package com.medicore.controller;

import com.medicore.dto.ApiResponse;
import com.medicore.dto.InvoiceDto;
import com.medicore.dto.SaleRequestDto;
import com.medicore.dto.SaleResponseDto;
import com.medicore.service.SaleService;
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
@RequestMapping("/api/sales")
@Tag(name = "Sales & POS", description = "Point of sale transaction processing, billing, checkout, and invoice generation")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @PostMapping
    @Operation(summary = "Complete POS checkout transaction and generate invoice")
    public ResponseEntity<ApiResponse<InvoiceDto>> processSale(@Valid @RequestBody SaleRequestDto request) {
        InvoiceDto invoice = saleService.processSale(request);
        return ResponseEntity.ok(ApiResponse.success("Sale completed successfully", invoice));
    }

    @GetMapping
    @Operation(summary = "Get paginated sales transaction history")
    public ResponseEntity<ApiResponse<Page<SaleResponseDto>>> getAllSales(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(saleService.getAllSales(pageable)));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get 5 most recent sales transactions")
    public ResponseEntity<ApiResponse<List<SaleResponseDto>>> getRecentSales() {
        return ResponseEntity.ok(ApiResponse.success(saleService.getRecentSales()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sale details by ID")
    public ResponseEntity<ApiResponse<SaleResponseDto>> getSaleById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(saleService.getSaleById(id)));
    }

    @GetMapping("/{id}/invoice")
    @Operation(summary = "Get formatted printable invoice for sale ID")
    public ResponseEntity<ApiResponse<InvoiceDto>> getInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(saleService.getInvoice(id)));
    }

    @GetMapping("/invoice/{invoiceNumber}")
    @Operation(summary = "Get invoice by invoice number")
    public ResponseEntity<ApiResponse<InvoiceDto>> getInvoiceByNumber(@PathVariable String invoiceNumber) {
        return ResponseEntity.ok(ApiResponse.success(saleService.getInvoiceByNumber(invoiceNumber)));
    }
}

