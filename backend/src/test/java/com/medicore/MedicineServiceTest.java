package com.medicore;

import com.medicore.dto.MedicineDto;
import com.medicore.entity.MedicineCategory;
import com.medicore.repository.MedicineCategoryRepository;
import com.medicore.service.MedicineService;
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
class MedicineServiceTest {

    @Autowired
    private MedicineService medicineService;

    @Autowired
    private MedicineCategoryRepository categoryRepository;

    @Test
    @DisplayName("Should create, retrieve, and update medicine accurately")
    void testMedicineCrudFlow() {
        MedicineCategory cat = categoryRepository.save(new MedicineCategory("Cardio Test", "Test category"));

        MedicineDto dto = new MedicineDto();
        dto.setName("Atorvastatin 10mg");
        dto.setGenericName("Atorvastatin");
        dto.setBrand("Lipitor");
        dto.setBatchNumber("ATV-999");
        dto.setBarcode("890103009999");
        dto.setPurchasePrice(new BigDecimal("45.00"));
        dto.setSellingPrice(new BigDecimal("70.00"));
        dto.setAvailableQuantity(100);
        dto.setMinimumStock(20);
        dto.setExpiryDate(LocalDate.now().plusDays(365));
        dto.setCategoryId(cat.getId());

        MedicineDto created = medicineService.createMedicine(dto);
        assertNotNull(created.getId());
        assertEquals("Atorvastatin 10mg", created.getName());
        assertEquals(100, created.getAvailableQuantity());
        assertFalse(created.isLowStock());

        // Update medicine
        created.setSellingPrice(new BigDecimal("75.00"));
        created.setAvailableQuantity(15); // drops below minStock 20
        MedicineDto updated = medicineService.updateMedicine(created.getId(), created);

        assertEquals(new BigDecimal("75.00"), updated.getSellingPrice());
        assertEquals(15, updated.getAvailableQuantity());
        assertTrue(updated.isLowStock());
    }

    @Test
    @DisplayName("Should detect expired medicines")
    void testExpiredMedicineDetection() {
        MedicineDto dto = new MedicineDto();
        dto.setName("Expired Cough Drop");
        dto.setGenericName("Menthol");
        dto.setBatchNumber("EXP-001");
        dto.setPurchasePrice(BigDecimal.TEN);
        dto.setSellingPrice(new BigDecimal("15.00"));
        dto.setAvailableQuantity(25);
        dto.setMinimumStock(5);
        dto.setExpiryDate(LocalDate.now().minusDays(10)); // Past expiry date

        MedicineDto created = medicineService.createMedicine(dto);
        assertTrue(created.isExpired());

        List<MedicineDto> expiredList = medicineService.getExpiredMedicines();
        assertTrue(expiredList.stream().anyMatch(m -> m.getId().equals(created.getId())));
    }
}

