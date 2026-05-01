"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  X,
  RotateCcw,
  Check,
  Loader2,
  FlipHorizontal,
} from "lucide-react";

interface CameraCaptureProps {
  type: "peminjam" | "barang";
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({
  type,
  onCapture,
  onClose,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);
  const isInitializingRef = useRef(false);

  const [status, setStatus] = useState<
    "loading" | "ready" | "captured" | "error"
  >("loading");
  const [capturedUrl, setCapturedUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      // Stop all tracks
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    // Prevent multiple initialization attempts
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    try {
      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }

      if (!isMountedRef.current) return;

      if (isMountedRef.current) setStatus("loading");

      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (isMountedRef.current) {
            videoRef.current?.play().catch(() => {
              // Auto-play may be blocked, that's ok
            });
            if (isMountedRef.current) setStatus("ready");
          }
        };
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;

      if (isMountedRef.current) {
        setStatus("error");
        setErrorMsg(
          err?.name === "NotAllowedError"
            ? "Akses kamera ditolak. Izinkan akses kamera di browser."
            : err?.name === "NotFoundError"
              ? "Kamera tidak ditemukan di perangkat ini."
              : "Gagal memulai kamera. Coba lagi atau gunakan upload manual.",
        );
      }
    } finally {
      isInitializingRef.current = false;
    }
  }, [facingMode]);

  useEffect(() => {
    isMountedRef.current = true;
    startCamera();

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [facingMode]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror for front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);
    const url = canvas.toDataURL("image/jpeg", 0.9);

    setCapturedUrl(url);
    if (isMountedRef.current) setStatus("captured");
    stopCamera();
  }, [facingMode, stopCamera]);

  const retake = useCallback(() => {
    setCapturedUrl("");
    if (isMountedRef.current) setStatus("loading");
    startCamera();
  }, [facingMode]);

  const confirmCapture = useCallback(() => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `${type}-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stopCamera();
        onCapture(file);
      },
      "image/jpeg",
      0.9,
    );
  }, [type, stopCamera, onCapture]);

  const flipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const label = type === "peminjam" ? "Peminjam" : "Barang";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(2, 8, 23, 0.97)" }}
    >
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Camera className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold text-sm sm:text-base truncate">
                Ambil Foto {label}
              </h2>
              <p className="text-white/40 text-xs">
                Posisikan objek di tengah frame
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera view */}
        <div
          className="relative bg-black flex-1 min-h-0"
          style={{ aspectRatio: "4/3" }}
        >
          {status !== "captured" && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />
          )}

          {status === "captured" && capturedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedUrl}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}

          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              <p className="text-white/50 text-sm">Memulai kamera...</p>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 sm:p-6">
              <p className="text-red-400 text-sm text-center">{errorMsg}</p>
            </div>
          )}

          {status === "ready" && (
            <>
              {/* Viewfinder */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                  <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-blue-400" />
                  <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 border-blue-400" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-l-2 border-blue-400" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 border-blue-400" />
                </div>
              </div>
              {/* Flip button */}
              <button
                type="button"
                onClick={flipCamera}
                className="absolute top-2 sm:top-3 right-2 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 flex-shrink-0">
          {status === "ready" && (
            <button
              onClick={capturePhoto}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-blue-50 transition-colors"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </button>
          )}

          {status === "captured" && (
            <>
              <button
                onClick={retake}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs sm:text-sm font-medium px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Ulangi
              </button>
              <button
                onClick={confirmCapture}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                <Check className="w-4 h-4" />
                Gunakan Foto
              </button>
            </>
          )}

          {status === "error" && (
            <button
              onClick={startCamera}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
