package com.healthcare.healthcare_backend.service;

import com.healthcare.healthcare_backend.entity.Doctor;
import com.healthcare.healthcare_backend.entity.User;
import com.healthcare.healthcare_backend.repository.DoctorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class DoctorServiceTest {

    private DoctorRepository doctorRepository;
    private DoctorService doctorService;
    private Doctor sampleDoctor;

    @BeforeEach
    void setUp() {
        doctorRepository = mock(DoctorRepository.class);
        doctorService = new DoctorService(doctorRepository);

        sampleDoctor = new Doctor();
        sampleDoctor.setId(10L);
        sampleDoctor.setSpecialization("Orthopaedics & Joint Replacement");
        sampleDoctor.setAvailability("Available");
        sampleDoctor.setConsultationFee(1800.0);
        sampleDoctor.setShift("Day");
        sampleDoctor.setWorkingHours(8);

        User docUser = new User();
        docUser.setId(10L);
        docUser.setName("Dr. S.K.S. Marya");
        sampleDoctor.setUser(docUser);
    }

    @Test
    @DisplayName("1. Update doctor availability to Busy or Available")
    void testUpdateAvailability_Success() {
        when(doctorRepository.findById(10L)).thenReturn(Optional.of(sampleDoctor));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(i -> i.getArgument(0));

        Doctor updated = doctorService.updateAvailability(10L, "Busy");

        assertNotNull(updated);
        assertEquals("Busy", updated.getAvailability());
        verify(doctorRepository, times(1)).save(sampleDoctor);
    }

    @Test
    @DisplayName("2. Update doctor consultation fee in Indian Rupees")
    void testUpdateConsultationFee_Success() {
        when(doctorRepository.findById(10L)).thenReturn(Optional.of(sampleDoctor));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(i -> i.getArgument(0));

        Doctor updated = doctorService.updateConsultationFee(10L, 2000.0);

        assertNotNull(updated);
        assertEquals(2000.0, updated.getConsultationFee());
        verify(doctorRepository, times(1)).save(sampleDoctor);
    }

    @Test
    @DisplayName("3. Update doctor shift timing and daily working hours")
    void testUpdateShiftAndWorkingHours_Success() {
        when(doctorRepository.findById(10L)).thenReturn(Optional.of(sampleDoctor));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(i -> i.getArgument(0));

        Doctor updated = doctorService.updateShift(10L, "Night", 6);

        assertNotNull(updated);
        assertEquals("Night", updated.getShift());
        assertEquals(6, updated.getWorkingHours());
        verify(doctorRepository, times(1)).save(sampleDoctor);
    }

    @Test
    @DisplayName("4. Retrieve all registered specialist doctors")
    void testGetAllDoctors_ReturnsList() {
        Doctor d1 = new Doctor();
        d1.setId(1L);
        d1.setSpecialization("Cardiology");

        Doctor d2 = new Doctor();
        d2.setId(2L);
        d2.setSpecialization("ENT");

        when(doctorRepository.findAll()).thenReturn(Arrays.asList(d1, d2));

        List<Doctor> doctors = doctorService.getAllDoctors();

        assertEquals(2, doctors.size());
        assertEquals("Cardiology", doctors.get(0).getSpecialization());
        assertEquals("ENT", doctors.get(1).getSpecialization());
    }
}
