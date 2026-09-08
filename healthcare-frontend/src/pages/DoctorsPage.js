import React from "react";
import Navbar from "../components/Navbar";
import Doctors from "../components/Doctors";
import Footer from "../components/Footer";

function DoctorsPage() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />
            <main className="container" style={{ flex: 1, padding: "24px 20px" }}>
                <Doctors />
            </main>
            <Footer />
        </div>
    );
}

export default DoctorsPage;
