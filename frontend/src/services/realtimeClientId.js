const CLIENT_ID_STORAGE_KEY = "control_muelles_client_id";

function createClientId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function resolveClientId() {
  if (typeof window === "undefined") {
    return createClientId();
  }

  try {
    const storedClientId = window.sessionStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (storedClientId) {
      return storedClientId;
    }

    const clientId = createClientId();
    window.sessionStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
    return clientId;
  } catch {
    return createClientId();
  }
}

export const realtimeClientId = resolveClientId();
