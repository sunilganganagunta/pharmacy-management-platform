package com.medicore.repository;

import com.medicore.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    Optional<PurchaseOrder> findByOrderNumber(String orderNumber);
    Page<PurchaseOrder> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<PurchaseOrder> findTop5ByOrderByCreatedAtDesc();
    long countByStatus(PurchaseOrder.Status status);

    @Query("SELECT COALESCE(SUM(po.totalAmount), 0) FROM PurchaseOrder po WHERE po.status = 'RECEIVED'")
    BigDecimal calculateTotalPurchasesReceived();

    @Query("SELECT po.supplier.name, COUNT(po), COALESCE(SUM(po.totalAmount), 0) " +
           "FROM PurchaseOrder po GROUP BY po.supplier.name")
    List<Object[]> getPurchasesBySupplier();
}

