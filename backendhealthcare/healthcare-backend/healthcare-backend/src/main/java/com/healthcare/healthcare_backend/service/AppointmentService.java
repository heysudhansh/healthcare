package com.healthcare.healthcare_backend.service;

import com.healthcare.healthcare_backend.dto.AppointmentRequest;
import com.healthcare.healthcare_backend.entity.Appointment;
import com.healthcare.healthcare_backend.entity.Doctor;
import com.healthcare.healthcare_backend.entity.Patient;
import com.healthcare.healthcare_backend.repository.AppointmentRepository;
import com.healthcare.healthcare_backend.repository.DoctorRepository;
import com.healthcare.healthcare_backend.repository.PatientRepository;
import com.healthcare.healthcare_backend.exception.AppointmentAlreadyExistsException;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public AppointmentService(AppointmentRepository appointmentRepository, PatientRepository patientRepository, DoctorRepository doctorRepository) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    public Appointment createAppointment(AppointmentRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .or(() -> patientRepository.findByUserId(request.getPatientId()))
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .or(() -> doctorRepository.findByUserId(request.getDoctorId()))
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (request.getAppointmentDate() == null || request.getAppointmentDate().isBlank()) {
            throw new RuntimeException("Appointment date is required.");
        }
        if (request.getAppointmentTime() == null || request.getAppointmentTime().isBlank()) {
            throw new RuntimeException("Appointment time is required.");
        }

        boolean alreadyBooked = appointmentRepository.existsByDoctorAndAppointmentDateAndAppointmentTime(doctor, request.getAppointmentDate(), request.getAppointmentTime());

        if (alreadyBooked) {
            throw new AppointmentAlreadyExistsException("Doctor is already booked at this time.");
        }

        boolean patientAlreadyBooked = appointmentRepository.existsByPatientAndAppointmentDateAndAppointmentTime(patient, request.getAppointmentDate(), request.getAppointmentTime());

        if (patientAlreadyBooked) {
            throw new RuntimeException("Patient already has an appointment at this time.");
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setStatus("Booked");
        if (doctor.getConsultationFee() != null) {
            appointment.setConsultationFee(doctor.getConsultationFee());
        }
        return appointmentRepository.save(appointment);
    }

    public Appointment cancelAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus("CANCELLED");
        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public List<Appointment> getAppointmentByPatient(Long patientId) {
        List<Appointment> list = appointmentRepository.findByPatientId(patientId);
        if (list.isEmpty()) {
            list = appointmentRepository.findByPatientUserId(patientId);
        }
        return list;
    }

    public List<Appointment> getAppointmentByDoctor(Long doctorId) {
        List<Appointment> list = appointmentRepository.findByDoctorId(doctorId);
        if (list.isEmpty()) {
            list = appointmentRepository.findByDoctorUserId(doctorId);
        }
        return list;
    }

    public List<Appointment> getAppointmentsByStatus(String status) {
        return appointmentRepository.findByStatus(status);
    }

    public Appointment rescheduleAppointment(Long id, String newDate, String newTime) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        boolean alreadyBooked = appointmentRepository.existsByDoctorAndAppointmentDateAndAppointmentTime(
                appointment.getDoctor(),
                newDate,
                newTime);

        if (alreadyBooked) {
            throw new AppointmentAlreadyExistsException("Doctor is already booked at this time.");
        }

        appointment.setAppointmentDate(newDate);
        appointment.setAppointmentTime(newTime);
        appointment.setStatus("Booked");

        return appointmentRepository.save(appointment);
    }

    public Appointment updatePrescription(Long id, String prescription) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setPrescription(prescription);
        return appointmentRepository.save(appointment);
    }
}
