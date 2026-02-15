"use client";

import { useState, useEffect } from "react";

interface QuickNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  color?: string;
  max?: number;
}

export default function QuickNumberInput({
  value,
  onChange,
  label,
  color,
  max = 999,
}: QuickNumberInputProps) {
  const [showNumpad, setShowNumpad] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  // Sync inputValue when external value changes
  useEffect(() => {
    if (!showNumpad) {
      setInputValue(value === 0 ? "" : value.toString());
    }
  }, [value, showNumpad]);

  const handleNumpadOpen = () => {
    setInputValue(value === 0 ? "" : value.toString());
    setShowNumpad(true);
  };

  const handleNumpadKey = (key: string) => {
    if (key === "backspace") {
      setInputValue((prev) => prev.slice(0, -1));
    } else if (key === "clear") {
      setInputValue("");
    } else {
      const newValue = inputValue + key;
      if (parseInt(newValue) <= max) {
        setInputValue(newValue);
      }
    }
  };

  const handleConfirm = () => {
    const newValue = parseInt(inputValue) || 0;
    onChange(Math.min(Math.max(newValue, 0), max));
    setShowNumpad(false);
  };

  const handleDiscard = () => {
    setInputValue(value === 0 ? "" : value.toString());
    setShowNumpad(false);
  };

  return (
    <>
      {/* Product Card - Clickable */}
      <button
        onClick={handleNumpadOpen}
        className="rounded-xl p-3 flex flex-col items-center gap-2 touch-manipulation transition-all active:scale-95 w-full"
        style={{
          backgroundColor: value > 0 ? (color || "var(--accent)") : "var(--bg-secondary)",
          border: value > 0 ? `2px solid ${color || "var(--accent)"}` : "2px solid var(--border-light)",
        }}
      >
        {/* Color indicator */}
        {color && value === 0 && (
          <span
            className="w-3 h-3 rounded-full absolute top-2 left-2"
            style={{ backgroundColor: color }}
          />
        )}
        
        {/* Product name */}
        <span
          className="text-sm font-semibold text-center leading-tight"
          style={{ 
            color: value > 0 ? "white" : "var(--text-primary)",
          }}
        >
          {label}
        </span>

        {/* Quantity display - only show when > 0 */}
        {value > 0 && (
          <span
            className="text-2xl font-bold"
            style={{ color: "white" }}
          >
            {value}
          </span>
        )}
      </button>

      {/* Numpad Modal */}
      {showNumpad && (
        <>
          {/* Backdrop - does nothing, user must confirm or discard */}
          <div
            className="fixed inset-0 bg-black/60 z-[60] animate-fadeIn"
          />

          {/* Numpad */}
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[320px] rounded-2xl p-4 animate-scaleIn"
            style={{ backgroundColor: "var(--bg-primary)" }}
          >
            {/* Header */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {color && (
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                  {label}
                </span>
              </div>
              
              {/* Display */}
              <div
                className="text-5xl font-bold py-4 rounded-xl"
                style={{ 
                  backgroundColor: "var(--bg-secondary)",
                  color: inputValue ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {inputValue || "0"}
              </div>
            </div>

            {/* Numpad grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumpadKey(num)}
                  className="h-14 rounded-xl text-2xl font-bold transition-all active:scale-95"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                  }}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleNumpadKey("clear")}
                className="h-14 rounded-xl text-lg font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "#ef4444",
                }}
              >
                C
              </button>
              <button
                onClick={() => handleNumpadKey("0")}
                className="h-14 rounded-xl text-2xl font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                }}
              >
                0
              </button>
              <button
                onClick={() => handleNumpadKey("backspace")}
                className="h-14 rounded-xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                }}
              >
                ⌫
              </button>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDiscard}
                className="h-14 rounded-xl text-lg font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                }}
              >
                Verwerfen
              </button>
              <button
                onClick={handleConfirm}
                className="h-14 rounded-xl text-lg font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: color || "var(--accent)",
                  color: "white",
                }}
              >
                ✓ OK
              </button>
            </div>
          </div>

          {/* Animations */}
          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
              to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            .animate-fadeIn {
              animation: fadeIn 0.15s ease-out;
            }
            .animate-scaleIn {
              animation: scaleIn 0.2s ease-out;
            }
          `}</style>
        </>
      )}
    </>
  );
}
