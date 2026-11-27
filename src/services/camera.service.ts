export type CameraErrorCode =
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "NOT_SUPPORTED"
  | "UNKNOWN";

export interface CameraError {
  code: CameraErrorCode;
  message: string;
}

export class CameraService {
  isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }

  async startStream(facingMode: "environment" | "user" = "environment"): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw {
        code: "NOT_SUPPORTED",
        message: "Camera access is not supported in this browser or context (HTTPS required).",
      } satisfies CameraError;
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err) {
      const error = err as DOMException;
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        throw {
          code: "PERMISSION_DENIED",
          message: "Camera permission was denied. Please allow camera access in browser settings.",
        } satisfies CameraError;
      }
      if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
        throw {
          code: "NOT_FOUND",
          message: "No camera device was found on this device.",
        } satisfies CameraError;
      }
      throw {
        code: "UNKNOWN",
        message: error?.message || "Unable to access the device camera.",
      } satisfies CameraError;
    }
  }

  stopStream(stream: MediaStream | null) {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  }

  captureFrame(videoElement: HTMLVideoElement): string | null {
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  }
}

export const cameraService = new CameraService();
