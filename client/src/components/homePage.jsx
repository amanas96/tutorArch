// import React from "react";
// import { useNavigate } from "react-router-dom";

// function HomePage() {
//   const navigate = useNavigate();

//   const handleStartSession = async () => {
//     try {
//       const response = await fetch(
//         "https://tutorarch.onrender.com/api/sessions/create",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//       if (!response.ok) throw new Error("Network response was not ok");
//       const data = await response.json();

//       // This MUST be a simple navigate call
//       navigate(`/session/${data.unique_id}`);
//     } catch (error) {
//       console.error("Failed to start session:", error);
//     }
//   };

//   // Return the styled JSX...
//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 bg-gray-800">
//       <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl max-w-md w-full text-center">
//         <h1 className="text-4xl md:text-5xl font-bold text-gray-800 pt-4 mb-8 text-center">
//           Live Session App
//         </h1>
//         <button
//           onClick={handleStartSession}
//           className="bg-blue-600 hover:bg-blue-700 text-white font-bold
//                            py-4 px-10 rounded-lg text-xl shadow-lg
//                            transform hover:scale-105 transition duration-300 ease-in-out"
//         >
//           START SESSION
//         </button>
//       </div>
//     </div>
//   );
// }
// export default HomePage;

import React from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  const handleStartSession = async () => {
    try {
      const response = await fetch(
        "https://tutorarch.onrender.com/api/sessions/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();

      navigate(`/session/${data.unique_id}`);
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  // Return the new styled JSX
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-800">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl max-w-md w-full text-center">
        {/* 3. The Content */}
        <h1 className="text-3xl md:text-4xl font-bold pt-4 text-gray-800 mb-4">
          Live Session App
        </h1>

        <p className="text-gray-600 mb-8">
          Click the button below to start a new live session.
        </p>

        <button
          onClick={handleStartSession}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold
                     py-3 px-6 rounded-lg text-lg shadow-lg
                     transform hover:scale-105 transition duration-300 ease-in-out"
        >
          START SESSION
        </button>
      </div>
    </div>
  );
}
export default HomePage;
