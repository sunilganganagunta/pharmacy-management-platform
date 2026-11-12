package com.medicore.dto;

import jakarta.validation.constraints.NotBlank;

public class SupplierDto {
    private Long id;

    @NotBlank(message = "Supplier name is required")
    private String name;

    @NotBlank(message = "Company name is required")
    private String companyName;

    private String contactPerson;
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String address;
    private boolean active = true;

    public SupplierDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}

