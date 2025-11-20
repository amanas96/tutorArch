const { v4: uuidv4 } = require("uuid");
const LiveSession = require("../models/session");

const createSession = async (req, res) => {
  try {
    const type = "admin";
    const unique_id = uuidv4();

    const userurl = `http://localhost:5173/session/${unique_id}`;

    // Create a new session document
    const newSession = new LiveSession({
      type: type,
      unique_id: unique_id,
      userurl: userurl,
    });

    // Save to the database
    await newSession.save();

    console.log("New session created:", newSession);

    // Send the new session details back to the frontend
    res.status(201).json({
      message: "Session created successfully!",
      unique_id: unique_id,
      userurl: userurl,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: "Failed to create session" });
  }
};

module.exports = {
  createSession,
};
