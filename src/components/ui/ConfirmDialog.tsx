"use client";

import Button from "./Button";
import Modal from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div 
        className="p-6 space-y-4 rounded-lg w-96"
        style={{ 
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-light)"
        }}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
        
        <p style={{ color: "var(--text-muted)" }}>
          {message}
        </p>

        <div className="flex gap-3 justify-end pt-4">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button 
            variant={isDangerous ? "danger" : "default"} 
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
