import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Vote from "./pages/Vote";
import Receipt from "./pages/Receipt";
import Admin from "./pages/Admin";
import SessionStatus from "./pages/SessionStatus";
import ChainCheck from "./pages/ChainCheck";
import StartElection from "./pages/StartElection";

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route
                        path="/verify"
                        element={<Navigate to="/vote" replace />}
                    />
                    <Route path="/start-election" element={<StartElection />} />
                    <Route path="/vote" element={<Vote />} />
                    <Route path="/receipt" element={<Receipt />} />
                    <Route path="/status" element={<SessionStatus />} />
                    <Route path="/chain-check" element={<ChainCheck />} />
                    <Route path="/admin" element={<Admin />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
