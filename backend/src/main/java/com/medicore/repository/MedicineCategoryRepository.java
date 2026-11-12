package com.medicore.repository;

import com.medicore.entity.MedicineCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedicineCategoryRepository extends JpaRepository<MedicineCategory, Long> {
    Optional<MedicineCategory> findByName(String name);
    boolean existsByName(String name);
}

