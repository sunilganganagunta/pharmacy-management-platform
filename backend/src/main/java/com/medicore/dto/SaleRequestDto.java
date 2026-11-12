package com.medicore.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class SaleRequestDto {

    private Long customerId;
    private String customerName;
    private String customerPhone;

    @NotEmpty(message = "Cart cannot be empty")
    @Valid
    private List<SaleItemRequestDto> items;

    @DecimalMin(value = "0.0", message = "Discount cannot be negative")
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", message = "Tax percent cannot be negative")
    private BigDecimal taxPercent = new BigDecimal("12.00"); // default 12% GST

    @NotNull(message = "Payment method is required")
    private String paymentMethod = "CASH"; // CASH, CARD, UPI

    private String notes;

    public SaleRequestDto() {}

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public List<SaleItemRequestDto> getItems() { return items; }
    public void setItems(List<SaleItemRequestDto> items) { this.items = items; }

    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }

    public BigDecimal getTaxPercent() { return taxPercent; }
    public void setTaxPercent(BigDecimal taxPercent) { this.taxPercent = taxPercent; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}

