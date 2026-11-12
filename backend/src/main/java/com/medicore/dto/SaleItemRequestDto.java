package com.medicore.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class SaleItemRequestDto {

    @NotNull(message = "Medicine ID is required")
    private Long medicineId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    public SaleItemRequestDto() {}

    public SaleItemRequestDto(Long medicineId, Integer quantity) {
        this.medicineId = medicineId;
        this.quantity = quantity;
    }

    public Long getMedicineId() { return medicineId; }
    public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}

