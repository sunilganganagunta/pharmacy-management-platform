package com.medicore.service;

import com.medicore.dto.AuthRequest;
import com.medicore.dto.AuthResponse;
import com.medicore.dto.ForgotPasswordRequest;
import com.medicore.dto.RegisterRequest;
import com.medicore.entity.User;
import com.medicore.exception.BadRequestException;
import com.medicore.exception.ResourceNotFoundException;
import com.medicore.repository.UserRepository;
import com.medicore.security.CustomUserDetails;
import com.medicore.security.JwtUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    public AuthResponse authenticateUser(AuthRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        return new AuthResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getFullName(),
                userDetails.getRole()
        );
    }

    @Transactional
    public AuthResponse registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        User.Role role = User.Role.PHARMACIST;
        if (request.getRole() != null && request.getRole().equalsIgnoreCase("ADMIN")) {
            role = User.Role.ADMIN;
        }

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName(),
                request.getPhone(),
                role
        );

        userRepository.save(user);

        return authenticateUser(new AuthRequest(request.getUsername(), request.getPassword()));
    }

    @Transactional
    public void resetPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + request.getEmail()));

        String newPass = (request.getNewPassword() != null && !request.getNewPassword().isBlank()) 
                ? request.getNewPassword() 
                : "MediCore@2026";
        user.setPasswordHash(passwordEncoder.encode(newPass));
        userRepository.save(user);
    }
}

