package com.medicore.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notifications")
public class Notification {

    public enum Type {
        LOW_STOCK,
        EXPIRY_WARNING,
        EXPIRED,
        PURCHASE_ORDER,
        SALE_COMPLETED,
        SYSTEM
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Type type;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public Notification() {}

    public Notification(String title, String message, Type type, String referenceId) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.referenceId = referenceId;
        this.read = false;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

