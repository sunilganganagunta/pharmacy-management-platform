package com.medicore.controller;

import com.medicore.dto.ApiResponse;
import com.medicore.dto.ReportSummaryDto;
import com.medicore.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports & Analytics", description = "Periodic sales reports, inventory valuations, and CSV exports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/sales")
    @Operation(summary = "Generate sales report by range (daily, weekly, monthly, annual, custom)")
    public ResponseEntity<ApiResponse<ReportSummaryDto>> getSalesReport(
            @RequestParam(defaultValue = "monthly") String range,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        ReportSummaryDto report = reportService.generateSalesReport(range, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/inventory")
    @Operation(summary = "Generate inventory valuation and status report (all, low_stock, expired, expiring_soon)")
    public ResponseEntity<ApiResponse<ReportSummaryDto>> getInventoryReport(
            @RequestParam(defaultValue = "all") String type) {
        ReportSummaryDto report = reportService.generateInventoryReport(type);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/export/sales")
    @Operation(summary = "Export all sales transactions as CSV file")
    public ResponseEntity<byte[]> exportSalesCsv() {
        String csv = reportService.exportSalesCsv();
        byte[] bytes = csv.getBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"medicore_sales_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }

    @GetMapping("/export/inventory")
    @Operation(summary = "Export inventory valuation and stock report as CSV file")
    public ResponseEntity<byte[]> exportInventoryCsv() {
        String csv = reportService.exportInventoryCsv();
        byte[] bytes = csv.getBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"medicore_inventory_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}

