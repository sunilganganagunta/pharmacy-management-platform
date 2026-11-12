package com.medicore.repository;

import com.medicore.entity.SaleItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    List<SaleItem> findBySaleId(Long saleId);

    @Query("SELECT si.medicine.name, SUM(si.quantity), SUM(si.subtotal) " +
           "FROM SaleItem si WHERE si.sale.status = 'COMPLETED' " +
           "GROUP BY si.medicine.name ORDER BY SUM(si.quantity) DESC")
    List<Object[]> findTopSellingMedicines(Pageable pageable);
}

