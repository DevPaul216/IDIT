"use client";

import { useState, useRef, useEffect } from "react";
import { StorageLocation } from "@/types";

type Bounds = { x: number; y: number; width: number; height: number };

interface FloorPlanEditorProps {
  locations: StorageLocation[];
  onSave: (changes: { id: string; bounds: Bounds }[]) => void;
  onCreate: (
    location: Omit<StorageLocation, "id" | "createdAt" | "updatedAt" | "isActive">
  ) => void;
}

const GRID = 10;
const PAD = 16;

type DragMode = "move" | "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const snap = (v: number) => Math.round(v / GRID) * GRID;

export default function FloorPlanEditor({ locations, onSave, onCreate }: FloorPlanEditorProps) {
  // ── local copy — all edits happen here, nothing goes to the server until Save ──
  const [local, setLocal] = useState<StorageLocation[]>(locations);
  const [dirty, setDirty] = useState(false);

  // Sync from parent when locations prop changes (after save / create)
  useEffect(() => { setLocal(locations); setDirty(false); }, [locations]);

  const [scale, setScale] = useState(0.75);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);

  // Modal for naming new area
  const [showNameModal, setShowNameModal] = useState(false);
  const [newAreaBounds, setNewAreaBounds] = useState<Bounds | null>(null);
  const [newAreaName, setNewAreaName] = useState("");

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    id: string;
    mx: number;
    my: number;
    orig: Bounds;
  } | null>(null);

  // ── helpers ──
  const displayed = local.filter((l) => l.parentId === parentId);
  const maxX = Math.max(...displayed.map((l) => l.x + l.width), 800);
  const maxY = Math.max(...displayed.map((l) => l.y + l.height), 600);

  const breadcrumb = (() => {
    const trail: StorageLocation[] = [];
    let id = parentId;
    while (id) {
      const loc = local.find((l) => l.id === id);
      if (!loc) break;
      trail.unshift(loc);
      id = loc.parentId;
    }
    return trail;
  })();

  const childCount = (id: string) => local.filter((l) => l.parentId === id).length;

  const toCanvas = (clientX: number, clientY: number) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale };
  };

  // ── update a single location in local state ──
  const updateBounds = (id: string, b: Bounds) => {
    setLocal((prev) => prev.map((l) => (l.id === id ? { ...l, ...b } : l)));
    setDirty(true);
  };

  // ── compute new bounds from drag delta ──
  const calcBounds = (mode: DragMode, orig: Bounds, dx: number, dy: number): Bounds => {
    const b = { ...orig };
    switch (mode) {
      case "move":
        b.x = Math.max(0, snap(orig.x + dx));
        b.y = Math.max(0, snap(orig.y + dy));
        break;
      case "se":
        b.width = Math.max(GRID, snap(orig.width + dx));
        b.height = Math.max(GRID, snap(orig.height + dy));
        break;
      case "e":
        b.width = Math.max(GRID, snap(orig.width + dx));
        break;
      case "s":
        b.height = Math.max(GRID, snap(orig.height + dy));
        break;
      case "sw": {
        const w = Math.max(GRID, snap(orig.width - dx));
        b.x = orig.x + orig.width - w;
        b.width = w;
        b.height = Math.max(GRID, snap(orig.height + dy));
        break;
      }
      case "ne": {
        b.width = Math.max(GRID, snap(orig.width + dx));
        const h = Math.max(GRID, snap(orig.height - dy));
        b.y = orig.y + orig.height - h;
        b.height = h;
        break;
      }
      case "nw": {
        const w = Math.max(GRID, snap(orig.width - dx));
        b.x = orig.x + orig.width - w;
        b.width = w;
        const h = Math.max(GRID, snap(orig.height - dy));
        b.y = orig.y + orig.height - h;
        b.height = h;
        break;
      }
      case "w": {
        const w = Math.max(GRID, snap(orig.width - dx));
        b.x = orig.x + orig.width - w;
        b.width = w;
        break;
      }
      case "n": {
        const h = Math.max(GRID, snap(orig.height - dy));
        b.y = orig.y + orig.height - h;
        b.height = h;
        break;
      }
    }
    return b;
  };

  // ── pointer handlers (on window so drag works even outside canvas) ──
  const onMove = (e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const { x, y } = toCanvas(e.clientX, e.clientY);
    const dx = snap(x - d.mx);
    const dy = snap(y - d.my);
    updateBounds(d.id, calcBounds(d.mode, d.orig, dx, dy));
  };

  const onUp = () => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  };

  const startDrag = (e: React.PointerEvent, id: string, mode: DragMode) => {
    e.stopPropagation();
    e.preventDefault();
    const loc = local.find((l) => l.id === id);
    if (!loc) return;
    const { x, y } = toCanvas(e.clientX, e.clientY);
    dragRef.current = { mode, id, mx: x, my: y, orig: { x: loc.x, y: loc.y, width: loc.width, height: loc.height } };
    setSelectedId(id);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // ── save: diff local vs original, push all changes at once ──
  const handleSave = () => {
    const changes: { id: string; bounds: Bounds }[] = [];
    for (const loc of local) {
      const orig = locations.find((l) => l.id === loc.id);
      if (!orig) continue;
      if (loc.x !== orig.x || loc.y !== orig.y || loc.width !== orig.width || loc.height !== orig.height) {
        changes.push({ id: loc.id, bounds: { x: loc.x, y: loc.y, width: loc.width, height: loc.height } });
      }
    }
    if (changes.length > 0) onSave(changes);
    setDirty(false);
  };

  // ── create mode ──
  const onCanvasDown = (e: React.PointerEvent) => {
    if (creating) {
      const { x, y } = toCanvas(e.clientX, e.clientY);
      setDrawStart({ x: snap(x - PAD), y: snap(y - PAD) });
      setDrawEnd({ x: snap(x - PAD), y: snap(y - PAD) });
    } else {
      setSelectedId(null);
    }
  };
  const onCanvasMove = (e: React.PointerEvent) => {
    if (creating && drawStart) {
      const { x, y } = toCanvas(e.clientX, e.clientY);
      setDrawEnd({ x: snap(x - PAD), y: snap(y - PAD) });
    }
  };
  const onCanvasUp = () => {
    if (creating && drawStart && drawEnd) {
      const x = Math.min(drawStart.x, drawEnd.x);
      const y = Math.min(drawStart.y, drawEnd.y);
      const w = Math.abs(drawEnd.x - drawStart.x);
      const h = Math.abs(drawEnd.y - drawStart.y);
      if (w >= GRID * 2 && h >= GRID * 2) {
        // Show the naming modal instead of browser prompt
        setNewAreaBounds({ x, y, width: w, height: h });
        setNewAreaName("");
        setShowNameModal(true);
      }
      setDrawStart(null);
      setDrawEnd(null);
      setCreating(false);
    }
  };

  const handleCreateArea = () => {
    if (newAreaBounds && newAreaName.trim()) {
      onCreate({
        name: newAreaName.trim(),
        description: null,
        parentId,
        x: newAreaBounds.x,
        y: newAreaBounds.y,
        width: newAreaBounds.width,
        height: newAreaBounds.height,
        color: null,
        capacity: null,
      });
    }
    setShowNameModal(false);
    setNewAreaBounds(null);
    setNewAreaName("");
  };

  // ── handle config ──
  const corners: { style: Record<string, number>; cursor: string; mode: DragMode }[] = [
    { style: { top: -7, left: -7 }, cursor: "nwse-resize", mode: "nw" },
    { style: { top: -7, right: -7 }, cursor: "nesw-resize", mode: "ne" },
    { style: { bottom: -7, left: -7 }, cursor: "nesw-resize", mode: "sw" },
    { style: { bottom: -7, right: -7 }, cursor: "nwse-resize", mode: "se" },
  ];
  const edges: { style: Record<string, number | string>; cursor: string; mode: DragMode; w: number; h: number }[] = [
    { style: { top: "50%", left: -6, transform: "translateY(-50%)" }, cursor: "ew-resize", mode: "w", w: 6, h: 16 },
    { style: { top: "50%", right: -6, transform: "translateY(-50%)" }, cursor: "ew-resize", mode: "e", w: 6, h: 16 },
    { style: { left: "50%", top: -6, transform: "translateX(-50%)" }, cursor: "ns-resize", mode: "n", w: 16, h: 6 },
    { style: { left: "50%", bottom: -6, transform: "translateX(-50%)" }, cursor: "ns-resize", mode: "s", w: 16, h: 6 },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setScale(Math.max(0.25, +(scale - 0.1).toFixed(2)))}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold active:scale-95"
            style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}>−</button>
          <span className="text-sm font-medium min-w-[3.5rem] text-center" style={{ color: "var(--text-muted)" }}>
            {Math.round(scale * 100)}%
          </span>
          <button onClick={() => setScale(Math.min(2, +(scale + 0.1).toFixed(2)))}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold active:scale-95"
            style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}>+</button>
        </div>

        {dirty && (
          <button onClick={handleSave}
            className="px-5 py-2 rounded-lg font-bold active:scale-95 animate-pulse"
            style={{ backgroundColor: "#22c55e", color: "white" }}>
            💾 Speichern
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg flex-wrap"
        style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
        <button onClick={() => { setParentId(null); setSelectedId(null); }}
          className="hover:underline font-medium"
          style={{ color: parentId ? "var(--accent)" : "var(--text-primary)" }}>
          🏠 Alle Bereiche
        </button>
        {breadcrumb.map((loc) => (
          <span key={loc.id} className="flex items-center gap-2">
            <span>›</span>
            <button onClick={() => { setParentId(loc.id); setSelectedId(null); }}
              className="hover:underline font-medium"
              style={{ color: loc.id === parentId ? "var(--text-primary)" : "var(--accent)" }}>
              {loc.name}
            </button>
          </span>
        ))}
      </div>

      {/* Hints */}
      <div className="flex items-center gap-4 text-xs px-3 py-2 rounded-lg flex-wrap"
        style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
        <span>✋ Ziehen = Verschieben</span>
        <span>📐 Ecken/Kanten = Größe ändern</span>
        <span>🖱️ Doppelklick = Hinein</span>
        {dirty && <span className="font-bold" style={{ color: "#22c55e" }}>● Ungespeicherte Änderungen</span>}
      </div>

      {/* Canvas */}
      <div className="overflow-auto rounded-xl select-none"
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: creating ? "2px solid #22c55e" : "1px solid var(--border-light)",
          cursor: creating ? "crosshair" : "default",
          maxHeight: "70vh",
        }}>
        <div ref={canvasRef} className="relative min-w-fit"
          style={{ width: (maxX + PAD * 2) * scale, height: (maxY + PAD * 2) * scale }}
          onPointerDown={onCanvasDown} onPointerMove={onCanvasMove} onPointerUp={onCanvasUp}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left",
            width: maxX + PAD * 2, height: maxY + PAD * 2, position: "relative" }}>

            {/* Grid */}
            <div className="absolute rounded-lg opacity-20 pointer-events-none"
              style={{ left: PAD, top: PAD, right: PAD, bottom: PAD,
                backgroundImage: `linear-gradient(var(--border-light) 1px,transparent 1px),linear-gradient(90deg,var(--border-light) 1px,transparent 1px)`,
                backgroundSize: `${GRID}px ${GRID}px` }} />

            {/* Empty */}
            {displayed.length === 0 && !creating && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ color: "var(--text-muted)" }}>
                <div className="text-center">
                  <div className="text-4xl mb-2">📭</div>
                  <div className="text-sm">Keine Bereiche{parentId ? " hier" : ""}.</div>
                </div>
              </div>
            )}

            {/* Draw preview */}
            {creating && drawStart && drawEnd && (
              <div className="absolute border-2 border-dashed rounded-lg pointer-events-none"
                style={{ left: Math.min(drawStart.x, drawEnd.x) + PAD, top: Math.min(drawStart.y, drawEnd.y) + PAD,
                  width: Math.abs(drawEnd.x - drawStart.x), height: Math.abs(drawEnd.y - drawStart.y),
                  backgroundColor: "#22c55e33", borderColor: "#22c55e" }} />
            )}

            {/* Locations */}
            {displayed.map((loc) => {
              const sel = selectedId === loc.id;
              const kids = childCount(loc.id);
              return (
                <div key={loc.id}
                  className="absolute flex flex-col items-center justify-center gap-0.5"
                  style={{
                    left: loc.x + PAD, top: loc.y + PAD, width: loc.width, height: loc.height,
                    borderRadius: 8,
                    border: sel ? "3px solid #3b82f6" : "2px solid var(--border-color)",
                    backgroundColor: loc.color ? `${loc.color}33` : "var(--bg-tertiary)",
                    color: loc.color || "var(--text-primary)",
                    boxShadow: sel ? "0 0 0 3px rgba(59,130,246,0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
                    cursor: creating ? "crosshair" : "move",
                    zIndex: sel ? 10 : 1,
                    userSelect: "none", touchAction: "none",
                  }}
                  onPointerDown={(e) => { if (!creating) startDrag(e, loc.id, "move"); }}
                  onDoubleClick={(e) => { e.stopPropagation(); if (kids > 0) { setParentId(loc.id); setSelectedId(null); } }}>
                  <span className="font-bold text-sm pointer-events-none">{loc.name}</span>
                  <span className="text-[10px] opacity-70 pointer-events-none">{loc.width}×{loc.height}</span>
                  {kids > 0 && <span className="text-[10px] opacity-60 pointer-events-none">📂 {kids}</span>}

                  {sel && !creating && (<>
                    {corners.map((h, i) => (
                      <div key={`c${i}`} className="absolute w-[14px] h-[14px] rounded-full border-2 bg-white"
                        style={{ ...h.style, borderColor: "#3b82f6", cursor: h.cursor, zIndex: 20, touchAction: "none" }}
                        onPointerDown={(e) => startDrag(e, loc.id, h.mode)} />
                    ))}
                    {edges.map((h, i) => (
                      <div key={`e${i}`} className="absolute rounded-full border-2 bg-white"
                        style={{ ...h.style, width: h.w, height: h.h, borderColor: "#3b82f6", cursor: h.cursor, zIndex: 20, touchAction: "none" }}
                        onPointerDown={(e) => startDrag(e, loc.id, h.mode)} />
                    ))}
                  </>)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info bar */}
      {selectedId && (() => {
        const loc = local.find((l) => l.id === selectedId);
        if (!loc) return null;
        const kids = childCount(loc.id);
        return (
          <div className="p-3 rounded-lg flex items-center justify-between flex-wrap gap-2"
            style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-light)" }}>
            <div className="flex items-center gap-3">
              {loc.color && <span className="w-4 h-4 rounded-full" style={{ backgroundColor: loc.color }} />}
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{loc.name}</span>
              {kids > 0 && (
                <button onClick={() => { setParentId(loc.id); setSelectedId(null); }}
                  className="text-xs px-2 py-1 rounded-md font-medium" style={{ backgroundColor: "var(--accent)", color: "white" }}>
                  📂 {kids} Unterbereiche
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>📍 ({loc.x}, {loc.y})</span>
              <span>📐 {loc.width} × {loc.height}</span>
            </div>
          </div>
        );
      })()}

      {/* Modal for naming new area */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => { setShowNameModal(false); setNewAreaBounds(null); }}>
          <div className="rounded-xl p-6 w-full max-w-sm shadow-2xl"
            style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Neuer Lagerbereich
            </h3>
            {newAreaBounds && (
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                Position: ({newAreaBounds.x}, {newAreaBounds.y}) — Größe: {newAreaBounds.width} × {newAreaBounds.height}
              </p>
            )}
            <input
              type="text"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              placeholder="Name eingeben..."
              autoFocus
              className="w-full px-4 py-3 rounded-lg text-base mb-4"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-light)",
                color: "var(--text-primary)",
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && newAreaName.trim()) handleCreateArea(); }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowNameModal(false); setNewAreaBounds(null); }}
                className="flex-1 px-4 py-3 rounded-lg font-medium"
                style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}>
                Abbrechen
              </button>
              <button
                onClick={handleCreateArea}
                disabled={!newAreaName.trim()}
                className="flex-1 px-4 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: newAreaName.trim() ? "#22c55e" : "var(--bg-tertiary)",
                  color: newAreaName.trim() ? "white" : "var(--text-muted)",
                }}>
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
