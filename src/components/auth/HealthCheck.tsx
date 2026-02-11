"use client";

import { useEffect, useState } from "react";

interface HealthStatus {
  status: "checking" | "ok" | "error";
  message: string;
  userCount?: number;
}

export default function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus>({
    status: "checking",
    message: "Verbindung wird überprüft...",
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("/api/health");
        const data = await response.json();

        if (response.ok && data.status === "ok") {
          setHealth({
            status: "ok",
            message: `✓ Datenbankverbindung OK (${data.userCount} Benutzer gefunden)`,
            userCount: data.userCount,
          });
        } else {
          setHealth({
            status: "error",
            message: `✗ Datenbankfehler: ${data.error || "Verbindung fehlgeschlagen"}`,
          });
        }
      } catch (error) {
        console.error("Health check error:", error);
        setHealth({
          status: "error",
          message: `✗ API-Fehler: ${error instanceof Error ? error.message : "Netzwerkfehler"}`,
        });
      }
    };

    checkHealth();
  }, []);

  return (
    <div
      className="p-4 rounded-lg mb-4 text-sm"
      style={{
        backgroundColor:
          health.status === "error"
            ? "rgba(239, 68, 68, 0.1)"
            : health.status === "ok"
            ? "rgba(34, 197, 94, 0.1)"
            : "rgba(59, 130, 246, 0.1)",
        color:
          health.status === "error"
            ? "#ef4444"
            : health.status === "ok"
            ? "#22c55e"
            : "#3b82f6",
        border: `1px solid ${
          health.status === "error"
            ? "#ef4444"
            : health.status === "ok"
            ? "#22c55e"
            : "#3b82f6"
        }`,
      }}
    >
      {health.message}
    </div>
  );
}
