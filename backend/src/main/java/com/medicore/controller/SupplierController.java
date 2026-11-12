package com.medicore.controller;

import com.medicore.dto.ApiResponse;
import com.medicore.dto.SupplierDto;
import com.medicore.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@Tag(name = "Suppliers", description = "Pharmaceutical vendors and distribution network partners")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    @Operation(summary = "Get list of all suppliers")
    public ResponseEntity<ApiResponse<List<SupplierDto>>> getAllSuppliers() {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getAllSuppliers()));
    }

    @GetMapping("/active")
    @Operation(summary = "Get list of active suppliers for PO dropdown")
    public ResponseEntity<ApiResponse<List<SupplierDto>>> getActiveSuppliers() {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getActiveSuppliers()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get supplier by ID")
    public ResponseEntity<ApiResponse<SupplierDto>> getSupplierById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getSupplierById(id)));
    }

    @PostMapping
    @Operation(summary = "Add a new supplier")
    public ResponseEntity<ApiResponse<SupplierDto>> createSupplier(@Valid @RequestBody SupplierDto dto) {
        SupplierDto created = supplierService.createSupplier(dto);
        return ResponseEntity.ok(ApiResponse.success("Supplier registered successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing supplier")
    public ResponseEntity<ApiResponse<SupplierDto>> updateSupplier(@PathVariable Long id,
                                                                   @Valid @RequestBody SupplierDto dto) {
        SupplierDto updated = supplierService.updateSupplier(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Supplier updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete (deactivate) a supplier")
    public ResponseEntity<ApiResponse<Void>> deleteSupplier(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.ok(ApiResponse.success("Supplier deactivated successfully", null));
    }
}

