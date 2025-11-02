const mongoose = require("mongoose");

// Define the schema for the 'live_sessions' collection
const SessionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["admin", "student"], // Per the URL's specs
    },
    unique_id: {
      type: String,
      required: true,
      unique: true, // Ensure this ID is always unique
      index: true,
    },
    userurl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Create and export the model
// Mongoose will create a collection named 'live_sessions' (pluralizes 'live_session')
// To be exact, let's force the collection name
const LiveSession = mongoose.model("live_sessions", SessionSchema);

module.exports = LiveSession;
