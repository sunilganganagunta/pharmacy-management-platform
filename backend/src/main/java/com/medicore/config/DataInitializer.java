package com.medicore.config;

import com.medicore.entity.User;
import com.medicore.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Ensure default admin user exists
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User(
                    "admin",
                    "admin@medicore.com",
                    passwordEncoder.encode("Admin@123"),
                    "Dr. Sunil Sharma (Admin)",
                    "+91 98765 43210",
                    User.Role.ADMIN
            );
            userRepository.save(admin);
            logger.info("Initialized default ADMIN user: admin@medicore.com");
        }

        // Ensure default pharmacist user exists
        if (!userRepository.existsByUsername("pharmacist")) {
            User pharmacist = new User(
                    "pharmacist",
                    "pharmacist@medicore.com",
                    passwordEncoder.encode("Pharmacist@123"),
                    "Priya Patel (Lead Pharmacist)",
                    "+91 98765 43211",
                    User.Role.PHARMACIST
            );
            userRepository.save(pharmacist);
            logger.info("Initialized default PHARMACIST user: pharmacist@medicore.com");
        }
    }
}

