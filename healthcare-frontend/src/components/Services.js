import React from "react";
import { useNavigate } from "react-router-dom";

const majorDepartments = [
    {
        id: "cardiology",
        title: "Cardiology & Heart Care",
        deptKey: "Cardiology",
        desc: "Specialized diagnosis and treatment for cardiac health, blood pressure, and chest conditions."
    },
    {
        id: "gynaecology",
        title: "Obstetrics & Gynaecology",
        deptKey: "Obstetrics & Gynaecology",
        desc: "Clinical care for women's reproductive health, maternity consultations, and pregnancy care."
    },
    {
        id: "orthopaedics",
        title: "Orthopaedics & Joint Care",
        deptKey: "Orthopaedics",
        desc: "Diagnosis and care for bone fractures, arthritis, joint pain, and musculoskeletal health."
    },
    {
        id: "medicine",
        title: "Internal Medicine",
        deptKey: "Internal Medicine",
        desc: "Diagnosis and treatment for general fever, diabetes, infections, and routine illnesses."
    },
    {
        id: "ent",
        title: "ENT (Ear, Nose & Throat)",
        deptKey: "ENT",
        desc: "Care for ear conditions, sinus issues, throat infections, and hearing consultations."
    },
    {
        id: "nephrology",
        title: "Nephrology & Kidney Care",
        deptKey: "Nephrology",
        desc: "Medical management for kidney health, renal checkups, and urinary conditions."
    }
];

function Services() {
    const navigate = useNavigate();

    const handleDepartmentClick = (deptKey) => {
        navigate(`/doctors?dept=${encodeURIComponent(deptKey)}`);
    };

    return (
        <section id="services" style={{ margin: "30px 0" }}>
            <div style={{ marginBottom: "18px" }}>
                <h2 style={{ fontSize: "20px", color: "#0f172a", fontWeight: 700 }}>Hospital Departments</h2>
                <p style={{ color: "#64748b", fontSize: "14px", marginTop: "2px" }}>
                    Select a department to view available doctors.
                </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                {majorDepartments.map((dept) => (
                    <div
                        key={dept.id}
                        className="card"
                        style={{
                            padding: "18px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            border: "1px solid #e2e8f0"
                        }}
                        onClick={() => handleDepartmentClick(dept.deptKey)}
                    >
                        <div>
                            <h3 style={{ fontSize: "16px", color: "#0284c7", margin: "0 0 8px 0", fontWeight: 600 }}>{dept.title}</h3>
                            <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: "1.5" }}>
                                {dept.desc}
                            </p>
                        </div>

                        <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                            <span style={{ color: "#0284c7", fontWeight: "600", fontSize: "13px" }}>View Doctors →</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Services;
