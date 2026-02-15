"use client";

import { useState } from "react";
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "color";
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

interface EntityModalProps {
  isOpen: boolean;
  title: string;
  fields: FieldConfig[];
  initialData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export default function EntityModal({
  isOpen,
  title,
  fields,
  initialData,
  onSave,
  onClose,
  isLoading = false,
}: EntityModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Update formData when initialData changes
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setFormData(initialData);
      setError("");
    } else {
      onClose();
    }
  };

  const handleChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    for (const field of fields) {
      if (field.required && !formData[field.name]) {
        setError(`${field.label} ist erforderlich`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={() => handleOpenChange(false)}>
      <div 
        className="p-6 space-y-4 rounded-lg"
        style={{ 
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-light)"
        }}
      >
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1">
              <label className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {field.label}
                {field.required && <span style={{ color: "#ef4444" }}> *</span>}
              </label>

              {field.type === "select" ? (
                <select
                  value={String(formData[field.name] ?? "")}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-primary)",
                  }}
                  required={field.required}
                >
                  <option value="">Wählen...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "color" ? (
                <Input
                  type="color"
                  value={String(formData[field.name] ?? "#3b82f6")}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="h-10 p-1"
                />
              ) : (
                <Input
                  type={field.type}
                  value={String(formData[field.name] ?? "")}
                  onChange={(e) =>
                    handleChange(
                      field.name,
                      field.type === "number" ? parseInt(e.target.value) || null : e.target.value
                    )
                  }
                  placeholder={field.placeholder}
                  required={field.required}
                  min={field.type === "number" ? 0 : undefined}
                />
              )}
            </div>
          ))}

          {error && (
            <p className="text-sm rounded-lg p-3" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isSaving}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSaving || isLoading}>
              {isSaving ? "Speichern..." : "Speichern"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
