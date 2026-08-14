# Healthcare Billing Microservice

This is a standalone Spring Boot microservice dedicated to handling patient invoices, consultation bill calculations, and hospital revenue tracking.

---

## 🏗️ Architecture & Highlights (For Presentation)
- **Port**: `8083` (Runs independently from the main backend on `8081` and notification service on `8082`).
- **Why Microservices?**: Decouples financial transactions and invoice generation from core appointment booking, allowing independent scaling and compliance auditing.
- **REST Endpoints**:
  - `POST /bills` - Creates a new billing record with auto-calculated 5% tax and total.
  - `GET /bills` - Lists all generated hospital invoices.
  - `GET /bills/appointment/{appointmentId}` - Fetches invoice for a specific appointment.
  - `GET /bills/revenue` - Computes real-time hospital revenue summary (`totalRevenue`, `paidInvoices`, `totalInvoices`).

---

## 🚀 How to Run the Microservice
From the `billing-service` directory:
```powershell
cd c:\Users\sudha\Desktop\healthcare\backendhealthcare\billing-service
mvn spring-boot:run
```
*(Or use `./mvnw spring-boot:run`)*
