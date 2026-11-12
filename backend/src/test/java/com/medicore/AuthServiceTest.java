package com.medicore;

import com.medicore.dto.AuthRequest;
import com.medicore.dto.AuthResponse;
import com.medicore.dto.RegisterRequest;
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
}

