package com.medicore.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class CreatePurchaseOrderRequest {

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    private LocalDate expectedDate;

    private String notes;

    @NotEmpty(message = "At least one order item is required")
    @Valid
    private List<CreatePurchaseOrderItemRequest> items;

    public CreatePurchaseOrderRequest() {}

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public LocalDate getExpectedDate() { return expectedDate; }
    public void setExpectedDate(LocalDate expectedDate) { this.expectedDate = expectedDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<CreatePurchaseOrderItemRequest> getItems() { return items; }
    public void setItems(List<CreatePurchaseOrderItemRequest> items) { this.items = items; }
}

