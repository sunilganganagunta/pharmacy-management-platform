package com.medicore.exception;

public class ExpiredMedicineException extends RuntimeException {
    public ExpiredMedicineException(String message) {
        super(message);
    }
}

