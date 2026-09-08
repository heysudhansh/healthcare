package com.healthcare.healthcare_backend.service;

import com.healthcare.healthcare_backend.dto.RegisterRequest;
import com.healthcare.healthcare_backend.entity.Doctor;
import com.healthcare.healthcare_backend.entity.Patient;
import com.healthcare.healthcare_backend.entity.Role;
import com.healthcare.healthcare_backend.entity.User;
import com.healthcare.healthcare_backend.repository.DoctorRepository;
import com.healthcare.healthcare_backend.repository.PatientRepository;
import com.healthcare.healthcare_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public UserService(UserRepository userRepository, PatientRepository patientRepository, DoctorRepository doctorRepository) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    public User registerUser(RegisterRequest request) {
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole() != null ? request.getRole() : Role.PATIENT);

        User savedUser = userRepository.save(user);

        if (savedUser.getRole() == Role.DOCTOR) {
            Doctor doctor = new Doctor();
            doctor.setUser(savedUser);
            doctor.setSpecialization(request.getSpecialization() != null && !request.getSpecialization().isBlank() ? request.getSpecialization() : "General Physician");
            doctor.setQualification(request.getQualification() != null && !request.getQualification().isBlank() ? request.getQualification() : "MBBS, MD");
            doctor.setExperience(request.getExperience() != null ? request.getExperience() : 5);
            doctor.setConsultationFee(request.getConsultationFee() != null ? request.getConsultationFee() : 1000.0);
            doctor.setAvailability(request.getAvailability() != null && !request.getAvailability().isBlank() ? request.getAvailability() : "Available");
            doctor.setShift(request.getShift() != null && !request.getShift().isBlank() ? request.getShift() : "Day");
            doctor.setWorkingHours(request.getWorkingHours() != null ? request.getWorkingHours() : 8);
            doctorRepository.save(doctor);
        } else if (savedUser.getRole() == Role.PATIENT) {
            Patient patient = new Patient();
            patient.setUser(savedUser);
            patient.setGender(request.getGender() != null ? request.getGender() : "Not Specified");
            patient.setBloodGroup(request.getBloodGroup() != null ? request.getBloodGroup() : "N/A");
            patient.setMedicalHistory(request.getMedicalHistory() != null && !request.getMedicalHistory().isBlank() ? request.getMedicalHistory() : "General consultation");
            patientRepository.save(patient);
        }

        return savedUser;
    }

    public User saveUser(User user) {
        User savedUser = userRepository.save(user);

        if (savedUser.getRole() == Role.PATIENT) {
            patientRepository.findByUser(savedUser).orElseGet(() -> {
                Patient patient = new Patient();
                patient.setUser(savedUser);
                patient.setMedicalHistory("General consultation");
                return patientRepository.save(patient);
            });
        } else if (savedUser.getRole() == Role.DOCTOR) {
            doctorRepository.findByUser(savedUser).orElseGet(() -> {
                Doctor doctor = new Doctor();
                doctor.setUser(savedUser);
                doctor.setSpecialization("General Physician");
                doctor.setQualification("MBBS, MD");
                doctor.setExperience(5);
                doctor.setAvailability("Available");
                doctor.setConsultationFee(1000.0);
                return doctorRepository.save(doctor);
            });
        }

        return savedUser;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User login(String email, String password) {
        User user = userRepository.findByEmail(email);

        if (user == null) {
            throw new RuntimeException("User not found");
        }

        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("Invalid password");
        }

        return user;
    }
}
