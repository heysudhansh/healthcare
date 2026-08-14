import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth";

function Navbar() {
    const navigate = useNavigate();
    const user = getCurrentUser();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header style={styles.header}>
            <div className="container" style={styles.navContainer}>
                <Link to="/" style={styles.brand}>
                    🏥 <strong>Healthcare Portal</strong>
                </Link>

                <nav style={styles.navLinks}>
                    <Link to="/" style={styles.link}>Home</Link>
                    <a href="#doctors" style={styles.link}>Doctors</a>
                    <a href="#services" style={styles.link}>Departments</a>
                    {user && (
                        <Link to="/dashboard" style={{ ...styles.link, fontWeight: "bold", color: "#0284c7" }}>
                            Dashboard
                        </Link>
                    )}
                </nav>

                <div>
                    {user ? (
                        <div style={styles.userInfo}>
                            <span>👤 {user.name || user.email} <span className="badge badge-role">{user.role}</span></span>
                            <button onClick={handleLogout} className="btn btn-outline btn-sm" style={{ marginLeft: "10px" }}>
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", gap: "8px" }}>
                            <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
                            <Link to="/signup" className="btn btn-primary btn-sm">Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

const styles = {
    header: {
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "10px 0",
        position: "sticky",
        top: 0,
        zIndex: 100
    },
    navContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
    },
    brand: {
        fontSize: "18px",
        color: "#0f172a",
        textDecoration: "none"
    },
    navLinks: {
        display: "flex",
        gap: "20px"
    },
    link: {
        color: "#475569",
        fontSize: "14px",
        textDecoration: "none"
    },
    userInfo: {
        fontSize: "13px",
        display: "flex",
        alignItems: "center"
    }
};

export default Navbar;