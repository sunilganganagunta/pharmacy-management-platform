package com.medicore.repository;

import com.medicore.entity.Medicine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    Optional<Medicine> findByBarcode(String barcode);

    List<Medicine> findByActiveTrue();

    Page<Medicine> findByActiveTrue(Pageable pageable);

    // Low stock medicines
    @Query("SELECT m FROM Medicine m WHERE m.active = true AND m.availableQuantity <= m.minimumStock")
    List<Medicine> findLowStockMedicines();

    @Query("SELECT COUNT(m) FROM Medicine m WHERE m.active = true AND m.availableQuantity <= m.minimumStock")
    long countLowStockMedicines();

    // Expired medicines
    @Query("SELECT m FROM Medicine m WHERE m.active = true AND m.expiryDate < :currentDate")
    List<Medicine> findExpiredMedicines(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT COUNT(m) FROM Medicine m WHERE m.active = true AND m.expiryDate < :currentDate")
    long countExpiredMedicines(@Param("currentDate") LocalDate currentDate);

    // Expiring soon (within N days)
    @Query("SELECT m FROM Medicine m WHERE m.active = true AND m.expiryDate >= :today AND m.expiryDate <= :targetDate")
    List<Medicine> findExpiringSoonMedicines(@Param("today") LocalDate today, @Param("targetDate") LocalDate targetDate);

    @Query("SELECT COUNT(m) FROM Medicine m WHERE m.active = true AND m.expiryDate >= :today AND m.expiryDate <= :targetDate")
    long countExpiringSoonMedicines(@Param("today") LocalDate today, @Param("targetDate") LocalDate targetDate);

    // Total Inventory Valuation (sum of availableQuantity * purchasePrice)
    @Query("SELECT COALESCE(SUM(m.availableQuantity * m.purchasePrice), 0) FROM Medicine m WHERE m.active = true")
    BigDecimal calculateTotalInventoryValue();

    // Search and filter with pagination
    @Query("SELECT m FROM Medicine m WHERE m.active = true AND " +
           "(:query IS NULL OR " +
           " LOWER(m.name) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
           " LOWER(m.genericName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
           " LOWER(m.brand) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
           " LOWER(m.batchNumber) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
           " (m.barcode IS NOT NULL AND LOWER(m.barcode) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')))) AND " +
           "(:categoryId IS NULL OR m.category.id = :categoryId) AND " +
           "(:lowStockOnly IS NULL OR :lowStockOnly = false OR m.availableQuantity <= m.minimumStock)")
    Page<Medicine> searchMedicines(@Param("query") String query,
                                  @Param("categoryId") Long categoryId,
                                  @Param("lowStockOnly") Boolean lowStockOnly,
                                  Pageable pageable);

    // Grouping by Category for Analytics
    @Query("SELECT c.name, COUNT(m), COALESCE(SUM(m.availableQuantity), 0) " +
           "FROM Medicine m JOIN m.category c WHERE m.active = true GROUP BY c.name")
    List<Object[]> getCategoryDistribution();
}

