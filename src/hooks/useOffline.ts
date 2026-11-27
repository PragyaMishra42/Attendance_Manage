"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

export function useOffline() {
  const browserOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot
  );
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);

  const isOnline = browserOnline && !simulatedOffline;

  const toggleSimulatedOffline = useCallback(() => {
    setSimulatedOffline((prev) => !prev);
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    browserOnline,
    simulatedOffline,
    toggleSimulatedOffline,
  };
}
