"use client";

import { useAuth } from "@/hooks/useAuth";
import PageWrapper from "@/components/layout/PageWrapper";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <PageWrapper title="Übersicht">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-lg" style={{ backgroundColor: "var(--bg-tertiary)" }} />
          <div className="h-32 rounded-lg" style={{ backgroundColor: "var(--bg-tertiary)" }} />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Übersicht"
      description={`Willkommen zurück${user?.name ? `, ${user.name}` : ""}!`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory Capture Card */}
        <div
          className="rounded-xl shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📦</span>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Lagerbestand erfassen
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Gehen Sie durch das Lager und erfassen Sie die aktuellen Palettenbestände für jeden Lagerplatz.
              Klicken Sie auf Lagerplätze im Grundriss, um Mengen einzugeben.
            </p>
            <Link
              href="/inventory"
              className="inline-flex items-center text-orange-500 hover:text-orange-400 text-sm font-medium"
            >
              Erfassung starten
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Settings Card */}
        <div
          className="rounded-xl shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏭</span>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Lagerkonfiguration
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Konfigurieren Sie Ihre Lagerplätze und Produktvarianten bevor Sie den Bestand erfassen.
              Richten Sie Ihren Grundriss mit X/Y-Koordinaten für die Visualisierung ein.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center text-orange-500 hover:text-orange-400 text-sm font-medium"
            >
              Zur Lagerkonfiguration
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* User Info Card */}
        <div
          className="rounded-xl shadow-sm p-6 relative overflow-hidden"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">👤</span>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Ihr Konto
            </h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border-light)" }}>
              <span style={{ color: "var(--text-muted)" }}>E-Mail</span>
              <span style={{ color: "var(--text-primary)" }}>{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border-light)" }}>
              <span style={{ color: "var(--text-muted)" }}>Name</span>
              <span style={{ color: "var(--text-primary)" }}>{user?.name || "Nicht festgelegt"}</span>
            </div>
          </div>
        </div>

        {/* How It Works Card */}
        <div
          className="rounded-xl shadow-sm p-6 relative overflow-hidden"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">💡</span>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              So funktioniert es
            </h3>
          </div>
          <ol className="space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
              <span>Lagerplätze und Produkte in der Lagerkonfiguration anlegen</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
              <span>Zur Lagerbestand-Erfassung gehen und Lagerplätze auf dem Grundriss anklicken</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
              <span>Palettenmengen für jedes Produkt eingeben</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">4</span>
              <span>Auf "Snapshot speichern" klicken um den Bestand zu protokollieren</span>
            </li>
          </ol>
        </div>
      </div>
    </PageWrapper>
  );
}
