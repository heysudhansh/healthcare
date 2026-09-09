package com.healthcare.healthcare_backend.controller;

import com.healthcare.healthcare_backend.dto.AppointmentRequest;
import com.healthcare.healthcare_backend.entity.Appointment;
import com.healthcare.healthcare_backend.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService){
        this.appointmentService=appointmentService;
    }

    @PostMapping
    public Appointment createAppointment(@Valid @RequestBody AppointmentRequest request) {
        return appointmentService.createAppointment(request);
    }

    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }
    @PutMapping("/cancel/{id}")
    public Appointment cancelAppointment(@PathVariable Long id){
        return appointmentService.cancelAppointment(id);
    }

    @GetMapping("/patient/{patientId}")
    public List<Appointment> getAppointmentsByPatient(@PathVariable Long patientId){
        return appointmentService.getAppointmentByPatient(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> getAppointmentByDoctor(@PathVariable Long doctorId){
        return appointmentService.getAppointmentByDoctor(doctorId);
    }
    @GetMapping("/status/{status}")
    public List<Appointment> getAppointmentsByStatus(@PathVariable String status) {
        return appointmentService.getAppointmentsByStatus(status);
    }

    @PutMapping("/reschedule/{id}")
    public Appointment rescheduleAppointment(
            @PathVariable Long id,
            @RequestParam String newDate,
            @RequestParam String newTime) {

        return appointmentService
                .rescheduleAppointment(
                        id,
                        newDate,
                        newTime);
    }

    @PutMapping("/prescription/{id}")
    public Appointment updatePrescription(
            @PathVariable Long id,
            @RequestParam String prescription) {
        return appointmentService.updatePrescription(id, prescription);
    }

}
