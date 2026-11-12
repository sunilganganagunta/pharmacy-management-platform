package com.medicore;

import com.medicore.dto.AuthRequest;
import com.medicore.dto.AuthResponse;
import com.medicore.dto.ForgotPasswordRequest;
import com.medicore.dto.RegisterRequest;
import com.medicore.dto.ResetPasswordConfirmRequest;
import com.medicore.exception.BadRequestException;
import com.medicore.repository.UserRepository;
import com.medicore.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Should successfully authenticate existing admin user")
    void testAdminLoginSuccess() {
        AuthRequest request = new AuthRequest("admin", "Admin@123");
        AuthResponse response = authService.authenticateUser(request);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("admin", response.getUsername());
        assertEquals("ADMIN", response.getRole());
    }

    @Test
    @DisplayName("Should fail authentication with invalid credentials")
    void testInvalidPasswordFailure() {
        AuthRequest request = new AuthRequest("admin", "WrongPassword999");
        assertThrows(BadCredentialsException.class, () -> authService.authenticateUser(request));
    }

    @Test
    @DisplayName("Should register new user and prevent duplicate username registration")
    void testRegisterDuplicateUser() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("newpharm");
        req.setEmail("newpharm@medicore.com");
        req.setPassword("SecurePass123");
        req.setFullName("John Doe");
        req.setRole("PHARMACIST");

        AuthResponse resp = authService.registerUser(req);
        assertNotNull(resp);
        assertEquals("newpharm", resp.getUsername());

        // Attempt duplicate registration
        RegisterRequest duplicateReq = new RegisterRequest();
        duplicateReq.setUsername("newpharm");
        duplicateReq.setEmail("different@medicore.com");
        duplicateReq.setPassword("SecurePass123");
        duplicateReq.setFullName("Duplicate");

        assertThrows(BadRequestException.class, () -> authService.registerUser(duplicateReq));
    }

    // ========================================================
    // SEC-01: Unauthorized ADMIN Registration Prevention Tests
    // ========================================================

    @Test
    @DisplayName("SEC-01: Public registration must ignore requested ADMIN role and enforce PHARMACIST")
    void testPublicRegistrationCannotCreateAdmin() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("attacker_admin");
        req.setEmail("attacker@medicore.com");
        req.setPassword("AttackPass123");
        req.setFullName("Malicious Actor");
        req.setRole("ADMIN"); // Attempting privilege escalation

        AuthResponse resp = authService.registerUser(req);

        assertNotNull(resp);
        assertEquals("attacker_admin", resp.getUsername());
        assertNotEquals("ADMIN", resp.getRole(), "CRITICAL: Public caller was able to register an ADMIN account!");
        assertEquals("PHARMACIST", resp.getRole(), "Public self-registration must strictly force PHARMACIST role");
    }

    @Test
    @DisplayName("SEC-01: Public registration with manipulated role defaults safely to PHARMACIST")
    void testPublicRegistrationWithManipulatedRoleDefaultsToPharmacist() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("manipulated_user");
        req.setEmail("manipulated@medicore.com");
        req.setPassword("SecurePass123");
        req.setFullName("Test User");
        req.setRole("SUPERUSER_ROOT_ACCESS"); // Arbitrary manipulated role

        AuthResponse resp = authService.registerUser(req);

        assertNotNull(resp);
        assertEquals("PHARMACIST", resp.getRole(), "Manipulated roles must default safely to PHARMACIST");
    }

    @Test
    @DisplayName("SEC-01: Public registration with null or empty role defaults to PHARMACIST")
    void testPublicRegistrationWithNullRoleDefaultsToPharmacist() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("default_user");
        req.setEmail("default_role@medicore.com");
        req.setPassword("SecurePass123");
        req.setFullName("Default Role User");
        req.setRole(null); // No role provided

        AuthResponse resp = authService.registerUser(req);

        assertNotNull(resp);
        assertEquals("PHARMACIST", resp.getRole(), "Omitted role must default to PHARMACIST");
    }

    // ========================================================
    // SEC-02: Secure Password Reset Token Lifecycle Tests
    // ========================================================

    @Test
    @DisplayName("SEC-02: Forgot password returns generic message for non-existent email (anti-enumeration)")
    void testForgotPasswordAntiEnumeration() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("nonexistent_pharmacy_staff@fake.com");

        String result = authService.initiatePasswordReset(req);

        assertNotNull(result);
        assertTrue(result.contains("If an account with that email exists"), "Must return generic response to prevent account enumeration");
    }

    @Test
    @DisplayName("SEC-02: Valid reset token allows password reset and enables successful login")
    void testPasswordResetTokenLifecycle() {
        // 1. Generate valid token for existing pharmacist
        String rawToken = authService.generateResetTokenForUser("pharmacist@medicore.com");
        assertNotNull(rawToken);
        assertEquals(64, rawToken.length(), "Raw token should be 32 bytes (64 hex characters)");

        // 2. Confirm password reset with the token
        ResetPasswordConfirmRequest confirmReq = new ResetPasswordConfirmRequest(rawToken, "NewSecurePass2026!");
        assertDoesNotThrow(() -> authService.confirmPasswordReset(confirmReq));

        // 3. Verify user can now authenticate with the new password
        AuthRequest loginReq = new AuthRequest("pharmacist", "NewSecurePass2026!");
        AuthResponse loginResp = authService.authenticateUser(loginReq);
        assertNotNull(loginResp);
        assertNotNull(loginResp.getToken());
    }

    @Test
    @DisplayName("SEC-02: Token reuse must be prevented (single-use token guarantee)")
    void testPasswordResetRejectsTokenReuse() {
        // 1. Generate token and use it once
        String rawToken = authService.generateResetTokenForUser("pharmacist@medicore.com");
        ResetPasswordConfirmRequest confirmReq = new ResetPasswordConfirmRequest(rawToken, "PassOne123!");
        authService.confirmPasswordReset(confirmReq);

        // 2. Attempt replay with the same token
        ResetPasswordConfirmRequest replayReq = new ResetPasswordConfirmRequest(rawToken, "PassTwoReplay456!");
        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.confirmPasswordReset(replayReq));
        assertTrue(ex.getMessage().contains("already been used"), "Replayed token must be rejected with single-use error");
    }

    @Test
    @DisplayName("SEC-02: Invalid or corrupted token must be rejected")
    void testPasswordResetRejectsCorruptedToken() {
        ResetPasswordConfirmRequest req = new ResetPasswordConfirmRequest("totally_fabricated_token_1234567890", "NewPass123!");
        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.confirmPasswordReset(req));
        assertTrue(ex.getMessage().contains("Invalid or expired"), "Invalid token must be rejected");
    }
}
