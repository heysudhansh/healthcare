import React from "react";

const departments = [
    { title: "General Medicine", desc: "Routine health examinations, diagnosis, and preventative care." },
    { title: "Cardiology", desc: "Heart checkups, ECG testing, and blood pressure management." },
    { title: "Pediatrics", desc: "Comprehensive healthcare and vaccinations for children." },
    { title: "Orthopedics", desc: "Bone, joint, fracture care, and arthritis treatment." },
    { title: "Neurology", desc: "Specialized diagnosis for nervous system and brain conditions." },
    { title: "Dermatology", desc: "Clinical skin care, allergy treatment, and dermatology consultations." }
];

function Services() {
    return (
        <section id="services" style={{ margin: "40px 0" }}>
            <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "22px", color: "#1e293b" }}>Clinical Departments</h2>
                <p style={{ color: "#64748b", fontSize: "14px" }}>Available hospital specialties and consultation units.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {departments.map((dept, idx) => (
                    <div key={idx} className="card" style={{ padding: "16px" }}>
                        <h3 style={{ fontSize: "16px", marginBottom: "6px", color: "#0284c7" }}>🩺 {dept.title}</h3>
                        <p style={{ fontSize: "13px", color: "#64748b" }}>{dept.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Services;
