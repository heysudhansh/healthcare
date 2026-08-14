import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { setCurrentUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!email || !password) {
            setErrorMsg("Please enter both email and password.");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post("/users/login", {
                email: email.trim(),
                password: password.trim()
            });

            const user = response.data;
            setCurrentUser(user);
            navigate("/dashboard");
        } catch (error) {
            setErrorMsg(
                error.response?.data?.message || 
                "Login failed. Please check email and password or ensure backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />

            <main className="container" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
                <div className="card" style={{ maxWidth: "400px", width: "100%" }}>
                    <h2 style={{ fontSize: "20px", marginBottom: "6px", color: "#0f172a" }}>Sign In</h2>
                    <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
                        Enter your email and password to access your healthcare account.
                    </p>

                    {errorMsg && (
                        <div className="alert alert-danger">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "10px", marginTop: "4px" }} disabled={loading}>
                            {loading ? "Signing in..." : "Login"}
                        </button>
                    </form>

                    <div style={{ textAlign: "center", marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #e2e8f0", fontSize: "13px" }}>
                        Don't have an account? <Link to="/signup">Register here</Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Login;