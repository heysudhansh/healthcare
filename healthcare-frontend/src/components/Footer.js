import React from "react";

function Footer() {
    return (
        <footer style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0", padding: "20px 0", marginTop: "40px", textAlign: "center" }}>
            <div className="container">
                <p style={{ fontSize: "13px", color: "#64748b" }}>
                    © {new Date().getFullYear()} Healthcare Management System Project • Spring Boot & React
                </p>
            </div>
        </footer>
    );
}

export default Footer;