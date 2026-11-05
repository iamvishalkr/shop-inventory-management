"use client";

import React, { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Html5Qrcode } from "html5-qrcode";
import {
  ScanBarcode,
  Camera,
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Smartphone,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface RecentScan {
  code: string;
  format?: string;
  timestamp: Date;
}

function getSocketUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (typeof window !== "undefined") {
    // If accessing from a phone via LAN IP/hostname, don't attempt to connect to phone's own localhost:4000
    if (!envUrl || envUrl.includes("localhost")) {
      const hostname = window.location.hostname;
      if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        return `http://${hostname}:4000`;
      }
    }
  }
  return envUrl || "http://localhost:4000";
}

// Synthesize pleasant chime using Web Audio API (no audio file required)
function playScanBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 chime
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (err) {
    console.warn("Audio feedback error:", err);
  }
}

function ScannerContent() {
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("id") || searchParams.get("s") || "";

  const [sessionId, setSessionId] = useState(urlSessionId);
  const [inputSessionId, setInputSessionId] = useState(urlSessionId);
  const [socketStatus, setSocketStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [peerConnected, setPeerConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  // Sync URL query if changed
  useEffect(() => {
    if (urlSessionId) {
      setSessionId(urlSessionId);
      setInputSessionId(urlSessionId);
    }
  }, [urlSessionId]);

  // Connect to Socket.io
  useEffect(() => {
    if (!sessionId) {
      setSocketStatus("disconnected");
      return;
    }

    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus("connected");
      socket.emit("join-session", { sessionId, role: "phone" });
    });

    socket.on("session-joined", () => {
      // Room confirmed
    });

    socket.on("peer-status", (data: { role: string; status: string }) => {
      if (data.role === "pc") {
        setPeerConnected(data.status === "connected");
      }
    });

    socket.on("pc-connected", () => {
      setPeerConnected(true);
    });

    socket.on("pc-disconnected", () => {
      setPeerConnected(false);
    });

    socket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
      setSocketStatus("disconnected");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  // Dispatch barcode to socket
  const handleBarcodeDecoded = useCallback(
    (code: string, format = "UNKNOWN") => {
      const now = Date.now();
      // Debounce: ignore if same code was scanned within 1.5 seconds
      if (
        lastScannedCodeRef.current === code &&
        now - lastScannedTimeRef.current < 1500
      ) {
        return;
      }

      lastScannedCodeRef.current = code;
      lastScannedTimeRef.current = now;

      // Audio feedback
      if (soundEnabled) {
        playScanBeep();
      }

      // Add to local history list
      setRecentScans((prev) => [
        { code, format, timestamp: new Date() },
        ...prev.slice(0, 9),
      ]);

      // Emit over socket
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("barcode-scanned", {
          sessionId,
          code,
          format,
        });
      }
    },
    [sessionId, soundEnabled]
  );

  // Initialize and control camera scanner
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("scanner-reader");
      }

      const qrCode = html5QrCodeRef.current;
      if (qrCode.isScanning) {
        await qrCode.stop();
      }

      await qrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText, decodedResult) => {
          handleBarcodeDecoded(
            decodedText,
            decodedResult?.result?.format?.formatName || "BARCODE"
          );
        },
        () => {
          // Frame decode skip/empty - normal in continuous scanning
        }
      );

      setIsScanning(true);
    } catch (err: unknown) {
      console.error("Camera startup error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        setCameraError(
          "Camera access requires a Secure Context (HTTPS) on mobile devices. If testing locally, use an HTTPS tunnel (ngrok)."
        );
      } else {
        setCameraError(`Camera error: ${msg}`);
      }
      setIsScanning(false);
    }
  }, [handleBarcodeDecoded]);

  const stopCamera = useCallback(async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      setIsScanning(false);
    } catch (err) {
      console.error("Camera stop error:", err);
    }
  }, []);

  // Auto-start camera when session is ready
  useEffect(() => {
    if (sessionId) {
      startCamera();
    }
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [sessionId, startCamera]);

  // Handle manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDecoded(manualCode.trim(), "MANUAL");
    setManualCode("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 max-w-md mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ScanBarcode className="w-6 h-6 text-primary" />
          <h1 className="font-semibold text-lg">Companion Scanner</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute audio" : "Enable audio"}
            className="text-slate-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-400" />}
          </Button>
        </div>
      </header>

      {/* Session / Connection Info */}
      <div className="py-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              socketStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span className="text-slate-400">
            {socketStatus === "connected" ? "Server Online" : "Connecting..."}
          </span>
        </div>

        <Badge
          variant={peerConnected ? "default" : "outline"}
          className={`flex items-center gap-1.5 ${
            peerConnected
              ? "bg-emerald-600/90 text-white hover:bg-emerald-600"
              : "border-slate-700 text-slate-400"
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>{peerConnected ? "PC Linked" : "Waiting for PC"}</span>
        </Badge>
      </div>

      {/* If no session ID in query, allow manual entry */}
      {!sessionId && (
        <Card className="my-3 bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">Session ID Required</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Scan the QR on your PC screen or enter the session code below:
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSessionId(inputSessionId.trim());
              }}
              className="flex gap-2"
            >
              <Input
                value={inputSessionId}
                onChange={(e) => setInputSessionId(e.target.value)}
                placeholder="e.g. 8f4a-bc12"
                className="bg-slate-950 border-slate-700 text-sm"
              />
              <Button type="submit" size="sm">
                Pair
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Camera Viewfinder */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 my-2 shadow-lg aspect-square flex flex-col justify-center items-center">
        <div id="scanner-reader" className="w-full h-full" />

        {/* Overlay instructions when scanning */}
        {isScanning && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-4">
            <div className="bg-black/60 backdrop-blur-xs text-xs text-slate-300 px-3 py-1 rounded-full border border-white/10 mt-2">
              Align barcode inside frame
            </div>
            <div className="w-64 h-64 border-2 border-emerald-400/80 rounded-2xl pointer-events-none animate-pulse relative">
              <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
              <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
            </div>
            <div className="text-[11px] text-slate-400 mb-2">Auto-scans continuously</div>
          </div>
        )}

        {/* Camera error message */}
        {cameraError && (
          <div className="p-4 text-center z-10">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-xs text-rose-300 mb-3">{cameraError}</p>
            <Button size="sm" variant="outline" onClick={startCamera}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry Camera
            </Button>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="flex items-center justify-center gap-3 my-2">
        {isScanning ? (
          <Button
            variant="outline"
            size="sm"
            onClick={stopCamera}
            className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
          >
            <Pause className="w-4 h-4 mr-1.5" /> Pause Scanner
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={startCamera}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Play className="w-4 h-4 mr-1.5" /> Resume Scanner
          </Button>
        )}
      </div>

      {/* Manual Input Fallback */}
      <div className="my-3">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Type barcode manually..."
            className="bg-slate-900 border-slate-800 text-sm"
          />
          <Button type="submit" size="sm" variant="secondary">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Recent Scans List */}
      <div className="mt-auto pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Scanned Items ({recentScans.length})</span>
          {recentScans.length > 0 && (
            <button
              onClick={() => setRecentScans([])}
              className="text-[11px] text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        {recentScans.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-4">No barcodes scanned yet</p>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {recentScans.map((scan, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-slate-100">{scan.code}</span>
                  <span className="text-[10px] text-slate-500">{scan.format}</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {scan.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MobileScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Loading scanner...
        </div>
      }
    >
      <ScannerContent />
    </Suspense>
  );
}

