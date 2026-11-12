package com.medicore.service;

import com.medicore.dto.*;
import com.medicore.entity.*;
import com.medicore.exception.ExpiredMedicineException;
import com.medicore.exception.InsufficientStockException;
import com.medicore.exception.ResourceNotFoundException;
import com.medicore.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SaleService {

    private final SaleRepository saleRepository;
    private final MedicineRepository medicineRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;

    public SaleService(SaleRepository saleRepository,
                       MedicineRepository medicineRepository,
                       CustomerRepository customerRepository,
                       UserRepository userRepository,
                       InventoryTransactionRepository transactionRepository,
                       NotificationRepository notificationRepository) {
        this.saleRepository = saleRepository;
        this.medicineRepository = medicineRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.notificationRepository = notificationRepository;
    }

    public Page<SaleResponseDto> getAllSales(Pageable pageable) {
        return saleRepository.findAllByOrderBySaleDateDesc(pageable)
                .map(this::convertToDto);
    }

    public List<SaleResponseDto> getRecentSales() {
        return saleRepository.findTop5ByOrderBySaleDateDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public SaleResponseDto getSaleById(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with ID: " + id));
        return convertToDto(sale);
    }

    public InvoiceDto getInvoice(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with ID: " + id));
        return convertToInvoiceDto(sale);
    }

    public InvoiceDto getInvoiceByNumber(String invoiceNumber) {
        Sale sale = saleRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with invoice: " + invoiceNumber));
        return convertToInvoiceDto(sale);
    }

    @Transactional
    public InvoiceDto processSale(SaleRequestDto request) {
        // 1. Resolve Customer if provided
        Customer customer = null;
        String customerName = request.getCustomerName();
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId()).orElse(null);
            if (customer != null) customerName = customer.getName();
        } else if (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank()) {
            customer = customerRepository.findByPhone(request.getCustomerPhone().trim())
                    .orElseGet(() -> {
                        String name = (request.getCustomerName() != null && !request.getCustomerName().isBlank())
                                ? request.getCustomerName().trim() : "Walk-in Customer";
                        Customer newCust = new Customer(name, request.getCustomerPhone().trim(), null, null);
                        return customerRepository.save(newCust);
                    });
            customerName = customer.getName();
        }

        if (customerName == null || customerName.isBlank()) {
            customerName = "Walk-in Customer";
        }

        // 2. Generate Invoice Number
        String invoiceNumber = "INV-" + (System.currentTimeMillis() % 10000000);

        Sale sale = new Sale();
        sale.setInvoiceNumber(invoiceNumber);
        sale.setCustomer(customer);
        sale.setCustomerName(customerName);
        sale.setSaleDate(Instant.now());
        sale.setNotes(request.getNotes());

        try {
            sale.setPaymentMethod(Sale.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()));
        } catch (Exception e) {
            sale.setPaymentMethod(Sale.PaymentMethod.CASH);
        }

        // Pharmacist performing the sale
        User pharmacist = getCurrentUser();
        sale.setPharmacist(pharmacist);

        // 3. Process Cart Items: 2-Phase Atomic Validation & Stock Deduction
        BigDecimal subtotal = BigDecimal.ZERO;
        String username = pharmacist != null ? pharmacist.getUsername() : "pharmacist";

        // Phase 3a: Pre-validate all cart items for existence, expiry, and sufficient stock
        List<Medicine> validatedMedicines = new ArrayList<>();
        for (SaleItemRequestDto itemReq : request.getItems()) {
            Medicine medicine = medicineRepository.findById(itemReq.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + itemReq.getMedicineId()));

            // Safety Rule: Check if expired
            if (medicine.isExpired()) {
                throw new ExpiredMedicineException("Cannot sell expired medicine: '" + medicine.getName() +
                        "' expired on " + medicine.getExpiryDate());
            }

            // Safety Rule: Check stock
            if (medicine.getAvailableQuantity() < itemReq.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock for '" + medicine.getName() +
                        "'. Requested: " + itemReq.getQuantity() + ", Available: " + medicine.getAvailableQuantity());
            }

            validatedMedicines.add(medicine);
        }

        // Phase 3b: All items valid; proceed to decrement inventory, log audit transactions, and build sale items
        for (int i = 0; i < request.getItems().size(); i++) {
            SaleItemRequestDto itemReq = request.getItems().get(i);
            Medicine medicine = validatedMedicines.get(i);

            // Decrement Stock
            int previousStock = medicine.getAvailableQuantity();
            int newStock = previousStock - itemReq.getQuantity();
            medicine.setAvailableQuantity(newStock);
            medicineRepository.save(medicine);

            // Record Inventory Audit Transaction
            InventoryTransaction tx = new InventoryTransaction(
                    medicine,
                    InventoryTransaction.TransactionType.SALE,
                    -itemReq.getQuantity(),
                    previousStock,
                    newStock,
                    invoiceNumber,
                    "Sold to " + customerName + " (" + invoiceNumber + ")",
                    username
            );
            transactionRepository.save(tx);

            // Check if triggered Low Stock
            if (medicine.isLowStock()) {
                notificationRepository.save(new Notification(
                        "Low Stock Alert: " + medicine.getName(),
                        "Stock level reached " + newStock + " (Minimum threshold: " + medicine.getMinimumStock() + ")",
                        Notification.Type.LOW_STOCK,
                        "MED-" + medicine.getId()
                ));
            }

            BigDecimal itemSubtotal = medicine.getSellingPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(itemSubtotal);

            SaleItem item = new SaleItem(
                    medicine,
                    medicine.getName(),
                    itemReq.getQuantity(),
                    medicine.getSellingPrice(),
                    itemSubtotal
            );
            sale.addItem(item);
        }

        // 4. Calculations: Discount, Tax, Final Amount
        BigDecimal discountPercent = request.getDiscountPercent() != null ? request.getDiscountPercent() : BigDecimal.ZERO;
        BigDecimal discountAmount = subtotal.multiply(discountPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal discountedSubtotal = subtotal.subtract(discountAmount);

        BigDecimal taxPercent = request.getTaxPercent() != null ? request.getTaxPercent() : BigDecimal.ZERO;
        BigDecimal taxAmount = discountedSubtotal.multiply(taxPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal totalAmount = discountedSubtotal.add(taxAmount);

        sale.setSubtotal(subtotal);
        sale.setDiscountPercent(discountPercent);
        sale.setDiscountAmount(discountAmount);
        sale.setTaxPercent(taxPercent);
        sale.setTaxAmount(taxAmount);
        sale.setTotalAmount(totalAmount);
        sale.setStatus(Sale.Status.COMPLETED);

        Sale saved = saleRepository.save(sale);

        // Update Customer Total Purchases if registered
        if (customer != null) {
            customer.setTotalPurchases(customer.getTotalPurchases().add(totalAmount));
            customerRepository.save(customer);
        }

        // Add Notification
        notificationRepository.save(new Notification(
                "Sale Completed: " + saved.getInvoiceNumber(),
                "Sale of ₹" + totalAmount + " successfully processed for " + customerName,
                Notification.Type.SALE_COMPLETED,
                saved.getInvoiceNumber()
        ));

        return convertToInvoiceDto(saved);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            return userRepository.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }

    public SaleResponseDto convertToDto(Sale sale) {
        SaleResponseDto dto = new SaleResponseDto();
        dto.setId(sale.getId());
        dto.setInvoiceNumber(sale.getInvoiceNumber());
        if (sale.getCustomer() != null) {
            dto.setCustomerId(sale.getCustomer().getId());
        }
        dto.setCustomerName(sale.getCustomerName());
        dto.setSaleDate(sale.getSaleDate());
        dto.setSubtotal(sale.getSubtotal());
        dto.setDiscountPercent(sale.getDiscountPercent());
        dto.setDiscountAmount(sale.getDiscountAmount());
        dto.setTaxPercent(sale.getTaxPercent());
        dto.setTaxAmount(sale.getTaxAmount());
        dto.setTotalAmount(sale.getTotalAmount());
        dto.setPaymentMethod(sale.getPaymentMethod().name());
        dto.setStatus(sale.getStatus().name());
        if (sale.getPharmacist() != null) {
            dto.setPharmacistName(sale.getPharmacist().getFullName());
        }
        dto.setNotes(sale.getNotes());

        if (sale.getItems() != null) {
            List<SaleItemResponseDto> itemDtos = sale.getItems().stream()
                    .map(item -> new SaleItemResponseDto(
                            item.getId(),
                            item.getMedicine().getId(),
                            item.getMedicineName(),
                            item.getQuantity(),
                            item.getUnitPrice(),
                            item.getSubtotal()
                    ))
                    .collect(Collectors.toList());
            dto.setItems(itemDtos);
        }

        return dto;
    }

    public InvoiceDto convertToInvoiceDto(Sale sale) {
        InvoiceDto dto = new InvoiceDto();
        dto.setInvoiceNumber(sale.getInvoiceNumber());
        dto.setInvoiceDate(sale.getSaleDate());
        dto.setCustomerName(sale.getCustomerName());
        if (sale.getCustomer() != null) {
            dto.setCustomerPhone(sale.getCustomer().getPhone());
        }
        dto.setPaymentMethod(sale.getPaymentMethod().name());
        if (sale.getPharmacist() != null) {
            dto.setPharmacistName(sale.getPharmacist().getFullName());
        }
        dto.setSubtotal(sale.getSubtotal());
        dto.setDiscountPercent(sale.getDiscountPercent());
        dto.setDiscountAmount(sale.getDiscountAmount());
        dto.setTaxPercent(sale.getTaxPercent());
        dto.setTaxAmount(sale.getTaxAmount());
        dto.setTotalAmount(sale.getTotalAmount());
        dto.setNotes(sale.getNotes());

        if (sale.getItems() != null) {
            List<SaleItemResponseDto> itemDtos = sale.getItems().stream()
                    .map(item -> new SaleItemResponseDto(
                            item.getId(),
                            item.getMedicine().getId(),
                            item.getMedicineName(),
                            item.getQuantity(),
                            item.getUnitPrice(),
                            item.getSubtotal()
                    ))
                    .collect(Collectors.toList());
            dto.setItems(itemDtos);
        }

        return dto;
    }
}

