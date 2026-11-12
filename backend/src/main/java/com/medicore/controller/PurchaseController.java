package com.medicore.controller;

import com.medicore.dto.ApiResponse;
import com.medicore.dto.CreatePurchaseOrderRequest;
import com.medicore.dto.PurchaseOrderDto;
import com.medicore.service.PurchaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchases")
@Tag(name = "Purchases", description = "Purchase order generation, supplier procurement, and inventory receiving")
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @GetMapping
    @Operation(summary = "Get paginated list of purchase orders")
    public ResponseEntity<ApiResponse<Page<PurchaseOrderDto>>> getAllPurchases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(purchaseService.getAllPurchaseOrders(pageable)));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent 5 purchase orders")
    public ResponseEntity<ApiResponse<List<PurchaseOrderDto>>> getRecentPurchases() {
        return ResponseEntity.ok(ApiResponse.success(purchaseService.getRecentPurchaseOrders()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase order details by ID")
    public ResponseEntity<ApiResponse<PurchaseOrderDto>> getPurchaseById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(purchaseService.getPurchaseOrderById(id)));
    }

    @PostMapping
    @Operation(summary = "Create a new purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderDto>> createPurchaseOrder(@Valid @RequestBody CreatePurchaseOrderRequest request) {
        PurchaseOrderDto created = purchaseService.createPurchaseOrder(request);
        return ResponseEntity.ok(ApiResponse.success("Purchase order created successfully", created));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update purchase order status (PENDING, APPROVED, RECEIVED, CANCELLED). If RECEIVED, inventory is updated!")
    public ResponseEntity<ApiResponse<PurchaseOrderDto>> updateStatus(@PathVariable Long id,
                                                                      @RequestBody Map<String, String> body) {
        String status = body.get("status");
        PurchaseOrderDto updated = purchaseService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Purchase order status updated to " + updated.getStatus(), updated));
    }
}

