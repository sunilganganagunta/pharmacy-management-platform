package com.medicore.dto;

import jakarta.validation.constraints.NotNull;

public class StockAdjustmentDto {
    @NotNull(message = "Medicine ID is required")
    private Long medicineId;

    @NotNull(message = "Adjustment quantity is required")
    private Integer quantity; // positive for addition, negative for reduction

    @NotNull(message = "Adjustment type is required")
    private String type; // STOCK_IN, STOCK_OUT, ADJUSTMENT

    private String reason;

    public StockAdjustmentDto() {}

    public Long getMedicineId() { return medicineId; }
    public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}

