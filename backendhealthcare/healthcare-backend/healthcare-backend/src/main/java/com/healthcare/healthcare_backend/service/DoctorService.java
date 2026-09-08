package com.healthcare.healthcare_backend.service;

import com.healthcare.healthcare_backend.entity.Doctor;
import com.healthcare.healthcare_backend.repository.DoctorRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DoctorService {
    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    public Doctor saveDoctor(Doctor doctor){
        return doctorRepository.save(doctor);
    }

    public List<Doctor> getAllDoctors(){
        return doctorRepository.findAll();
    }

    public Doctor updateAvailability(Long doctorId, String availability) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .or(() -> doctorRepository.findByUserId(doctorId))
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        doctor.setAvailability(availability);
        return doctorRepository.save(doctor);
    }

    public Doctor updateConsultationFee(Long doctorId, Double consultationFee) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .or(() -> doctorRepository.findByUserId(doctorId))
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        doctor.setConsultationFee(consultationFee);
        return doctorRepository.save(doctor);
    }

    public Doctor updateShift(Long doctorId, String shift, Integer workingHours) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .or(() -> doctorRepository.findByUserId(doctorId))
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (shift != null && !shift.isBlank()) {
            doctor.setShift(shift);
        }
        if (workingHours != null && workingHours > 0) {
            doctor.setWorkingHours(workingHours);
        }
        return doctorRepository.save(doctor);
    }
}
