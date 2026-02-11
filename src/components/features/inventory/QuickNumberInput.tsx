"use client";

import { useState } from "react";

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
  max = 99,
}: QuickNumberInputProps) {
  const [isEditing, setIsEditing] = useState(false);

  const increment = (amount: number) => {
    const newValue = Math.min(value + amount, max);
    onChange(newValue);
  };

  const decrement = (amount: number) => {
    const newValue = Math.max(value - amount, 0);
    onChange(newValue);
  };

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    onChange(Math.min(Math.max(newValue, 0), max));
  };

  return (
    <div
      className="rounded-xl p-3 flex flex-col items-center gap-2 touch-manipulation"
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: value > 0 ? `2px solid ${color || "var(--accent)"}` : "2px solid var(--border-light)",
      }}
    >
      {/* Label with color indicator */}
      <div className="flex items-center gap-2 w-full justify-center">
        {color && (
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <span
          className="text-sm font-semibold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </span>
      </div>

      {/* Main value display / input */}
      {isEditing ? (
        <input
          type="number"
          value={value || ""}
          onChange={handleDirectInput}
          onBlur={() => setIsEditing(false)}
          autoFocus
          className="w-20 h-14 text-center text-3xl font-bold rounded-lg border-2"
          style={{
            backgroundColor: "var(--bg-primary)",
            borderColor: color || "var(--accent)",
            color: "var(--text-primary)",
          }}
          min={0}
          max={max}
        />
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="w-20 h-14 text-3xl font-bold rounded-lg transition-transform active:scale-95"
          style={{
            backgroundColor: value > 0 ? (color || "var(--accent)") : "var(--bg-tertiary)",
            color: value > 0 ? "white" : "var(--text-muted)",
          }}
        >
          {value}
        </button>
      )}

      {/* Quick increment/decrement buttons */}
      <div className="flex items-center gap-1 w-full">
        <button
          onClick={() => decrement(1)}
          disabled={value === 0}
          className="flex-1 h-10 rounded-lg text-lg font-bold transition-all active:scale-95 disabled:opacity-30"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-primary)",
          }}
        >
          −1
        </button>
        <button
          onClick={() => increment(1)}
          className="flex-1 h-10 rounded-lg text-lg font-bold transition-all active:scale-95"
          style={{
            backgroundColor: color || "var(--accent)",
            color: "white",
          }}
        >
          +1
        </button>
      </div>

      {/* Quick +5 / +10 buttons */}
      <div className="flex items-center gap-1 w-full">
        <button
          onClick={() => increment(5)}
          className="flex-1 h-8 rounded-md text-sm font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
          }}
        >
          +5
        </button>
        <button
          onClick={() => increment(10)}
          className="flex-1 h-8 rounded-md text-sm font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
          }}
        >
          +10
        </button>
      </div>
    </div>
  );
}
