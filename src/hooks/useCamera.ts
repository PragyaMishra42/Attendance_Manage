"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraError, cameraService } from "@/services/camera.service";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<CameraError | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopCamera = useCallback(() => {
    cameraService.stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(
    async (mode: "environment" | "user" = facingMode) => {
      setError(null);
      stopCamera();
      try {
        const stream = await cameraService.startStream(mode);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsStreaming(true);
      } catch (err) {
        setError(err as CameraError);
        setIsStreaming(false);
      }
    },
    [facingMode, stopCamera]
  );

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return null;
    const dataUrl = cameraService.captureFrame(videoRef.current);
    if (dataUrl) {
      setCapturedImage(dataUrl);
      stopCamera();
    }
    return dataUrl;
  }, [stopCamera]);

  const retakePhoto = useCallback(async () => {
    setCapturedImage(null);
    await startCamera(facingMode);
  }, [facingMode, startCamera]);

  const switchCamera = useCallback(async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    if (isStreaming) {
      await startCamera(next);
    }
  }, [facingMode, isStreaming, startCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isStreaming,
    capturedImage,
    setCapturedImage,
    error,
    facingMode,
    startCamera,
    stopCamera,
    capturePhoto,
    retakePhoto,
    switchCamera,
  };
}
