package com.medicore.service;

import com.medicore.dto.CustomerDto;
import com.medicore.entity.Customer;
import com.medicore.exception.BadRequestException;
import com.medicore.exception.ResourceNotFoundException;
import com.medicore.repository.CustomerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public Page<CustomerDto> getAllCustomers(String query, Pageable pageable) {
        if (query != null && !query.trim().isEmpty()) {
            return customerRepository.findByNameContainingIgnoreCaseOrPhoneContaining(query.trim(), query.trim(), pageable)
                    .map(this::convertToDto);
        }
        return customerRepository.findAll(pageable).map(this::convertToDto);
    }

    public List<CustomerDto> getAllCustomersList() {
        return customerRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public CustomerDto getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + id));
        return convertToDto(customer);
    }

    public CustomerDto getCustomerByPhone(String phone) {
        Customer customer = customerRepository.findByPhone(phone)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with phone: " + phone));
        return convertToDto(customer);
    }

    @Transactional
    public CustomerDto createCustomer(CustomerDto dto) {
        if (customerRepository.existsByPhone(dto.getPhone())) {
            throw new BadRequestException("A customer with phone number " + dto.getPhone() + " already exists.");
        }

        Customer customer = new Customer(
                dto.getName(),
                dto.getPhone(),
                dto.getEmail(),
                dto.getAddress()
        );
        Customer saved = customerRepository.save(customer);
        return convertToDto(saved);
    }

    @Transactional
    public CustomerDto updateCustomer(Long id, CustomerDto dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + id));

        if (!customer.getPhone().equals(dto.getPhone()) && customerRepository.existsByPhone(dto.getPhone())) {
            throw new BadRequestException("Phone number already used by another customer: " + dto.getPhone());
        }

        customer.setName(dto.getName());
        customer.setPhone(dto.getPhone());
        customer.setEmail(dto.getEmail());
        customer.setAddress(dto.getAddress());

        Customer updated = customerRepository.save(customer);
        return convertToDto(updated);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + id));
        customerRepository.delete(customer);
    }

    public CustomerDto convertToDto(Customer customer) {
        CustomerDto dto = new CustomerDto();
        dto.setId(customer.getId());
        dto.setName(customer.getName());
        dto.setPhone(customer.getPhone());
        dto.setEmail(customer.getEmail());
        dto.setAddress(customer.getAddress());
        dto.setTotalPurchases(customer.getTotalPurchases());
        return dto;
    }
}

