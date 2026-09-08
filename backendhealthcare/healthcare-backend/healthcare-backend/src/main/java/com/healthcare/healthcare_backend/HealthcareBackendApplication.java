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
			// 1. Admin Account
			if (userRepository.findByEmail("admin@hospital.com") == null) {
				User admin = new User();
				admin.setName("System Administrator");
				admin.setEmail("admin@hospital.com");
				admin.setPassword("admin123");
				admin.setPhone("+91-98100-55000");
				admin.setRole(Role.ADMIN);
				userRepository.save(admin);
				System.out.println("Default Admin created: admin@hospital.com / admin123");
			}

			// Helper lambda to seed doctors
			java.util.function.Consumer<DoctorSeedData> createDoctorIfAbsent = data -> {
				if (userRepository.findByEmail(data.email) == null) {
					User user = new User();
					user.setName(data.name);
					user.setEmail(data.email);
					user.setPassword("doctor123");
					user.setPhone(data.phone);
					user.setRole(Role.DOCTOR);
					User savedUser = userRepository.save(user);

					Doctor doctor = new Doctor();
					doctor.setUser(savedUser);
					doctor.setSpecialization(data.specialization);
					doctor.setQualification(data.qualification);
					doctor.setExperience(data.experience);
					doctor.setAvailability("Available");
					doctor.setConsultationFee(data.fee);
					doctor.setShift(data.shift);
					doctor.setWorkingHours(data.workingHours);
					doctorRepository.save(doctor);
					System.out.println("Doctor created: " + data.name + " (" + data.email + ") - " + data.shift + " Shift (" + data.workingHours + " hrs) - Fee: ₹" + data.fee);
				}
			};

			// 2. Real Indian Doctors with Shifts & Working Hours
			createDoctorIfAbsent.accept(new DoctorSeedData(
					"Dr. Bhavna Chaudhry",
					"dr.bhavna@hospital.com",
					"+91-98111-20001",
					"Obstetrics & Gynaecology",
					"MBBS, MS (Obstetrics & Gynaecology)",
					29,
					1200.0,
					"Day",
					8
			));

			createDoctorIfAbsent.accept(new DoctorSeedData(
					"Dr. Rajiv Dang",
					"dr.rajiv@hospital.com",
					"+91-98111-20002",
					"Internal Medicine",
					"MBBS, MD (Internal Medicine)",
					39,
					1000.0,
					"Day",
					8
			));

			createDoctorIfAbsent.accept(new DoctorSeedData(
					"Dr. Arvind M Das",
					"dr.arvind@hospital.com",
					"+91-98111-20003",
					"Cardiology & Cardiac Sciences",
					"MBBS, MD, DM (Cardiology)",
					35,
					1500.0,
					"Day",
					6
			));

			createDoctorIfAbsent.accept(new DoctorSeedData(
					"Dr. Ravinder Gera",
					"dr.ravinder@hospital.com",
					"+91-98111-20004",
					"ENT (Ear Nose Throat)",
					"MBBS, MS (ENT)",
					26,
					900.0,
					"Night",
					6
			));

			createDoctorIfAbsent.accept(new DoctorSeedData(
					"Dr. S.K.S. Marya",
					"dr.marya@hospital.com",
					"+91-98111-20005",
					"Orthopaedics & Joint Replacement",
					"MBBS, MS (Ortho), M.Ch",
					41,
					1800.0,
					"Day",
					8
			));

			createDoctorIfAbsent.accept(new DoctorSeedData(
					"Dr. Ambrish Mithal",
					"dr.ambrish@hospital.com",
					"+91-98111-20006",
					"Endocrinology & Diabetology",
					"MBBS, MD, DM (Endocrinology)",
					40,
					1500.0,
					"Day",
					8
			));

			createDoctorIfAbsent.accept(new DoctorSeedData(
					"Dr. Sunil Prakash",
					"dr.sunil@hospital.com",
					"+91-98111-20007",
					"Nephrology & Kidney Transplant",
					"MBBS, MD, DM (Nephrology)",
					41,
					1600.0,
					"Night",
					6
			));

			createDoctorIfAbsent.accept(new DoctorSeedData(
					"Dr. Sandeep Batra",
					"dr.sandeep@hospital.com",
					"+91-98111-20008",
					"Medical Oncology & Cancer Care",
					"MBBS, MD, DNB (Oncology)",
					17,
					1400.0,
					"Day",
					8
			));

			// 3. Default Patient Account
			if (userRepository.findByEmail("patient@hospital.com") == null) {
				User patientUser = new User();
				patientUser.setName("Rahul Sharma");
				patientUser.setEmail("patient@hospital.com");
				patientUser.setPassword("patient123");
				patientUser.setPhone("+91-98765-43210");
				patientUser.setRole(Role.PATIENT);
				User savedPatUser = userRepository.save(patientUser);

				Patient patient = new Patient();
				patient.setUser(savedPatUser);
				patient.setGender("Male");
				patient.setBloodGroup("B+");
				patient.setMedicalHistory("Routine Annual Health Checkup");
				patientRepository.save(patient);
				System.out.println("Default Patient created: patient@hospital.com / patient123");
			}
		};
	}

	// Helper record for seeding
	private static class DoctorSeedData {
		String name;
		String email;
		String phone;
		String specialization;
		String qualification;
		int experience;
		double fee;
		String shift;
		int workingHours;

		DoctorSeedData(String name, String email, String phone, String specialization, String qualification, int experience, double fee, String shift, int workingHours) {
			this.name = name;
			this.email = email;
			this.phone = phone;
			this.specialization = specialization;
			this.qualification = qualification;
			this.experience = experience;
			this.fee = fee;
			this.shift = shift;
			this.workingHours = workingHours;
		}
	}
}
