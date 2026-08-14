package com.healthcare.healthcare_backend;

import com.healthcare.healthcare_backend.entity.Doctor;
import com.healthcare.healthcare_backend.entity.Patient;
import com.healthcare.healthcare_backend.entity.Role;
import com.healthcare.healthcare_backend.entity.User;
import com.healthcare.healthcare_backend.repository.DoctorRepository;
import com.healthcare.healthcare_backend.repository.PatientRepository;
import com.healthcare.healthcare_backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class HealthcareBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(HealthcareBackendApplication.class, args);
	}

	@Bean
	CommandLineRunner initDatabase(
			UserRepository userRepository,
			DoctorRepository doctorRepository,
			PatientRepository patientRepository) {
		return args -> {
			// 1. Seed Default Administrator if not existing
			if (userRepository.findByEmail("admin@hospital.com") == null) {
				User admin = new User();
				admin.setName("System Administrator");
				admin.setEmail("admin@hospital.com");
				admin.setPassword("admin123");
				admin.setPhone("+1-800-555-0100");
				admin.setRole(Role.ADMIN);
				userRepository.save(admin);
				System.out.println("Default Admin created: admin@hospital.com / admin123");
			}

			// 2. Seed Default Doctor if not existing
			if (userRepository.findByEmail("dr.sarah@hospital.com") == null) {
				User doctorUser = new User();
				doctorUser.setName("Dr. Sarah Jenkins");
				doctorUser.setEmail("dr.sarah@hospital.com");
				doctorUser.setPassword("doctor123");
				doctorUser.setPhone("+1-555-019-2834");
				doctorUser.setRole(Role.DOCTOR);
				User savedDocUser = userRepository.save(doctorUser);

				Doctor doctor = new Doctor();
				doctor.setUser(savedDocUser);
				doctor.setSpecialization("Cardiologist");
				doctor.setQualification("MBBS, MD (Cardiology)");
				doctor.setExperience(10);
				doctor.setAvailability("Available");
				doctor.setConsultationFee(60.0);
				doctorRepository.save(doctor);
				System.out.println("Default Doctor created: dr.sarah@hospital.com / doctor123");
			}

			// 3. Seed Second Doctor
			if (userRepository.findByEmail("dr.alex@hospital.com") == null) {
				User doctorUser2 = new User();
				doctorUser2.setName("Dr. Alex Rivera");
				doctorUser2.setEmail("dr.alex@hospital.com");
				doctorUser2.setPassword("doctor123");
				doctorUser2.setPhone("+1-555-014-9921");
				doctorUser2.setRole(Role.DOCTOR);
				User savedDocUser2 = userRepository.save(doctorUser2);

				Doctor doctor2 = new Doctor();
				doctor2.setUser(savedDocUser2);
				doctor2.setSpecialization("General Physician");
				doctor2.setQualification("MBBS, MD");
				doctor2.setExperience(7);
				doctor2.setAvailability("Available");
				doctor2.setConsultationFee(45.0);
				doctorRepository.save(doctor2);
			}

			// 4. Seed Default Patient if not existing
			if (userRepository.findByEmail("patient@hospital.com") == null) {
				User patientUser = new User();
				patientUser.setName("John Doe");
				patientUser.setEmail("patient@hospital.com");
				patientUser.setPassword("patient123");
				patientUser.setPhone("+1-555-018-7722");
				patientUser.setRole(Role.PATIENT);
				User savedPatUser = userRepository.save(patientUser);

				Patient patient = new Patient();
				patient.setUser(savedPatUser);
				patient.setGender("Male");
				patient.setBloodGroup("O+");
				patient.setMedicalHistory("Routine Health Checkup");
				patientRepository.save(patient);
				System.out.println("Default Patient created: patient@hospital.com / patient123");
			}
		};
	}

}
