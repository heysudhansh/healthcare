import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

function Doctors({ onSelectDoctor, initialDepartment }) {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const selectedDept = searchParams.get("dept") || initialDepartment || "";

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

    const clearFilter = () => {
        searchParams.delete("dept");
        setSearchParams(searchParams);
    };

    const filteredDoctors = doctors.filter((doc) => {
        if (!selectedDept) return true;
        const spec = (doc.specialization || "").toLowerCase();
        const filter = selectedDept.toLowerCase();
        return spec.includes(filter) || filter.includes(spec);
    });

    return (
        <section id="doctors" style={{ margin: "24px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "18px" }}>
                <div>
                    <h2 style={{ fontSize: "20px", color: "#0f172a", fontWeight: 700 }}>Doctors</h2>
                    <p style={{ color: "#64748b", fontSize: "14px", marginTop: "2px" }}>
                        View available doctors and book appointments.
                    </p>
                </div>

                {selectedDept && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f0f9ff", padding: "6px 12px", borderRadius: "6px", border: "1px solid #bae6fd" }}>
                        <span style={{ fontSize: "13px", color: "#0369a1", fontWeight: "600" }}>
                            Department: {selectedDept}
                        </span>
                        <button onClick={clearFilter} className="btn btn-outline btn-sm" style={{ padding: "2px 8px", fontSize: "11px" }}>
                            Clear Filter
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <p style={{ color: "#64748b" }}>Loading doctors...</p>
            ) : filteredDoctors.length === 0 ? (
                <div className="card" style={{ padding: "24px", textAlign: "center" }}>
                    <p style={{ color: "#64748b", fontSize: "14px" }}>
                        No doctors found under {selectedDept || "this department"}.
                    </p>
                    {selectedDept && (
                        <button onClick={clearFilter} className="btn btn-primary btn-sm" style={{ marginTop: "10px" }}>
                            View All Doctors
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
                    {filteredDoctors.map((doc) => {
                        const name = doc.user?.name || `Dr. #${doc.id}`;
                        const isAvailable = (doc.availability || "Available").toLowerCase() === "available";
                        const shift = doc.shift || "Day";
                        const hours = doc.workingHours || 8;

                        return (
                            <div key={doc.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "18px" }}>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                        <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: 600 }}>{name}</h3>
                                        <span className={`badge ${isAvailable ? "badge-available" : "badge-busy"}`}>
                                            {doc.availability || "Available"}
                                        </span>
                                    </div>

                                    <p style={{ color: "#0284c7", fontWeight: "500", fontSize: "13.5px", marginBottom: "3px" }}>
                                        {doc.specialization || "General Physician"}
                                    </p>
                                    <p style={{ color: "#64748b", fontSize: "12px", margin: "2px 0" }}>
                                        {doc.qualification || "MBBS, MD"}
                                    </p>

                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "8px 0" }}>
                                        <span style={{ fontSize: "12px", background: "#f8fafc", color: "#475569", padding: "2px 8px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                                            Shift: {shift} ({hours} hrs/day)
                                        </span>
                                        <span style={{ fontSize: "12px", background: "#f8fafc", color: "#475569", padding: "2px 8px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                                            Experience: {doc.experience || 10}+ Yrs
                                        </span>
                                    </div>

                                    <p style={{ color: "#0f766e", fontWeight: "600", fontSize: "15px", marginTop: "6px" }}>
                                        Fee: ₹{doc.consultationFee || 1000}
                                    </p>
                                </div>

                                <div style={{ marginTop: "14px" }}>
                                    <button
                                        onClick={() => handleBook(doc)}
                                        className="btn btn-primary btn-sm"
                                        style={{ width: "100%", padding: "8px" }}
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
