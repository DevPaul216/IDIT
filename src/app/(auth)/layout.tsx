"use client";

import { ReactNode } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-full blur-3xl" />
      </div>

      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">🔥</span>
            </div>
          </div>
          <h1 
            className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent"
          >IDIT</h1>
          <p 
            className="mt-1"
            style={{ color: 'var(--text-muted)' }}
          >Intex Digitales Lagerverwaltungstool</p>
        </div>
        <div 
          className="rounded-2xl shadow-xl p-8 backdrop-blur-sm"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
        >
          {children}
        </div>
        <p className="text-center mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
          © 2026 Intex · Alle Rechte vorbehalten
        </p>
      </div>
    </div>
  );
}
