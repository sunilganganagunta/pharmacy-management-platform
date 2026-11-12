package com.medicore.repository;

import com.medicore.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findByActiveTrueOrderByNameAsc();
    List<Supplier> findByNameContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(String name, String companyName);
}

