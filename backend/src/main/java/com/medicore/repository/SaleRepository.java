package com.medicore.repository;

import com.medicore.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    Optional<Sale> findByInvoiceNumber(String invoiceNumber);

    Page<Sale> findAllByOrderBySaleDateDesc(Pageable pageable);

    List<Sale> findTop5ByOrderBySaleDateDesc();

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.status = 'COMPLETED' AND s.saleDate >= :start AND s.saleDate < :end")
    BigDecimal sumSalesBetween(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.status = 'COMPLETED' AND s.saleDate >= :start AND s.saleDate < :end")
    long countSalesBetween(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.status = 'COMPLETED'")
    BigDecimal calculateTotalLifetimeRevenue();

    @Query("SELECT s FROM Sale s WHERE s.saleDate >= :start AND s.saleDate <= :end ORDER BY s.saleDate DESC")
    List<Sale> findSalesInDateRange(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT s.paymentMethod, COUNT(s), COALESCE(SUM(s.totalAmount), 0) " +
           "FROM Sale s WHERE s.status = 'COMPLETED' GROUP BY s.paymentMethod")
    List<Object[]> getSalesByPaymentMethod();
}

