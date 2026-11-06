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

interface SessionState {
  pcs: Set<string>;
  phones: Set<string>;
}

// In-memory session tracking for active device counts
const sessions = new Map<string, SessionState>();

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

      // Register device in session map
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { pcs: new Set(), phones: new Set() });
      }
      const session = sessions.get(sessionId)!;

      if (role === "phone") {
        session.phones.add(socket.id);
        const count = session.phones.size;
        console.log(`[Socket] PHONE joined session: ${sessionId} (Active phones: ${count}, Socket: ${socket.id})`);

        // If PC is already in the room, notify this phone immediately
        if (session.pcs.size > 0) {
          socket.emit("pc-connected", { timestamp: Date.now() });
        }

        // Notify room / PC of the updated phone count
        io.to(sessionId).emit("phone-count", {
          count,
          sessionId,
          timestamp: Date.now(),
        });
        io.to(sessionId).emit("phone-connected", {
          count,
          socketId: socket.id,
          timestamp: Date.now(),
        });
      } else if (role === "pc") {
        session.pcs.add(socket.id);
        console.log(`[Socket] PC joined session: ${sessionId} (Active PCs: ${session.pcs.size}, Socket: ${socket.id})`);

        // If phone(s) are already in the room, inform this PC immediately with current count
        if (session.phones.size > 0) {
          socket.emit("phone-count", {
            count: session.phones.size,
            sessionId,
            timestamp: Date.now(),
          });
          socket.emit("phone-connected", {
            count: session.phones.size,
            timestamp: Date.now(),
          });
        }

        // Notify phone(s) that PC is present
        socket.to(sessionId).emit("pc-connected", {
          socketId: socket.id,
          timestamp: Date.now(),
        });
      }

      // Acknowledge the joining socket
      socket.emit("session-joined", {
        sessionId,
        role,
        success: true,
      });

      // General peer status broadcast
      socket.to(sessionId).emit("peer-status", {
        role,
        status: "connected",
        socketId: socket.id,
        timestamp: Date.now(),
      });
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

      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;

        if (role === "phone") {
          session.phones.delete(socket.id);
          const remainingPhones = session.phones.size;
          console.log(`[Socket] Phone left session ${sessionId}. Remaining phones: ${remainingPhones}`);

          // Broadcast updated count
          io.to(sessionId).emit("phone-count", {
            count: remainingPhones,
            sessionId,
            timestamp: Date.now(),
          });

          // Only broadcast phone-disconnected when count hits 0
          if (remainingPhones === 0) {
            io.to(sessionId).emit("phone-disconnected", { timestamp: Date.now() });
          }
        } else if (role === "pc") {
          session.pcs.delete(socket.id);
          const remainingPcs = session.pcs.size;
          console.log(`[Socket] PC left session ${sessionId}. Remaining PCs: ${remainingPcs}`);

          if (remainingPcs === 0) {
            io.to(sessionId).emit("pc-disconnected", { timestamp: Date.now() });
          }
        }

        // Clean up empty session memory when both devices are gone
        if (session.pcs.size === 0 && session.phones.size === 0) {
          sessions.delete(sessionId);
          console.log(`[Socket] Session room cleared from memory: ${sessionId}`);
        }

        socket.to(sessionId).emit("peer-status", {
          role,
          status: "disconnected",
          timestamp: Date.now(),
        });
      }
    });
  });

  return io;
}
