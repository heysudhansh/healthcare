# HEALTHCARE MANAGEMENT SYSTEM - COMPREHENSIVE ARCHITECTURE & CODE FLOW GUIDE

---

## 1. SYSTEM OVERVIEW & ARCHITECTURAL LAYERS

The Healthcare Management System follows a classic, industry-standard **N-Tier Layered Architecture** built on **Spring Boot 4 / Java 17** for the backend, **React.js** for the frontend, and **MySQL 8.0** for data persistence.

```
+-------------------------------------------------------------------------+
|                         REACT FRONTEND (Port 3000)                      |
|   - Signup.js (Client-side validation, 10-digit numeric phone filter)   |
|   - Dashboard.js (Calendar min={today} past date lock, empty check)     |
+-------------------------------------------------------------------------+
                                    |
                           HTTP JSON Requests
                                    |
                                    v
+-------------------------------------------------------------------------+
|                  BACKEND CONTROLLER LAYER (Port 8081)                   |
|   - UserController.java (@Valid @RequestBody RegisterRequest)           |
|   - AppointmentController.java (@Valid @RequestBody AppointmentRequest) |
+-------------------------------------------------------------------------+
                                    |
                                    |---> If DTO validation fails:
                                    |     Throws MethodArgumentNotValidException
                                    |     Handled by GlobalExceptionHandler (400 Bad Request)
                                    v
+-------------------------------------------------------------------------+
|                          SERVICE LAYER (Business Logic)                 |
|   - UserService.java (Duplicate email check, Name/Phone/Password rules) |
|   - AppointmentService.java (Past date check, Doctor double-booking)    |
|   - DoctorService.java (Specialization, fee, shifts, availability)      |
|   - PatientService.java (Medical history, profile records)              |
+-------------------------------------------------------------------------+
                                    |
                                    |---> If Business check fails:
                                    |     Throws IllegalArgumentException / Custom Exception
                                    |     Handled by GlobalExceptionHandler (400 / 409)
                                    v
+-------------------------------------------------------------------------+
|                     REPOSITORY LAYER (Spring Data JPA)                  |
|   - UserRepository, AppointmentRepository, DoctorRepository, PatientRepo|
+-------------------------------------------------------------------------+
                                    |
                               Hibernate SQL
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         MYSQL DATABASE (healthcare_db)                  |
|   - Tables: users, doctors, patients, appointments                      |
+-------------------------------------------------------------------------+
```

---

## 2. THE DTO LAYER (DATA TRANSFER OBJECTS)

### What is a DTO and why do we use it?
A **DTO (Data Transfer Object)** is an object that carries data between processes (specifically between the Frontend HTTP JSON payload and the Backend Controller).
Instead of binding raw database Entities directly to HTTP requests (which is a security risk), DTOs allow us to:
1. Define strict input shapes for incoming requests.
2. Apply **Jakarta Bean Validation annotations** (`@NotBlank`, `@Pattern`, `@Email`, `@Size`, `@NotNull`).
3. Reject malformed data **before** it touches our Service or Database.

---

### A. User Registration DTO (`RegisterRequest.java`)
**File Path:** `src/main/java/com/healthcare/healthcare_backend/dto/RegisterRequest.java`

```java
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]{2,50}$", message = "Name must contain only letters and spaces (2 to 50 characters)")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be a valid 10-digit number")
    private String phone;

    private Role role; // PATIENT, DOCTOR, ADMIN

    // Doctor specific fields (optional if role is PATIENT)
    private String specialization;
    private String qualification;
    private Integer experience;
    private Double consultationFee;
    private String availability;
    private String shift;
    private Integer workingHours;

    // Patient specific fields
    private String medicalHistory;
    private String gender;
    private String bloodGroup;

    // Getters and Setters...
}
```

#### How Each Annotation Protects Against Blunders:
| Field | Annotation | Blunder Prevented | Example Bad Input Caught |
| :--- | :--- | :--- | :--- |
| `name` | `@NotBlank`, `@Pattern("^[a-zA-Z\\s]{2,50}$")` | Numbers or symbols in name | `"234"`, `"John@123"`, `""` |
| `phone` | `@NotBlank`, `@Pattern("^[0-9]{10}$")` | Letters, wrong length phone | `"sudhansh"`, `"12345"` (5 digits) |
| `email` | `@NotBlank`, `@Email` | Invalid email structure | `"not-an-email"`, `"user@"` |
| `password`| `@NotBlank`, `@Size(min = 6)` | Insecure short passwords | `"123"`, `"abc"` |

---

### B. Appointment Request DTO (`AppointmentRequest.java`)
**File Path:** `src/main/java/com/healthcare/healthcare_backend/dto/AppointmentRequest.java`

```java
public class AppointmentRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotBlank(message = "Appointment date is required")
    private String appointmentDate;

    @NotBlank(message = "Appointment time is required")
    private String appointmentTime;

    // Getters and Setters...
}
```

#### How it works:
* `@NotNull` ensures the frontend provides existing numerical IDs for patient and doctor.
* `@NotBlank` ensures the date and time strings are not null or empty strings (`""`).

---

## 3. CONTROLLER LAYER & `@Valid` TRIGGER

**Files:**
* `UserController.java`: `public User registerUser(@Valid @RequestBody RegisterRequest request)`
* `AppointmentController.java`: `public Appointment createAppointment(@Valid @RequestBody AppointmentRequest request)`

### What does `@Valid` do?
When `@Valid` is placed before `@RequestBody`:
1. Spring Boot automatically reads the annotations on the DTO before invoking the method body.
2. If any validation constraint fails (e.g. `phone="sudhansh"`), Spring halts execution immediately.
3. Spring creates a `MethodArgumentNotValidException` containing all the failed field errors and forwards it to our **Global Exception Handler**.

---

## 4. GLOBAL EXCEPTION HANDLING LAYER

### Why do we need Global Exception Handling?
Without a centralized exception handler, whenever an error occurs (such as a duplicate email, past date booking, or invalid phone), Spring Boot returns a default `500 Internal Server Error` with a huge Java stack trace.
This has two major problems:
1. **Bad User Experience:** The frontend receives an ugly, unhelpful 500 crash.
2. **Security Risk:** Stack traces expose internal code paths and database structure.

With `@RestControllerAdvice`, we catch all exceptions centrally and format them into clean, predictable JSON responses.

---

### A. Structured Error DTO (`ErrorResponse.java`)
**File Path:** `src/main/java/com/healthcare/healthcare_backend/dto/ErrorResponse.java`

```java
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;

    public ErrorResponse(int status, String error, String message) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.error = error;
        this.message = message;
    }

    // Getters and Setters...
}
```

Whenever an error happens, the client receives this clean JSON:
```json
{
  "timestamp": "2026-09-10T00:15:30",
  "status": 400,
  "error": "Validation Failed",
  "message": "Phone must be a valid 10-digit number"
}
```

---

### B. The Global Exception Handler (`GlobalExceptionHandler.java`)
**File Path:** `src/main/java/com/healthcare/healthcare_backend/exception/GlobalExceptionHandler.java`

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Catches DTO @Valid annotation failures
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Validation Failed",
                errorMessage
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // 2. Catches Service-level validation & business rule failures
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Invalid Argument",
                ex.getMessage()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // 3. Catches Doctor Double-Booking conflicts
    @ExceptionHandler(AppointmentAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleAppointmentAlreadyExistsException(AppointmentAlreadyExistsException ex) {
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "Conflict",
                ex.getMessage()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT); // 409
    }

    // 4. Catches general business runtime errors (e.g. "User not found")
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                ex.getMessage()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // 5. Fallback for any unhandled generic server error
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred"
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

---

## 5. SERVICE LAYER: BUSINESS RULES & DEFENSIVE LOGIC

The Service layer contains hospital business rules that **cannot be validated by annotations alone** because they require database queries or date calculations.

### A. `UserService.java`
**Key Responsibilities:**
1. **Duplicate Email Check:** Queries MySQL (`userRepository.findByEmail(request.getEmail())`). If an account with that email already exists, throws `IllegalArgumentException("Email is already registered: ...")`.
2. **Defensive Validation Fallbacks:** Validates name, 10-digit phone, email syntax, and password length directly in Java so unit tests can verify these without needing HTTP requests.
3. **Automatic Sub-Profile Creation:** When a user registers:
   * If `role == Role.DOCTOR`, creates and links a new `Doctor` record in the `doctors` table.
   * If `role == Role.PATIENT`, creates and links a new `Patient` record in the `patients` table.
4. **Authentication (`login`):** Checks email existence and validates password equality.

---

### B. `AppointmentService.java`
**Key Responsibilities:**
1. **Past Date Prevention (`createAppointment` & `rescheduleAppointment`):**
   ```java
   LocalDate date = LocalDate.parse(request.getAppointmentDate().trim());
   if (date.isBefore(LocalDate.now())) {
       throw new IllegalArgumentException("Cannot book an appointment for a past date: " + request.getAppointmentDate());
   }
   ```
2. **Doctor Double-Booking Conflict Check:**
   ```java
   boolean alreadyBooked = appointmentRepository.existsByDoctorAndAppointmentDateAndAppointmentTime(
       doctor, request.getAppointmentDate(), request.getAppointmentTime()
   );
   if (alreadyBooked) {
       throw new AppointmentAlreadyExistsException("Doctor is already booked at this time.");
   }
   ```
3. **Patient Time Conflict Check:**
   Ensures the same patient cannot be simultaneously booked with two different doctors at the exact same hour.
4. **Consultation Fee Snapshot:** Automatically copies the doctor's active `consultationFee` onto the created `Appointment` record.
5. **Prescription Note Guard (`updatePrescription`):** Rejects empty or whitespace-only submissions (`if (prescription.trim().isEmpty()) throw new IllegalArgumentException(...)`).

---

## 6. FRONTEND BLUNDER PROTECTION

Client-side protections provide immediate visual feedback before any network traffic is sent.

### A. Signup Page (`Signup.js`)
1. **10-Digit Numeric Phone Filter:** In `handleChange`, non-numeric characters are stripped in real-time, and the input length is capped at 10 digits:
   ```javascript
   if (name === "phone") {
       const numericValue = value.replace(/\D/g, "").slice(0, 10);
       setFormData({ ...formData, phone: numericValue });
       return;
   }
   ```
2. **Pre-Submit Validation:** Verifies name has only letters, email matches standard format, and password $\ge 6$ characters. If invalid, displays a red alert banner instantly.

### B. Dashboard Page (`Dashboard.js`)
1. **Calendar Past Date Disable (`min={today}`):**
   ```jsx
   <input
       type="date"
       value={bookingDate}
       onChange={(e) => setBookingDate(e.target.value)}
       min={new Date().toISOString().split("T")[0]}
       required
   />
   ```
   Users cannot click or select yesterday or any past year in the date picker.
2. **Prescription Non-Empty Check:** The doctor's prescription modal blocks submitting whitespace or empty text.

---

## 7. END-TO-END SCENARIO WALKTHROUGHS

### Scenario 1: User Enters Invalid Phone (`"sudhansh"`) During Registration
1. **Frontend:** `Signup.js` intercepts keystrokes and only accepts digits. If bypassed, `handleSubmit` detects invalid phone length and shows an alert.
2. **HTTP Request:** A POST request arrives at `/users` with JSON: `{"name":"Rahul","phone":"sudhansh","email":"rahul@hospital.com","password":"123"}`.
3. **Controller:** `UserController.registerUser(@Valid RegisterRequest request)` triggers DTO validation.
4. **DTO Validation:** `@Pattern(regexp="^[0-9]{10}$")` detects that `"sudhansh"` is not a 10-digit number.
5. **Exception:** Spring throws `MethodArgumentNotValidException`.
6. **Global Exception Handler:** Catches the exception and returns:
   * **HTTP Status:** `400 Bad Request`
   * **JSON Body:** `{"status": 400, "error": "Validation Failed", "message": "Phone must be a valid 10-digit number"}`
7. **Database:** Remains 100% clean and untouched.

---

### Scenario 2: User Tries to Book an Appointment for a Past Date (`"2020-01-01"`)
1. **Frontend:** Date picker restricts dates $\ge$ Today. If an API client sends a past date directly:
2. **HTTP Request:** POST arrives at `/appointments` with `appointmentDate: "2020-01-01"`.
3. **Controller:** Passes valid DTO shape to `AppointmentService.createAppointment(request)`.
4. **Service Logic:** `LocalDate.parse("2020-01-01").isBefore(LocalDate.now())` evaluates to `true`.
5. **Exception:** Throws `IllegalArgumentException("Cannot book an appointment for a past date: 2020-01-01")`.
6. **Global Exception Handler:** Intercepts `IllegalArgumentException` and returns:
   * **HTTP Status:** `400 Bad Request`
   * **JSON Body:** `{"status": 400, "error": "Invalid Argument", "message": "Cannot book an appointment for a past date: 2020-01-01"}`

---

### Scenario 3: Doctor Double-Booking Conflict
1. **Doctor A** already has an appointment booked on `2028-09-15` at `10:00 AM`.
2. **Patient B** tries to book Doctor A at `2028-09-15` at `10:00 AM`.
3. **Service Logic:** `appointmentRepository.existsByDoctorAndAppointmentDateAndAppointmentTime(...)` returns `true`.
4. **Exception:** Throws `AppointmentAlreadyExistsException("Doctor is already booked at this time.")`.
5. **Global Exception Handler:** Intercepts `AppointmentAlreadyExistsException` and returns:
   * **HTTP Status:** `409 Conflict`
   * **JSON Body:** `{"status": 409, "error": "Conflict", "message": "Doctor is already booked at this time."}`

---

## 8. UNIT TESTING STRATEGY (JUnit 5 + Mockito)

Our test suite contains **40 unit tests** divided into 4 service test classes:

1. **`AppointmentServiceTest` (13 Tests):** Tests successful booking, past date rejections, missing fields, doctor double-booking (`409`), patient time conflicts, cancellations, rescheduling, and empty prescription rejection.
2. **`UserServiceTest` (15 Tests):** Tests patient/doctor registration, default fallbacks, duplicate email rejection, numeric name blunder (`"234"`), non-numeric phone blunder (`"sudhansh"`), bad email, short password, and login authentication.
3. **`DoctorServiceTest` (8 Tests):** Tests doctor creation, availability updates, fee updates, shift timings, and non-existent doctor lookups.
4. **`PatientServiceTest` (4 Tests):** Tests patient creation, listings, medical history updates, and non-existent patient lookups.

### How Mockito Works Here:
* We mock the repositories (`mock(UserRepository.class)`, `mock(AppointmentRepository.class)`).
* This allows tests to run in milliseconds in memory **without requiring a live MySQL server running**, testing the exact business logic and exception branches in complete isolation.

---

## 9. SUMMARY QUICK REFERENCE TABLE

| Layer | Component / File | Purpose | Exception / Response |
| :--- | :--- | :--- | :--- |
| **Frontend** | `Signup.js` | Real-time 10-digit phone restriction & input checking | Client-side Alert Banners |
| **Frontend** | `Dashboard.js` | Calendar `min={today}` & prescription non-empty check | Disabled past dates in UI |
| **DTO** | `RegisterRequest.java` | Constraints: 10-digit phone, letters-only name, email, password $\ge 6$ | `MethodArgumentNotValidException` |
| **DTO** | `AppointmentRequest.java` | Mandatory IDs, non-blank date and time slot | `MethodArgumentNotValidException` |
| **Controller** | `UserController`, `AppointmentController` | `@Valid` trigger before service execution | Passes data to Service |
| **Service** | `UserService.java` | Duplicate email check, fallback defaults, login logic | `IllegalArgumentException` / `RuntimeException` |
| **Service** | `AppointmentService.java` | Past date checks, double-booking prevention, prescription check | `IllegalArgumentException` / `AppointmentAlreadyExistsException` |
| **Global Handler** | `GlobalExceptionHandler.java` | Translates all exceptions into structured JSON error payloads | `400 Bad Request`, `409 Conflict` |
| **Unit Tests** | `*ServiceTest.java` (40 Tests) | 100% automated verification of happy paths & blunder exceptions | `40 / 40 BUILD SUCCESS` |
