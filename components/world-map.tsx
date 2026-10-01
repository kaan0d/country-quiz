"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Sphere,
  Graticule,
  Marker,
} from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// Some regions share the same geo.id (e.g., -99 for Kosovo, Somaliland, N. Cyprus).
// We use geo.properties.name to create unique IDs for them.
const NAME_TO_CUSTOM_ID: Record<string, string> = {
  "Kosovo": "CUSTOM_XKX",
  "Somaliland": "CUSTOM_SOMALILAND",
  "N. Cyprus": "CUSTOM_NCYPRUS",
};

// Map custom IDs to alpha-3 codes
const CUSTOM_ID_TO_ALPHA3: Record<string, string | null> = {
  "CUSTOM_XKX": "XKX",           // Kosovo - playable
  "CUSTOM_SOMALILAND": null,     // Somaliland - not playable (part of Somalia visually)
  "CUSTOM_NCYPRUS": null,        // N. Cyprus - not playable (part of Cyprus visually)
};

// Get the effective ID for a geography (uses name-based custom ID if applicable)
function getGeoId(geo: { id?: string; properties?: { name?: string } }): string | undefined {
  const name = geo.properties?.name ?? "";
  if (NAME_TO_CUSTOM_ID[name]) {
    return NAME_TO_CUSTOM_ID[name];
  }
  return geo.id;
}

interface WorldMapProps {
  onCountryClick: (countryCode: string) => void;
  correctCountries: string[];
  wrongCountries: string[];
  completedCountries: string[];
  numericToAlpha3: Record<string, string>;
  hintCircle: { center: [number, number]; radius: number } | null;
  includeSmallIslands: boolean;
  smallIslandCodes: string[]; // alpha-3 codes of small islands
  isLocked: boolean; // when true, no clicks allowed (during transition)
}

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

function WorldMapComponent({
  onCountryClick,
  correctCountries,
  wrongCountries,
  completedCountries,
  numericToAlpha3,
  hintCircle,
  includeSmallIslands,
  smallIslandCodes,
  isLocked,
}: WorldMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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

  const toAlpha3 = useCallback(
    (id: string | undefined | null): string | null => {
      if (id === undefined || id === null || id === "") return null;

      // Check if it's a custom ID first
      if (id.startsWith("CUSTOM_")) {
        return CUSTOM_ID_TO_ALPHA3[id] ?? null;
      }
      return numericToAlpha3[id] || null;
    },
    [numericToAlpha3]
  );

  const getCountryFill = useCallback(
    (id: string) => {
      const a3 = toAlpha3(id);
      if (!a3) return "#334155"; // Non-playable region
      if (correctCountries.includes(a3)) return "#22c55e";
      if (wrongCountries.includes(a3)) return "#ef4444";
      if (completedCountries.includes(a3)) return "#166534";
      return "#334155";
    },
    [correctCountries, wrongCountries, completedCountries, toAlpha3]
  );

  const getCountryHoverFill = useCallback(
    (id: string) => {
      const a3 = toAlpha3(id);
      if (!a3) return "#334155"; // Non-playable region
      if (correctCountries.includes(a3)) return "#16a34a";
      if (wrongCountries.includes(a3)) return "#dc2626";
      if (completedCountries.includes(a3)) return "#15803d";
      return "#64748b";
    },
    [correctCountries, wrongCountries, completedCountries, toAlpha3]
  );

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
        projectionConfig={{ scale: 160, center: [0, 10] }}
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
              // Use custom IDs for regions that share the same geo.id
              const geoWithIds = geographies
                .map(g => ({ geo: g, effectiveId: getGeoId(g) }))
                .filter((item): item is { geo: typeof item.geo; effectiveId: string } =>
                  item.effectiveId !== undefined
                );

              const completedSet = new Set(completedCountries);
              const normal = geoWithIds.filter(
                ({ effectiveId }) => {
                  const a3 = toAlpha3(effectiveId);
                  return effectiveId !== hoveredId && (!a3 || !completedSet.has(a3));
                }
              );
              const comp = geoWithIds.filter(
                ({ effectiveId }) => {
                  const a3 = toAlpha3(effectiveId);
                  return effectiveId !== hoveredId && a3 && completedSet.has(a3);
                }
              );
              const hov = geoWithIds.find(({ effectiveId }) => effectiveId === hoveredId);
              const ordered = [...normal, ...comp, ...(hov ? [hov] : [])];

              return ordered.map(({ geo, effectiveId }) => {
                const a3 = toAlpha3(effectiveId);
                const isNonPlayable = a3 === null; // Somaliland, N. Cyprus, etc.

                const isHovered = effectiveId === hoveredId && !isNonPlayable;
                const isCompleted = a3 ? completedCountries.includes(a3) : false;
                const isWrong = a3 ? wrongCountries.includes(a3) : false;
                const isCorrect = a3 ? correctCountries.includes(a3) : false;
                const isExcludedIsland = a3 ? (!includeSmallIslands && smallIslandCodes.includes(a3)) : false;
                const isDisabled = isNonPlayable || isLocked || isCompleted || isWrong || isCorrect || isExcludedIsland;

                const fill =
                  isHovered && !isDisabled
                    ? getCountryHoverFill(effectiveId)
                    : getCountryFill(effectiveId);
                const strokeColor =
                  isHovered && !isDisabled
                    ? "#ffffff"
                    : isCompleted
                      ? "#4ade80"
                      : "#1e293b";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => !isNonPlayable && setHoveredId(effectiveId)}
                    onMouseLeave={() => setHoveredId(null)}
                    onTouchStart={() => !isNonPlayable && setHoveredId(effectiveId)}
                    onClick={() => {
                      if (!isDisabled && !gesture.current.hasMoved) {
                        onCountryClick(effectiveId);
                      }
                    }}
                    style={{
                      default: {
                        fill,
                        stroke: strokeColor,
                        strokeWidth: 0.05,
                        outline: "none",
                        cursor: isDisabled ? "default" : "pointer",
                        transition: "fill 0.15s",
                      },
                      hover: {
                        fill,
                        stroke: strokeColor,
                        strokeWidth: 0.05,
                        outline: "none",
                        cursor: isDisabled ? "default" : "pointer",
                      },
                      pressed: {
                        fill,
                        stroke: strokeColor,
                        strokeWidth: 0.05,
                        outline: "none",
                      },
                    }}
                  />
                );
              });
            }}
          </Geographies>

          {hintCircle && (
            <Marker coordinates={hintCircle.center}>
              <circle
                r={hintCircle.radius}
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
