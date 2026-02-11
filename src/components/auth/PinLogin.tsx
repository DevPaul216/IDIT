"use client";

import { useState, useEffect } from "react";
import { useUser, SimpleUser } from "@/context/UserContext";

export default function PinLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const { login } = useUser();

  // Auto-check when PIN is 4 digits
  useEffect(() => {
    if (pin.length === 4) {
      checkPin();
    }
  }, [pin]);

  const checkPin = async () => {
    setIsChecking(true);
    setError("");

    try {
      const response = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        login(data.user as SimpleUser);
      } else {
        setError("Ungültige PIN");
        setPin("");
      }
    } catch {
      setError("Verbindungsfehler");
      setPin("");
    } finally {
      setIsChecking(false);
    }
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 4 && !isChecking) {
      setPin((prev) => prev + digit);
      setError("");
    }
  };

  const handleBackspace = () => {
    if (!isChecking) {
      setPin((prev) => prev.slice(0, -1));
      setError("");
    }
  };

  const handleClear = () => {
    if (!isChecking) {
      setPin("");
      setError("");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Logo and Title */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🔥</div>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          IDIT
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Intex Digitales Lagerverwaltungstool
        </p>
      </div>

      {/* PIN Display */}
      <div className="flex gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-all"
            style={{
              backgroundColor:
                pin.length > i ? "var(--accent)" : "var(--bg-tertiary)",
              color: pin.length > i ? "white" : "var(--text-muted)",
              border: "2px solid var(--border-light)",
            }}
          >
            {pin.length > i ? "●" : ""}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 px-4 py-2 rounded-lg text-sm font-medium animate-shake"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
        >
          {error}
        </div>
      )}

      {/* Loading indicator */}
      {isChecking && (
        <div className="mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
          <div
            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
          />
          <span>Prüfe...</span>
        </div>
      )}

      {/* PIN Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map(
          (key) => (
            <button
              key={key}
              onClick={() => {
                if (key === "C") handleClear();
                else if (key === "⌫") handleBackspace();
                else handleDigit(key);
              }}
              disabled={isChecking}
              className="w-20 h-20 rounded-2xl text-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor:
                  key === "C"
                    ? "rgba(239, 68, 68, 0.1)"
                    : key === "⌫"
                    ? "var(--bg-tertiary)"
                    : "var(--bg-secondary)",
                color:
                  key === "C"
                    ? "#ef4444"
                    : "var(--text-primary)",
                border: "1px solid var(--border-light)",
              }}
            >
              {key}
            </button>
          )
        )}
      </div>

      {/* Hint */}
      <p className="mt-8 text-sm text-center" style={{ color: "var(--text-muted)" }}>
        Gib deine 4-stellige PIN ein
      </p>

      {/* Shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-8px);
          }
          75% {
            transform: translateX(8px);
          }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
