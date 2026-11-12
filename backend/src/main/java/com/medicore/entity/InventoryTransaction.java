package com.medicore.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "inventory_transactions")
public class InventoryTransaction {

    public enum TransactionType {
        STOCK_IN,
        STOCK_OUT,
        ADJUSTMENT,
        SALE,
        PURCHASE_RECEIVE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 50)
    private TransactionType transactionType;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "previous_stock", nullable = false)
    private Integer previousStock;

    @Column(name = "new_stock", nullable = false)
    private Integer newStock;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "performed_by", length = 100)
    private String performedBy;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public InventoryTransaction() {}

    public InventoryTransaction(Medicine medicine, TransactionType transactionType, Integer quantity,
                                Integer previousStock, Integer newStock, String referenceId,
                                String reason, String performedBy) {
        this.medicine = medicine;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.previousStock = previousStock;
        this.newStock = newStock;
        this.referenceId = referenceId;
        this.reason = reason;
        this.performedBy = performedBy;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }

    public TransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(TransactionType transactionType) { this.transactionType = transactionType; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Integer getPreviousStock() { return previousStock; }
    public void setPreviousStock(Integer previousStock) { this.previousStock = previousStock; }

    public Integer getNewStock() { return newStock; }
    public void setNewStock(Integer newStock) { this.newStock = newStock; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

