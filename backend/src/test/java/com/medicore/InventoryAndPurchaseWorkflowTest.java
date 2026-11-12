package com.medicore;

import com.medicore.dto.*;
import com.medicore.service.MedicineService;
import com.medicore.service.PurchaseService;
import com.medicore.service.SupplierService;
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
class InventoryAndPurchaseWorkflowTest {

    @Autowired
    private SupplierService supplierService;

    @Autowired
    private MedicineService medicineService;

    @Autowired
    private PurchaseService purchaseService;

    @Test
    @DisplayName("Purchase workflow: Order creation does not affect stock; Receiving stock updates inventory")
    void testPurchaseOrderAndReceiveWorkflow() {
        // 1. Add Supplier
        SupplierDto sup = new SupplierDto();
        sup.setName("Apollo Distribution");
        sup.setCompanyName("Apollo Health Supply Ltd");
        sup.setPhone("+91 80 1234 5678");
        SupplierDto createdSupplier = supplierService.createSupplier(sup);
        assertNotNull(createdSupplier.getId());

        // 2. Add Medicine with initial stock 10
        MedicineDto med = new MedicineDto();
        med.setName("Vitamin C 500mg");
        med.setGenericName("Ascorbic Acid");
        med.setBatchNumber("VITC-2026");
        med.setPurchasePrice(new BigDecimal("15.00"));
        med.setSellingPrice(new BigDecimal("25.00"));
        med.setAvailableQuantity(10);
        med.setMinimumStock(5);
        med.setExpiryDate(LocalDate.now().plusDays(400));
        med.setSupplierId(createdSupplier.getId());
        MedicineDto createdMed = medicineService.createMedicine(med);
        assertEquals(10, createdMed.getAvailableQuantity());

        // 3. Create Purchase Order for 40 units (status PENDING)
        CreatePurchaseOrderRequest poReq = new CreatePurchaseOrderRequest();
        poReq.setSupplierId(createdSupplier.getId());
        poReq.setNotes("Quarterly stock refill");

        CreatePurchaseOrderItemRequest itemReq = new CreatePurchaseOrderItemRequest();
        itemReq.setMedicineId(createdMed.getId());
        itemReq.setQuantity(40);
        itemReq.setUnitCost(new BigDecimal("14.50"));
        poReq.setItems(List.of(itemReq));

        PurchaseOrderDto createdPo = purchaseService.createPurchaseOrder(poReq);
        assertEquals("PENDING", createdPo.getStatus());

        // Business Rule Verification: Stock MUST NOT be modified when order is merely created
        MedicineDto medAfterPo = medicineService.getMedicineById(createdMed.getId());
        assertEquals(10, medAfterPo.getAvailableQuantity(), "Stock should remain 10 after creating PO");

        // 4. Mark Purchase Order as RECEIVED
        PurchaseOrderDto receivedPo = purchaseService.updateStatus(createdPo.getId(), "RECEIVED");
        assertEquals("RECEIVED", receivedPo.getStatus());

        // Business Rule Verification: Stock MUST be incremented now (10 + 40 = 50)
        MedicineDto medAfterReceive = medicineService.getMedicineById(createdMed.getId());
        assertEquals(50, medAfterReceive.getAvailableQuantity(), "Stock must be 50 after receiving PO");
    }
}

