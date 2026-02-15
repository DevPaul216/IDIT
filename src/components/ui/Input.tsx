import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full px-3 py-2 shadow-sm transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          style={{
            backgroundColor: 'var(--input-bg)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: error ? '#ef4444' : 'var(--border-color)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-sm)',
          }}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
