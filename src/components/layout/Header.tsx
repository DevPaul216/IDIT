"use client";

import { useAuth } from "@/hooks/useAuth";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Header() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

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
        {isLoading ? (
          <div className="h-8 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        ) : user ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-medium text-sm">
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-sm hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>{user.name || user.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Abmelden
            </Button>
          </>
        ) : null}
      </div>
    </header>
  );
}
