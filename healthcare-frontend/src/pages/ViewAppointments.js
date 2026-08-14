import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ViewAppointments() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/dashboard?tab=appointments", { replace: true });
    }, [navigate]);

    return (
        <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Redirecting to appointments...</p>
        </div>
    );
}

export default ViewAppointments;