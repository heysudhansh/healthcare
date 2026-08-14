import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Doctors({ onSelectDoctor }) {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadDoctors = () => {
        setLoading(true);
        api.get("/doctors")
            .then((res) => {
                setDoctors(res.data || []);
            })
            .catch(() => {
                setDoctors([]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        loadDoctors();
    }, []);

    const handleBook = (doctor) => {
        if (onSelectDoctor) {
            onSelectDoctor(doctor);
        } else {
            navigate(`/dashboard?tab=book&doctorId=${doctor.id}`);
        }
    };

    return (
        <section id="doctors" style={{ margin: "24px 0" }}>
            <div style={{ marginBottom: "16px" }}>
                <h2 style={{ fontSize: "20px", color: "#1e293b" }}>Our Doctors</h2>
                <p style={{ color: "#64748b", fontSize: "13.5px" }}>Choose a specialist doctor for your consultation.</p>
            </div>

            {loading ? (
                <p style={{ color: "#64748b" }}>Loading doctors...</p>
            ) : doctors.length === 0 ? (
                <p style={{ color: "#64748b" }}>No doctors registered yet.</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                    {doctors.map((doc) => {
                        const name = doc.user?.name || `Dr. #${doc.id}`;
                        const isAvailable = (doc.availability || "Available").toLowerCase() === "available";

                        return (
                            <div key={doc.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <h3 style={{ fontSize: "16px", color: "#0f172a" }}>👨‍⚕️ {name}</h3>
                                        <span className={`badge ${isAvailable ? "badge-available" : "badge-busy"}`}>
                                            {doc.availability || "Available"}
                                        </span>
                                    </div>
                                    <p style={{ color: "#0284c7", fontWeight: "600", fontSize: "13.5px" }}>{doc.specialization || "General Physician"}</p>
                                    <p style={{ color: "#64748b", fontSize: "12px", margin: "4px 0" }}>{doc.qualification || "MBBS"}</p>
                                    <p style={{ color: "#475569", fontSize: "13px" }}>Experience: {doc.experience || 5} Yrs</p>
                                    <p style={{ color: "#0f766e", fontWeight: "700", fontSize: "14.5px", marginTop: "6px" }}>
                                        Consultation Fee: ${doc.consultationFee || 50}
                                    </p>
                                </div>

                                <div style={{ marginTop: "14px" }}>
                                    <button
                                        onClick={() => handleBook(doc)}
                                        className="btn btn-primary btn-sm"
                                        style={{ width: "100%" }}
                                    >
                                        Book Appointment
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default Doctors;
