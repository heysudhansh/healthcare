package com.healthcare.healthcare_backend.service;

import com.healthcare.healthcare_backend.entity.Patient;
import com.healthcare.healthcare_backend.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public Patient savePatient(Patient patient) {
        return patientRepository.save(patient);
    }

    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    public Patient updateMedicalHistory(Long patientId, String medicalHistory) {
        Patient patient = patientRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        patient.setMedicalHistory(medicalHistory);
        return patientRepository.save(patient);
    }
}