package com.medicore.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class ReportSummaryDto {
    private String reportType;
    private String dateRange;
    private BigDecimal totalRevenue;
    private long totalTransactions;
    private BigDecimal averageOrderValue;
    private BigDecimal totalInventoryValue;
    private long totalItemsCount;

    private List<Map<String, Object>> timeSeriesData;
    private List<Map<String, Object>> breakdownData;
    private List<MedicineDto> medicineDetails;
    private List<SaleResponseDto> salesDetails;

    public ReportSummaryDto() {}

    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }

    public String getDateRange() { return dateRange; }
    public void setDateRange(String dateRange) { this.dateRange = dateRange; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public long getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(long totalTransactions) { this.totalTransactions = totalTransactions; }

    public BigDecimal getAverageOrderValue() { return averageOrderValue; }
    public void setAverageOrderValue(BigDecimal averageOrderValue) { this.averageOrderValue = averageOrderValue; }

    public BigDecimal getTotalInventoryValue() { return totalInventoryValue; }
    public void setTotalInventoryValue(BigDecimal totalInventoryValue) { this.totalInventoryValue = totalInventoryValue; }

    public long getTotalItemsCount() { return totalItemsCount; }
    public void setTotalItemsCount(long totalItemsCount) { this.totalItemsCount = totalItemsCount; }

    public List<Map<String, Object>> getTimeSeriesData() { return timeSeriesData; }
    public void setTimeSeriesData(List<Map<String, Object>> timeSeriesData) { this.timeSeriesData = timeSeriesData; }

    public List<Map<String, Object>> getBreakdownData() { return breakdownData; }
    public void setBreakdownData(List<Map<String, Object>> breakdownData) { this.breakdownData = breakdownData; }

    public List<MedicineDto> getMedicineDetails() { return medicineDetails; }
    public void setMedicineDetails(List<MedicineDto> medicineDetails) { this.medicineDetails = medicineDetails; }

    public List<SaleResponseDto> getSalesDetails() { return salesDetails; }
    public void setSalesDetails(List<SaleResponseDto> salesDetails) { this.salesDetails = salesDetails; }
}

