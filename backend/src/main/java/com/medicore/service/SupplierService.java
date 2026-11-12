package com.medicore.service;

import com.medicore.dto.SupplierDto;
import com.medicore.entity.Supplier;
import com.medicore.exception.ResourceNotFoundException;
import com.medicore.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public List<SupplierDto> getAllSuppliers() {
        return supplierRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<SupplierDto> getActiveSuppliers() {
        return supplierRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public SupplierDto getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + id));
        return convertToDto(supplier);
    }

    @Transactional
    public SupplierDto createSupplier(SupplierDto dto) {
        Supplier supplier = new Supplier(
                dto.getName(),
                dto.getCompanyName(),
                dto.getContactPerson(),
                dto.getEmail(),
                dto.getPhone(),
                dto.getAddress()
        );
        supplier.setActive(dto.isActive());
        Supplier saved = supplierRepository.save(supplier);
        return convertToDto(saved);
    }

    @Transactional
    public SupplierDto updateSupplier(Long id, SupplierDto dto) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + id));

        supplier.setName(dto.getName());
        supplier.setCompanyName(dto.getCompanyName());
        supplier.setContactPerson(dto.getContactPerson());
        supplier.setEmail(dto.getEmail());
        supplier.setPhone(dto.getPhone());
        supplier.setAddress(dto.getAddress());
        supplier.setActive(dto.isActive());

        Supplier updated = supplierRepository.save(supplier);
        return convertToDto(updated);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + id));
        supplier.setActive(false);
        supplierRepository.save(supplier);
    }

    public SupplierDto convertToDto(Supplier supplier) {
        SupplierDto dto = new SupplierDto();
        dto.setId(supplier.getId());
        dto.setName(supplier.getName());
        dto.setCompanyName(supplier.getCompanyName());
        dto.setContactPerson(supplier.getContactPerson());
        dto.setEmail(supplier.getEmail());
        dto.setPhone(supplier.getPhone());
        dto.setAddress(supplier.getAddress());
        dto.setActive(supplier.isActive());
        return dto;
    }
}

