package com.medicore.controller;

import com.medicore.dto.ApiResponse;
import com.medicore.dto.MedicineDto;
import com.medicore.service.MedicineService;
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
@RequestMapping("/api/medicines")
@Tag(name = "Medicines", description = "Medicine inventory catalogue, CRUD operations, searching, and status tracking")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    @GetMapping
    @Operation(summary = "Search, filter, and paginate medicines")
    public ResponseEntity<ApiResponse<Page<MedicineDto>>> searchMedicines(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean lowStockOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = (sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        Page<MedicineDto> result = medicineService.searchMedicines(search, categoryId, lowStockOnly, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all active medicines for POS and quick select")
    public ResponseEntity<ApiResponse<List<MedicineDto>>> getAllActiveMedicines() {
        return ResponseEntity.ok(ApiResponse.success(medicineService.getAllActiveMedicines()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get medicine by ID")
    public ResponseEntity<ApiResponse<MedicineDto>> getMedicineById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(medicineService.getMedicineById(id)));
    }

    @GetMapping("/barcode/{barcode}")
    @Operation(summary = "Lookup medicine by barcode for POS barcode scanner")
    public ResponseEntity<ApiResponse<MedicineDto>> getMedicineByBarcode(@PathVariable String barcode) {
        return ResponseEntity.ok(ApiResponse.success(medicineService.getMedicineByBarcode(barcode)));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get list of all medicines below minimum stock threshold")
    public ResponseEntity<ApiResponse<List<MedicineDto>>> getLowStockMedicines() {
        return ResponseEntity.ok(ApiResponse.success(medicineService.getLowStockMedicines()));
    }

    @GetMapping("/expired")
    @Operation(summary = "Get list of expired medicines")
    public ResponseEntity<ApiResponse<List<MedicineDto>>> getExpiredMedicines() {
        return ResponseEntity.ok(ApiResponse.success(medicineService.getExpiredMedicines()));
    }

    @GetMapping("/expiring-soon")
    @Operation(summary = "Get list of medicines expiring within next 30 days")
    public ResponseEntity<ApiResponse<List<MedicineDto>>> getExpiringSoonMedicines() {
        return ResponseEntity.ok(ApiResponse.success(medicineService.getExpiringSoonMedicines()));
    }

    @PostMapping
    @Operation(summary = "Add a new medicine")
    public ResponseEntity<ApiResponse<MedicineDto>> createMedicine(@Valid @RequestBody MedicineDto dto) {
        MedicineDto created = medicineService.createMedicine(dto);
        return ResponseEntity.ok(ApiResponse.success("Medicine added successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing medicine")
    public ResponseEntity<ApiResponse<MedicineDto>> updateMedicine(@PathVariable Long id,
                                                                   @Valid @RequestBody MedicineDto dto) {
        MedicineDto updated = medicineService.updateMedicine(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Medicine updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete (deactivate) a medicine")
    public ResponseEntity<ApiResponse<Void>> deleteMedicine(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.ok(ApiResponse.success("Medicine removed successfully", null));
    }
}

