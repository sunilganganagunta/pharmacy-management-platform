package com.medicore.repository;

import com.medicore.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByPhone(String phone);
    boolean existsByPhone(String phone);
    Page<Customer> findByNameContainingIgnoreCaseOrPhoneContaining(String name, String phone, Pageable pageable);
}

