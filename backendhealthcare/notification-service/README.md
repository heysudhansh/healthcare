# Healthcare Notification Microservice

This is a standalone Spring Boot microservice dedicated to handling appointment notifications, confirmation emails, and alerts for patients and doctors.

---

## 🏗️ Architecture & Highlights (For Presentation)
- **Port**: `8082` (Runs independently from the main backend on `8081`).
- **Why Microservices?**: Decouples notification dispatching (Email/SMS) from core appointment booking, ensuring that sending emails or SMS messages never slows down or blocks the patient booking flow.
- **REST Endpoints**:
  - `POST /notifications/send` - Dispatches an appointment notification or confirmation alert.
  - `GET /notifications` - Lists all sent notification history logs.
  - `GET /notifications/recipient/{email}` - Retrieves notifications for a specific patient or doctor email.
  - `GET /notifications/status` - Returns microservice health and metrics.

---

## 🚀 How to Run the Microservice
From the `notification-service` directory:
```powershell
cd c:\Users\sudha\Desktop\healthcare\backendhealthcare\notification-service
./mvnw spring-boot:run
```
*(Or use `mvn spring-boot:run`)*
