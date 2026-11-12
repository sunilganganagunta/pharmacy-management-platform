package com.medicore.config;

import com.medicore.entity.User;
import com.medicore.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${medicore.admin.default-password:Admin@123}")
    private String adminPassword;

    @Value("${medicore.pharmacist.default-password:Pharmacist@123}")
    private String pharmacistPassword;

    @Value("${medicore.cashier.default-password:Cashier@123}")
    private String cashierPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        boolean initializedAny = false;

        // Ensure default admin user exists
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User(
                    "admin",
                    "admin@medicore.com",
                    passwordEncoder.encode(adminPassword),
                    "Dr. Sunil Sharma (Admin)",
                    "+91 98765 43210",
                    User.Role.ADMIN
            );
            userRepository.save(admin);
            logger.info("Initialized default ADMIN user: admin@medicore.com");
            initializedAny = true;
        }

        // Ensure default pharmacist user exists
        if (!userRepository.existsByUsername("pharmacist")) {
            User pharmacist = new User(
                    "pharmacist",
                    "pharmacist@medicore.com",
                    passwordEncoder.encode(pharmacistPassword),
                    "Priya Patel (Lead Pharmacist)",
                    "+91 98765 43211",
                    User.Role.PHARMACIST
            );
            userRepository.save(pharmacist);
            logger.info("Initialized default PHARMACIST user: pharmacist@medicore.com");
            initializedAny = true;
        }

        // Ensure default cashier user exists (SEC-03 3-tier RBAC)
        if (!userRepository.existsByUsername("cashier")) {
            User cashier = new User(
                    "cashier",
                    "cashier@medicore.com",
                    passwordEncoder.encode(cashierPassword),
                    "Rahul Verma (Lead Cashier)",
                    "+91 98765 43212",
                    User.Role.CASHIER
            );
            userRepository.save(cashier);
            logger.info("Initialized default CASHIER user: cashier@medicore.com");
            initializedAny = true;
        }

        if (initializedAny) {
            logger.warn("SECURITY NOTICE: Default seeded user accounts are active. Ensure all passwords are rotated prior to ingesting live clinical data.");
        }
    }
}
