package com.medicore;

import com.medicore.dto.InvoiceDto;
import com.medicore.dto.MedicineDto;
import com.medicore.dto.SaleItemRequestDto;
import com.medicore.dto.SaleRequestDto;
import com.medicore.exception.ExpiredMedicineException;
import com.medicore.exception.InsufficientStockException;
import com.medicore.service.MedicineService;
import com.medicore.service.SaleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class SaleServiceTest {

    @Autowired
    private SaleService saleService;

    @Autowired
    private MedicineService medicineService;

    @Test
    @DisplayName("Should successfully complete POS sale, deduct inventory, and generate invoice")
    void testSuccessfulSaleFlow() {
        // Create medicine with 50 in stock
        MedicineDto med = new MedicineDto();
        med.setName("Paracetamol 500mg");
        med.setGenericName("Paracetamol");
        med.setBatchNumber("PCM-01");
        med.setPurchasePrice(new BigDecimal("10.00"));
        med.setSellingPrice(new BigDecimal("20.00"));
        med.setAvailableQuantity(50);
        med.setMinimumStock(10);
        med.setExpiryDate(LocalDate.now().plusDays(200));
        MedicineDto createdMed = medicineService.createMedicine(med);

        // Process sale of 5 units
        SaleRequestDto req = new SaleRequestDto();
        req.setCustomerName("Rajesh Test");
        req.setCustomerPhone("+91 99999 11111");
        req.setPaymentMethod("UPI");
        req.setDiscountPercent(new BigDecimal("10.00")); // 10% discount
        req.setTaxPercent(new BigDecimal("12.00")); // 12% tax
        req.setItems(List.of(new SaleItemRequestDto(createdMed.getId(), 5)));

        InvoiceDto invoice = saleService.processSale(req);

        assertNotNull(invoice);
        assertNotNull(invoice.getInvoiceNumber());
        assertEquals("Rajesh Test", invoice.getCustomerName());
        assertEquals("UPI", invoice.getPaymentMethod());

        // Subtotal: 5 * 20 = 100.00
        assertEquals(0, new BigDecimal("100.00").compareTo(invoice.getSubtotal()));
        // Discount: 10% of 100 = 10.00
        assertEquals(0, new BigDecimal("10.00").compareTo(invoice.getDiscountAmount()));
        // Tax: 12% of 90 = 10.80
        assertEquals(0, new BigDecimal("10.80").compareTo(invoice.getTaxAmount()));
        // Total: 90 + 10.80 = 100.80
        assertEquals(0, new BigDecimal("100.80").compareTo(invoice.getTotalAmount()));

        // Verify stock deducted from 50 -> 45
        MedicineDto updatedMed = medicineService.getMedicineById(createdMed.getId());
        assertEquals(45, updatedMed.getAvailableQuantity());
    }

    @Test
    @DisplayName("Should block sale when quantity exceeds available inventory")
    void testInsufficientStockFailure() {
        MedicineDto med = new MedicineDto();
        med.setName("Limited Stock Injection");
        med.setGenericName("Test Injectable");
        med.setBatchNumber("INJ-01");
        med.setPurchasePrice(BigDecimal.TEN);
        med.setSellingPrice(new BigDecimal("50.00"));
        med.setAvailableQuantity(3); // only 3 available
        med.setMinimumStock(1);
        med.setExpiryDate(LocalDate.now().plusDays(100));
        MedicineDto created = medicineService.createMedicine(med);

        SaleRequestDto req = new SaleRequestDto();
        req.setItems(List.of(new SaleItemRequestDto(created.getId(), 10))); // Requesting 10

        assertThrows(InsufficientStockException.class, () -> saleService.processSale(req));
    }

    @Test
    @DisplayName("Should strictly reject sale of expired medicines")
    void testExpiredMedicineSaleFailure() {
        MedicineDto med = new MedicineDto();
        med.setName("Old Antibiotic");
        med.setGenericName("Antibiotic");
        med.setBatchNumber("OLD-01");
        med.setPurchasePrice(BigDecimal.TEN);
        med.setSellingPrice(new BigDecimal("30.00"));
        med.setAvailableQuantity(100);
        med.setMinimumStock(10);
        med.setExpiryDate(LocalDate.now().minusDays(5)); // Expired!
        MedicineDto created = medicineService.createMedicine(med);

        SaleRequestDto req = new SaleRequestDto();
        req.setItems(List.of(new SaleItemRequestDto(created.getId(), 1)));

        assertThrows(ExpiredMedicineException.class, () -> saleService.processSale(req));
    }

    @Test
    @DisplayName("Should atomically rollback entire multi-item sale when one item fails stock check")
    void testMultiItemSaleRollbackWhenSecondItemFails() {
        // Item 1: Sufficient stock (50 units)
        MedicineDto med1 = new MedicineDto();
        med1.setName("Item One Available");
        med1.setGenericName("Available Med");
        med1.setBatchNumber("BATCH-A1");
        med1.setPurchasePrice(BigDecimal.TEN);
        med1.setSellingPrice(new BigDecimal("25.00"));
        med1.setAvailableQuantity(50);
        med1.setMinimumStock(5);
        med1.setExpiryDate(LocalDate.now().plusDays(180));
        MedicineDto created1 = medicineService.createMedicine(med1);

        // Item 2: Deficient stock (only 2 units available)
        MedicineDto med2 = new MedicineDto();
        med2.setName("Item Two Low");
        med2.setGenericName("Low Med");
        med2.setBatchNumber("BATCH-B2");
        med2.setPurchasePrice(BigDecimal.TEN);
        med2.setSellingPrice(new BigDecimal("15.00"));
        med2.setAvailableQuantity(2);
        med2.setMinimumStock(5);
        med2.setExpiryDate(LocalDate.now().plusDays(180));
        MedicineDto created2 = medicineService.createMedicine(med2);

        // Cart requesting 5 of Item 1 (valid) and 10 of Item 2 (invalid)
        SaleRequestDto req = new SaleRequestDto();
        req.setCustomerName("Atomic Test");
        req.setItems(List.of(
                new SaleItemRequestDto(created1.getId(), 5),
                new SaleItemRequestDto(created2.getId(), 10)
        ));

        // Must throw InsufficientStockException
        assertThrows(InsufficientStockException.class, () -> saleService.processSale(req));

        // Atomicity verification: Item 1 stock must NOT have been decremented
        MedicineDto refreshed1 = medicineService.getMedicineById(created1.getId());
        assertEquals(50, refreshed1.getAvailableQuantity(), "Item 1 stock must remain unchanged after rollback");
    }
}

