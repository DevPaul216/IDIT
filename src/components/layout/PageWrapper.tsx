import { ReactNode } from "react";

interface PageWrapperProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function PageWrapper({
  title,
  description,
  actions,
  children,
}: PageWrapperProps) {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          {description && (
            <p className="mt-1" style={{ color: 'var(--text-muted)' }}>{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
