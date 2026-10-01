"use client";

import { memo, useState, useRef, useEffect } from "react";
import { numericToAlpha3 } from "@/lib/geo";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Sphere,
  Graticule,
  Marker,
} from "react-simple-maps";

// world-atlas@2 countries-50m, served locally so the game works offline
const geoUrl = "/countries-50m.json";

// Kosovo, Somaliland and N. Cyprus have no numeric id in the atlas, so they are matched by name.
// Somaliland and N. Cyprus stay unplayable; they read as part of Somalia and Cyprus.
function toAlpha3(geo: { id?: string; properties?: { name?: string } }): string | null {
  if (geo.properties?.name === "Kosovo") return "XKX";
  return (geo.id && numericToAlpha3[geo.id]) || null;
}

export type HintCircle = { center: [number, number]; radius: number };

interface WorldMapProps {
  onCountryClick: (code: string) => void;
  playable: Set<string>; // countries in this game; the rest are dimmed and not clickable
  done: string[];
  wrong: string[];
  correct: string | null;
  target: string | null; // highlighted answer
  hintCircle: HintCircle | null;
  locked: boolean;
}

const MAP_SCALE = 160;
// Equirectangular: one degree spans the same number of SVG units everywhere
const UNITS_PER_DEGREE = (MAP_SCALE * Math.PI) / 180;

const MIN_ZOOM = 1;
const MAX_ZOOM = 48;

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function degPerPx(zoom: number, containerW: number, containerH: number) {
  return {
    lngPerPx: 360 / (containerW * zoom),
    latPerPx: 170 / (containerH * zoom),
  };
}

function clampCoords(lng: number, lat: number, zoom: number): [number, number] {
  const maxLng = 180 * (1 - 1 / zoom);
  const maxLat = 85 * (1 - 1 / zoom);
  return [clamp(lng, -maxLng, maxLng), clamp(lat, -maxLat, maxLat)];
}

const FILL = {
  off: ["#1e293b", "#1e293b"],
  correct: ["#22c55e", "#16a34a"],
  target: ["#eab308", "#ca8a04"],
  wrong: ["#ef4444", "#dc2626"],
  done: ["#166534", "#15803d"],
  open: ["#334155", "#64748b"],
} as const;

function WorldMapComponent({
  onCountryClick,
  playable,
  done,
  wrong,
  correct,
  target,
  hintCircle,
  locked,
}: WorldMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 10],
    zoom: 1,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const gesture = useRef({
    active: false,
    type: "none" as "none" | "pan" | "pinch",
    hasMoved: false,
    startX: 0,
    startY: 0,
    startCoords: [0, 10] as [number, number],
    startZoom: 1,
    startDist: 0,
    midX: 0,
    midY: 0,
  });

  const status = (a3: string | null): keyof typeof FILL => {
    if (!a3 || !playable.has(a3)) return "off";
    if (a3 === correct) return "correct";
    if (a3 === target) return "target";
    if (wrong.includes(a3)) return "wrong";
    if (done.includes(a3)) return "done";
    return "open";
  };

  const positionRef = useRef(position);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const g = gesture.current;
      const touches = e.touches;

      if (touches.length === 1) {
        g.type = "pan";
        g.active = true;
        g.hasMoved = false;
        g.startX = touches[0].clientX;
        g.startY = touches[0].clientY;
        g.startCoords = [...positionRef.current.coordinates] as [number, number];
        g.startZoom = positionRef.current.zoom;
      } else if (touches.length >= 2) {
        const t0 = touches[0];
        const t1 = touches[1];
        const d = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        g.type = "pinch";
        g.active = true;
        g.hasMoved = false;
        g.startDist = d;
        g.midX = (t0.clientX + t1.clientX) / 2;
        g.midY = (t0.clientY + t1.clientY) / 2;
        g.startCoords = [...positionRef.current.coordinates] as [number, number];
        g.startZoom = positionRef.current.zoom;
        g.startX = g.midX;
        g.startY = g.midY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const g = gesture.current;
      if (!g.active) return;

      const rect = el.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      if (g.type === "pan" && e.touches.length === 1) {
        const dx = e.touches[0].clientX - g.startX;
        const dy = e.touches[0].clientY - g.startY;

        if (!g.hasMoved && Math.hypot(dx, dy) > 5) {
          g.hasMoved = true;
        }
        if (!g.hasMoved) return;

        e.preventDefault();

        const { lngPerPx, latPerPx } = degPerPx(g.startZoom, W, H);
        const newLng = g.startCoords[0] - dx * lngPerPx;
        const newLat = g.startCoords[1] + dy * latPerPx;
        const clamped = clampCoords(newLng, newLat, g.startZoom);
        setPosition({ zoom: g.startZoom, coordinates: clamped });
      } else if (g.type === "pinch" && e.touches.length >= 2) {
        e.preventDefault();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;

        g.hasMoved = true;

        const zoomFactor = currentDist / g.startDist;
        const newZoom = clamp(g.startZoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);

        const dx = midX - g.startX;
        const dy = midY - g.startY;
        const { lngPerPx, latPerPx } = degPerPx(g.startZoom, W, H);
        const newLng = g.startCoords[0] - dx * lngPerPx;
        const newLat = g.startCoords[1] + dy * latPerPx;
        const clamped = clampCoords(newLng, newLat, newZoom);

        setPosition({ zoom: newZoom, coordinates: clamped });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const g = gesture.current;
      if (e.touches.length === 0) {
        g.active = false;
        g.type = "none";
        setTimeout(() => {
          g.hasMoved = false;
        }, 50);
      } else if (e.touches.length === 1) {
        g.type = "pan";
        g.hasMoved = false;
        g.startX = e.touches[0].clientX;
        g.startY = e.touches[0].clientY;
        g.startCoords = [...positionRef.current.coordinates] as [number, number];
        g.startZoom = positionRef.current.zoom;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{ touchAction: "none" }}
    >
      <ComposableMap
        projection="geoEquirectangular"
        projectionConfig={{ scale: MAP_SCALE, center: [0, 10] }}
        className="w-full h-full select-none"
        style={{ background: "#0f172a" }}
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onMoveEnd={({ coordinates, zoom }) =>
            setPosition({ coordinates: coordinates as [number, number], zoom })
          }
        >
          <Sphere id="ocean" fill="#0f172a" stroke="#1e293b" strokeWidth={0.5} />
          <Graticule stroke="#1e293b" strokeWidth={0.3} />

          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies
                .map((geo) => ({ geo, a3: toAlpha3(geo) }))
                // Hovered country last so its outline is drawn on top
                .sort((x, y) => Number(x.a3 === hovered && !!x.a3) - Number(y.a3 === hovered && !!y.a3))
                .map(({ geo, a3 }) => {
                  const st = status(a3);
                  const clickable = !locked && (st === "open" || st === "target");
                  const isHovered = clickable && a3 === hovered;
                  const fill = FILL[st][isHovered ? 1 : 0];
                  const stroke = isHovered ? "#ffffff" : st === "done" ? "#4ade80" : "#1e293b";
                  const style = { fill, stroke, strokeWidth: 0.05, outline: "none", cursor: clickable ? "pointer" : "default" };
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => setHovered(a3)}
                      onMouseLeave={() => setHovered(null)}
                      onTouchStart={() => setHovered(a3)}
                      onClick={() => {
                        if (clickable && a3 && !gesture.current.hasMoved) onCountryClick(a3);
                      }}
                      style={{ default: { ...style, transition: "fill 0.15s" }, hover: style, pressed: style }}
                    />
                  );
                })
            }
          </Geographies>

          {hintCircle && (
            <Marker coordinates={hintCircle.center}>
              <circle
                r={hintCircle.radius * UNITS_PER_DEGREE}
                fill="rgba(234,179,8,0.08)"
                stroke="#eab308"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                style={{ pointerEvents: "none" }}
              />
            </Marker>
          )}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}

export const WorldMap = memo(WorldMapComponent);
