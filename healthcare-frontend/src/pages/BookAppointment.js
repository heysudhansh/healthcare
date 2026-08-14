import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function BookAppointment() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/dashboard?tab=book", { replace: true });
    }, [navigate]);

    return (
        <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Redirecting to appointment booking...</p>
        </div>
    );
}

export default BookAppointment;
