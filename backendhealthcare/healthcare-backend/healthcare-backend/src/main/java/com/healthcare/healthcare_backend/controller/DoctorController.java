package com.healthcare.healthcare_backend.controller;

import com.healthcare.healthcare_backend.entity.Doctor;
import com.healthcare.healthcare_backend.service.DoctorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/doctors")
public class DoctorController {
    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService){
        this.doctorService = doctorService;
    }

    @PostMapping
    public Doctor createDoctor(@RequestBody Doctor doctor){
        return doctorService.saveDoctor(doctor);
    }

    @GetMapping
    public List<Doctor> getALlDoctors(){
        return doctorService.getAllDoctors();
    }

    @PutMapping("/availability/{doctorId}")
    public Doctor updateAvailability(
            @PathVariable Long doctorId,
            @RequestParam String availability) {
        return doctorService.updateAvailability(doctorId, availability);
    }

    @PutMapping("/fee/{doctorId}")
    public Doctor updateConsultationFee(
            @PathVariable Long doctorId,
            @RequestParam Double consultationFee) {
        return doctorService.updateConsultationFee(doctorId, consultationFee);
    }
}
