package com.medicore.controller;

import com.medicore.dto.ApiResponse;
import com.medicore.dto.CustomerDto;
import com.medicore.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@Tag(name = "Customers", description = "Customer records, loyalty tracking, and purchase profiles")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    @Operation(summary = "Get paginated list of customers with optional search")
    public ResponseEntity<ApiResponse<Page<CustomerDto>>> getAllCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.success(customerService.getAllCustomers(search, pageable)));
    }

    @GetMapping("/all")
    @Operation(summary = "Get list of all customers for POS autocomplete")
    public ResponseEntity<ApiResponse<List<CustomerDto>>> getAllCustomersList() {
        return ResponseEntity.ok(ApiResponse.success(customerService.getAllCustomersList()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get customer by ID")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(customerService.getCustomerById(id)));
    }

    @GetMapping("/phone/{phone}")
    @Operation(summary = "Get customer by phone number")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerByPhone(@PathVariable String phone) {
        return ResponseEntity.ok(ApiResponse.success(customerService.getCustomerByPhone(phone)));
    }

    @PostMapping
    @Operation(summary = "Register a new customer")
    public ResponseEntity<ApiResponse<CustomerDto>> createCustomer(@Valid @RequestBody CustomerDto dto) {
        CustomerDto created = customerService.createCustomer(dto);
        return ResponseEntity.ok(ApiResponse.success("Customer registered successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update customer details")
    public ResponseEntity<ApiResponse<CustomerDto>> updateCustomer(@PathVariable Long id,
                                                                   @Valid @RequestBody CustomerDto dto) {
        CustomerDto updated = customerService.updateCustomer(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Customer updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete customer record")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(ApiResponse.success("Customer removed successfully", null));
    }
}

