package com.medicore.service;

import com.medicore.dto.NotificationDto;
import com.medicore.entity.Notification;
import com.medicore.exception.ResourceNotFoundException;
import com.medicore.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<NotificationDto> getRecentNotifications() {
        return notificationRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public Page<NotificationDto> getAllNotifications(Pageable pageable) {
        return notificationRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::convertToDto);
    }

    public long getUnreadCount() {
        return notificationRepository.countByReadFalse();
    }

    @Transactional
    public NotificationDto markAsRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + id));
        n.setRead(true);
        Notification saved = notificationRepository.save(n);
        return convertToDto(saved);
    }

    @Transactional
    public void markAllAsRead() {
        List<Notification> unread = notificationRepository.findByReadFalseOrderByCreatedAtDesc();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public NotificationDto convertToDto(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.setId(n.getId());
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setType(n.getType().name());
        dto.setRead(n.isRead());
        dto.setReferenceId(n.getReferenceId());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }
}

