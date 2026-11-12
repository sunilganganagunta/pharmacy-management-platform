package com.medicore.dto;

import java.math.BigDecimal;

public class SaleItemResponseDto {
    private Long id;
    private Long medicineId;
    private String medicineName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;

    public SaleItemResponseDto() {}

    public SaleItemResponseDto(Long id, Long medicineId, String medicineName, Integer quantity, BigDecimal unitPrice, BigDecimal subtotal) {
        this.id = id;
        this.medicineId = medicineId;
        this.medicineName = medicineName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = subtotal;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMedicineId() { return medicineId; }
    public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
}

