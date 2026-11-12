package com.medicore.service;

import com.medicore.dto.CreatePurchaseOrderItemRequest;
import com.medicore.dto.CreatePurchaseOrderRequest;
import com.medicore.dto.PurchaseOrderDto;
import com.medicore.dto.PurchaseOrderItemDto;
import com.medicore.entity.*;
import com.medicore.exception.BadRequestException;
import com.medicore.exception.ResourceNotFoundException;
import com.medicore.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class PurchaseService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final MedicineRepository medicineRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;

    public PurchaseService(PurchaseOrderRepository purchaseOrderRepository,
                           SupplierRepository supplierRepository,
                           MedicineRepository medicineRepository,
                           InventoryTransactionRepository transactionRepository,
                           NotificationRepository notificationRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
        this.medicineRepository = medicineRepository;
        this.transactionRepository = transactionRepository;
        this.notificationRepository = notificationRepository;
    }

    public Page<PurchaseOrderDto> getAllPurchaseOrders(Pageable pageable) {
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::convertToDto);
    }

    public List<PurchaseOrderDto> getRecentPurchaseOrders() {
        return purchaseOrderRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public PurchaseOrderDto getPurchaseOrderById(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + id));
        return convertToDto(po);
    }

    @Transactional
    public PurchaseOrderDto createPurchaseOrder(CreatePurchaseOrderRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + request.getSupplierId()));

        PurchaseOrder po = new PurchaseOrder();
        po.setOrderNumber("PO-" + System.currentTimeMillis() % 1000000);
        po.setSupplier(supplier);
        po.setOrderDate(LocalDate.now());
        po.setExpectedDate(request.getExpectedDate());
        po.setStatus(PurchaseOrder.Status.PENDING);
        po.setNotes(request.getNotes());
        po.setCreatedBy(getCurrentUsername());

        BigDecimal grandTotal = BigDecimal.ZERO;

        for (CreatePurchaseOrderItemRequest itemReq : request.getItems()) {
            Medicine medicine = medicineRepository.findById(itemReq.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + itemReq.getMedicineId()));

            BigDecimal subtotal = itemReq.getUnitCost().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            grandTotal = grandTotal.add(subtotal);

            PurchaseOrderItem item = new PurchaseOrderItem(
                    medicine,
                    itemReq.getQuantity(),
                    itemReq.getUnitCost(),
                    subtotal
            );
            po.addItem(item);
        }

        po.setTotalAmount(grandTotal);
        PurchaseOrder saved = purchaseOrderRepository.save(po);

        // Notify new purchase order created
        notificationRepository.save(new Notification(
                "New Purchase Order: " + saved.getOrderNumber(),
                "Purchase order created for " + supplier.getName() + " with total ₹" + grandTotal,
                Notification.Type.PURCHASE_ORDER,
                saved.getOrderNumber()
        ));

        return convertToDto(saved);
    }

    @Transactional
    public PurchaseOrderDto updateStatus(Long id, String statusStr) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + id));

        PurchaseOrder.Status newStatus;
        try {
            newStatus = PurchaseOrder.Status.valueOf(statusStr.toUpperCase());
        } catch (Exception e) {
            throw new BadRequestException("Invalid status: " + statusStr);
        }

        if (po.getStatus() == PurchaseOrder.Status.RECEIVED) {
            throw new BadRequestException("Cannot change status: Purchase order has already been RECEIVED.");
        }

        // When receiving stock, update inventory!
        if (newStatus == PurchaseOrder.Status.RECEIVED) {
            receivePurchaseOrder(po);
        } else {
            po.setStatus(newStatus);
        }

        PurchaseOrder updated = purchaseOrderRepository.save(po);
        return convertToDto(updated);
    }

    private void receivePurchaseOrder(PurchaseOrder po) {
        po.setStatus(PurchaseOrder.Status.RECEIVED);
        po.setReceivedDate(LocalDate.now());

        String username = getCurrentUsername();

        for (PurchaseOrderItem item : po.getItems()) {
            Medicine medicine = item.getMedicine();
            int prevStock = medicine.getAvailableQuantity();
            int addedQty = item.getQuantity();
            int newStock = prevStock + addedQty;

            medicine.setAvailableQuantity(newStock);
            medicineRepository.save(medicine);

            InventoryTransaction tx = new InventoryTransaction(
                    medicine,
                    InventoryTransaction.TransactionType.PURCHASE_RECEIVE,
                    addedQty,
                    prevStock,
                    newStock,
                    po.getOrderNumber(),
                    "Purchase order stock received from " + po.getSupplier().getName(),
                    username
            );
            transactionRepository.save(tx);
        }

        notificationRepository.save(new Notification(
                "Purchase Stock Received: " + po.getOrderNumber(),
                "All items from purchase order " + po.getOrderNumber() + " received into active inventory.",
                Notification.Type.PURCHASE_ORDER,
                po.getOrderNumber()
        ));
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "admin";
    }

    public PurchaseOrderDto convertToDto(PurchaseOrder po) {
        PurchaseOrderDto dto = new PurchaseOrderDto();
        dto.setId(po.getId());
        dto.setOrderNumber(po.getOrderNumber());
        dto.setSupplierId(po.getSupplier().getId());
        dto.setSupplierName(po.getSupplier().getName());
        dto.setOrderDate(po.getOrderDate());
        dto.setExpectedDate(po.getExpectedDate());
        dto.setReceivedDate(po.getReceivedDate());
        dto.setStatus(po.getStatus().name());
        dto.setTotalAmount(po.getTotalAmount());
        dto.setNotes(po.getNotes());
        dto.setCreatedBy(po.getCreatedBy());
        dto.setCreatedAt(po.getCreatedAt());

        if (po.getItems() != null) {
            List<PurchaseOrderItemDto> itemDtos = po.getItems().stream()
                    .map(item -> new PurchaseOrderItemDto(
                            item.getId(),
                            item.getMedicine().getId(),
                            item.getMedicine().getName(),
                            item.getQuantity(),
                            item.getUnitCost(),
                            item.getSubtotal()
                    ))
                    .collect(Collectors.toList());
            dto.setItems(itemDtos);
        }

        return dto;
    }
}

