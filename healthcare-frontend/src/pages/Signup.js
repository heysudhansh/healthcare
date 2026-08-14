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
        bloodGroup: "O+",
        medicalHistory: "",
        // Doctor fields
        specialization: "General Physician",
        qualification: "MBBS, MD",
        experience: 5,
        consultationFee: 50,
        availability: "Available"
    });

    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!formData.name || !formData.email || !formData.password) {
            setErrorMsg("Please fill in name, email, and password.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password.trim(),
                phone: formData.phone.trim(),
                role: role
            };

            if (role === "DOCTOR") {
                payload.specialization = formData.specialization;
                payload.qualification = formData.qualification;
                payload.experience = Number(formData.experience) || 5;
                payload.consultationFee = Number(formData.consultationFee) || 50;
                payload.availability = formData.availability;
            } else {
                payload.gender = formData.gender;
                payload.bloodGroup = formData.bloodGroup;
                payload.medicalHistory = formData.medicalHistory || "General Consultation";
            }

            await api.post("/users", payload);

            setSuccessMsg("Account created successfully! Redirecting to login...");
            setTimeout(() => {
                navigate("/login");
            }, 1200);
        } catch (error) {
            setErrorMsg(
                error.response?.data?.message || 
                "Error creating account. Email might already exist."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />

            <main className="container" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 16px" }}>
                <div className="card" style={{ maxWidth: "520px", width: "100%" }}>
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
                            👤 Register as Patient
                        </button>
                        <button
                            type="button"
                            className={`btn ${role === "DOCTOR" ? "btn-primary" : "btn-outline"}`}
                            style={{ flex: 1 }}
                            onClick={() => setRole("DOCTOR")}
                        >
                            👨‍⚕️ Register as Doctor
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
                                placeholder={role === "DOCTOR" ? "e.g. Dr. Emily Watson" : "e.g. John Doe"}
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
                                placeholder="name@example.com"
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
                            <label>Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                className="form-input"
                                placeholder="e.g. 9876543210"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        {/* DOCTOR SPECIFIC FIELDS */}
                        {role === "DOCTOR" && (
                            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                                <h4 style={{ fontSize: "14px", color: "#0f172a", marginBottom: "10px" }}>Doctor Professional Details</h4>

                                <div className="form-group">
                                    <label>Medical Specialization *</label>
                                    <select
                                        name="specialization"
                                        className="form-select"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                    >
                                        <option value="Cardiologist">Cardiologist (Heart Specialist)</option>
                                        <option value="General Physician">General Physician</option>
                                        <option value="Pediatrician">Pediatrician (Child Specialist)</option>
                                        <option value="Orthopedic">Orthopedic (Bone & Joint)</option>
                                        <option value="Neurologist">Neurologist (Brain & Nerves)</option>
                                        <option value="Dermatologist">Dermatologist (Skin Specialist)</option>
                                        <option value="Ophthalmologist">Ophthalmologist (Eye Specialist)</option>
                                        <option value="ENT Specialist">ENT Specialist</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Qualification *</label>
                                    <input
                                        type="text"
                                        name="qualification"
                                        className="form-input"
                                        placeholder="e.g. MBBS, MD, MS"
                                        value={formData.qualification}
                                        onChange={handleChange}
                                        required
                                    />
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
                                        <label>Consultation Fee ($)</label>
                                        <input
                                            type="number"
                                            name="consultationFee"
                                            className="form-input"
                                            min="10"
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
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="AB+">AB+</option>
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
                                        placeholder="e.g. Allergy, Asthma, Routine checkup"
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