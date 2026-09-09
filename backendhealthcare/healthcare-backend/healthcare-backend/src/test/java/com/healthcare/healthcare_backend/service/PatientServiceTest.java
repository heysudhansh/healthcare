package com.healthcare.healthcare_backend.service;

import com.healthcare.healthcare_backend.entity.Patient;
import com.healthcare.healthcare_backend.entity.User;
import com.healthcare.healthcare_backend.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class PatientServiceTest {

    private PatientRepository patientRepository;
    private PatientService patientService;
    private Patient samplePatient;

    @BeforeEach
    void setUp() {
        patientRepository = mock(PatientRepository.class);
        patientService = new PatientService(patientRepository);

        samplePatient = new Patient();
        samplePatient.setId(101L);
        samplePatient.setGender("Male");
        samplePatient.setBloodGroup("B+");
        samplePatient.setMedicalHistory("Routine health checkup");

        User user = new User();
        user.setId(1L);
        user.setName("Rahul Sharma");
        samplePatient.setUser(user);
    }

    @Test
    @DisplayName("1. Save and return patient entity")
    void testSavePatient_Success() {
        when(patientRepository.save(any(Patient.class))).thenReturn(samplePatient);

        Patient saved = patientService.savePatient(samplePatient);

        assertNotNull(saved);
        assertEquals(101L, saved.getId());
        assertEquals("Male", saved.getGender());
        verify(patientRepository, times(1)).save(samplePatient);
    }

    @Test
    @DisplayName("2. Retrieve complete list of registered patients")
    void testGetAllPatients_ReturnsList() {
        Patient p2 = new Patient();
        p2.setId(102L);
        p2.setGender("Female");
        p2.setBloodGroup("O+");

        when(patientRepository.findAll()).thenReturn(Arrays.asList(samplePatient, p2));

        List<Patient> list = patientService.getAllPatients();

        assertEquals(2, list.size());
        assertEquals("Male", list.get(0).getGender());
        assertEquals("Female", list.get(1).getGender());
    }

    @Test
    @DisplayName("3. Update patient medical history successfully")
    void testUpdateMedicalHistory_Success() {
        when(patientRepository.findById(101L)).thenReturn(Optional.of(samplePatient));
        when(patientRepository.save(any(Patient.class))).thenAnswer(i -> i.getArgument(0));

        Patient updated = patientService.updateMedicalHistory(101L, "Hypertension, Seasonal allergy");

        assertNotNull(updated);
        assertEquals("Hypertension, Seasonal allergy", updated.getMedicalHistory());
        verify(patientRepository, times(1)).save(samplePatient);
    }

    @Test
    @DisplayName("4. Update medical history throws exception when patient not found")
    void testUpdateMedicalHistory_PatientNotFound_ThrowsException() {
        when(patientRepository.findById(999L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            patientService.updateMedicalHistory(999L, "Diabetic consultation");
        });

        assertEquals("Patient not found", ex.getMessage());
    }
}
