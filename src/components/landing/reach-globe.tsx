"use client";

import { useEffect, useRef, useState } from "react";
import type { CountryReach, ReachStats } from "@/lib/reach-stats";
import { CountUp } from "./count-up";

type WorldMap = { names: string[]; shapes: number[][][] };
type Shape = { name: string; reach: CountryReach | null; rings: Float64Array[] };

const RAD = Math.PI / 180;
const SPIN = 0.004; // degrees per ms
const GRATICULE = 30; // degrees between grid lines

/** Slowly turning globe with every country outlined and the ones we've reached filled in. */
export function ReachGlobe({ stats, atlasNames }: { stats: ReachStats; atlasNames: Record<string, string> }) {
  const { countries } = stats;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);
  const targetRef = useRef<CountryReach | null>(null);

  const pick = (name: string | null, turnTo = false) => {
    activeRef.current = name;
    setActive(name);
    if (turnTo) targetRef.current = countries.find((c) => c.country === name) ?? null;
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const byAtlasName = new Map(countries.map((c) => [atlasNames[c.country] ?? c.country, c]));

    let shapes: Shape[] = [];
    fetch("/data/world-countries.json")
      .then((r) => r.json())
      .then((m: WorldMap) => {
        shapes = m.names.map((name, i) => ({
          name,
          reach: byAtlasName.get(name) ?? null,
          rings: m.shapes[i].map((r) => Float64Array.from(r)),
        }));
        // Draw reached countries last so their outlines sit on top.
        shapes.sort((a, b) => Number(!!a.reach) - Number(!!b.reach));
      })
      .catch(() => {});

    // Start over Africa, tilted a little to show the north.
    const rot = { lon: 18, lat: 8 };
    // Scrolling the section through the screen turns and tilts the globe on
    // top of its own spin, and it grows in as it arrives. Eased every frame.
    const scroll = { lon: 0, lat: 0, zoom: 1 };
    const scrollTarget = { lon: 0, lat: 0, zoom: 1 };
    const onScroll = () => {
      if (reduce) return;
      const b = wrap.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight - b.top) / (window.innerHeight + b.height)));
      scrollTarget.lon = (p - 0.5) * -140;
      scrollTarget.lat = (0.5 - p) * 30;
      scrollTarget.zoom = 0.8 + 0.2 * Math.min(1, p * 2.2);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    let w = 0, h = 0, dpr = 1;
    let hitPaths: { reach: CountryReach; path: Path2D }[] = [];
    let colors = { fg: "#101828", lime: "#4F7A00", blue: "#3B6CFF", bg: "#FFFFFF" };
    const readColors = () => {
      const s = getComputedStyle(canvas);
      const v = (n: string, d: string) => s.getPropertyValue(n).trim() || d;
      colors = { fg: v("--foreground", colors.fg), lime: v("--lime", colors.lime), blue: v("--blue", colors.blue), bg: v("--surface", colors.bg) };
    };
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };
    resize();
    readColors();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Orthographic projection to unit-disc coordinates; depth < 0 is the far side.
    let sinP0 = 0, cosP0 = 1;
    const project = (lon: number, lat: number) => {
      const p = lat * RAD, l = (lon - rot.lon - scroll.lon) * RAD;
      const cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
      return { x: cp * Math.sin(l), y: cosP0 * sp - sinP0 * cp * cl, depth: sinP0 * sp + cosP0 * cp * cl };
    };

    let raf = 0, last = 0, visible = true, dragging = false, moved = false, px = 0, py = 0;

    const frame = (t: number) => {
      const dt = Math.min(64, t - (last || t));
      last = t;

      const target = targetRef.current;
      if (target) {
        const d = ((target.lon - rot.lon - scroll.lon + 540) % 360) - 180;
        rot.lon += d * 0.08;
        rot.lat += (Math.max(-25, Math.min(35, target.lat)) - scroll.lat - rot.lat) * 0.08;
        if (Math.abs(d) < 0.3) targetRef.current = null;
      } else if (!dragging && !activeRef.current && !reduce) {
        rot.lon -= SPIN * dt; // west to east, like the real thing
      }
      scroll.lon += (scrollTarget.lon - scroll.lon) * 0.1;
      scroll.lat += (scrollTarget.lat - scroll.lat) * 0.1;
      scroll.zoom += (scrollTarget.zoom - scroll.zoom) * 0.1;
      const tilt = Math.max(-60, Math.min(60, rot.lat + scroll.lat));
      sinP0 = Math.sin(tilt * RAD);
      cosP0 = Math.cos(tilt * RAD);

      const R = (Math.min(w, h) / 2 - 6) * scroll.zoom;
      const cx = w / 2, cy = h / 2;
      const X = (x: number) => cx + x * R;
      const Y = (y: number) => cy - y * R;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Ocean: the surface colour with a faint tint.
      ctx.fillStyle = colors.bg;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = colors.fg;
      ctx.fill();

      // Faint latitude/longitude grid.
      ctx.globalAlpha = 0.07;
      ctx.strokeStyle = colors.fg;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      const line = (pts: [number, number][]) => {
        let pen = false;
        for (const [lon, lat] of pts) {
          const q = project(lon, lat);
          if (q.depth < 0) { pen = false; continue; }
          if (pen) ctx.lineTo(X(q.x), Y(q.y));
          else ctx.moveTo(X(q.x), Y(q.y));
          pen = true;
        }
      };
      for (let lon = -180; lon < 180; lon += GRATICULE) line(Array.from({ length: 61 }, (_, i) => [lon, -90 + i * 3]));
      for (let lat = -60; lat <= 60; lat += GRATICULE) line(Array.from({ length: 121 }, (_, i) => [-180 + i * 3, lat]));
      ctx.stroke();

      // Countries. Far-side vertices are pushed onto the rim so fills close
      // neatly at the horizon; outlines only draw the visible edges.
      hitPaths = [];
      const pulse = reduce ? 1 : 0.85 + 0.15 * Math.sin(t * 0.002);
      for (const s of shapes) {
        const fill = new Path2D();
        const edge = new Path2D();
        let any = false;
        for (const r of s.rings) {
          let pen = false, first = true, seen = false;
          for (let k = 0; k < r.length; k += 2) {
            const q = project(r[k], r[k + 1]);
            let x = q.x, y = q.y;
            if (q.depth < 0) {
              const len = Math.hypot(x, y) || 1;
              x /= len; y /= len;
            } else seen = true;
            if (first) fill.moveTo(X(x), Y(y));
            else fill.lineTo(X(x), Y(y));
            first = false;
            if (q.depth < 0) { pen = false; continue; }
            if (pen) edge.lineTo(X(q.x), Y(q.y));
            else edge.moveTo(X(q.x), Y(q.y));
            pen = true;
          }
          fill.closePath();
          any ||= seen;
        }
        if (!any) continue;

        const c = s.reach;
        const on = !!c && activeRef.current === c.country;
        const dim = !!activeRef.current && !on;
        if (c) {
          ctx.fillStyle = c.interns ? colors.lime : colors.blue;
          ctx.globalAlpha = (on ? 0.9 : dim ? 0.3 : c.interns ? 0.62 : 0.42) * (on ? 1 : pulse);
          hitPaths.push({ reach: c, path: fill });
        } else {
          ctx.fillStyle = colors.fg;
          ctx.globalAlpha = 0.07;
        }
        ctx.fill(fill, "evenodd");

        ctx.strokeStyle = c ? (c.interns ? colors.lime : colors.blue) : colors.fg;
        ctx.globalAlpha = c ? (on ? 1 : 0.9) : 0.22;
        ctx.lineWidth = on ? 1.6 : c ? 0.9 : 0.5;
        ctx.lineJoin = "round";
        ctx.stroke(edge);
      }

      // Small pins with a ripple where we have interns.
      for (const [i, c] of countries.entries()) {
        if (!c.interns) continue;
        const q = project(c.lon, c.lat);
        if (q.depth <= 0.05) continue;
        const [x, y] = [X(q.x), Y(q.y)];
        if (!reduce) {
          const ph = (t / 2600 + i * 0.23) % 1;
          ctx.globalAlpha = (1 - ph) * 0.6 * q.depth;
          ctx.strokeStyle = colors.lime;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 2.5 + ph * 12, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = q.depth;
        ctx.fillStyle = colors.bg;
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colors.lime;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Rim.
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = colors.fg;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Keep the tooltip pinned to the active country as the globe turns.
      const tip = tipRef.current;
      const cur = countries.find((c) => c.country === activeRef.current);
      const q = cur && project(cur.lon, cur.lat);
      if (tip) {
        const show = !!q && q.depth > 0;
        tip.style.opacity = show ? "1" : "0";
        if (show) tip.style.transform = `translate(${X(q.x)}px, ${Y(q.y) - 12}px) translate(-50%, -100%)`;
      }

      if (visible) raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(wrap);

    const hit = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      // Paths are in CSS pixels under the dpr transform; the test point is in device pixels.
      const [x, y] = [(e.clientX - b.left) * dpr, (e.clientY - b.top) * dpr];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return hitPaths.findLast((p) => ctx.isPointInPath(p.path, x, y, "evenodd"))?.reach.country ?? null;
    };

    const down = (e: PointerEvent) => {
      dragging = true;
      moved = false;
      px = e.clientX;
      py = e.clientY;
      targetRef.current = null;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (dragging) {
        const [dx, dy] = [e.clientX - px, e.clientY - py];
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        const k = 160 / Math.max(200, Math.min(w, h)); // feel the same at any size
        rot.lon -= dx * k;
        rot.lat = Math.max(-60, Math.min(60, rot.lat + dy * k));
        px = e.clientX;
        py = e.clientY;
        return;
      }
      const name = hit(e);
      if (name !== activeRef.current) pick(name);
      canvas.style.cursor = name ? "pointer" : "grab";
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      canvas.style.cursor = "grab";
      if (!moved) pick(hit(e));
    };
    const leave = () => {
      if (!dragging) pick(null);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      mo.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointerleave", leave);
    };
    // `pick` only touches refs and a state setter, so it is safe to leave out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries, atlasNames]);

  const max = Math.max(1, ...countries.map((c) => c.applied));
  const current = countries.find((c) => c.country === active);
  const figures = [
    { value: stats.applied, label: "lives touched" },
    { value: countries.length, label: "countries" },
    { value: countries.filter((c) => c.interns > 0).length, label: "with interns", lime: true },
  ];

  return (
    <div
      data-reveal
      className="mt-10 grid overflow-hidden rounded-3xl border border-border bg-surface/70 backdrop-blur lg:grid-cols-[1fr_19rem]"
    >
      <div className="relative px-4 pt-6 pb-5 sm:px-8 sm:pt-8">
        <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[32rem]">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full cursor-grab touch-pan-y"
            role="img"
            aria-label={`Globe of the ${countries.length} countries our applicants come from`}
          />
          <div
            ref={tipRef}
            className="pointer-events-none absolute left-0 top-0 z-10 whitespace-nowrap rounded-xl border border-border bg-background/95 px-3.5 py-2.5 text-sm opacity-0 shadow-lg backdrop-blur transition-opacity"
          >
            {current && (
              <>
                <p className="font-semibold">{current.country}</p>
                <p className="text-muted">
                  {current.applied.toLocaleString()} applied
                  {current.interns > 0 && <> · <span className="text-lime">{current.interns} interns</span></>}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-lime" aria-hidden="true" /> Interns from here
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue/70" aria-hidden="true" /> Applicants only
          </span>
          <span>Drag to spin · tap a country</span>
        </div>
      </div>

      <aside className="border-t border-border p-6 sm:p-8 lg:border-t-0 lg:border-l">
        <dl className="grid grid-cols-3 gap-4 lg:grid-cols-1 lg:gap-5">
          {figures.map((f) => (
            <div key={f.label} className="flex flex-col-reverse">
              <dt className="text-xs text-muted sm:text-sm">{f.label}</dt>
              <dd className={`text-2xl font-semibold tracking-[-0.04em] sm:text-4xl ${f.lime ? "text-lime" : ""}`}>
                <CountUp value={f.value} />
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 text-xs font-medium uppercase tracking-[0.14em] text-muted">Top countries</p>
        <ol className="mt-3 space-y-1" onMouseLeave={() => pick(null)}>
          {countries.slice(0, 7).map((c) => (
            <li key={c.country}>
              <button
                type="button"
                onMouseEnter={() => pick(c.country, true)}
                onFocus={() => pick(c.country, true)}
                onClick={() => pick(c.country, true)}
                className={`w-full cursor-pointer rounded-lg px-2 py-1.5 text-left transition-colors ${
                  active === c.country ? "bg-foreground/[0.05]" : ""
                }`}
              >
                <span className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate">{c.country}</span>
                  <span className="tabular-nums text-muted">{c.applied.toLocaleString()}</span>
                </span>
                <span className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-foreground/[0.07]">
                  <span
                    className={`block h-full rounded-full ${c.interns ? "bg-lime" : "bg-blue"}`}
                    // Square-root scale so Nigeria doesn't flatten everyone else.
                    style={{ width: `${Math.max(4, Math.sqrt(c.applied / max) * 100)}%` }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
