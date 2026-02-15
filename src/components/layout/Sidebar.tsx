"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Übersicht",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/inventory",
    label: "Lagerbestand erfassen",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analytik",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "Verlauf",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Lagerkonfiguration",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
  };

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <aside 
        className="w-64 min-h-screen"
        style={{ 
          backgroundColor: 'var(--bg-primary)', 
          borderRight: '1px solid var(--border-light)' 
        }}
      />
    );
  }

  return (
    <aside 
      className={cn(
        "min-h-screen flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
      style={{ 
        backgroundColor: 'var(--bg-primary)', 
        borderRight: '1px solid var(--border-light)' 
      }}
    >
      {/* Header with logo and toggle */}
      <div className={cn("p-4 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-3 group flex-1 min-w-0">
            <div 
              className="w-10 h-10 sidebar-logo flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0"
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <span className="text-xl">📦</span>
            </div>
            <div className="min-w-0">
              <span 
                className="text-xl font-bold sidebar-logo-text block truncate"
                style={{ color: 'var(--accent-primary)' }}
              >IDIT</span>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Lagerverwaltung</p>
            </div>
          </Link>
        )}

        {isCollapsed && (
          <Link href="/dashboard" className="flex items-center justify-center">
            <div 
              className="w-10 h-10 sidebar-logo flex items-center justify-center hover:scale-105 transition-transform"
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <span className="text-xl">📦</span>
            </div>
          </Link>
        )}

        <button
          onClick={toggleCollapse}
          className="p-1.5 transition-colors flex-shrink-0"
          title={isCollapsed ? "Sidebar erweitern" : "Sidebar einklappen"}
          style={{ 
            color: 'var(--text-muted)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 pb-4", isCollapsed ? "px-2" : "px-4")}>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all nav-link",
                    isCollapsed && "justify-center px-2",
                    isActive && "nav-link-active"
                  )}
                  style={{ 
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent'
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
