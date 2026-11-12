package com.medicore.service;

import com.medicore.dto.MedicineDto;
import com.medicore.entity.Medicine;
import com.medicore.entity.MedicineCategory;
import com.medicore.entity.Supplier;
import com.medicore.exception.BadRequestException;
import com.medicore.exception.ResourceNotFoundException;
import com.medicore.repository.MedicineCategoryRepository;
import com.medicore.repository.MedicineRepository;
import com.medicore.repository.SupplierRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final MedicineCategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;

    public MedicineService(MedicineRepository medicineRepository,
                           MedicineCategoryRepository categoryRepository,
                           SupplierRepository supplierRepository) {
        this.medicineRepository = medicineRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
    }

    public Page<MedicineDto> searchMedicines(String query, Long categoryId, Boolean lowStockOnly, Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        if (cleanQuery == null && categoryId == null && (lowStockOnly == null || !lowStockOnly)) {
            return medicineRepository.findByActiveTrue(pageable).map(this::convertToDto);
        }
        return medicineRepository.searchMedicines(cleanQuery, categoryId, lowStockOnly, pageable)
                .map(this::convertToDto);
    }

    public List<MedicineDto> getAllActiveMedicines() {
        return medicineRepository.findByActiveTrue().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public MedicineDto getMedicineById(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + id));
        return convertToDto(medicine);
    }

    public MedicineDto getMedicineByBarcode(String barcode) {
        Medicine medicine = medicineRepository.findByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with barcode: " + barcode));
        return convertToDto(medicine);
    }

    @Transactional
    public MedicineDto createMedicine(MedicineDto dto) {
        if (dto.getBarcode() != null && !dto.getBarcode().isBlank()) {
            if (medicineRepository.findByBarcode(dto.getBarcode()).isPresent()) {
                throw new BadRequestException("Barcode already exists: " + dto.getBarcode());
            }
        }

        Medicine medicine = new Medicine();
        updateMedicineFields(medicine, dto);
        medicine.setActive(true);

        Medicine saved = medicineRepository.save(medicine);
        return convertToDto(saved);
    }

    @Transactional
    public MedicineDto updateMedicine(Long id, MedicineDto dto) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + id));

        if (dto.getBarcode() != null && !dto.getBarcode().isBlank()) {
            medicineRepository.findByBarcode(dto.getBarcode()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new BadRequestException("Barcode already exists on another medicine: " + dto.getBarcode());
                }
            });
        }

        updateMedicineFields(medicine, dto);
        Medicine updated = medicineRepository.save(medicine);
        return convertToDto(updated);
    }

    @Transactional
    public void deleteMedicine(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + id));
        // Soft delete
        medicine.setActive(false);
        medicineRepository.save(medicine);
    }

    public List<MedicineDto> getLowStockMedicines() {
        return medicineRepository.findLowStockMedicines().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<MedicineDto> getExpiredMedicines() {
        return medicineRepository.findExpiredMedicines(LocalDate.now()).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<MedicineDto> getExpiringSoonMedicines() {
        LocalDate today = LocalDate.now();
        LocalDate target = today.plusDays(30);
        return medicineRepository.findExpiringSoonMedicines(today, target).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private void updateMedicineFields(Medicine medicine, MedicineDto dto) {
        medicine.setName(dto.getName());
        medicine.setGenericName(dto.getGenericName());
        medicine.setBrand(dto.getBrand());
        medicine.setManufacturer(dto.getManufacturer());
        medicine.setBatchNumber(dto.getBatchNumber());
        medicine.setBarcode(dto.getBarcode());
        medicine.setPurchasePrice(dto.getPurchasePrice());
        medicine.setSellingPrice(dto.getSellingPrice());
        medicine.setAvailableQuantity(dto.getAvailableQuantity());
        medicine.setMinimumStock(dto.getMinimumStock());
        medicine.setManufacturingDate(dto.getManufacturingDate());
        medicine.setExpiryDate(dto.getExpiryDate());
        medicine.setDescription(dto.getDescription());

        if (dto.getCategoryId() != null) {
            MedicineCategory category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + dto.getCategoryId()));
            medicine.setCategory(category);
        } else {
            medicine.setCategory(null);
        }

        if (dto.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + dto.getSupplierId()));
            medicine.setSupplier(supplier);
        } else {
            medicine.setSupplier(null);
        }
    }

    public MedicineDto convertToDto(Medicine medicine) {
        MedicineDto dto = new MedicineDto();
        dto.setId(medicine.getId());
        dto.setName(medicine.getName());
        dto.setGenericName(medicine.getGenericName());
        dto.setBrand(medicine.getBrand());
        if (medicine.getCategory() != null) {
            dto.setCategoryId(medicine.getCategory().getId());
            dto.setCategoryName(medicine.getCategory().getName());
        }
        dto.setManufacturer(medicine.getManufacturer());
        dto.setBatchNumber(medicine.getBatchNumber());
        dto.setBarcode(medicine.getBarcode());
        dto.setPurchasePrice(medicine.getPurchasePrice());
        dto.setSellingPrice(medicine.getSellingPrice());
        dto.setAvailableQuantity(medicine.getAvailableQuantity());
        dto.setMinimumStock(medicine.getMinimumStock());
        dto.setManufacturingDate(medicine.getManufacturingDate());
        dto.setExpiryDate(medicine.getExpiryDate());
        if (medicine.getSupplier() != null) {
            dto.setSupplierId(medicine.getSupplier().getId());
            dto.setSupplierName(medicine.getSupplier().getName());
        }
        dto.setDescription(medicine.getDescription());
        dto.setActive(medicine.isActive());

        dto.setLowStock(medicine.isLowStock());
        dto.setExpired(medicine.isExpired());
        dto.setExpiringSoon(medicine.isExpiringSoon());

        return dto;
    }
}

