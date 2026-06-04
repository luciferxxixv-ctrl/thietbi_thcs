import { io } from "socket.io-client";
import { API_BASE } from "../components/shared/constants";

let socket;

export const initiateSocketConnection = (userId, role) => {
  if (!socket) {
    socket = io(API_BASE, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Connected to socket server");
      socket.emit("register", { userId, role });
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
