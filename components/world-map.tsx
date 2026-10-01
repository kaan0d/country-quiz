"use client";

import { memo, useState, useRef, useEffect } from "react";
import { countryCenters, numericToAlpha3, tinyCountries } from "@/lib/geo";
import { BASE } from "@/lib/countries";
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
const geoUrl = `${BASE}/countries-50m.json`;

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
  focus: [number, number, number, number] | null; // [minLng, minLat, maxLng, maxLat] to zoom to, null for the world
  done: string[];
  wrong: string[];
  correct: string | null;
  targets: string[]; // highlighted in yellow: the answer, or the asked country in neighbours mode
  hintCircle: HintCircle | null;
  locked: boolean;
  heat?: Record<string, number>; // explore view: open countries are tinted by lifetime misses
}

// 0 misses is the normal open color, 5 or more is full red
const heatFill = (n: number) => `color-mix(in srgb, #ef4444 ${Math.min(n, 5) * 20}%, #334155)`;

const MIN_ZOOM = 1;
const MAX_ZOOM = 48;

const rad = (deg: number) => (deg * Math.PI) / 180;

// Screen pixels per degree at zoom 1 (equirectangular, so the same everywhere). Landscape fits the
// whole world; portrait fills the height with the inhabited latitudes and pans sideways instead of
// shrinking the world into a thin strip.
function pxPerDegree(w: number, h: number) {
  const scale = h > w ? h / rad(150) : Math.min(w / rad(360), h / rad(170));
  return rad(scale);
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

// Keep the view inside the map: longitude -180..180, latitude -90..85
function clampCoords(lng: number, lat: number, zoom: number, view: View): [number, number] {
  const halfLng = view.w / (2 * view.ppd * zoom);
  const halfLat = view.h / (2 * view.ppd * zoom);
  const maxLng = Math.max(0, 180 - halfLng);
  const [loLat, hiLat] = [-90 + halfLat, 85 - halfLat];
  return [clamp(lng, -maxLng, maxLng), loLat > hiLat ? (loLat + hiLat) / 2 : clamp(lat, loLat, hiLat)];
}

type View = { w: number; h: number; ppd: number };

const homePosition = (view: View) => ({
  coordinates: clampCoords(view.h > view.w ? 15 : 0, 10, 1, view),
  zoom: 1,
});

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
  focus,
  done,
  wrong,
  correct,
  targets,
  hintCircle,
  locked,
  heat,
}: WorldMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 10],
    zoom: 1,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // The SVG matches the container in pixels, so one map unit is one screen pixel at zoom 1
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const view: View = size ? { ...size, ppd: pxPerDegree(size.w, size.h) } : { w: 800, h: 600, ppd: 1 };
  const viewRef = useRef(view);
  viewRef.current = view;

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
    if (targets.includes(a3)) return "target";
    if (wrong.includes(a3)) return "wrong";
    if (done.includes(a3)) return "done";
    return "open";
  };

  // Fit the focus box into the visible map; keyed by value since the array is rebuilt each render
  const focusKey = focus?.join();
  useEffect(() => {
    if (!size) return;
    if (!focus) {
      setPosition(homePosition(view));
      return;
    }
    const [minLng, minLat, maxLng, maxLat] = focus;
    const zoom = clamp(
      Math.min(view.w / view.ppd / (maxLng - minLng), view.h / view.ppd / (maxLat - minLat)) * 0.9,
      MIN_ZOOM,
      MAX_ZOOM
    );
    setPosition({ coordinates: clampCoords((minLng + maxLng) / 2, (minLat + maxLat) / 2, zoom, view), zoom });
  }, [focusKey, size?.w, size?.h]);

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

      const v = viewRef.current;
      const degPerPx = (zoom: number) => 1 / (v.ppd * zoom);

      if (g.type === "pan" && e.touches.length === 1) {
        const dx = e.touches[0].clientX - g.startX;
        const dy = e.touches[0].clientY - g.startY;

        if (!g.hasMoved && Math.hypot(dx, dy) > 5) {
          g.hasMoved = true;
        }
        if (!g.hasMoved) return;

        e.preventDefault();

        const newLng = g.startCoords[0] - dx * degPerPx(g.startZoom);
        const newLat = g.startCoords[1] + dy * degPerPx(g.startZoom);
        const clamped = clampCoords(newLng, newLat, g.startZoom, v);
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
        const newLng = g.startCoords[0] - dx * degPerPx(g.startZoom);
        const newLat = g.startCoords[1] + dy * degPerPx(g.startZoom);
        const clamped = clampCoords(newLng, newLat, newZoom, v);

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
      {size && (
        <ComposableMap
          projection="geoEquirectangular"
          projectionConfig={{ scale: view.ppd * (180 / Math.PI), center: [0, 10] }}
          width={size.w}
          height={size.h}
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
              {({ geographies }) => {
                const items = geographies.map((geo) => ({ geo, a3: toAlpha3(geo) }));
                const isClickable = (st: keyof typeof FILL) => !locked && (st === "open" || st === "target");
                return [
                  ...items.map(({ geo, a3 }) => {
                    const st = status(a3);
                    const clickable = isClickable(st);
                    const fill = heat && st === "open" && a3 !== hovered ? heatFill(heat[a3!] ?? 0) : FILL[st][clickable && a3 === hovered ? 1 : 0];
                    const stroke = st === "done" ? "#4ade80" : "#1e293b";
                    const style = { fill, stroke, strokeWidth: 0.05, outline: "none", cursor: clickable ? "pointer" : "default" };
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => setHovered(a3)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => {
                          if (clickable && a3 && !gesture.current.hasMoved) onCountryClick(a3);
                        }}
                        style={{ default: { ...style, transition: "fill 0.15s" }, hover: style, pressed: style }}
                      />
                    );
                  }),
                  // Hover outline drawn on top as a separate, non-interactive copy. Reordering the
                  // hovered path itself would move it in the DOM mid-click and the click would be lost.
                  ...items
                    .filter(({ a3 }) => a3 && a3 === hovered && isClickable(status(a3)))
                    .map(({ geo }) => (
                      <Geography
                        key={`hover-${geo.rsmKey}`}
                        geography={geo}
                        style={{ default: { fill: "none", stroke: "#ffffff", strokeWidth: 1.5, vectorEffect: "non-scaling-stroke", pointerEvents: "none", outline: "none" } }}
                      />
                    )),
                ];
              }}
            </Geographies>

            {[...tinyCountries].map((a3) => {
              const center = countryCenters[a3];
              const st = status(a3);
              if (!center || st === "off") return null;
              const clickable = !locked && (st === "open" || st === "target");
              const isHovered = clickable && a3 === hovered;
              return (
                <Marker key={a3} coordinates={center}>
                  {/* Constant on-screen size: divide by zoom, the group scales its children */}
                  <circle
                    r={4 / position.zoom}
                    fill={heat && st === "open" && !isHovered ? heatFill(heat[a3] ?? 0) : FILL[st][isHovered ? 1 : 0]}
                    stroke={isHovered ? "#ffffff" : "#94a3b8"}
                    strokeWidth={0.8 / position.zoom}
                    style={{ cursor: clickable ? "pointer" : "default" }}
                    onMouseEnter={() => setHovered(a3)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => {
                      if (clickable && !gesture.current.hasMoved) onCountryClick(a3);
                    }}
                  />
                </Marker>
              );
            })}

            {hintCircle && (
              <Marker coordinates={hintCircle.center}>
                <circle
                  r={hintCircle.radius * view.ppd}
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
      )}
    </div>
  );
}

export const WorldMap = memo(WorldMapComponent);
