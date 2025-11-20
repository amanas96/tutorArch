import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [sessionLink, setSessionLink] = useState("");
  const [loading, setLoading] = useState(false);

  // Function: create new session
  const handleStartSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:5000/api/sessions/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) throw new Error("Failed to create session");

      const data = await response.json();
      setSessionLink(data.userurl);
      setModalOpen(true); // Show modal with link
      setLoading(false);
    } catch (error) {
      console.error("❌ Failed to start session:", error);
      setLoading(false);
      alert("Something went wrong! Please try again.");
    }
  };

  // Function: copy link
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionLink);
    alert("Session link copied to clipboard!");
  };

  // Function: open session
  const openSession = () => {
    setModalOpen(false);
    const id = sessionLink.split("/").pop();
    navigate(`/session/${id}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          🎥 Live Session App
        </h1>
        <p className="text-gray-400 mb-8">
          Start a new live session and share the link with your students.
        </p>

        <button
          onClick={handleStartSession}
          disabled={loading}
          className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-bold
                      py-3 px-6 rounded-lg text-lg shadow-lg transition transform
                      ${loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105"}`}
        >
          {loading ? "Starting..." : "START SESSION"}
        </button>
      </div>

      {/* ==== MODAL ==== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white rounded-2xl shadow-2xl p-8 w-96 text-center relative">
            {/* Close button */}
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-xl"
              onClick={() => setModalOpen(false)}
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-4">Session Created 🎉</h2>
            <p className="text-gray-300 mb-4">
              Share this link with your students to join the session:
            </p>

            {/* Link Box */}
            <div className="bg-gray-700 text-sm text-left p-3 rounded-lg mb-4 break-all border border-gray-600">
              {sessionLink}
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold transition"
              >
                Copy Link
              </button>
              <button
                onClick={openSession}
                className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold transition"
              >
                Open Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
