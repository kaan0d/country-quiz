"use client";

import { useEffect, useRef } from "react";
import { geoGraticule10, geoOrthographic, geoPath, geoInterpolate } from "d3-geo";
import { feature, merge, mesh } from "topojson-client";
import { BASE, countries, type Continent } from "@/lib/countries";
import { continentBounds, numericToAlpha3 } from "@/lib/geo";

type Topology = Parameters<typeof mesh>[0];
type GeometryCollection = Parameters<typeof mesh>[1] & { geometries: { id?: string | number }[] };

const continentOf = new Map(countries.map((c) => [c.code, c.continent]));

// The atlas is shared with the game map, so the browser fetches it once
let atlas: Promise<Topology> | null = null;
const loadAtlas = () => (atlas ??= fetch(`${BASE}/countries-50m.json`).then((r) => r.json()));

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Engraved globe for the menu: spins on its own, can be dragged, and turns to the chosen region
// with that continent inked in the seal colour.
export function Globe({ region, className }: { region: Continent | "all"; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const regionRef = useRef(region);
  regionRef.current = region;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const projection = geoOrthographic().clipAngle(90);
    const path = geoPath(projection, ctx);
    const graticule = geoGraticule10();
    const colors = { ink: css("--ink"), ocean: css("--ocean"), land: css("--land"), seal: css("--seal"), faint: css("--ink-faint") };

    let rotation: [number, number] = [-30, -25];
    let goal: [number, number] | null = null;
    let tween: ((t: number) => [number, number]) | null = null;
    let tweenStart = 0;
    let drag: { x: number; y: number; rot: [number, number] } | null = null;
    let shownRegion: Continent | "all" | null = null;
    let topo: Topology | null = null;
    let land: GeoJSON.Feature | null = null;
    let borders: GeoJSON.MultiLineString | null = null;
    let highlight: GeoJSON.MultiPolygon | null = null;
    let size = 0;
    let frame = 0;
    let last = performance.now();

    loadAtlas().then((t) => {
      topo = t;
      land = feature(t, t.objects.land as GeometryCollection) as unknown as GeoJSON.Feature;
      borders = mesh(t, t.objects.countries as GeometryCollection, (a, b) => a !== b);
    });

    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      size = canvas.clientWidth;
      canvas.width = canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const draw = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const r = regionRef.current;

      // A new region: ink its countries and swing the globe round to face it
      if (topo && r !== shownRegion) {
        shownRegion = r;
        const geoms = (topo.objects.countries as GeometryCollection).geometries.filter(
          (g) => r !== "all" && continentOf.get(numericToAlpha3[String(g.id)]) === r
        );
        highlight = geoms.length ? merge(topo, geoms as never) : null;
        if (r === "all") goal = null;
        else {
          const [x0, y0, x1, y1] = continentBounds[r];
          goal = [-(x0 + x1) / 2, -(y0 + y1) / 2];
          tween = geoInterpolate(rotation, goal) as never;
          tweenStart = now;
        }
      }

      if (drag) {
        // the drag handlers set the rotation
      } else if (goal && tween) {
        const t = Math.min((now - tweenStart) / 1400, 1);
        rotation = tween(1 - Math.pow(1 - t, 3));
        if (t === 1) tween = null;
      } else if (!goal && !still) {
        rotation = [rotation[0] + dt * 0.006, rotation[1] + (-18 - rotation[1]) * 0.02];
      }

      const radius = size / 2 - 14;
      projection.translate([size / 2, size / 2]).scale(radius).rotate([rotation[0], rotation[1], 0]);
      ctx.clearRect(0, 0, size, size);

      // Ocean with a soft light from the upper left
      const shade = ctx.createRadialGradient(size * 0.36, size * 0.32, radius * 0.1, size / 2, size / 2, radius);
      shade.addColorStop(0, colors.land);
      shade.addColorStop(1, colors.ocean);
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.fillStyle = shade;
      ctx.fill();

      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = colors.faint;
      ctx.lineWidth = 0.6;
      ctx.stroke();

      if (land) {
        ctx.beginPath();
        path(land);
        ctx.fillStyle = colors.land;
        ctx.fill();
        if (highlight) {
          ctx.beginPath();
          path(highlight);
          ctx.fillStyle = colors.seal;
          ctx.fill();
        }
        ctx.beginPath();
        path(borders!);
        ctx.strokeStyle = colors.ink;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        path(land);
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      // Limb shadow, then the engraved rim with a degree scale
      const limb = ctx.createRadialGradient(size / 2, size / 2, radius * 0.7, size / 2, size / 2, radius);
      limb.addColorStop(0, "transparent");
      limb.addColorStop(1, colors.faint);
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.fillStyle = limb;
      ctx.fill();
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(size / 2, size / 2, radius + 8, 0, Math.PI * 2);
      ctx.lineWidth = 0.75;
      ctx.stroke();
      for (let d = 0; d < 360; d += 5) {
        const a = ((d + rotation[0]) * Math.PI) / 180;
        const len = d % 30 === 0 ? 8 : d % 10 === 0 ? 5 : 3;
        ctx.beginPath();
        ctx.moveTo(size / 2 + Math.cos(a) * (radius + 8), size / 2 + Math.sin(a) * (radius + 8));
        ctx.lineTo(size / 2 + Math.cos(a) * (radius + 8 - len), size / 2 + Math.sin(a) * (radius + 8 - len));
        ctx.stroke();
      }

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    const onDown = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY, rot: rotation };
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const k = 180 / size;
      rotation = [drag.rot[0] + (e.clientX - drag.x) * k, Math.max(-80, Math.min(80, drag.rot[1] - (e.clientY - drag.y) * k))];
    };
    const onUp = () => {
      drag = null;
      // Dragging away from a chosen region keeps it where it was left
      if (goal) goal = rotation;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={`aspect-square touch-none cursor-grab active:cursor-grabbing ${className ?? ""}`} />;
}
