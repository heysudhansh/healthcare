package com.healthcare.healthcare_backend.exception;

public class AppointmentAlreadyExistsException extends RuntimeException {

    public AppointmentAlreadyExistsException(String message){
        super(message);
    }
}
