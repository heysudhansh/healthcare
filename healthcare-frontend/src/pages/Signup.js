import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Signup() {
    const [role, setRole] = useState("PATIENT");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        // Patient fields
        gender: "Male",
        bloodGroup: "B+",
        medicalHistory: "",
        // Doctor fields
        specialization: "Internal Medicine",
        qualification: "MBBS, MD",
        experience: 15,
        consultationFee: 1000,
        availability: "Available",
        shift: "Day",
        workingHours: 8
    });

    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "phone") {
            const numericValue = value.replace(/\D/g, "").slice(0, 10);
            setFormData({
                ...formData,
                phone: numericValue
            });
            return;
        }
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        const nameTrimmed = formData.name.trim();
        const emailTrimmed = formData.email.trim();
        const phoneTrimmed = formData.phone.trim();
        const passwordTrimmed = formData.password.trim();

        if (!nameTrimmed || !emailTrimmed || !passwordTrimmed || !phoneTrimmed) {
            setErrorMsg("Please fill in all required fields (Name, Email, Password, and Phone).");
            return;
        }

        const nameRegex = /^[a-zA-Z\s]{2,50}$/;
        if (!nameRegex.test(nameTrimmed)) {
            setErrorMsg("Invalid Name. Name must contain only letters and spaces (2 to 50 characters).");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailTrimmed)) {
            setErrorMsg("Invalid Email address format.");
            return;
        }

        if (passwordTrimmed.length < 6) {
            setErrorMsg("Password must be at least 6 characters long.");
            return;
        }

        if (phoneTrimmed.length !== 10) {
            setErrorMsg("Phone number must be exactly 10 digits.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: nameTrimmed,
                email: emailTrimmed,
                password: passwordTrimmed,
                phone: phoneTrimmed,
                role: role
            };

            if (role === "DOCTOR") {
                payload.specialization = formData.specialization;
                payload.qualification = formData.qualification;
                payload.experience = Number(formData.experience) || 10;
                payload.consultationFee = Number(formData.consultationFee) || 1000;
                payload.availability = formData.availability;
                payload.shift = formData.shift;
                payload.workingHours = Number(formData.workingHours) || 8;
            } else {
                payload.gender = formData.gender;
                payload.bloodGroup = formData.bloodGroup;
                payload.medicalHistory = formData.medicalHistory || "Routine Health Checkup";
            }

            await api.post("/users", payload);

            setSuccessMsg("Account created successfully! Redirecting to login...");
            setTimeout(() => {
                navigate("/login");
            }, 1200);
        } catch (error) {
            setErrorMsg(
                error.response?.data?.message || 
                "Error creating account. Please check your details and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />

            <main className="container" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 16px" }}>
                <div className="card" style={{ maxWidth: "560px", width: "100%" }}>
                    <h2 style={{ fontSize: "20px", marginBottom: "6px", color: "#0f172a" }}>Register Account</h2>
                    <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
                        Choose whether you are registering as a Patient or a Doctor.
                    </p>

                    {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                    {successMsg && <div className="alert alert-success">{successMsg}</div>}

                    {/* Role Selector */}
                    <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
                        <button
                            type="button"
                            className={`btn ${role === "PATIENT" ? "btn-primary" : "btn-outline"}`}
                            style={{ flex: 1 }}
                            onClick={() => setRole("PATIENT")}
                        >
                            Register as Patient
                        </button>
                        <button
                            type="button"
                            className={`btn ${role === "DOCTOR" ? "btn-primary" : "btn-outline"}`}
                            style={{ flex: 1 }}
                            onClick={() => setRole("DOCTOR")}
                        >
                            Register as Doctor
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Common Account Fields */}
                        <div className="form-group">
                            <label>Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                placeholder={role === "DOCTOR" ? "e.g. Dr. Bhavna Chaudhry" : "e.g. Rahul Sharma"}
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="name@hospital.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone Number * (10 Digits)</label>
                            <input
                                type="tel"
                                name="phone"
                                className="form-input"
                                placeholder="e.g. 9876543210"
                                maxLength="10"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* DOCTOR SPECIFIC FIELDS */}
                        {role === "DOCTOR" && (
                            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                                <h4 style={{ fontSize: "14px", color: "#0f172a", marginBottom: "10px" }}>Doctor Details</h4>

                                <div className="form-group">
                                    <label>Medical Specialization *</label>
                                    <select
                                        name="specialization"
                                        className="form-select"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                    >
                                        <option value="Cardiology & Cardiac Sciences">Cardiology & Cardiac Sciences</option>
                                        <option value="Obstetrics & Gynaecology">Obstetrics & Gynaecology</option>
                                        <option value="Orthopaedics & Joint Replacement">Orthopaedics & Joint Replacement</option>
                                        <option value="Internal Medicine">Internal Medicine (General Medicine)</option>
                                        <option value="ENT (Ear Nose Throat)">ENT (Ear Nose Throat)</option>
                                        <option value="Nephrology & Kidney Transplant">Nephrology & Kidney Transplant</option>
                                        <option value="Medical Oncology & Cancer Care">Medical Oncology & Cancer Care</option>
                                        <option value="Pediatrics">Pediatrics</option>
                                        <option value="Dermatology">Dermatology</option>
                                        <option value="General Physician">General Physician</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Qualification *</label>
                                    <input
                                        type="text"
                                        name="qualification"
                                        className="form-input"
                                        placeholder="e.g. MBBS, MD, MS, DM"
                                        value={formData.qualification}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Shift Timing *</label>
                                        <select
                                            name="shift"
                                            className="form-select"
                                            value={formData.shift}
                                            onChange={handleChange}
                                        >
                                            <option value="Day">Day Shift (9 AM - 5 PM)</option>
                                            <option value="Night">Night Shift (6 PM - 2 AM)</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Daily Working Hours</label>
                                        <select
                                            name="workingHours"
                                            className="form-select"
                                            value={formData.workingHours}
                                            onChange={handleChange}
                                        >
                                            <option value="4">4 Hours / Day</option>
                                            <option value="6">6 Hours / Day</option>
                                            <option value="8">8 Hours / Day (Full-Time)</option>
                                            <option value="10">10 Hours / Day</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    <div className="form-group">
                                        <label>Experience (Years)</label>
                                        <input
                                            type="number"
                                            name="experience"
                                            className="form-input"
                                            min="1"
                                            value={formData.experience}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Consultation Fee (₹ INR)</label>
                                        <input
                                            type="number"
                                            name="consultationFee"
                                            className="form-input"
                                            min="100"
                                            step="50"
                                            value={formData.consultationFee}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PATIENT SPECIFIC FIELDS */}
                        {role === "PATIENT" && (
                            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                                <h4 style={{ fontSize: "14px", color: "#0f172a", marginBottom: "10px" }}>Patient Health Information</h4>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    <div className="form-group">
                                        <label>Gender</label>
                                        <select
                                            name="gender"
                                            className="form-select"
                                            value={formData.gender}
                                            onChange={handleChange}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Blood Group</label>
                                        <select
                                            name="bloodGroup"
                                            className="form-select"
                                            value={formData.bloodGroup}
                                            onChange={handleChange}
                                        >
                                            <option value="B+">B+</option>
                                            <option value="O+">O+</option>
                                            <option value="A+">A+</option>
                                            <option value="AB+">AB+</option>
                                            <option value="B-">B-</option>
                                            <option value="O-">O-</option>
                                            <option value="A-">A-</option>
                                            <option value="AB-">AB-</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Medical Notes / History (Optional)</label>
                                    <input
                                        type="text"
                                        name="medicalHistory"
                                        className="form-input"
                                        placeholder="e.g. Hypertension, Diabetes checkup, Allergy"
                                        value={formData.medicalHistory}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "10px" }} disabled={loading}>
                            {loading ? "Registering..." : `Register as ${role === "DOCTOR" ? "Doctor" : "Patient"}`}
                        </button>
                    </form>

                    <div style={{ textAlign: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e2e8f0", fontSize: "13px" }}>
                        Already have an account? <Link to="/login">Sign in here</Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Signup;