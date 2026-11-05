import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

export type ClientRole = "pc" | "phone";

export interface JoinSessionPayload {
  sessionId: string;
  role: ClientRole;
}

export interface BarcodeScannedPayload {
  sessionId: string;
  code: string;
  format?: string;
}

export interface ScanFeedbackPayload {
  sessionId: string;
  success: boolean;
  message?: string;
  code?: string;
}

export function setupSocket(server: HttpServer, clientUrl: string): Server {
  const io = new Server(server, {
    cors: {
      // In development allow any origin (for mobile testing over LAN/tunnels), in production enforce clientUrl
      origin: process.env.NODE_ENV === "production" ? clientUrl : "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join a pairing session room
    socket.on("join-session", ({ sessionId, role }: JoinSessionPayload) => {
      if (!sessionId || !role) {
        socket.emit("error", { message: "sessionId and role ('pc' | 'phone') are required" });
        return;
      }

      socket.data.sessionId = sessionId;
      socket.data.role = role;

      socket.join(sessionId);
      console.log(`[Socket] ${role.toUpperCase()} joined session: ${sessionId} (Socket: ${socket.id})`);

      // Acknowledge the joining socket
      socket.emit("session-joined", {
        sessionId,
        role,
        success: true,
      });

      // Notify other clients in the same session room
      socket.to(sessionId).emit("peer-status", {
        role,
        status: "connected",
        socketId: socket.id,
        timestamp: Date.now(),
      });

      // Role-specific convenience events
      if (role === "phone") {
        socket.to(sessionId).emit("phone-connected", { socketId: socket.id, timestamp: Date.now() });
      } else if (role === "pc") {
        socket.to(sessionId).emit("pc-connected", { socketId: socket.id, timestamp: Date.now() });
      }
    });

    // Handle barcode scanned from phone
    socket.on("barcode-scanned", ({ sessionId, code, format }: BarcodeScannedPayload) => {
      const activeSession = sessionId || socket.data.sessionId;
      if (!activeSession || !code) {
        socket.emit("error", { message: "sessionId and code are required for barcode transmission" });
        return;
      }

      console.log(`[Socket] Barcode scanned in session ${activeSession}: ${code} (${format ?? "UNKNOWN"})`);

      // Relay barcode to the PC in the room
      socket.to(activeSession).emit("barcode-received", {
        code,
        format: format || "UNKNOWN",
        timestamp: Date.now(),
      });

      // Send immediate receipt ack back to phone (can trigger beep/vibrate)
      socket.emit("scan-ack", {
        success: true,
        code,
        timestamp: Date.now(),
      });
    });

    // Optional: PC can send feedback back to the phone (e.g., product found / added successfully)
    socket.on("scan-feedback", (payload: ScanFeedbackPayload) => {
      const activeSession = payload.sessionId || socket.data.sessionId;
      if (activeSession) {
        socket.to(activeSession).emit("scan-feedback", payload);
      }
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      const { sessionId, role } = socket.data as { sessionId?: string; role?: ClientRole };
      console.log(`[Socket] Client disconnected: ${socket.id} (${role ?? "unknown"}), Reason: ${reason}`);

      if (sessionId && role) {
        socket.to(sessionId).emit("peer-status", {
          role,
          status: "disconnected",
          timestamp: Date.now(),
        });

        if (role === "phone") {
          socket.to(sessionId).emit("phone-disconnected", { timestamp: Date.now() });
        } else if (role === "pc") {
          socket.to(sessionId).emit("pc-disconnected", { timestamp: Date.now() });
        }
      }
    });
  });

  return io;
}

