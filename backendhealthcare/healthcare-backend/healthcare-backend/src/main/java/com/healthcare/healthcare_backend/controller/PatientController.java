package com.healthcare.healthcare_backend.controller;

import com.healthcare.healthcare_backend.entity.Patient;
import com.healthcare.healthcare_backend.service.PatientService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patients")
public class PatientController {
    private final PatientService patientService;

    public PatientController(PatientService patientService){
        this.patientService = patientService;
    }

    @PostMapping
    public Patient createPatient(@RequestBody Patient patient){
        return patientService.savePatient(patient);
    }

    @GetMapping
    public List<Patient> getAllPatients(){
        return patientService.getAllPatients();
    }

    @PutMapping("/medical-history/{patientId}")
    public Patient updateMedicalHistory(
            @PathVariable Long patientId,
            @RequestParam String medicalHistory) {
        return patientService.updateMedicalHistory(patientId, medicalHistory);
    }
}
