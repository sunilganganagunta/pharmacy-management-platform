package com.medicore.service;

import com.medicore.dto.DashboardStatsDto;
import com.medicore.dto.MedicineDto;
import com.medicore.entity.PurchaseOrder;
import com.medicore.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final MedicineService medicineService;
    private final SaleService saleService;
    private final PurchaseService purchaseService;
    private final InventoryService inventoryService;

    public DashboardService(MedicineRepository medicineRepository,
                            SupplierRepository supplierRepository,
                            SaleRepository saleRepository,
                            SaleItemRepository saleItemRepository,
                            PurchaseOrderRepository purchaseOrderRepository,
                            InventoryTransactionRepository transactionRepository,
                            MedicineService medicineService,
                            SaleService saleService,
                            PurchaseService purchaseService,
                            InventoryService inventoryService) {
        this.medicineRepository = medicineRepository;
        this.supplierRepository = supplierRepository;
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.transactionRepository = transactionRepository;
        this.medicineService = medicineService;
        this.saleService = saleService;
        this.purchaseService = purchaseService;
        this.inventoryService = inventoryService;
    }

    public DashboardStatsDto getDashboardStats() {
        DashboardStatsDto stats = new DashboardStatsDto();

        LocalDate today = LocalDate.now();
        ZoneId zone = ZoneId.systemDefault();
        Instant todayStart = today.atStartOfDay(zone).toInstant();
        Instant todayEnd = today.plusDays(1).atStartOfDay(zone).toInstant();
        Instant monthStart = today.withDayOfMonth(1).atStartOfDay(zone).toInstant();

        // 1. KPI Cards
        stats.setTotalMedicines(medicineRepository.count());
        BigDecimal invValue = medicineRepository.calculateTotalInventoryValue();
        stats.setTotalInventoryValue(invValue != null ? invValue : BigDecimal.ZERO);
        stats.setTodaySales(saleRepository.sumSalesBetween(todayStart, todayEnd));
        stats.setMonthlyRevenue(saleRepository.sumSalesBetween(monthStart, todayEnd));
        stats.setTotalSuppliers(supplierRepository.count());
        stats.setLowStockCount(medicineRepository.countLowStockMedicines());
        stats.setExpiredCount(medicineRepository.countExpiredMedicines(today));
        stats.setExpiringSoonCount(medicineRepository.countExpiringSoonMedicines(today, today.plusDays(30)));

        // 2. Weekly Sales Chart (Past 7 Days)
        List<Map<String, Object>> weeklyChart = new ArrayList<>();
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("EEE (dd MMM)");
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            Instant start = d.atStartOfDay(zone).toInstant();
            Instant end = d.plusDays(1).atStartOfDay(zone).toInstant();
            BigDecimal daySales = saleRepository.sumSalesBetween(start, end);
            long count = saleRepository.countSalesBetween(start, end);

            Map<String, Object> point = new HashMap<>();
            point.put("date", d.format(dayFormatter));
            point.put("sales", daySales != null ? daySales : BigDecimal.ZERO);
            point.put("transactions", count);
            weeklyChart.add(point);
        }
        stats.setWeeklySalesChart(weeklyChart);

        // 3. Monthly Revenue Chart (Past 6 Months)
        List<Map<String, Object>> monthlyChart = new ArrayList<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(today).minusMonths(i);
            Instant start = ym.atDay(1).atStartOfDay(zone).toInstant();
            Instant end = ym.plusMonths(1).atDay(1).atStartOfDay(zone).toInstant();
            BigDecimal mSales = saleRepository.sumSalesBetween(start, end);

            Map<String, Object> point = new HashMap<>();
            point.put("month", ym.format(monthFormatter));
            point.put("revenue", mSales != null ? mSales : BigDecimal.ZERO);
            monthlyChart.add(point);
        }
        stats.setMonthlyRevenueChart(monthlyChart);

        // 4. Category Distribution
        List<Map<String, Object>> catDistribution = new ArrayList<>();
        List<Object[]> rawCategories = medicineRepository.getCategoryDistribution();
        for (Object[] row : rawCategories) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", row[0]);
            item.put("medicineCount", row[1]);
            item.put("totalStock", row[2]);
            catDistribution.add(item);
        }
        stats.setCategoryDistributionChart(catDistribution);

        // 5. Top Selling Medicines (Top 5)
        List<Map<String, Object>> topSelling = new ArrayList<>();
        List<Object[]> rawTop = saleItemRepository.findTopSellingMedicines(PageRequest.of(0, 5));
        for (Object[] row : rawTop) {
            Map<String, Object> item = new HashMap<>();
            item.put("medicineName", row[0]);
            item.put("quantitySold", row[1]);
            item.put("totalRevenue", row[2]);
            topSelling.add(item);
        }
        stats.setTopSellingMedicinesChart(topSelling);

        // 6. Payment Method Distribution
        List<Map<String, Object>> payDistribution = new ArrayList<>();
        List<Object[]> rawPay = saleRepository.getSalesByPaymentMethod();
        for (Object[] row : rawPay) {
            Map<String, Object> item = new HashMap<>();
            item.put("method", row[0] != null ? row[0].toString() : "CASH");
            item.put("count", row[1]);
            item.put("total", row[2]);
            payDistribution.add(item);
        }
        stats.setPaymentMethodDistribution(payDistribution);

        // 7. Recent Activities
        stats.setRecentSales(saleService.getRecentSales());
        stats.setRecentPurchases(purchaseService.getRecentPurchaseOrders());
        stats.setRecentStockUpdates(inventoryService.getRecentTransactions());

        List<MedicineDto> recentMeds = medicineRepository.findAll(PageRequest.of(0, 5))
                .getContent().stream()
                .map(medicineService::convertToDto)
                .toList();
        stats.setRecentMedicines(recentMeds);

        // 8. Alerts
        stats.setLowStockAlerts(medicineService.getLowStockMedicines());
        stats.setExpiringSoonAlerts(medicineService.getExpiringSoonMedicines());
        stats.setExpiredAlerts(medicineService.getExpiredMedicines());
        stats.setPendingPurchaseOrdersCount(purchaseOrderRepository.countByStatus(PurchaseOrder.Status.PENDING));

        return stats;
    }
}

