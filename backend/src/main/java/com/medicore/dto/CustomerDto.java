package com.medicore.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class CustomerDto {
    private Long id;

    @NotBlank(message = "Customer name is required")
    private String name;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String email;
    private String address;
    private BigDecimal totalPurchases;

    public CustomerDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public BigDecimal getTotalPurchases() { return totalPurchases; }
    public void setTotalPurchases(BigDecimal totalPurchases) { this.totalPurchases = totalPurchases; }
}

