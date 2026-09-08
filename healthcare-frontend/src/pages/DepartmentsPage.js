import React from "react";
import Navbar from "../components/Navbar";
import Services from "../components/Services";
import Footer from "../components/Footer";

function DepartmentsPage() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />
            <main className="container" style={{ flex: 1, padding: "24px 20px" }}>
                <Services />
            </main>
            <Footer />
        </div>
    );
}

export default DepartmentsPage;
