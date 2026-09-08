package com.healthcare.healthcare_backend.service;

import com.healthcare.healthcare_backend.dto.RegisterRequest;
import com.healthcare.healthcare_backend.entity.Doctor;
import com.healthcare.healthcare_backend.entity.Patient;
import com.healthcare.healthcare_backend.entity.Role;
import com.healthcare.healthcare_backend.entity.User;
import com.healthcare.healthcare_backend.repository.DoctorRepository;
import com.healthcare.healthcare_backend.repository.PatientRepository;
import com.healthcare.healthcare_backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class UserServiceTest {

    private UserRepository userRepository;
    private PatientRepository patientRepository;
    private DoctorRepository doctorRepository;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        patientRepository = mock(PatientRepository.class);
        doctorRepository = mock(DoctorRepository.class);

        userService = new UserService(userRepository, patientRepository, doctorRepository);
    }

    @Test
    @DisplayName("1. Register new patient successfully")
    void testRegisterPatient_Success() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Rahul Sharma");
        req.setEmail("rahul.sharma@hospital.com");
        req.setPassword("patientPass123");
        req.setPhone("+91-98765-43210");
        req.setRole(Role.PATIENT);
        req.setGender("Male");
        req.setBloodGroup("B+");
        req.setMedicalHistory("Routine annual checkup");

        User saved = new User();
        saved.setId(101L);
        saved.setName(req.getName());
        saved.setEmail(req.getEmail());
        saved.setRole(Role.PATIENT);

        when(userRepository.save(any(User.class))).thenReturn(saved);
        when(patientRepository.save(any(Patient.class))).thenReturn(new Patient());

        User result = userService.registerUser(req);

        assertNotNull(result);
        assertEquals("Rahul Sharma", result.getName());
        assertEquals("rahul.sharma@hospital.com", result.getEmail());
        assertEquals(Role.PATIENT, result.getRole());
        verify(patientRepository, times(1)).save(any(Patient.class));
    }

    @Test
    @DisplayName("2. Register doctor with shift and daily hours")
    void testRegisterDoctor_WithShiftAndHours() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Dr. Bhavna Chaudhry");
        req.setEmail("dr.bhavna@hospital.com");
        req.setPassword("docPass123");
        req.setPhone("+91-98111-20001");
        req.setRole(Role.DOCTOR);
        req.setSpecialization("Obstetrics & Gynaecology");
        req.setQualification("MBBS, MS");
        req.setExperience(29);
        req.setConsultationFee(1200.0);
        req.setShift("Day");
        req.setWorkingHours(8);

        User saved = new User();
        saved.setId(102L);
        saved.setName(req.getName());
        saved.setEmail(req.getEmail());
        saved.setRole(Role.DOCTOR);

        when(userRepository.save(any(User.class))).thenReturn(saved);
        when(doctorRepository.save(any(Doctor.class))).thenReturn(new Doctor());

        User result = userService.registerUser(req);

        assertNotNull(result);
        assertEquals(Role.DOCTOR, result.getRole());
        verify(doctorRepository, times(1)).save(any(Doctor.class));
    }

    @Test
    @DisplayName("3. Login with valid credentials returns user")
    void testLogin_Success() {
        User user = new User();
        user.setId(1L);
        user.setEmail("admin@hospital.com");
        user.setPassword("admin123");
        user.setRole(Role.ADMIN);

        when(userRepository.findByEmail("admin@hospital.com")).thenReturn(user);

        User loggedIn = userService.login("admin@hospital.com", "admin123");

        assertNotNull(loggedIn);
        assertEquals("admin@hospital.com", loggedIn.getEmail());
        assertEquals(Role.ADMIN, loggedIn.getRole());
    }

    @Test
    @DisplayName("4. Login with invalid password throws exception")
    void testLogin_InvalidPassword_ThrowsException() {
        User user = new User();
        user.setId(2L);
        user.setEmail("doctor@hospital.com");
        user.setPassword("correctPassword");

        when(userRepository.findByEmail("doctor@hospital.com")).thenReturn(user);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            userService.login("doctor@hospital.com", "wrongPassword");
        });

        assertEquals("Invalid password", ex.getMessage());
    }

    @Test
    @DisplayName("5. Login with non-existing email throws User not found")
    void testLogin_UserNotFound_ThrowsException() {
        when(userRepository.findByEmail("unknown@hospital.com")).thenReturn(null);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            userService.login("unknown@hospital.com", "anyPass");
        });

        assertEquals("User not found", ex.getMessage());
    }

    @Test
    @DisplayName("6. Fetch all users list for admin portal")
    void testGetAllUsers_ReturnsUserList() {
        User u1 = new User();
        u1.setId(1L);
        u1.setName("Admin");

        User u2 = new User();
        u2.setId(2L);
        u2.setName("Dr. Rajiv");

        when(userRepository.findAll()).thenReturn(Arrays.asList(u1, u2));

        List<User> list = userService.getAllUsers();

        assertEquals(2, list.size());
        assertEquals("Admin", list.get(0).getName());
        assertEquals("Dr. Rajiv", list.get(1).getName());
    }
}
