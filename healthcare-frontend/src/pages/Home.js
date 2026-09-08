import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Services from "../components/Services";
import Doctors from "../components/Doctors";
import Footer from "../components/Footer";
import { getCurrentUser } from "../services/auth";
import "./Home.css";

function Home() {
    const navigate = useNavigate();
    const user = getCurrentUser();

    const handleBookClick = () => {
        if (user) {
            navigate("/dashboard?tab=book");
        } else {
            navigate("/login");
        }
    };

    return (
        <div className="home-wrapper">
            <Navbar />

            <main className="container">
                {/* Hero Section */}
                <div className="hero-box card">
                    <div className="hero-text">
                        <h1>Online Doctor Appointment & Healthcare Management</h1>
                        <p>
                            Easily schedule appointments with qualified doctors, manage medical visits, 
                            and track your healthcare consultations online.
                        </p>

                        <div className="hero-buttons">
                            <button onClick={handleBookClick} className="btn btn-primary">
                                Book Appointment
                            </button>
                            {!user && (
                                <button onClick={() => navigate("/signup")} className="btn btn-outline">
                                    Register New Patient
                                </button>
                            )}
                            {user && (
                                <button onClick={() => navigate("/dashboard")} className="btn btn-secondary">
                                    Go to Dashboard →
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="hero-image-wrap">
                        <img src="/hospital.jpg" alt="Hospital Building" className="hero-img" />
                    </div>
                </div>

                {/* Departments */}
                <Services />

                {/* Doctors Section */}
                <Doctors />
            </main>

            <Footer />
        </div>
    );
}

export default Home;