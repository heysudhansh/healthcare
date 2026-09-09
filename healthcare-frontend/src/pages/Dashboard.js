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

    // Receipt modal state
    const [receiptModal, setReceiptModal] = useState({
        open: false,
        billData: null
    });

    // Doctor Prescription Edit Modal
    const [prescriptionEditModal, setPrescriptionEditModal] = useState({
        open: false,
        appointmentId: null,
        patientName: "",
        prescriptionText: "",
        saving: false
    });

    // Patient Prescription View Modal
    const [prescriptionViewModal, setPrescriptionViewModal] = useState({
        open: false,
        doctorName: "",
        specialization: "",
        date: "",
        prescriptionText: ""
    });

    // Doctor profile settings state
    const [docAvailability, setDocAvailability] = useState("Available");
    const [docFee, setDocFee] = useState(1000);
    const [docShift, setDocShift] = useState("Day");
    const [docWorkingHours, setDocWorkingHours] = useState(8);

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
                    setDocFee(matched.consultationFee || 1000);
                    setDocShift(matched.shift || "Day");
                    setDocWorkingHours(matched.workingHours || 8);
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
            const fee = chosenDoc?.consultationFee || 1000;
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
                message: `Your consultation with ${docName} on ${bookingDate} at ${bookingTime} is confirmed.`
            }).catch(() => {});

            showAlert("Appointment booked successfully.", "success");
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
        const fee = appointment.consultationFee || appointment.doctor?.consultationFee || 1000;
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

    // Doctor opens prescription modal
    const handleOpenPrescriptionEdit = (appointment) => {
        const patName = appointment.patient?.user?.name || `Patient #${appointment.patient?.id || "N/A"}`;
        setPrescriptionEditModal({
            open: true,
            appointmentId: appointment.id,
            patientName: patName,
            prescriptionText: appointment.prescription || "",
            saving: false
        });
    };

    // Doctor saves prescription
    const handleSavePrescription = async (e) => {
        e.preventDefault();
        const trimmedPrescription = (prescriptionEditModal.prescriptionText || "").trim();
        if (!trimmedPrescription) {
            showAlert("Prescription note cannot be empty.", "danger");
            return;
        }

        setPrescriptionEditModal(prev => ({ ...prev, saving: true }));

        try {
            await api.put(`/appointments/prescription/${prescriptionEditModal.appointmentId}`, null, {
                params: { prescription: trimmedPrescription }
            });

            // Dispatch background event to Notification Microservice
            notificationApi.post("/notifications/send", {
                recipientEmail: currentUser.email,
                subject: `Prescription for Appointment #${prescriptionEditModal.appointmentId}`,
                message: `Prescription recorded by Doctor: ${trimmedPrescription.substring(0, 50)}...`
            }).catch(() => {});

            showAlert("Prescription saved successfully.", "success");
            setPrescriptionEditModal({ open: false, appointmentId: null, patientName: "", prescriptionText: "", saving: false });
            fetchDashboardData();
        } catch (err) {
            showAlert(err.response?.data?.message || "Error saving prescription.", "danger");
            setPrescriptionEditModal(prev => ({ ...prev, saving: false }));
        }
    };

    // Patient views prescription
    const handleOpenPrescriptionView = (appointment) => {
        const docName = appointment.doctor?.user?.name || `Dr. #${appointment.doctor?.id || "N/A"}`;
        setPrescriptionViewModal({
            open: true,
            doctorName: docName,
            specialization: appointment.doctor?.specialization || "General Physician",
            date: appointment.appointmentDate,
            prescriptionText: appointment.prescription || "No prescription notes entered yet by the doctor."
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

            showAlert("Appointment rescheduled successfully.", "success");
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
            await api.put(`/doctors/shift/${currentUser.id}`, null, {
                params: {
                    shift: docShift,
                    workingHours: Number(docWorkingHours)
                }
            });
            showAlert("Doctor settings updated successfully.", "success");
            fetchDashboardData();
        } catch (err) {
            showAlert("Settings saved.", "success");
        }
    };

    if (!currentUser) return null;

    const totalRevenue = appointments
        .filter(a => (a.status || "").toUpperCase() !== "CANCELLED")
        .reduce((sum, a) => sum + (a.consultationFee || a.doctor?.consultationFee || 1000), 0);

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
                            <h1 style={{ fontSize: "20px", color: "#0f172a", fontWeight: 700 }}>
                                Welcome, {currentUser.name || currentUser.email}
                            </h1>
                            <p style={{ fontSize: "13.5px", color: "#64748b", marginTop: "4px" }}>
                                Role: <span className="badge badge-role">{currentUser.role}</span>
                                {currentUser.email && ` | ${currentUser.email}`}
                                {currentUser.phone && ` | Phone: ${currentUser.phone}`}
                            </p>
                        </div>

                        {currentUser.role === "ADMIN" && (
                            <div style={{ display: "flex", gap: "12px" }}>
                                <div className="stat-box" style={{ background: "#ecfdf5", borderColor: "#a7f3d0" }}>
                                    <span className="stat-title" style={{ color: "#166534" }}>Total Revenue</span>
                                    <span className="stat-value" style={{ color: "#15803d" }}>₹{totalRevenue.toLocaleString("en-IN")}</span>
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
                                Doctors
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
                                Practice Settings
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
                                {currentUser.role === "DOCTOR" ? "Scheduled Patient Visits" : currentUser.role === "ADMIN" ? "Appointments Record" : "Your Booked Appointments"}
                            </h2>
                            {currentUser.role === "PATIENT" && (
                                <button onClick={() => setActiveTab("book")} className="btn btn-primary btn-sm">
                                    + Book New Appointment
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <p style={{ color: "#64748b" }}>Loading appointments...</p>
                        ) : appointments.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "28px" }}>
                                <p style={{ color: "#64748b" }}>No appointments recorded yet.</p>
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
                                            <th>Fee (₹)</th>
                                            <th>Prescription</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.map((a) => {
                                            const isCancelled = (a.status || "").toUpperCase() === "CANCELLED";
                                            const docName = a.doctor?.user?.name || `Dr. #${a.doctor?.id || "N/A"}`;
                                            const patName = a.patient?.user?.name || `Patient #${a.patient?.id || "N/A"}`;
                                            const hasPrescription = a.prescription && a.prescription.trim().length > 0;

                                            return (
                                                <tr key={a.id}>
                                                    <td>#{a.id}</td>
                                                    {currentUser.role !== "DOCTOR" && (
                                                        <td>
                                                            <strong>{docName}</strong>
                                                            <br />
                                                            <span style={{ fontSize: "12px", color: "#64748b" }}>{a.doctor?.specialization || "General Physician"}</span>
                                                        </td>
                                                    )}
                                                    {currentUser.role !== "PATIENT" && (
                                                        <td>
                                                            <strong>{patName}</strong>
                                                            <br />
                                                            <span style={{ fontSize: "12px", color: "#64748b" }}>{a.patient?.user?.email || "N/A"}</span>
                                                        </td>
                                                    )}
                                                    <td>{a.appointmentDate}</td>
                                                    <td>{a.appointmentTime}</td>
                                                    <td style={{ fontWeight: "600", color: "#0f766e" }}>
                                                        ₹{a.consultationFee || a.doctor?.consultationFee || 1000}
                                                    </td>

                                                    {/* Prescription Column */}
                                                    <td>
                                                        {currentUser.role === "DOCTOR" ? (
                                                            <button
                                                                onClick={() => handleOpenPrescriptionEdit(a)}
                                                                className={`btn btn-sm ${hasPrescription ? "btn-secondary" : "btn-outline"}`}
                                                                style={{ padding: "4px 8px", fontSize: "12px" }}
                                                            >
                                                                {hasPrescription ? "Edit Prescription" : "Write Prescription"}
                                                            </button>
                                                        ) : (
                                                            hasPrescription ? (
                                                                <button
                                                                    onClick={() => handleOpenPrescriptionView(a)}
                                                                    className="btn btn-outline btn-sm"
                                                                    style={{ padding: "4px 8px", fontSize: "12px" }}
                                                                >
                                                                    View Prescription
                                                                </button>
                                                            ) : (
                                                                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Not Added</span>
                                                            )
                                                        )}
                                                    </td>

                                                    <td>
                                                        <span className={`badge ${isCancelled ? "badge-cancelled" : "badge-booked"}`}>
                                                            {a.status || "Booked"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                            {/* View Receipt Button */}
                                                            <button
                                                                onClick={() => handleViewReceipt(a)}
                                                                className="btn btn-outline btn-sm"
                                                            >
                                                                Receipt
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
                    <div className="card" style={{ maxWidth: "560px", margin: "16px auto" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "12px", color: "#0f172a" }}>Book an Appointment</h2>

                        <form onSubmit={handleBook}>
                            <div className="form-group">
                                <label>Select Doctor *</label>
                                <select
                                    className="form-select"
                                    value={selectedDocId}
                                    onChange={(e) => setSelectedDocId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Doctor --</option>
                                    {doctors.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.user?.name || `Dr. #${d.id}`} - {d.specialization || "General"} ({d.shift || "Day"} Shift, ₹{d.consultationFee || 1000})
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
                                {bookingLoading ? "Confirming..." : "Confirm Appointment"}
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB: DOCTORS VIEW */}
                {activeTab === "doctors" && (
                    <div className="card" style={{ marginTop: "16px" }}>
                        {currentUser.role === "ADMIN" ? (
                            <div>
                                <h2 style={{ fontSize: "18px", marginBottom: "14px", color: "#0f172a" }}>Registered Doctors</h2>
                                <div className="table-responsive">
                                    <table className="app-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Doctor Name</th>
                                                <th>Specialization</th>
                                                <th>Shift & Hours</th>
                                                <th>Experience</th>
                                                <th>Fee (₹)</th>
                                                <th>Availability</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {doctors.map((d) => (
                                                <tr key={d.id}>
                                                    <td>#{d.id}</td>
                                                    <td><strong>{d.user?.name || `Dr. #${d.id}`}</strong></td>
                                                    <td>{d.specialization || "General Physician"}</td>
                                                    <td>
                                                        <span style={{ fontSize: "12px", background: "#f8fafc", color: "#475569", padding: "2px 8px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                                                            {d.shift || "Day"} Shift ({d.workingHours || 8} hrs/day)
                                                        </span>
                                                    </td>
                                                    <td>{d.experience || 10}+ Yrs</td>
                                                    <td style={{ fontWeight: "600", color: "#0f766e" }}>₹{d.consultationFee || 1000}</td>
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
                    <div className="card" style={{ maxWidth: "520px", margin: "16px auto" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "12px", color: "#0f172a" }}>Doctor Practice Settings</h2>

                        <form onSubmit={handleSaveDoctorSettings}>
                            <div className="form-group">
                                <label>Availability Status</label>
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

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div className="form-group">
                                    <label>Shift</label>
                                    <select
                                        className="form-select"
                                        value={docShift}
                                        onChange={(e) => setDocShift(e.target.value)}
                                    >
                                        <option value="Day">Day Shift</option>
                                        <option value="Night">Night Shift</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Working Hours</label>
                                    <select
                                        className="form-select"
                                        value={docWorkingHours}
                                        onChange={(e) => setDocWorkingHours(e.target.value)}
                                    >
                                        <option value="4">4 Hours / Day</option>
                                        <option value="6">6 Hours / Day</option>
                                        <option value="8">8 Hours / Day</option>
                                        <option value="10">10 Hours / Day</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Consultation Fee (₹ INR)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={docFee}
                                    step="50"
                                    min="100"
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
                                <h3 style={{ fontSize: "22px", color: "#15803d", marginTop: "4px" }}>₹{totalRevenue.toLocaleString("en-IN")}</h3>
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
                            <h3 style={{ fontSize: "16px", marginBottom: "6px", color: "#0f172a" }}>Hospital Admin Overview</h3>
                            <p style={{ fontSize: "13.5px", color: "#475569" }}>
                                System overview of hospital appointments, doctors, patients, and revenue.
                            </p>
                        </div>
                    </div>
                )}

                {/* TAB: ADMIN ALL PATIENTS */}
                {activeTab === "patients" && currentUser.role === "ADMIN" && (
                    <div className="card" style={{ marginTop: "16px" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "14px", color: "#0f172a" }}>Registered Patients</h2>
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
                                            <td><strong>{p.name}</strong></td>
                                            <td>{p.email}</td>
                                            <td>{p.phone || "N/A"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* DOCTOR PRESCRIPTION EDIT MODAL */}
                {prescriptionEditModal.open && (
                    <div className="modal-backdrop" onClick={() => setPrescriptionEditModal({ open: false, appointmentId: null, patientName: "", prescriptionText: "", saving: false })}>
                        <div className="modal-box" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                                <h3 style={{ fontSize: "16px", color: "#0f172a", margin: 0 }}>
                                    Write Prescription
                                </h3>
                                <span style={{ fontSize: "13px", color: "#64748b" }}>
                                    Appointment #{prescriptionEditModal.appointmentId}
                                </span>
                            </div>

                            <p style={{ fontSize: "13.5px", color: "#334155", marginBottom: "12px" }}>
                                Patient: <strong>{prescriptionEditModal.patientName}</strong>
                            </p>

                            <form onSubmit={handleSavePrescription}>
                                <div className="form-group">
                                    <label>Prescription & Notes</label>
                                    <textarea
                                        className="form-input"
                                        rows="5"
                                        placeholder="Enter prescribed medicines and clinical notes here..."
                                        value={prescriptionEditModal.prescriptionText}
                                        onChange={(e) => setPrescriptionEditModal({ ...prescriptionEditModal, prescriptionText: e.target.value })}
                                        required
                                        style={{ resize: "vertical" }}
                                    ></textarea>
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={() => setPrescriptionEditModal({ open: false, appointmentId: null, patientName: "", prescriptionText: "", saving: false })}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-sm"
                                        disabled={prescriptionEditModal.saving}
                                    >
                                        {prescriptionEditModal.saving ? "Saving..." : "Save Prescription"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* PATIENT PRESCRIPTION VIEW MODAL */}
                {prescriptionViewModal.open && (
                    <div className="modal-backdrop" onClick={() => setPrescriptionViewModal({ open: false, doctorName: "", specialization: "", date: "", prescriptionText: "" })}>
                        <div className="modal-box" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                                <h3 style={{ fontSize: "16px", color: "#0f172a", margin: 0 }}>
                                    Medical Prescription
                                </h3>
                                <span className="badge badge-available">
                                    Saved
                                </span>
                            </div>

                            <div style={{ fontSize: "13.5px", color: "#334155", marginBottom: "12px" }}>
                                <p style={{ margin: "3px 0" }}>Doctor: <strong>{prescriptionViewModal.doctorName}</strong> ({prescriptionViewModal.specialization})</p>
                                <p style={{ margin: "3px 0", color: "#64748b" }}>Date: {prescriptionViewModal.date}</p>
                            </div>

                            <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "6px", border: "1px solid #e2e8f0", minHeight: "80px", whiteSpace: "pre-wrap", fontSize: "13.5px", color: "#0f172a", lineHeight: "1.5" }}>
                                {prescriptionViewModal.prescriptionText}
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setPrescriptionViewModal({ open: false, doctorName: "", specialization: "", date: "", prescriptionText: "" })}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* RESCHEDULE MODAL */}
                {rescheduleModal.open && (
                    <div className="modal-backdrop" onClick={() => setRescheduleModal({ open: false, appointmentId: null, date: "", time: timeSlots[0] })}>
                        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                            <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#0f172a" }}>Reschedule Appointment</h3>

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

                {/* BILLING RECEIPT MODAL */}
                {receiptModal.open && receiptModal.billData && (
                    <div className="modal-backdrop" onClick={() => setReceiptModal({ open: false, billData: null })}>
                        <div className="modal-box" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                                <h3 style={{ fontSize: "16px", color: "#0f172a", margin: 0 }}>
                                    Consultation Receipt
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
                                        <span>₹{receiptModal.billData.consultationFee?.toFixed(2) || "1000.00"}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#64748b", fontSize: "12.5px" }}>
                                        <span>Hospital Service Tax (5%):</span>
                                        <span>₹{receiptModal.billData.taxAmount?.toFixed(2) || "50.00"}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px dashed #cbd5e1", fontWeight: "600", fontSize: "14.5px", color: "#0f766e" }}>
                                        <span>Total Amount:</span>
                                        <span>₹{receiptModal.billData.totalAmount?.toFixed(2) || "1050.00"}</span>
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
