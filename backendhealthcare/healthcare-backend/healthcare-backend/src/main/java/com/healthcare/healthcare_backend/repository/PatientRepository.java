package com.healthcare.healthcare_backend.repository;

import com.healthcare.healthcare_backend.entity.Patient;
import com.healthcare.healthcare_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUser(User user);
    Optional<Patient> findByUserId(Long userId);
}
