import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "portai-reduced-motion";
type Mode = "system" | "on" | "off";

function systemPrefers(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function resolve(mode: Mode): boolean {
  if (mode === "on") return true;
  if (mode === "off") return false;
  return systemPrefers();
}

export function applyReducedMotionAttr(reduced: boolean) {
  if (typeof document === "undefined") return;
  if (reduced) {
    document.documentElement.setAttribute("data-reduced-motion", "true");
  } else {
    document.documentElement.removeAttribute("data-reduced-motion");
  }
}

export function bootReducedMotion() {
  const stored = (typeof localStorage !== "undefined"
    ? (localStorage.getItem(STORAGE_KEY) as Mode | null)
    : null) ?? "system";
  applyReducedMotionAttr(resolve(stored));
}

export function useReducedMotion() {
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof localStorage === "undefined") return "system";
    return ((localStorage.getItem(STORAGE_KEY) as Mode | null) ?? "system");
  });
  const [reduced, setReduced] = useState<boolean>(() => resolve(mode));

  useEffect(() => {
    const resolved = resolve(mode);
    setReduced(resolved);
    applyReducedMotionAttr(resolved);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => {
      const r = mq.matches;
      setReduced(r);
      applyReducedMotionAttr(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((prev) => (resolve(prev) ? "off" : "on"));
  }, []);

  return { mode, setMode, reduced, toggle };
}
