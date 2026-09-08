# JUnit Unit Testing Report: Healthcare Management System

---

## 1. Executive Summary

| Metric | Result |
| :--- | :--- |
| **Testing Framework** | JUnit 5 (Jupiter) + Mockito 5 |
| **Execution Tool** | Maven Surefire Plugin (`./mvnw test`) |
| **Total Test Cases** | **18** |
| **Passed** | **18 (100% Pass Rate)** |
| **Failures** | **0** |
| **Errors** | **0** |
| **Skipped** | **0** |
| **Build Status** | **BUILD SUCCESS** |

---

## 2. Why Do All Tests Pass? (Positive vs Negative Scenarios)

In production software engineering, **all test cases in a build suite should pass (`BUILD SUCCESS`)**. 

However, real-world testing does **not** only test successful actions ("happy paths"). It tests two distinct categories of scenarios:

1. **Positive Test Cases (Happy Path)**:
   - Verifying that valid user actions succeed (e.g. creating an appointment, logging in with correct password, updating doctor fees).
   - *Result*: Test passes because data is correctly saved and returned.

2. **Negative Test Cases (Error Handling & Edge Cases)**:
   - Verifying that invalid or conflicting actions are safely rejected (e.g. double-booking a doctor slot, entering wrong login passwords, missing appointment dates, double-booking a patient across two doctors).
   - *Result*: Test passes because the system correctly throws the expected exception (`AppointmentAlreadyExistsException`, `RuntimeException`) and protects database integrity.

---

## 3. Complete Breakdown of All 18 Test Cases

### Suite 1: `UserServiceTest.java` (6 Test Cases)
File: `src/test/java/com/healthcare/healthcare_backend/service/UserServiceTest.java`

| # | Test Name | Scenario Type | Description & Assertion | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `testRegisterPatient_Success` | Positive | Registers new patient Rahul Sharma with B+ blood group. Asserts user ID, email, role, and repository persistence. | **PASSED** |
| 2 | `testRegisterDoctor_WithShiftAndHours` | Positive | Registers Dr. Bhavna Chaudhry with Day Shift and 8 working hours. Asserts doctor record creation. | **PASSED** |
| 3 | `testLogin_Success` | Positive | Verifies user login with matching email and password. Asserts authenticated user session object. | **PASSED** |
| 4 | `testLogin_InvalidPassword_ThrowsException` | Negative | Verifies login failure when password does not match. Asserts `RuntimeException("Invalid password")`. | **PASSED** |
| 5 | `testLogin_UserNotFound_ThrowsException` | Negative | Verifies login failure when email does not exist. Asserts `RuntimeException("User not found")`. | **PASSED** |
| 6 | `testGetAllUsers_ReturnsUserList` | Positive | Verifies admin retrieval of all registered users. Asserts list size and user names. | **PASSED** |

---

### Suite 2: `AppointmentServiceTest.java` (7 Test Cases)
File: `src/test/java/com/healthcare/healthcare_backend/service/AppointmentServiceTest.java`

| # | Test Name | Scenario Type | Description & Assertion | Status |
| :--- | :--- | :--- | :--- | :--- |
| 7 | `testCreateAppointment_Success` | Positive | Books appointment on 2026-09-15 at 10:00 AM. Asserts status is `"Booked"` and fee is `₹1,500.0`. | **PASSED** |
| 8 | `testCreateAppointment_DoctorDoubleBooking_ThrowsException` | Negative | Simulates slot already taken by another patient. Asserts `AppointmentAlreadyExistsException` is thrown. | **PASSED** |
| 9 | `testCreateAppointment_PatientDoubleBooking_ThrowsException` | Negative | Simulates patient attempting two simultaneous bookings. Asserts `RuntimeException("Patient already has an appointment...")`. | **PASSED** |
| 10 | `testCreateAppointment_MissingDate_ThrowsException` | Negative | Passes null date in booking request. Asserts `RuntimeException("Appointment date is required.")`. | **PASSED** |
| 11 | `testCancelAppointment_Success` | Positive | Patient cancels appointment #501. Asserts status is updated to `"CANCELLED"`. | **PASSED** |
| 12 | `testRescheduleAppointment_Success` | Positive | Moves appointment #501 to 2026-09-20 at 02:00 PM. Asserts updated date, time, and `"Booked"` status. | **PASSED** |
| 13 | `testUpdatePrescription_Success` | Positive | Doctor records clinical medicine instructions. Asserts prescription text is saved on appointment record. | **PASSED** |

---

### Suite 3: `DoctorServiceTest.java` (4 Test Cases)
File: `src/test/java/com/healthcare/healthcare_backend/service/DoctorServiceTest.java`

| # | Test Name | Scenario Type | Description & Assertion | Status |
| :--- | :--- | :--- | :--- | :--- |
| 14 | `testUpdateAvailability_Success` | Positive | Doctor updates status from `"Available"` to `"Busy"`. Asserts updated availability in database. | **PASSED** |
| 15 | `testUpdateConsultationFee_Success` | Positive | Doctor updates fee from `₹1,800` to `₹2,000`. Asserts updated fee. | **PASSED** |
| 16 | `testUpdateShiftAndWorkingHours_Success` | Positive | Doctor updates shift to `"Night"` and working hours to `6` hrs/day. Asserts updated shift and hours. | **PASSED** |
| 17 | `testGetAllDoctors_ReturnsList` | Positive | Retrieves list of all registered doctors across specialties. Asserts list size and specializations. | **PASSED** |

---

### Suite 4: `HealthcareBackendApplicationTests.java` (1 Test Case)
File: `src/test/java/com/healthcare/healthcare_backend/HealthcareBackendApplicationTests.java`

| # | Test Name | Scenario Type | Description & Assertion | Status |
| :--- | :--- | :--- | :--- | :--- |
| 18 | `contextLoads` | Integration | Verifies that the Spring Boot ApplicationContext, JPA EntityManagers, and Repositories bootstrap cleanly. | **PASSED** |

---

## 4. Running the Test Suite

Execute the following command in terminal:

```bash
cd c:\Users\sudha\Desktop\healthcare\backendhealthcare\healthcare-backend\healthcare-backend
./mvnw test
```

### Actual Execution Console Output:
```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.healthcare.healthcare_backend.HealthcareBackendApplicationTests
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 7.232 s -- in com.healthcare.healthcare_backend.HealthcareBackendApplicationTests
[INFO] Running com.healthcare.healthcare_backend.service.AppointmentServiceTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.657 s -- in com.healthcare.healthcare_backend.service.AppointmentServiceTest
[INFO] Running com.healthcare.healthcare_backend.service.DoctorServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.053 s -- in com.healthcare.healthcare_backend.service.DoctorServiceTest
[INFO] Running com.healthcare.healthcare_backend.service.UserServiceTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.216 s -- in com.healthcare.healthcare_backend.service.UserServiceTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 18, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  13.886 s
[INFO] ------------------------------------------------------------------------
```

---

## 5. Viva / Presentation Q&A for the 18 Test Cases

### Q1: Why do all 18 test cases pass even though some test error conditions like wrong password or double booking?
**Answer**: In unit testing, when we test an error condition (a negative scenario), our test method expects an exception to be thrown using `assertThrows()`. When the code correctly throws the exception and prevents the invalid action, the test passes because the error handling worked properly.

### Q2: How did you test the double-booking prevention in JUnit?
**Answer**: In `AppointmentServiceTest.java`, we mocked `appointmentRepository.existsByDoctorAndAppointmentDateAndAppointmentTime(...)` to return `true`. We then called `appointmentService.createAppointment(request)` inside `assertThrows(AppointmentAlreadyExistsException.class, ...)`. This proved that a conflicting booking is rejected before hitting the database.

### Q3: What is the purpose of `@BeforeEach` in each test class?
**Answer**: `@BeforeEach` executes before every single test method. It creates fresh mock instances (`mock(UserRepository.class)`) and re-initializes the service, ensuring tests are completely isolated and one test never interferes with another.
