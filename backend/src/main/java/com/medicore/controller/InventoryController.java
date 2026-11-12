package com.medicore.controller;

import com.medicore.dto.ApiResponse;
import com.medicore.dto.InventoryTransactionDto;
import com.medicore.dto.StockAdjustmentDto;
import com.medicore.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@Tag(name = "Inventory", description = "Stock adjustments, real-time stock levels, and audit logs")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/adjust")
    @Operation(summary = "Adjust stock quantity (Stock In, Stock Out, or Manual Adjustment)")
    public ResponseEntity<ApiResponse<InventoryTransactionDto>> adjustStock(@Valid @RequestBody StockAdjustmentDto dto) {
        InventoryTransactionDto tx = inventoryService.adjustStock(dto);
        return ResponseEntity.ok(ApiResponse.success("Stock adjusted successfully", tx));
    }

    @GetMapping("/history")
    @Operation(summary = "Get paginated inventory transaction audit history")
    public ResponseEntity<ApiResponse<Page<InventoryTransactionDto>>> getTransactionHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getTransactionHistory(pageable)));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent 10 inventory transactions")
    public ResponseEntity<ApiResponse<List<InventoryTransactionDto>>> getRecentTransactions() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getRecentTransactions()));
    }

    @GetMapping("/medicine/{medicineId}")
    @Operation(summary = "Get inventory history for specific medicine")
    public ResponseEntity<ApiResponse<List<InventoryTransactionDto>>> getMedicineTransactions(@PathVariable Long medicineId) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getTransactionsForMedicine(medicineId)));
    }
}

