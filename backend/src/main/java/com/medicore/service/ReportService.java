package com.medicore.service;

import com.medicore.dto.MedicineDto;
import com.medicore.dto.ReportSummaryDto;
import com.medicore.dto.SaleResponseDto;
import com.medicore.entity.Sale;
import com.medicore.repository.MedicineRepository;
import com.medicore.repository.PurchaseOrderRepository;
import com.medicore.repository.SaleItemRepository;
import com.medicore.repository.SaleRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ReportService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final MedicineRepository medicineRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final MedicineService medicineService;
    private final SaleService saleService;

    public ReportService(SaleRepository saleRepository,
                         SaleItemRepository saleItemRepository,
                         MedicineRepository medicineRepository,
                         PurchaseOrderRepository purchaseOrderRepository,
                         MedicineService medicineService,
                         SaleService saleService) {
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.medicineRepository = medicineRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.medicineService = medicineService;
        this.saleService = saleService;
    }

    public ReportSummaryDto generateSalesReport(String range, LocalDate startDate, LocalDate endDate) {
        ReportSummaryDto report = new ReportSummaryDto();
        report.setReportType("Sales Report - " + range.toUpperCase());

        LocalDate today = LocalDate.now();
        ZoneId zone = ZoneId.systemDefault();

        LocalDate start = (startDate != null) ? startDate : today.minusDays(30);
        LocalDate end = (endDate != null) ? endDate : today;

        if ("daily".equalsIgnoreCase(range)) {
            start = today;
            end = today;
        } else if ("weekly".equalsIgnoreCase(range)) {
            start = today.minusDays(7);
            end = today;
        } else if ("monthly".equalsIgnoreCase(range)) {
            start = today.withDayOfMonth(1);
            end = today;
        } else if ("annual".equalsIgnoreCase(range)) {
            start = today.withDayOfYear(1);
            end = today;
        }

        report.setDateRange(start.toString() + " to " + end.toString());

        Instant startInstant = start.atStartOfDay(zone).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(zone).toInstant();

        List<Sale> sales = saleRepository.findSalesInDateRange(startInstant, endInstant);
        List<SaleResponseDto> saleDtos = sales.stream().map(saleService::convertToDto).toList();
        report.setSalesDetails(saleDtos);

        BigDecimal totalRev = sales.stream()
                .map(Sale::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        report.setTotalRevenue(totalRev);
        report.setTotalTransactions(sales.size());

        if (!sales.isEmpty()) {
            report.setAverageOrderValue(totalRev.divide(BigDecimal.valueOf(sales.size()), 2, RoundingMode.HALF_UP));
        } else {
            report.setAverageOrderValue(BigDecimal.ZERO);
        }

        // Time series for charts
        List<Map<String, Object>> timeSeries = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM");
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            Instant s = d.atStartOfDay(zone).toInstant();
            Instant e = d.plusDays(1).atStartOfDay(zone).toInstant();
            BigDecimal sum = saleRepository.sumSalesBetween(s, e);
            long cnt = saleRepository.countSalesBetween(s, e);

            Map<String, Object> point = new HashMap<>();
            point.put("label", d.format(fmt));
            point.put("revenue", sum != null ? sum : BigDecimal.ZERO);
            point.put("orders", cnt);
            timeSeries.add(point);
        }
        report.setTimeSeriesData(timeSeries);

        return report;
    }

    public ReportSummaryDto generateInventoryReport(String type) {
        ReportSummaryDto report = new ReportSummaryDto();
        report.setReportType("Inventory Report - " + type.toUpperCase());
        report.setDateRange("As of " + LocalDate.now().toString());

        List<MedicineDto> meds;
        if ("low_stock".equalsIgnoreCase(type)) {
            meds = medicineService.getLowStockMedicines();
        } else if ("expired".equalsIgnoreCase(type)) {
            meds = medicineService.getExpiredMedicines();
        } else if ("expiring_soon".equalsIgnoreCase(type)) {
            meds = medicineService.getExpiringSoonMedicines();
        } else {
            meds = medicineService.getAllActiveMedicines();
        }

        report.setMedicineDetails(meds);
        report.setTotalItemsCount(meds.size());

        BigDecimal totalVal = meds.stream()
                .map(m -> m.getPurchasePrice().multiply(BigDecimal.valueOf(m.getAvailableQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        report.setTotalInventoryValue(totalVal);

        // Category breakdown
        Map<String, Integer> catCounts = new HashMap<>();
        for (MedicineDto m : meds) {
            String c = m.getCategoryName() != null ? m.getCategoryName() : "Uncategorized";
            catCounts.put(c, catCounts.getOrDefault(c, 0) + m.getAvailableQuantity());
        }

        List<Map<String, Object>> breakdown = new ArrayList<>();
        catCounts.forEach((cat, stock) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("category", cat);
            item.put("quantity", stock);
            breakdown.add(item);
        });
        report.setBreakdownData(breakdown);

        return report;
    }

    public String exportSalesCsv() {
        List<Sale> sales = saleRepository.findAll();
        StringBuilder csv = new StringBuilder();
        csv.append("Invoice Number,Date,Customer,Subtotal,Discount Amount,Tax Amount,Total Amount,Payment Method,Status\n");
        for (Sale s : sales) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",%.2f,%.2f,%.2f,%.2f,\"%s\",\"%s\"\n",
                    s.getInvoiceNumber(),
                    s.getSaleDate().toString(),
                    s.getCustomerName() != null ? s.getCustomerName() : "Walk-in",
                    s.getSubtotal(),
                    s.getDiscountAmount(),
                    s.getTaxAmount(),
                    s.getTotalAmount(),
                    s.getPaymentMethod().name(),
                    s.getStatus().name()
            ));
        }
        return csv.toString();
    }

    public String exportInventoryCsv() {
        List<MedicineDto> meds = medicineService.getAllActiveMedicines();
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Name,Generic Name,Category,Batch Number,Barcode,Purchase Price,Selling Price,Stock,Min Stock,Expiry Date,Status\n");
        for (MedicineDto m : meds) {
            String status = m.isExpired() ? "EXPIRED" : (m.isLowStock() ? "LOW_STOCK" : (m.isExpiringSoon() ? "EXPIRING_SOON" : "IN_STOCK"));
            csv.append(String.format("%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%.2f,%.2f,%d,%d,\"%s\",\"%s\"\n",
                    m.getId(),
                    m.getName().replace("\"", "\"\""),
                    m.getGenericName().replace("\"", "\"\""),
                    m.getCategoryName() != null ? m.getCategoryName() : "N/A",
                    m.getBatchNumber(),
                    m.getBarcode() != null ? m.getBarcode() : "",
                    m.getPurchasePrice(),
                    m.getSellingPrice(),
                    m.getAvailableQuantity(),
                    m.getMinimumStock(),
                    m.getExpiryDate() != null ? m.getExpiryDate().toString() : "",
                    status
            ));
        }
        return csv.toString();
    }
}

