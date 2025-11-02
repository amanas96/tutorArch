import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./components/homePage";
import SessionPage from "./components/sessionPage";

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Route 1: The homepage */}
        <Route path="/" element={<HomePage />} />

        {/* Route 2: The session page, with a dynamic 'sessionId' */}
        <Route path="/session/:sessionId" element={<SessionPage />} />
      </Routes>
    </div>
  );
}

export default App;
