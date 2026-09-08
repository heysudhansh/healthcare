package com.healthcare.healthcare_backend.service;

import com.healthcare.healthcare_backend.dto.AppointmentRequest;
import com.healthcare.healthcare_backend.entity.Appointment;
import com.healthcare.healthcare_backend.entity.Doctor;
import com.healthcare.healthcare_backend.entity.Patient;
import com.healthcare.healthcare_backend.entity.User;
import com.healthcare.healthcare_backend.exception.AppointmentAlreadyExistsException;
import com.healthcare.healthcare_backend.repository.AppointmentRepository;
import com.healthcare.healthcare_backend.repository.DoctorRepository;
import com.healthcare.healthcare_backend.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AppointmentServiceTest {

    private AppointmentRepository appointmentRepository;
    private PatientRepository patientRepository;
    private DoctorRepository doctorRepository;
    private AppointmentService appointmentService;

    private Patient mockPatient;
    private Doctor mockDoctor;

    @BeforeEach
    void setUp() {
        appointmentRepository = mock(AppointmentRepository.class);
        patientRepository = mock(PatientRepository.class);
        doctorRepository = mock(DoctorRepository.class);

        appointmentService = new AppointmentService(appointmentRepository, patientRepository, doctorRepository);

        mockPatient = new Patient();
        mockPatient.setId(1L);
        User pUser = new User();
        pUser.setName("Rahul Sharma");
        mockPatient.setUser(pUser);

        mockDoctor = new Doctor();
        mockDoctor.setId(2L);
        mockDoctor.setConsultationFee(1500.0);
        mockDoctor.setSpecialization("Cardiology & Cardiac Sciences");
        User dUser = new User();
        dUser.setName("Dr. Arvind M Das");
        mockDoctor.setUser(dUser);
    }

    @Test
    @DisplayName("1. Book consultation appointment successfully")
    void testCreateAppointment_Success() {
        AppointmentRequest req = new AppointmentRequest();
        req.setPatientId(1L);
        req.setDoctorId(2L);
        req.setAppointmentDate("2026-09-15");
        req.setAppointmentTime("10:00 AM");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(mockPatient));
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(mockDoctor));
        when(appointmentRepository.existsByDoctorAndAppointmentDateAndAppointmentTime(mockDoctor, "2026-09-15", "10:00 AM")).thenReturn(false);
        when(appointmentRepository.existsByPatientAndAppointmentDateAndAppointmentTime(mockPatient, "2026-09-15", "10:00 AM")).thenReturn(false);

        Appointment saved = new Appointment();
        saved.setId(501L);
        saved.setPatient(mockPatient);
        saved.setDoctor(mockDoctor);
        saved.setAppointmentDate("2026-09-15");
        saved.setAppointmentTime("10:00 AM");
        saved.setStatus("Booked");
        saved.setConsultationFee(1500.0);

        when(appointmentRepository.save(any(Appointment.class))).thenReturn(saved);

        Appointment res = appointmentService.createAppointment(req);

        assertNotNull(res);
        assertEquals(501L, res.getId());
        assertEquals("Booked", res.getStatus());
        assertEquals(1500.0, res.getConsultationFee());
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    @DisplayName("2. Prevent doctor double-booking for same date and time slot")
    void testCreateAppointment_DoctorDoubleBooking_ThrowsException() {
        AppointmentRequest req = new AppointmentRequest();
        req.setPatientId(1L);
        req.setDoctorId(2L);
        req.setAppointmentDate("2026-09-15");
        req.setAppointmentTime("10:00 AM");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(mockPatient));
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(mockDoctor));
        when(appointmentRepository.existsByDoctorAndAppointmentDateAndAppointmentTime(mockDoctor, "2026-09-15", "10:00 AM")).thenReturn(true);

        assertThrows(AppointmentAlreadyExistsException.class, () -> {
            appointmentService.createAppointment(req);
        });
    }

    @Test
    @DisplayName("3. Prevent patient double-booking across multiple doctors at same time")
    void testCreateAppointment_PatientDoubleBooking_ThrowsException() {
        AppointmentRequest req = new AppointmentRequest();
        req.setPatientId(1L);
        req.setDoctorId(2L);
        req.setAppointmentDate("2026-09-15");
        req.setAppointmentTime("10:00 AM");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(mockPatient));
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(mockDoctor));
        when(appointmentRepository.existsByDoctorAndAppointmentDateAndAppointmentTime(mockDoctor, "2026-09-15", "10:00 AM")).thenReturn(false);
        when(appointmentRepository.existsByPatientAndAppointmentDateAndAppointmentTime(mockPatient, "2026-09-15", "10:00 AM")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            appointmentService.createAppointment(req);
        });

        assertEquals("Patient already has an appointment at this time.", ex.getMessage());
    }

    @Test
    @DisplayName("4. Missing appointment date validation check")
    void testCreateAppointment_MissingDate_ThrowsException() {
        AppointmentRequest req = new AppointmentRequest();
        req.setPatientId(1L);
        req.setDoctorId(2L);
        req.setAppointmentDate(null);
        req.setAppointmentTime("10:00 AM");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(mockPatient));
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(mockDoctor));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            appointmentService.createAppointment(req);
        });

        assertEquals("Appointment date is required.", ex.getMessage());
    }

    @Test
    @DisplayName("5. Cancel existing appointment updates status to CANCELLED")
    void testCancelAppointment_Success() {
        Appointment appt = new Appointment();
        appt.setId(501L);
        appt.setStatus("Booked");

        when(appointmentRepository.findById(501L)).thenReturn(Optional.of(appt));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        Appointment cancelled = appointmentService.cancelAppointment(501L);

        assertNotNull(cancelled);
        assertEquals("CANCELLED", cancelled.getStatus());
    }

    @Test
    @DisplayName("6. Reschedule appointment to new date and time slot")
    void testRescheduleAppointment_Success() {
        Appointment appt = new Appointment();
        appt.setId(501L);
        appt.setDoctor(mockDoctor);
        appt.setAppointmentDate("2026-09-15");
        appt.setAppointmentTime("10:00 AM");
        appt.setStatus("Booked");

        when(appointmentRepository.findById(501L)).thenReturn(Optional.of(appt));
        when(appointmentRepository.existsByDoctorAndAppointmentDateAndAppointmentTime(mockDoctor, "2026-09-20", "02:00 PM")).thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        Appointment rescheduled = appointmentService.rescheduleAppointment(501L, "2026-09-20", "02:00 PM");

        assertNotNull(rescheduled);
        assertEquals("2026-09-20", rescheduled.getAppointmentDate());
        assertEquals("02:00 PM", rescheduled.getAppointmentTime());
        assertEquals("Booked", rescheduled.getStatus());
    }

    @Test
    @DisplayName("7. Doctor saves clinical prescription on appointment")
    void testUpdatePrescription_Success() {
        Appointment appt = new Appointment();
        appt.setId(501L);
        appt.setStatus("Booked");

        String prescriptionNotes = "Tab Paracetamol 650mg twice daily after food for 3 days. Rest and hydration.";

        when(appointmentRepository.findById(501L)).thenReturn(Optional.of(appt));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        Appointment updated = appointmentService.updatePrescription(501L, prescriptionNotes);

        assertNotNull(updated);
        assertEquals(prescriptionNotes, updated.getPrescription());
        verify(appointmentRepository, times(1)).save(appt);
    }
}
