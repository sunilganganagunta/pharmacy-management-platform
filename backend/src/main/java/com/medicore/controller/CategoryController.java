package com.medicore.controller;

import com.medicore.dto.ApiResponse;
import com.medicore.dto.CategoryDto;
import com.medicore.entity.MedicineCategory;
import com.medicore.repository.MedicineCategoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Categories", description = "Medicine classification and therapeutic categories")
public class CategoryController {

    private final MedicineCategoryRepository categoryRepository;

    public CategoryController(MedicineCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'CASHIER')")
    @Operation(summary = "Get all medicine categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getAllCategories() {
        List<CategoryDto> list = categoryRepository.findAll().stream()
                .map(c -> new CategoryDto(c.getId(), c.getName(), c.getDescription()))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    @Operation(summary = "Create a new medicine category")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(@Valid @RequestBody CategoryDto dto) {
        MedicineCategory cat = new MedicineCategory(dto.getName(), dto.getDescription());
        MedicineCategory saved = categoryRepository.save(cat);
        return ResponseEntity.ok(ApiResponse.success("Category created", new CategoryDto(saved.getId(), saved.getName(), saved.getDescription())));
    }
}

