package com.medicore;

import com.medicore.controller.MedicineController;
import com.medicore.controller.ReportController;
import com.medicore.controller.SaleController;
import com.medicore.dto.ApiResponse;
import com.medicore.dto.MedicineDto;
import com.medicore.dto.SaleResponseDto;
import com.medicore.service.MedicineService;
import com.medicore.service.ReportService;
import com.medicore.service.SaleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
class SecurityRbacTest {

    @Autowired
    private MedicineController medicineController;

    @Autowired
    private ReportController reportController;

    @Autowired
    private SaleController saleController;

    @MockBean
    private MedicineService medicineService;

    @MockBean
    private ReportService reportService;

    @MockBean
    private SaleService saleService;

    // ========================================================
    // SEC-03: Cashier Role RBAC Boundary Tests
    // ========================================================

    @Test
    @WithMockUser(username = "cashier_user", roles = {"CASHIER"})
    @DisplayName("SEC-03: CASHIER is permitted to view sales transactions")
    void testCashierCanAccessSales() {
        Page<SaleResponseDto> emptyPage = new PageImpl<>(Collections.emptyList());
        when(saleService.getAllSales(any(Pageable.class))).thenReturn(emptyPage);

        ResponseEntity<ApiResponse<Page<SaleResponseDto>>> response = saleController.getAllSales(0, 10);
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    @WithMockUser(username = "cashier_user", roles = {"CASHIER"})
    @DisplayName("SEC-03: CASHIER must be BLOCKED from deleting medicines (HTTP 403 / AccessDenied)")
    void testCashierBlockedFromMedicineDeletion() {
        assertThrows(AccessDeniedException.class, () -> medicineController.deleteMedicine(1L),
                "Cashier should not have permission to delete medicines from the catalog");
    }

    @Test
    @WithMockUser(username = "cashier_user", roles = {"CASHIER"})
    @DisplayName("SEC-03: CASHIER must be BLOCKED from creating medicines (HTTP 403 / AccessDenied)")
    void testCashierBlockedFromMedicineCreation() {
        MedicineDto dto = new MedicineDto();
        dto.setName("Unauthorized Med");
        assertThrows(AccessDeniedException.class, () -> medicineController.createMedicine(dto),
                "Cashier should not have permission to add new medicines to the catalog");
    }

    @Test
    @WithMockUser(username = "cashier_user", roles = {"CASHIER"})
    @DisplayName("SEC-03: CASHIER must be BLOCKED from accessing financial sales reports")
    void testCashierBlockedFromReports() {
        assertThrows(AccessDeniedException.class, () -> reportController.getSalesReport("monthly", null, null),
                "Cashier should not have permission to access financial executive reports");
    }

    // ========================================================
    // SEC-03: Pharmacist Role RBAC Boundary Tests
    // ========================================================

    @Test
    @WithMockUser(username = "pharm_user", roles = {"PHARMACIST"})
    @DisplayName("SEC-03: PHARMACIST can create and update medicines in catalogue")
    void testPharmacistCanCreateMedicine() {
        MedicineDto dto = new MedicineDto();
        dto.setName("Paracetamol 500mg");
        when(medicineService.createMedicine(any(MedicineDto.class))).thenReturn(dto);

        ResponseEntity<ApiResponse<MedicineDto>> response = medicineController.createMedicine(dto);
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    @WithMockUser(username = "pharm_user", roles = {"PHARMACIST"})
    @DisplayName("SEC-03: PHARMACIST must be BLOCKED from deleting medicines (Admin only)")
    void testPharmacistBlockedFromMedicineDeletion() {
        assertThrows(AccessDeniedException.class, () -> medicineController.deleteMedicine(1L),
                "Only ADMIN should be permitted to deactivate/delete medicines from the catalog");
    }

    // ========================================================
    // SEC-03: Admin Role RBAC Boundary Tests
    // ========================================================

    @Test
    @WithMockUser(username = "admin_user", roles = {"ADMIN"})
    @DisplayName("SEC-03: ADMIN has full permission to delete medicines")
    void testAdminCanDeleteMedicine() {
        doNothing().when(medicineService).deleteMedicine(1L);

        ResponseEntity<ApiResponse<Void>> response = medicineController.deleteMedicine(1L);
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        verify(medicineService, times(1)).deleteMedicine(1L);
    }
}

