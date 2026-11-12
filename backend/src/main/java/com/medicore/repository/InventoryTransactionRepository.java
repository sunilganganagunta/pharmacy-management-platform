package com.medicore.repository;

import com.medicore.entity.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    Page<InventoryTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<InventoryTransaction> findTop10ByOrderByCreatedAtDesc();
    List<InventoryTransaction> findByMedicineIdOrderByCreatedAtDesc(Long medicineId);
}

