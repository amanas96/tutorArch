import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { socket } from "../socket";

const ICE_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function SessionPage() {
  const { sessionId } = useParams();
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState("");
  const [students, setStudents] = useState([]);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("Connecting...");

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnections = useRef(new Map());

  // 🧠 Create new PeerConnection
  const createPeer = (remoteId, isHostSide) => {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate, remoteId);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`PC[${remoteId}] → ${pc.connectionState}`);
    };

    // Student receives host stream
    if (!isHostSide) {
      pc.ontrack = (event) => {
        const videoEl = document.getElementById("student-video");
        if (videoEl) {
          videoEl.srcObject = event.streams[0];
          videoEl.muted = true; // start silent
          videoEl.play().catch(console.error);
          console.log("🔇 Student video loaded silently");
        }
        setStatus("Connected");
      };
    }

    return pc;
  };

  // 🧩 Host creates offer for each student
  const hostCreateOffer = async (student) => {
    const studentId = student.id;
    console.log("Host creating offer for:", studentId);

    const pc = createPeer(studentId, true);
    peerConnections.current.set(studentId, pc);

    // Add host media tracks
    localStreamRef.current
      .getTracks()
      .forEach((track) => pc.addTrack(track, localStreamRef.current));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", pc.localDescription, studentId);
    console.log("Host sent offer to:", studentId);
  };

  // 🧩 Student handles offer
  const studentHandleOffer = async (offer, hostId) => {
    console.log("Student received offer from:", hostId);

    const pc = createPeer(hostId, false);
    peerConnections.current.set(hostId, pc);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", pc.localDescription, hostId, socket.id);
    console.log("Student sent answer to host:", hostId);
  };

  // 🧩 Host handles answer
  const hostHandleAnswer = async (answer, studentId) => {
    const pc = peerConnections.current.get(studentId);
    if (!pc) return console.warn("PC not found for student", studentId);
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("Host set remote desc for:", studentId);
  };

  // 🧊 Handle ICE
  const handleIce = async (candidate, senderId) => {
    const pc = peerConnections.current.get(senderId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("Added ICE candidate from", senderId);
    }
  };

  // 🧹 End Session
  const endSession = () => {
    socket.emit("end-session", sessionId);
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    if (localStreamRef.current)
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    window.location.href = "/";
  };

  // ⚡ Socket setup
  useEffect(() => {
    socket.on("connect", () => console.log("Connected:", socket.id));

    socket.on("you-are-host", async () => {
      console.log("You are host");
      setIsHost(true);
      setStatus("Setting up camera...");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;
        setIsReady(true);
        setStatus("Camera ready — waiting for students");
        socket.emit("host-ready", sessionId);
      } catch (err) {
        alert("Camera access denied");
      }
    });

    socket.on("user-joined", (student) => hostCreateOffer(student));
    socket.on("student-list", setStudents);
    socket.on("student-count", setCount);
    socket.on("offer", studentHandleOffer);
    socket.on("answer", hostHandleAnswer);
    socket.on("ice-candidate", handleIce);

    socket.on("session-ended", () => {
      alert("Session ended by host");
      window.location.href = "/";
    });

    socket.on("student-left", (id) => {
      const pc = peerConnections.current.get(id);
      if (pc) pc.close();
      peerConnections.current.delete(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setCount((c) => c - 1);
    });

    return () => socket.removeAllListeners();
  }, []);

  // ✳️ Join room
  const joinRoom = () => {
    socket.emit("join-room", { roomId: sessionId, name });
    setJoined(true);
  };

  // --- Student pre-join screen ---
  if (!isHost && !joined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center w-80">
          <h2 className="text-2xl font-bold mb-4">Join Live Session</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="w-full p-3 mb-4 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={joinRoom}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold"
          >
            Join Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Live Session: {sessionId}</h1>

      {isHost && (
        <div className="flex justify-between w-full max-w-4xl mb-4">
          <div className="flex gap-2">
            <span className="bg-blue-800 px-3 py-1 rounded-full">Host</span>
            <span className="bg-green-700 px-3 py-1 rounded-full">
              Students: {count}
            </span>
          </div>
          <button
            onClick={endSession}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg font-semibold"
          >
            End Session
          </button>
        </div>
      )}

      {isHost && (
        <div className="w-full max-w-4xl bg-gray-800 p-3 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-2">Connected Students</h3>
          {students.length === 0 ? (
            <p className="text-gray-400">No students connected yet</p>
          ) : (
            <ul className="space-y-1">
              {students.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="text-gray-500 text-xs">
                    {s.id.slice(0, 6)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* VIDEO */}
      <div className="w-full max-w-4xl bg-black rounded-lg p-4">
        {isHost ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            controls
            className="w-full rounded-lg"
          />
        ) : (
          <video
            id="student-video"
            autoPlay
            playsInline
            controls
            className="w-full rounded-lg"
          />
        )}
      </div>

      <p className="mt-3 text-gray-300">{status}</p>
    </div>
  );
}

export default SessionPage;
