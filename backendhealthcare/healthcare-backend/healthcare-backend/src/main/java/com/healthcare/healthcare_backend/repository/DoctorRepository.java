package com.healthcare.healthcare_backend.repository;

import com.healthcare.healthcare_backend.entity.Doctor;
import com.healthcare.healthcare_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUser(User user);
    Optional<Doctor> findByUserId(Long userId);
}
