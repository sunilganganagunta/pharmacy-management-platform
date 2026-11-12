package com.medicore.service;

import com.medicore.dto.InventoryTransactionDto;
import com.medicore.dto.StockAdjustmentDto;
import com.medicore.entity.InventoryTransaction;
import com.medicore.entity.Medicine;
import com.medicore.exception.BadRequestException;
import com.medicore.exception.ResourceNotFoundException;
import com.medicore.repository.InventoryTransactionRepository;
import com.medicore.repository.MedicineRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class InventoryService {

    private final MedicineRepository medicineRepository;
    private final InventoryTransactionRepository transactionRepository;

    public InventoryService(MedicineRepository medicineRepository,
                            InventoryTransactionRepository transactionRepository) {
        this.medicineRepository = medicineRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public InventoryTransactionDto adjustStock(StockAdjustmentDto request) {
        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + request.getMedicineId()));

        int currentStock = medicine.getAvailableQuantity();
        int change = request.getQuantity();
        int newStock = currentStock + change;

        if (newStock < 0) {
            throw new BadRequestException("Insufficient inventory. Current stock is " + currentStock + ", cannot reduce by " + Math.abs(change));
        }

        medicine.setAvailableQuantity(newStock);
        medicineRepository.save(medicine);

        String username = getCurrentUsername();
        InventoryTransaction.TransactionType type;
        try {
            type = InventoryTransaction.TransactionType.valueOf(request.getType());
        } catch (Exception e) {
            type = InventoryTransaction.TransactionType.ADJUSTMENT;
        }

        InventoryTransaction transaction = new InventoryTransaction(
                medicine,
                type,
                change,
                currentStock,
                newStock,
                "ADJ-" + System.currentTimeMillis(),
                request.getReason(),
                username
        );

        InventoryTransaction saved = transactionRepository.save(transaction);
        return convertToDto(saved);
    }

    public Page<InventoryTransactionDto> getTransactionHistory(Pageable pageable) {
        return transactionRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::convertToDto);
    }

    public List<InventoryTransactionDto> getRecentTransactions() {
        return transactionRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<InventoryTransactionDto> getTransactionsForMedicine(Long medicineId) {
        return transactionRepository.findByMedicineIdOrderByCreatedAtDesc(medicineId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "system";
    }

    public InventoryTransactionDto convertToDto(InventoryTransaction tx) {
        InventoryTransactionDto dto = new InventoryTransactionDto();
        dto.setId(tx.getId());
        dto.setMedicineId(tx.getMedicine().getId());
        dto.setMedicineName(tx.getMedicine().getName());
        dto.setTransactionType(tx.getTransactionType().name());
        dto.setQuantity(tx.getQuantity());
        dto.setPreviousStock(tx.getPreviousStock());
        dto.setNewStock(tx.getNewStock());
        dto.setReferenceId(tx.getReferenceId());
        dto.setReason(tx.getReason());
        dto.setPerformedBy(tx.getPerformedBy());
        dto.setCreatedAt(tx.getCreatedAt());
        return dto;
    }
}

