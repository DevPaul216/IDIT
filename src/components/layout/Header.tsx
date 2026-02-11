"use client";

import { useUser } from "@/context/UserContext";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Header() {
  const { user, logout } = useUser();

  return (
    <header 
      className="h-16 flex items-center justify-between px-6"
      style={{ 
        backgroundColor: 'var(--bg-primary)', 
        borderBottom: '1px solid var(--border-light)' 
      }}
    >
      <div className="flex items-center gap-4">
        <h1 
          className="text-lg font-semibold flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          <span className="hidden sm:inline">Intex Digitales Lagerverwaltungstool</span>
          <span className="sm:hidden">IDIT</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        {user && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-medium text-sm">
                  {user.name[0].toUpperCase()}
                </span>
              </div>
              <span className="text-sm hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
                {user.name}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Abmelden
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
