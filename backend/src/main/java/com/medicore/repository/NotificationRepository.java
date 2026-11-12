package com.medicore.repository;

import com.medicore.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop10ByOrderByCreatedAtDesc();
    Page<Notification> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByReadFalse();
    List<Notification> findByReadFalseOrderByCreatedAtDesc();
}

