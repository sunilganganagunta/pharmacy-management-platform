package com.medicore.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class InvoiceDto {
    private String pharmacyName = "MediCore Pharmacy & Health Store";
    private String pharmacyTagline = "Smart Pharmacy Management. Simplified.";
    private String pharmacyAddress = "104 Healthcare Boulevard, Medicity, Tech Park, BLR - 560100";
    private String pharmacyPhone = "+91 80 4455 6677";
    private String pharmacyGstin = "29AABCU9603R1ZM";
    private String pharmacyDlNo = "KA-BLR-2026-DL-88990";

    private String invoiceNumber;
    private Instant invoiceDate;
    private String customerName;
    private String customerPhone;
    private String paymentMethod;
    private String pharmacistName;

    private List<SaleItemResponseDto> items;

    private BigDecimal subtotal;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal taxPercent;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String notes;

    public InvoiceDto() {}

    public String getPharmacyName() { return pharmacyName; }
    public void setPharmacyName(String pharmacyName) { this.pharmacyName = pharmacyName; }

    public String getPharmacyTagline() { return pharmacyTagline; }
    public void setPharmacyTagline(String pharmacyTagline) { this.pharmacyTagline = pharmacyTagline; }

    public String getPharmacyAddress() { return pharmacyAddress; }
    public void setPharmacyAddress(String pharmacyAddress) { this.pharmacyAddress = pharmacyAddress; }

    public String getPharmacyPhone() { return pharmacyPhone; }
    public void setPharmacyPhone(String pharmacyPhone) { this.pharmacyPhone = pharmacyPhone; }

    public String getPharmacyGstin() { return pharmacyGstin; }
    public void setPharmacyGstin(String pharmacyGstin) { this.pharmacyGstin = pharmacyGstin; }

    public String getPharmacyDlNo() { return pharmacyDlNo; }
    public void setPharmacyDlNo(String pharmacyDlNo) { this.pharmacyDlNo = pharmacyDlNo; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public Instant getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(Instant invoiceDate) { this.invoiceDate = invoiceDate; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPharmacistName() { return pharmacistName; }
    public void setPharmacistName(String pharmacistName) { this.pharmacistName = pharmacistName; }

    public List<SaleItemResponseDto> getItems() { return items; }
    public void setItems(List<SaleItemResponseDto> items) { this.items = items; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public BigDecimal getTaxPercent() { return taxPercent; }
    public void setTaxPercent(BigDecimal taxPercent) { this.taxPercent = taxPercent; }

    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}

