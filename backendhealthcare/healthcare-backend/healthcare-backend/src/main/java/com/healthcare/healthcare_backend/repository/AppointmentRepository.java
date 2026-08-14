package com.healthcare.healthcare_backend.repository;

import com.healthcare.healthcare_backend.entity.Appointment;
import com.healthcare.healthcare_backend.entity.Doctor;
import com.healthcare.healthcare_backend.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    boolean existsByDoctorAndAppointmentDateAndAppointmentTime(
            Doctor doctor,
            String appointmentDate,
            String appointmentTime
    );

    boolean existsByPatientAndAppointmentDateAndAppointmentTime(
            Patient patient,
            String appointmentDate,
            String appointmentTime
    );

    List<Appointment> findByPatientId(Long patientId);
    List<Appointment> findByPatientUserId(Long userId);
    List<Appointment> findByDoctorId(Long doctorId);
    List<Appointment> findByDoctorUserId(Long userId);
    List<Appointment> findByStatus(String status);
}
