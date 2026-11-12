package com.medicore.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class SaleResponseDto {
    private Long id;
    private String invoiceNumber;
    private Long customerId;
    private String customerName;
    private Instant saleDate;
    private BigDecimal subtotal;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal taxPercent;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String status;
    private String pharmacistName;
    private String notes;
    private List<SaleItemResponseDto> items;

    public SaleResponseDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public Instant getSaleDate() { return saleDate; }
    public void setSaleDate(Instant saleDate) { this.saleDate = saleDate; }

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

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPharmacistName() { return pharmacistName; }
    public void setPharmacistName(String pharmacistName) { this.pharmacistName = pharmacistName; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<SaleItemResponseDto> getItems() { return items; }
    public void setItems(List<SaleItemResponseDto> items) { this.items = items; }
}

