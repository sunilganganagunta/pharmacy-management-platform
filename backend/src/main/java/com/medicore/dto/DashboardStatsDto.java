package com.medicore.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardStatsDto {

    // 1. KPI Cards
    private long totalMedicines;
    private BigDecimal totalInventoryValue;
    private BigDecimal todaySales;
    private BigDecimal monthlyRevenue;
    private long totalSuppliers;
    private long lowStockCount;
    private long expiredCount;
    private long expiringSoonCount;

    // 2. Analytics Charts
    private List<Map<String, Object>> weeklySalesChart;
    private List<Map<String, Object>> monthlyRevenueChart;
    private List<Map<String, Object>> categoryDistributionChart;
    private List<Map<String, Object>> topSellingMedicinesChart;
    private List<Map<String, Object>> paymentMethodDistribution;

    // 3. Recent Activity Lists
    private List<SaleResponseDto> recentSales;
    private List<PurchaseOrderDto> recentPurchases;
    private List<MedicineDto> recentMedicines;
    private List<InventoryTransactionDto> recentStockUpdates;

    // 4. Alert Lists
    private List<MedicineDto> lowStockAlerts;
    private List<MedicineDto> expiringSoonAlerts;
    private List<MedicineDto> expiredAlerts;
    private long pendingPurchaseOrdersCount;

    public DashboardStatsDto() {}

    // Getters and Setters
    public long getTotalMedicines() { return totalMedicines; }
    public void setTotalMedicines(long totalMedicines) { this.totalMedicines = totalMedicines; }

    public BigDecimal getTotalInventoryValue() { return totalInventoryValue; }
    public void setTotalInventoryValue(BigDecimal totalInventoryValue) { this.totalInventoryValue = totalInventoryValue; }

    public BigDecimal getTodaySales() { return todaySales; }
    public void setTodaySales(BigDecimal todaySales) { this.todaySales = todaySales; }

    public BigDecimal getMonthlyRevenue() { return monthlyRevenue; }
    public void setMonthlyRevenue(BigDecimal monthlyRevenue) { this.monthlyRevenue = monthlyRevenue; }

    public long getTotalSuppliers() { return totalSuppliers; }
    public void setTotalSuppliers(long totalSuppliers) { this.totalSuppliers = totalSuppliers; }

    public long getLowStockCount() { return lowStockCount; }
    public void setLowStockCount(long lowStockCount) { this.lowStockCount = lowStockCount; }

    public long getExpiredCount() { return expiredCount; }
    public void setExpiredCount(long expiredCount) { this.expiredCount = expiredCount; }

    public long getExpiringSoonCount() { return expiringSoonCount; }
    public void setExpiringSoonCount(long expiringSoonCount) { this.expiringSoonCount = expiringSoonCount; }

    public List<Map<String, Object>> getWeeklySalesChart() { return weeklySalesChart; }
    public void setWeeklySalesChart(List<Map<String, Object>> weeklySalesChart) { this.weeklySalesChart = weeklySalesChart; }

    public List<Map<String, Object>> getMonthlyRevenueChart() { return monthlyRevenueChart; }
    public void setMonthlyRevenueChart(List<Map<String, Object>> monthlyRevenueChart) { this.monthlyRevenueChart = monthlyRevenueChart; }

    public List<Map<String, Object>> getCategoryDistributionChart() { return categoryDistributionChart; }
    public void setCategoryDistributionChart(List<Map<String, Object>> categoryDistributionChart) { this.categoryDistributionChart = categoryDistributionChart; }

    public List<Map<String, Object>> getTopSellingMedicinesChart() { return topSellingMedicinesChart; }
    public void setTopSellingMedicinesChart(List<Map<String, Object>> topSellingMedicinesChart) { this.topSellingMedicinesChart = topSellingMedicinesChart; }

    public List<Map<String, Object>> getPaymentMethodDistribution() { return paymentMethodDistribution; }
    public void setPaymentMethodDistribution(List<Map<String, Object>> paymentMethodDistribution) { this.paymentMethodDistribution = paymentMethodDistribution; }

    public List<SaleResponseDto> getRecentSales() { return recentSales; }
    public void setRecentSales(List<SaleResponseDto> recentSales) { this.recentSales = recentSales; }

    public List<PurchaseOrderDto> getRecentPurchases() { return recentPurchases; }
    public void setRecentPurchases(List<PurchaseOrderDto> recentPurchases) { this.recentPurchases = recentPurchases; }

    public List<MedicineDto> getRecentMedicines() { return recentMedicines; }
    public void setRecentMedicines(List<MedicineDto> recentMedicines) { this.recentMedicines = recentMedicines; }

    public List<InventoryTransactionDto> getRecentStockUpdates() { return recentStockUpdates; }
    public void setRecentStockUpdates(List<InventoryTransactionDto> recentStockUpdates) { this.recentStockUpdates = recentStockUpdates; }

    public List<MedicineDto> getLowStockAlerts() { return lowStockAlerts; }
    public void setLowStockAlerts(List<MedicineDto> lowStockAlerts) { this.lowStockAlerts = lowStockAlerts; }

    public List<MedicineDto> getExpiringSoonAlerts() { return expiringSoonAlerts; }
    public void setExpiringSoonAlerts(List<MedicineDto> expiringSoonAlerts) { this.expiringSoonAlerts = expiringSoonAlerts; }

    public List<MedicineDto> getExpiredAlerts() { return expiredAlerts; }
    public void setExpiredAlerts(List<MedicineDto> expiredAlerts) { this.expiredAlerts = expiredAlerts; }

    public long getPendingPurchaseOrdersCount() { return pendingPurchaseOrdersCount; }
    public void setPendingPurchaseOrdersCount(long pendingPurchaseOrdersCount) { this.pendingPurchaseOrdersCount = pendingPurchaseOrdersCount; }
}

