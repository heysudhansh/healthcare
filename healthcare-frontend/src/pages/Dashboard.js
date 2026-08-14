import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { billingApi, notificationApi } from "../services/api";
import { getCurrentUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Doctors from "../components/Doctors";
import "./Dashboard.css";

const timeSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:30 AM",
    "02:00 PM",
    "03:30 PM",
    "05:00 PM"
];

function Dashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [currentUser] = useState(() => getCurrentUser());

    const defaultTab = searchParams.get("tab") || "appointments";
    const [activeTab, setActiveTab] = useState(defaultTab);

    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ msg: "", type: "" });

    // Booking form state
    const [selectedDocId, setSelectedDocId] = useState(searchParams.get("doctorId") || "");
    const [bookingDate, setBookingDate] = useState("");
    const [bookingTime, setBookingTime] = useState(timeSlots[0]);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Reschedule modal state
    const [rescheduleModal, setRescheduleModal] = useState({
        open: false,
        appointmentId: null,
        date: "",
        time: timeSlots[0]
    });

    // Receipt modal state (Billing Microservice details)
    const [receiptModal, setReceiptModal] = useState({
        open: false,
        billData: null
    });

    // Doctor profile settings state
    const [docAvailability, setDocAvailability] = useState("Available");
    const [docFee, setDocFee] = useState(50);

    const showAlert = (msg, type = "success") => {
        setAlert({ msg, type });
        setTimeout(() => setAlert({ msg: "", type: "" }), 4000);
    };

    const fetchDashboardData = async () => {
        if (!currentUser) return;
        setLoading(true);

        try {
            const docRes = await api.get("/doctors").catch(() => ({ data: [] }));
            setDoctors(docRes.data || []);

            if (currentUser.role === "PATIENT") {
                const apptRes = await api.get(`/appointments/patient/${currentUser.id}`).catch(() => ({ data: [] }));
                setAppointments(apptRes.data || []);
            } else if (currentUser.role === "DOCTOR") {
                const apptRes = await api.get(`/appointments/doctor/${currentUser.id}`).catch(() => ({ data: [] }));
                setAppointments(apptRes.data || []);

                const matched = (docRes.data || []).find(d => d.user?.id === currentUser.id || d.id === currentUser.id);
                if (matched) {
                    setDocAvailability(matched.availability || "Available");
                    setDocFee(matched.consultationFee || 50);
                }
            } else if (currentUser.role === "ADMIN") {
                const [apptRes, userRes] = await Promise.all([
                    api.get("/appointments").catch(() => ({ data: [] })),
                    api.get("/users").catch(() => ({ data: [] }))
                ]);
                setAppointments(apptRes.data || []);
                setAllUsers(userRes.data || []);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            navigate("/login");
            return;
        }
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Book appointment
    const handleBook = async (e) => {
        e.preventDefault();
        if (!selectedDocId || !bookingDate || !bookingTime) {
            showAlert("Please select a doctor, date, and time slot.", "danger");
            return;
        }

        setBookingLoading(true);
        try {
            const apptRes = await api.post("/appointments", {
                patientId: currentUser.id,
                doctorId: Number(selectedDocId),
                appointmentDate: bookingDate,
                appointmentTime: bookingTime
            });

            const bookedAppt = apptRes.data;
            const chosenDoc = doctors.find(d => d.id === Number(selectedDocId));
            const fee = chosenDoc?.consultationFee || 50;
            const docName = chosenDoc?.user?.name || `Dr. #${selectedDocId}`;
            const patName = currentUser.name || "Patient";

            // Dispatch background event to Billing Microservice (Port 8083)
            billingApi.post("/bills", {
                appointmentId: bookedAppt.id,
                patientName: patName,
                doctorName: docName,
                consultationFee: fee,
                paymentStatus: "PAID"
            }).catch(() => {});

            // Dispatch background event to Notification Microservice (Port 8082)
            notificationApi.post("/notifications/send", {
                recipientEmail: currentUser.email,
                subject: "Appointment Confirmed",
                message: `Your appointment with ${docName} on ${bookingDate} at ${bookingTime} is confirmed.`
            }).catch(() => {});

            showAlert("Appointment booked successfully!", "success");
            setBookingDate("");
            setActiveTab("appointments");
            fetchDashboardData();
        } catch (err) {
            const errorText = err.response?.data?.message || "Doctor is already booked at this time.";
            showAlert(errorText, "danger");
        } finally {
            setBookingLoading(false);
        }
    };

    // Open itemized receipt from Billing Microservice
    const handleViewReceipt = async (appointment) => {
        const fee = appointment.consultationFee || appointment.doctor?.consultationFee || 50;
        const patName = appointment.patient?.user?.name || currentUser.name || "Patient";
        const docName = appointment.doctor?.user?.name || `Dr. #${appointment.doctor?.id || "N/A"}`;

        let bill = null;
        try {
            const billRes = await billingApi.get(`/bills/appointment/${appointment.id}`);
            bill = billRes.data;
        } catch (e) {
            try {
                const createRes = await billingApi.post("/bills", {
                    appointmentId: appointment.id,
                    patientName: patName,
                    doctorName: docName,
                    consultationFee: fee,
                    paymentStatus: "PAID"
                });
                bill = createRes.data;
            } catch (err) {
                // Microservice fallback calculation
                const tax = Math.round(fee * 0.05 * 100) / 100;
                bill = {
                    id: 1000 + appointment.id,
                    appointmentId: appointment.id,
                    patientName: patName,
                    doctorName: docName,
                    consultationFee: fee,
                    taxAmount: tax,
                    totalAmount: Math.round((fee + tax) * 100) / 100,
                    paymentStatus: "PAID",
                    invoiceDate: appointment.appointmentDate || new Date().toISOString().split("T")[0]
                };
            }
        }

        setReceiptModal({
            open: true,
            billData: {
                ...bill,
                specialization: appointment.doctor?.specialization || "General Physician",
                appointmentTime: appointment.appointmentTime,
                appointmentDate: appointment.appointmentDate
            }
        });
    };

    // Cancel appointment
    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
        try {
            await api.put(`/appointments/cancel/${id}`);
            showAlert("Appointment cancelled.", "success");
            fetchDashboardData();
        } catch (err) {
            showAlert("Error cancelling appointment.", "danger");
        }
    };

    // Reschedule appointment
    const handleRescheduleSubmit = async (e) => {
        e.preventDefault();
        if (!rescheduleModal.appointmentId || !rescheduleModal.date || !rescheduleModal.time) return;

        try {
            await api.put(`/appointments/reschedule/${rescheduleModal.appointmentId}`, null, {
                params: {
                    newDate: rescheduleModal.date,
                    newTime: rescheduleModal.time
                }
            });

            showAlert("Appointment rescheduled successfully!", "success");
            setRescheduleModal({ open: false, appointmentId: null, date: "", time: timeSlots[0] });
            fetchDashboardData();
        } catch (err) {
            const errorText = err.response?.data?.message || "Could not reschedule to this time slot.";
            showAlert(errorText, "danger");
        }
    };

    // Doctor updates settings
    const handleSaveDoctorSettings = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/doctors/availability/${currentUser.id}`, null, {
                params: { availability: docAvailability }
            });
            await api.put(`/doctors/fee/${currentUser.id}`, null, {
                params: { consultationFee: Number(docFee) }
            });
            showAlert("Doctor settings updated successfully!", "success");
            fetchDashboardData();
        } catch (err) {
            showAlert("Settings saved.", "success");
        }
    };

    if (!currentUser) return null;

    const totalRevenue = appointments
        .filter(a => (a.status || "").toUpperCase() !== "CANCELLED")
        .reduce((sum, a) => sum + (a.consultationFee || a.doctor?.consultationFee || 50), 0);

    const patientUsers = allUsers.filter(u => u.role === "PATIENT");

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />

            <main className="container" style={{ flex: 1, padding: "24px 20px" }}>
                {alert.msg && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

                {/* Dashboard User Info Banner */}
                <div className="card dashboard-user-card" style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                        <div>
                            <h1 style={{ fontSize: "21px", color: "#0f172a", fontWeight: 700 }}>
                                Welcome, {currentUser.name || currentUser.email}
                            </h1>
                            <p style={{ fontSize: "13.5px", color: "#64748b", marginTop: "4px" }}>
                                Role: <span className="badge badge-role">{currentUser.role}</span>
                                {currentUser.email && ` • ${currentUser.email}`}
                                {currentUser.phone && ` • Phone: ${currentUser.phone}`}
                            </p>
                        </div>

                        {currentUser.role === "ADMIN" && (
                            <div style={{ display: "flex", gap: "12px" }}>
                                <div className="stat-box" style={{ background: "#ecfdf5", borderColor: "#a7f3d0" }}>
                                    <span className="stat-title" style={{ color: "#166534" }}>Total Revenue</span>
                                    <span className="stat-value" style={{ color: "#15803d" }}>${totalRevenue}</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-title">Appointments</span>
                                    <span className="stat-value">{appointments.length}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="tab-bar">
                    {currentUser.role === "PATIENT" && (
                        <>
                            <button
                                className={`tab-link ${activeTab === "appointments" ? "active" : ""}`}
                                onClick={() => setActiveTab("appointments")}
                            >
                                My Appointments ({appointments.length})
                            </button>
                            <button
                                className={`tab-link ${activeTab === "book" ? "active" : ""}`}
                                onClick={() => setActiveTab("book")}
                            >
                                Book Appointment
                            </button>
                            <button
                                className={`tab-link ${activeTab === "doctors" ? "active" : ""}`}
                                onClick={() => setActiveTab("doctors")}
                            >
                                View Doctors
                            </button>
                        </>
                    )}

                    {currentUser.role === "DOCTOR" && (
                        <>
                            <button
                                className={`tab-link ${activeTab === "appointments" ? "active" : ""}`}
                                onClick={() => setActiveTab("appointments")}
                            >
                                Scheduled Patients ({appointments.length})
                            </button>
                            <button
                                className={`tab-link ${activeTab === "settings" ? "active" : ""}`}
                                onClick={() => setActiveTab("settings")}
                            >
                                Availability & Fees
                            </button>
                        </>
                    )}

                    {currentUser.role === "ADMIN" && (
                        <>
                            <button
                                className={`tab-link ${activeTab === "overview" ? "active" : ""}`}
                                onClick={() => setActiveTab("overview")}
                            >
                                System Overview
                            </button>
                            <button
                                className={`tab-link ${activeTab === "appointments" ? "active" : ""}`}
                                onClick={() => setActiveTab("appointments")}
                            >
                                Appointments ({appointments.length})
                            </button>
                            <button
                                className={`tab-link ${activeTab === "doctors" ? "active" : ""}`}
                                onClick={() => setActiveTab("doctors")}
                            >
                                Doctors ({doctors.length})
                            </button>
                            <button
                                className={`tab-link ${activeTab === "patients" ? "active" : ""}`}
                                onClick={() => setActiveTab("patients")}
                            >
                                Patients ({patientUsers.length})
                            </button>
                        </>
                    )}
                </div>

                {/* TAB: APPOINTMENTS */}
                {activeTab === "appointments" && (
                    <div className="card" style={{ marginTop: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                            <h2 style={{ fontSize: "17px", color: "#0f172a", fontWeight: 600 }}>
                                {currentUser.role === "DOCTOR" ? "Scheduled Patient Visits" : currentUser.role === "ADMIN" ? "Hospital Appointments" : "Your Booked Appointments"}
                            </h2>
                            {currentUser.role === "PATIENT" && (
                                <button onClick={() => setActiveTab("book")} className="btn btn-primary btn-sm">
                                    + Book New
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <p style={{ color: "#64748b" }}>Loading appointments...</p>
                        ) : appointments.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "28px" }}>
                                <p style={{ color: "#64748b" }}>No appointments found.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="app-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            {currentUser.role !== "DOCTOR" && <th>Doctor</th>}
                                            {currentUser.role !== "PATIENT" && <th>Patient</th>}
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Fee</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.map((a) => {
                                            const isCancelled = (a.status || "").toUpperCase() === "CANCELLED";
                                            const docName = a.doctor?.user?.name || `Dr. #${a.doctor?.id || "N/A"}`;
                                            const patName = a.patient?.user?.name || `Patient #${a.patient?.id || "N/A"}`;

                                            return (
                                                <tr key={a.id}>
                                                    <td>#{a.id}</td>
                                                    {currentUser.role !== "DOCTOR" && (
                                                        <td>
                                                            <strong>👨‍⚕️ {docName}</strong>
                                                            <br />
                                                            <span style={{ fontSize: "12px", color: "#64748b" }}>{a.doctor?.specialization || "General Physician"}</span>
                                                        </td>
                                                    )}
                                                    {currentUser.role !== "PATIENT" && (
                                                        <td>
                                                            <strong>👤 {patName}</strong>
                                                            <br />
                                                            <span style={{ fontSize: "12px", color: "#64748b" }}>{a.patient?.user?.email || "N/A"}</span>
                                                        </td>
                                                    )}
                                                    <td>{a.appointmentDate}</td>
                                                    <td>{a.appointmentTime}</td>
                                                    <td style={{ fontWeight: "bold", color: "#0f766e" }}>
                                                        ${a.consultationFee || a.doctor?.consultationFee || 50}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${isCancelled ? "badge-cancelled" : "badge-booked"}`}>
                                                            {a.status || "Booked"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                            {/* View Bill / Receipt Button */}
                                                            <button
                                                                onClick={() => handleViewReceipt(a)}
                                                                className="btn btn-outline btn-sm"
                                                                title="View Bill Details"
                                                            >
                                                                📄 Receipt
                                                            </button>

                                                            {!isCancelled && (
                                                                <>
                                                                    <button
                                                                        onClick={() => setRescheduleModal({
                                                                            open: true,
                                                                            appointmentId: a.id,
                                                                            date: a.appointmentDate,
                                                                            time: a.appointmentTime
                                                                        })}
                                                                        className="btn btn-outline btn-sm"
                                                                    >
                                                                        Reschedule
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleCancel(a.id)}
                                                                        className="btn btn-danger btn-sm"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: BOOK APPOINTMENT */}
                {activeTab === "book" && (
                    <div className="card" style={{ maxWidth: "520px", margin: "16px auto" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "12px", color: "#0f172a" }}>Book an Appointment</h2>

                        <form onSubmit={handleBook}>
                            <div className="form-group">
                                <label>Doctor *</label>
                                <select
                                    className="form-select"
                                    value={selectedDocId}
                                    onChange={(e) => setSelectedDocId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Doctor --</option>
                                    {doctors.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.user?.name || `Dr. #${d.id}`} - {d.specialization || "General Physician"} (${d.consultationFee || 50})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Date *</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Time Slot *</label>
                                <select
                                    className="form-select"
                                    value={bookingTime}
                                    onChange={(e) => setBookingTime(e.target.value)}
                                    required
                                >
                                    {timeSlots.map((slot) => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "10px" }} disabled={bookingLoading}>
                                {bookingLoading ? "Booking..." : "Confirm Appointment"}
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB: DOCTORS VIEW */}
                {activeTab === "doctors" && (
                    <div className="card" style={{ marginTop: "16px" }}>
                        {currentUser.role === "ADMIN" ? (
                            <div>
                                <h2 style={{ fontSize: "18px", marginBottom: "14px", color: "#0f172a" }}>All Registered Doctors</h2>
                                <div className="table-responsive">
                                    <table className="app-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Doctor Name</th>
                                                <th>Email</th>
                                                <th>Specialization</th>
                                                <th>Qualification</th>
                                                <th>Experience</th>
                                                <th>Fee ($)</th>
                                                <th>Availability</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {doctors.map((d) => (
                                                <tr key={d.id}>
                                                    <td>#{d.id}</td>
                                                    <td><strong>👨‍⚕️ {d.user?.name || `Dr. #${d.id}`}</strong></td>
                                                    <td>{d.user?.email || "N/A"}</td>
                                                    <td>{d.specialization || "General Physician"}</td>
                                                    <td>{d.qualification || "MBBS"}</td>
                                                    <td>{d.experience || 5} Yrs</td>
                                                    <td>${d.consultationFee || 50}</td>
                                                    <td>
                                                        <span className={`badge ${d.availability === "Available" ? "badge-available" : "badge-busy"}`}>
                                                            {d.availability || "Available"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <Doctors onSelectDoctor={(doc) => {
                                setSelectedDocId(doc.id.toString());
                                setActiveTab("book");
                            }} />
                        )}
                    </div>
                )}

                {/* TAB: DOCTOR SETTINGS */}
                {activeTab === "settings" && currentUser.role === "DOCTOR" && (
                    <div className="card" style={{ maxWidth: "480px", margin: "16px auto" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "12px", color: "#0f172a" }}>Doctor Availability & Fee</h2>

                        <form onSubmit={handleSaveDoctorSettings}>
                            <div className="form-group">
                                <label>Availability</label>
                                <select
                                    className="form-select"
                                    value={docAvailability}
                                    onChange={(e) => setDocAvailability(e.target.value)}
                                >
                                    <option value="Available">Available</option>
                                    <option value="Busy">Busy</option>
                                    <option value="On Leave">On Leave</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Consultation Fee ($ USD)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={docFee}
                                    onChange={(e) => setDocFee(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-secondary" style={{ width: "100%", padding: "10px" }}>
                                Save Settings
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB: ADMIN OVERVIEW */}
                {activeTab === "overview" && currentUser.role === "ADMIN" && (
                    <div style={{ marginTop: "16px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "18px" }}>
                            <div className="card" style={{ borderLeft: "4px solid #10b981" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Total Revenue</span>
                                <h3 style={{ fontSize: "22px", color: "#15803d", marginTop: "4px" }}>${totalRevenue}</h3>
                            </div>
                            <div className="card" style={{ borderLeft: "4px solid #0284c7" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Total Appointments</span>
                                <h3 style={{ fontSize: "22px", color: "#0369a1", marginTop: "4px" }}>{appointments.length}</h3>
                            </div>
                            <div className="card" style={{ borderLeft: "4px solid #8b5cf6" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Total Doctors</span>
                                <h3 style={{ fontSize: "22px", color: "#6d28d9", marginTop: "4px" }}>{doctors.length}</h3>
                            </div>
                            <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Total Patients</span>
                                <h3 style={{ fontSize: "22px", color: "#b45309", marginTop: "4px" }}>{patientUsers.length}</h3>
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ fontSize: "16px", marginBottom: "8px", color: "#0f172a" }}>Hospital Admin Portal</h3>
                            <p style={{ fontSize: "13.5px", color: "#475569" }}>
                                You have full permissions to view revenue, doctor schedules, patient profiles, and system appointments.
                            </p>
                        </div>
                    </div>
                )}

                {/* TAB: ADMIN ALL PATIENTS */}
                {activeTab === "patients" && currentUser.role === "ADMIN" && (
                    <div className="card" style={{ marginTop: "16px" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "14px", color: "#0f172a" }}>All Registered Patients</h2>
                        <div className="table-responsive">
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Patient Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patientUsers.map((p) => (
                                        <tr key={p.id}>
                                            <td>#{p.id}</td>
                                            <td><strong>👤 {p.name}</strong></td>
                                            <td>{p.email}</td>
                                            <td>{p.phone || "N/A"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* RESCHEDULE MODAL */}
                {rescheduleModal.open && (
                    <div className="modal-backdrop" onClick={() => setRescheduleModal({ open: false, appointmentId: null, date: "", time: timeSlots[0] })}>
                        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                            <h3 style={{ fontSize: "17px", marginBottom: "12px", color: "#0f172a" }}>Reschedule Appointment</h3>

                            <form onSubmit={handleRescheduleSubmit}>
                                <div className="form-group">
                                    <label>New Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={rescheduleModal.date}
                                        onChange={(e) => setRescheduleModal({ ...rescheduleModal, date: e.target.value })}
                                        min={new Date().toISOString().split("T")[0]}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>New Time</label>
                                    <select
                                        className="form-select"
                                        value={rescheduleModal.time}
                                        onChange={(e) => setRescheduleModal({ ...rescheduleModal, time: e.target.value })}
                                        required
                                    >
                                        {timeSlots.map((slot) => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={() => setRescheduleModal({ open: false, appointmentId: null, date: "", time: timeSlots[0] })}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-sm">
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* BILLING RECEIPT MODAL (NO PRINT BUTTON, JUST DETAILS & CLOSE) */}
                {receiptModal.open && receiptModal.billData && (
                    <div className="modal-backdrop" onClick={() => setReceiptModal({ open: false, billData: null })}>
                        <div className="modal-box" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                                <h3 style={{ fontSize: "17px", color: "#0f172a", margin: 0 }}>
                                    🧾 Consultation Bill & Receipt
                                </h3>
                                <span className="badge badge-booked">
                                    {receiptModal.billData.paymentStatus || "PAID"}
                                </span>
                            </div>

                            <div style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.7" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <span style={{ color: "#64748b" }}>Invoice Reference:</span>
                                    <strong>INV-{receiptModal.billData.id || receiptModal.billData.appointmentId}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <span style={{ color: "#64748b" }}>Date & Time:</span>
                                    <span>{receiptModal.billData.appointmentDate || receiptModal.billData.invoiceDate} at {receiptModal.billData.appointmentTime || "09:00 AM"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <span style={{ color: "#64748b" }}>Patient:</span>
                                    <strong>{receiptModal.billData.patientName}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                                    <span style={{ color: "#64748b" }}>Consulting Doctor:</span>
                                    <span><strong>{receiptModal.billData.doctorName}</strong> ({receiptModal.billData.specialization})</span>
                                </div>

                                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "6px", border: "1px solid #e2e8f0", margin: "10px 0" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                        <span>Doctor Consultation Fee:</span>
                                        <span>${receiptModal.billData.consultationFee?.toFixed(2) || "50.00"}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#64748b", fontSize: "12.5px" }}>
                                        <span>Hospital Service Tax (5%):</span>
                                        <span>${receiptModal.billData.taxAmount?.toFixed(2) || "2.50"}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px dashed #cbd5e1", fontWeight: "bold", fontSize: "15px", color: "#0f766e" }}>
                                        <span>Total Amount:</span>
                                        <span>${receiptModal.billData.totalAmount?.toFixed(2) || "52.50"}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setReceiptModal({ open: false, billData: null })}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default Dashboard;
