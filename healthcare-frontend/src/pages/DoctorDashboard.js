import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function DoctorDashboard() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/dashboard", { replace: true });
    }, [navigate]);

    return (
        <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Redirecting to Doctor Portal...</p>
        </div>
    );
}

export default DoctorDashboard;