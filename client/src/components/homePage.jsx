import React from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  const handleStartSession = async () => {
    try {
      const response = await fetch("https://tutorarch.onrender.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();

      // This MUST be a simple navigate call
      navigate(`/session/${data.unique_id}`);
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  // Return the styled JSX...
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8 text-center">
        Live Session App
      </h1>
      <button
        onClick={handleStartSession}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold 
                           py-4 px-10 rounded-lg text-xl shadow-lg 
                           transform hover:scale-105 transition duration-300 ease-in-out"
      >
        START SESSION
      </button>
    </div>
  );
}
export default HomePage;
