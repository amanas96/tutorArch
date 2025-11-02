import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { socket } from "../socket";

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function SessionPage() {
  const { sessionId } = useParams();
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const createPeerConnection = (studentId) => {
    console.log("🟢 HOST: Creating peer connection for student:", studentId);

    if (peerConnectionRef.current) {
      console.log("Closing existing peer connection");
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Add local tracks to the connection
    console.log("🟢 HOST: Adding local tracks to peer connection");
    localStreamRef.current.getTracks().forEach((track) => {
      console.log("Adding track:", track.kind);
      pc.addTrack(track, localStreamRef.current);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🟢 HOST: Sending ICE candidate to student");
        socket.emit("ice-candidate", event.candidate, studentId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🟢 HOST: ICE connection state:", pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      console.log("🟢 HOST: Connection state:", pc.connectionState);
    };

    // Create and send offer
    pc.createOffer()
      .then((offer) => {
        return pc.setLocalDescription(offer);
      })
      .then(() => {
        console.log("🟢 HOST: Sending offer to student", studentId);
        socket.emit("offer", pc.localDescription, studentId);
      })
      .catch((e) => console.error("❌ Error creating offer:", e));
  };

  const handleOffer = (offer, hostSocketId) => {
    console.log("🔵 STUDENT: Received offer from host:", hostSocketId);

    if (peerConnectionRef.current) {
      console.log("Closing existing peer connection");
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // This is critical - student receives the host's tracks
    pc.ontrack = (event) => {
      console.log("🔵 STUDENT: Received remote track!", event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        console.log("🔵 STUDENT: Setting remote stream to video element");
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnectionStatus("connected");
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🔵 STUDENT: Sending ICE candidate to host");
        socket.emit("ice-candidate", event.candidate, hostSocketId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🔵 STUDENT: ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected") {
        setConnectionStatus("connected");
      } else if (pc.iceConnectionState === "failed") {
        setConnectionStatus("failed");
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("🔵 STUDENT: Connection state:", pc.connectionState);
    };

    // Set remote description and create answer
    pc.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => {
        console.log("🔵 STUDENT: Remote description set, creating answer");
        return pc.createAnswer();
      })
      .then((answer) => {
        return pc.setLocalDescription(answer);
      })
      .then(() => {
        console.log("🔵 STUDENT: Sending answer to host");
        socket.emit("answer", pc.localDescription, hostSocketId);
        setConnectionStatus("connecting");
      })
      .catch((e) => console.error("❌ STUDENT: Error handling offer:", e));
  };

  const handleAnswer = (answer) => {
    console.log("🟢 HOST: Received answer from student");
    const pc = peerConnectionRef.current;

    if (!pc) {
      console.error("❌ No peer connection exists");
      return;
    }

    console.log("Current signaling state:", pc.signalingState);

    if (pc.signalingState === "have-local-offer") {
      pc.setRemoteDescription(new RTCSessionDescription(answer))
        .then(() => {
          console.log("🟢 HOST: Remote description set successfully");
        })
        .catch((e) => console.error("❌ Error setting remote answer:", e));
    } else {
      console.log("⚠️ Ignoring answer, signaling state is:", pc.signalingState);
    }
  };

  const handleIceCandidate = (candidate) => {
    console.log("Received ICE candidate");
    const pc = peerConnectionRef.current;

    if (pc && pc.remoteDescription) {
      pc.addIceCandidate(new RTCIceCandidate(candidate))
        .then(() => console.log("✅ ICE candidate added"))
        .catch((e) => console.error("❌ Error adding ICE candidate:", e));
    } else {
      console.log("⚠️ Peer connection not ready for ICE candidates yet");
    }
  };

  useEffect(() => {
    console.log("🚀 SessionPage mounted for session:", sessionId);

    const handleYouAreHost = () => {
      console.log("🟢 Server confirmed: YOU ARE THE HOST");
      setIsHost(true);
      setConnectionStatus("host");

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          console.log("🟢 HOST: Got media stream");
          localStreamRef.current = stream;

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            console.log("🟢 HOST: Local video element updated");
          }

          // Register listeners for incoming connections
          socket.on("user-joined", createPeerConnection);
          socket.on("answer", handleAnswer);

          // Tell server we're ready
          console.log("🟢 HOST: Emitting host-ready");
          socket.emit("host-ready", sessionId);
          setIsReady(true);
        })
        .catch((err) => {
          console.error("❌ HOST: Permission denied.", err);
          alert("You must allow camera/mic access to be a host.");
          setConnectionStatus("error");
        });
    };

    // Set up all listeners
    socket.on("you-are-host", handleYouAreHost);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("offer", handleOffer);

    // Join the room
    console.log("📡 Emitting join-room for:", sessionId);
    socket.emit("join-room", sessionId);

    return () => {
      console.log("🧹 Cleaning up session page...");
      socket.off("you-are-host", handleYouAreHost);
      socket.off("user-joined", createPeerConnection);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("offer", handleOffer);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-900  md:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        <h2 className="text-2xl md:text-4xl font-bold text-center  mb-7 text-white">
          Live Session: <span className="text-blue-600">{sessionId}</span>
        </h2>

        {/* Status indicator - only show when not connected */}
        {connectionStatus !== "connected" && connectionStatus !== "host" && (
          <div className="text-center mb-6">
            {connectionStatus === "connecting" && (
              <p className="text-yellow-600 font-semibold">
                🔄 Connecting to stream...
              </p>
            )}
            {connectionStatus === "failed" && (
              <p className="text-red-600 font-semibold">
                ❌ Connection failed - Please refresh
              </p>
            )}
          </div>
        )}

        {/* Main video display - for both host and student */}
        <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden p-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={isHost ? localVideoRef : remoteVideoRef}
              autoPlay
              playsInline
              controls={!isHost}
              muted={isHost}
              className="w-full h-full object-contain"
            />
            {!isHost && connectionStatus === "connecting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                <p className="text-gray-300 text-xl">
                  ⏳ Waiting for the admin's stream...
                </p>
              </div>
            )}
            {isHost && !isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                <p className="text-yellow-400 text-xl">Setting up camera...</p>
              </div>
            )}
          </div>

          {/* Info badge */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isHost ? (
                <>
                  <span className="bg-blue-100 text-blue-800 px-1  rounded-full text-sm font-semibold">
                    Admin View
                  </span>
                  {isReady && (
                    <span className="bg-green-100 text-green-800 ml-5 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                      ● LIVE
                    </span>
                  )}
                </>
              ) : (
                <span className="bg-gray-100 text-gray-800 px-1 rounded-full text-sm font-semibold">
                  🎓 Student View
                </span>
              )}
            </div>
            {connectionStatus === "connected" && !isHost && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                ✅ Connected
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionPage;
