import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { getDrawRows } from "./lib/draws";

/** Base + honeycomb off-state: outer #212226, face #323339, text #757575 */
const UI_BG = "#212226";
const UI_CARD = "#323339";
const UI_NUM_CELL_IDLE = "#323339";
/** Bottom nav + pinned top (toolbar, honeycomb, save row) */
const UI_NAV_BG = "rgba(45, 45, 50, 0.96)";
const HONEY_HEX_FACE_RGBA = "rgba(50,51,57,0.98)";
const HONEY_HEX_STROKE_RGBA = "rgba(42,43,49,0.95)";
const HONEY_HEX_LABEL = "#757575";
/** Toolbar accent (minus bar, inner hex stroke when row-selected, etc.) */
const TOOLBAR_ACCENT_PINK = "rgba(255,80,128,0.98)";
/** Saved rows locked — lock icons (matches ROW_COLORS mint #00ff8c) */
const SAVED_LOCK_ICON_GREEN = "#00ff8c";
/** Onion skin active — toolbar count hex outline (mint, not pink) */
const ONION_ACTIVE_HEX_STROKE = "rgba(0, 255, 140, 0.55)";
/** Saved rows when unlocked — same RGB as × / lock accent, lower alpha for fill */
const SAVED_ROW_UNLOCKED_BG = "rgba(255,80,128,0.18)";
/** Saved rows when locked — green (same hue as ROW_COLORS mint #00ff8c) */
const SAVED_ROW_LOCKED_BG = "rgba(0, 255, 140, 0.14)";
const HEX_FILL = 0x323339;
const HEX_RING = 0x2a2b31;
/** Idle row/honeycomb labels */
const ROW_NUM_TEXT_SHADOW_IDLE = "0 1px 1px rgba(0,0,0,0.5)";
/** Lit row + honeycomb digits (not bonus): black, no shadow */
const LIT_NUM_COLOR = "#000000";
/** Bonus chip dashed border — lit digit matches this */
const BONUS_DASH_RGBA = "rgba(255,255,255,0.2)";

/** Saved / Winning numbers list — shared label + gap above first row (matches rowsRef top pad). */
const SECTION_LIST_LABEL_STYLE = {
  padding: "8px 14px 4px",
  flexShrink: 0,
  fontSize: 10,
  fontWeight: 300,
  letterSpacing: 3,
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.25)"
};
const SECTION_LIST_ROWS_PADDING_TOP = 4;

/** Down chevron (svgrepo.com); rotate 180° for “up” inside hex toolbar */
const HEX_CHEVRON_DOWN_PATH =
  "M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z";

/** Toolbar onion glyph (19×19) */
const ONION_GLYPH_PATH =
  "M18.826 1.85309L17.1469 0.173943C16.9149 -0.057981 16.5392 -0.057981 16.3073 0.173943L15.3239 1.15734C14.5461 1.93973 13.4877 2.37808 12.3845 2.37498L8.90624 2.37884C4.64575 2.37575 1.18831 5.82686 1.18518 10.0883C1.1844 11.4018 1.51838 12.6945 2.15698 13.8426H0.593751C0.265951 13.8426 0 14.1086 0 14.4363C0 14.7641 0.265951 15.0301 0.593751 15.0301H2.18868C2.45463 15.0293 2.71672 15.0889 2.95716 15.2033L1.33671 16.8229C1.10479 17.0549 1.10479 17.4314 1.33671 17.6633C1.56864 17.8952 1.94516 17.8952 2.17709 17.6633L3.79753 16.0429C3.91195 16.2825 3.97148 16.5454 3.97071 16.8113V18.4063C3.97071 18.7341 4.23666 19 4.56446 19C4.89226 19 5.15821 18.7341 5.15821 18.4063V16.843C8.88218 18.9134 13.5797 17.5721 15.6501 13.8479C16.2879 12.6999 16.6227 11.4079 16.6219 10.0944L16.625 6.61542C16.6219 5.51219 17.0603 4.45386 17.8427 3.67605L18.8261 2.69265C19.058 2.46073 19.058 2.08499 18.8261 1.85306L18.826 1.85309ZM3.88725 14.2731C1.58037 11.5 1.95839 7.38252 4.73072 5.07532C7.15125 3.06137 10.6643 3.06137 13.085 5.07532L12.2407 5.91879C9.93465 4.07718 6.57221 4.45297 4.73076 6.75915C3.17294 8.70977 3.17294 11.4791 4.73076 13.4287L3.88725 14.2731ZM6.80735 7.99457C5.81158 8.99266 5.65386 10.5536 6.43007 11.7311L5.57888 12.5822C4.20583 10.7423 4.58466 8.13838 6.42389 6.76534C7.89822 5.66521 9.92141 5.66521 11.3957 6.76534L10.5445 7.61652C9.3663 6.84033 7.80536 6.99804 6.8072 7.99457H6.80735ZM9.67401 8.48626L7.29901 10.8612C6.87533 9.97373 7.25108 8.90997 8.1386 8.48626C8.62413 8.25434 9.18849 8.25434 9.67401 8.48626ZM13.5248 14.712C11.1351 17.0956 7.32375 17.2694 4.72757 15.1125L13.9254 5.9147C16.0824 8.51069 15.9086 12.3222 13.525 14.7119L13.5248 14.712ZM17.0022 2.83709C16.1402 3.69446 15.599 4.82153 15.4691 6.03013C14.8398 5.01504 13.984 4.15999 12.9696 3.53062C14.178 3.40074 15.3052 2.85956 16.1627 1.99755L16.727 1.43396L17.5666 2.27355L17.0022 2.83709Z";

const ROW_COLORS = [
  "#ff78b4",
  "#00ff8c",
  "#00dcdc",
  "#ffcc00",
  "#ff5aa8",
  "#00e070",
  "#00b8c8",
  "#e6b82e",
  "#7a9fff",
  "#ff9ec8",
  "#40ffb8",
  "#40e8e8",
  "#ffd940",
  "#5ae0ff"
];

const GRID_50 = [4, 5, 6, 7, 6, 7, 6, 5, 4];
const GRID_52 = [4, 5, 6, 7, 8, 7, 6, 5, 4];

const HEX_R = 22;
const HEX_W = Math.sqrt(3) * HEX_R;
const HEX_H = 2 * HEX_R;
const COL_S = HEX_W + 2;
const ROW_S = HEX_H * 0.75 + 1.5;
const CANVAS_H = 430;
/** PWA standalone bottom nav — keep rowsScrollBottomPad in sync when changing */
const NAV_H = 58;
const ONION_LEVELS = [2, 3, 5, 8, 13, 21];

const ROWS = getDrawRows();

/** `owner/repo` for GitHub REST — override with `VITE_GITHUB_REPO` in `.env` if forked */
const GITHUB_REPO_FULL =
  typeof import.meta.env?.VITE_GITHUB_REPO === "string" && String(import.meta.env.VITE_GITHUB_REPO).trim()
    ? String(import.meta.env.VITE_GITHUB_REPO).trim()
    : "john-bacic/lotto-honey-pwa";

/**
 * Short SHA for **this** bundle — Vercel sets `VERCEL_GIT_COMMIT_SHA` at build time (new value every deploy).
 * Also reads `__BUILD_GIT_SHA__` from vite `define` as a fallback for the same value.
 */
function shortShaFromThisBuild() {
  const injected =
    typeof __BUILD_GIT_SHA__ !== "undefined" && __BUILD_GIT_SHA__ ? String(__BUILD_GIT_SHA__).trim() : "";
  const fromEnv =
    typeof import.meta.env.VERCEL_GIT_COMMIT_SHA === "string"
      ? import.meta.env.VERCEL_GIT_COMMIT_SHA.trim()
      : "";
  const raw = (fromEnv || injected).toLowerCase();
  if (raw.length < 6 || !/^[0-9a-f]+$/.test(raw)) return null;
  return raw.slice(0, 6);
}

/**
 * iOS WebKit (Safari, home-screen PWA, iPadOS “desktop” Safari): window scroll +
 * fixed header path. Excludes Chrome/Firefox/Edge on iOS. Inner overflow scroll for others.
 */
function isIosWebKitDocumentScroll() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  const iPadDesktopSafari =
    typeof navigator !== "undefined" &&
    navigator.platform === "MacIntel" &&
    navigator.maxTouchPoints > 1;
  const isIosDevice = /iP(hone|ad|od)/.test(ua) || iPadDesktopSafari;
  if (!isIosDevice) return false;
  if (/CriOS|FxiOS|OPiOS|EdgiOS|GSA\//i.test(ua)) return false;
  return /AppleWebKit/i.test(ua);
}

/** 0…1 position of lotto number `num` in 1…totalCells (for gradient). */
function spectrumT(num, totalCells) {
  const i = Math.max(0, Math.min(num - 1, totalCells - 1));
  return totalCells <= 1 ? 0 : i / (totalCells - 1);
}

/** Full hue sweep so ball 1…N maps to a smooth spectrum across the active grid (50 or 52). */
function spectrumHexForNum(num, totalCells) {
  const c = new THREE.Color();
  c.setHSL(spectrumT(num, totalCells), 0.82, 0.46);
  return `#${c.getHexString()}`;
}

function themeRgba(hex, a) {
  const x = hex.replace("#", "");
  const r = parseInt(x.slice(0, 2), 16);
  const g = parseInt(x.slice(2, 4), 16);
  const b = parseInt(x.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function spectrumSpecColorsForNum(n, totalCells, THREE_) {
  const t = spectrumT(n, totalCells);
  const specColor = new THREE_.Color().setHSL(t, 0.82, 0.46);
  const specBorder = specColor.clone();
  const hsl = { h: 0, s: 0, l: 0 };
  specBorder.getHSL(hsl);
  specBorder.setHSL(hsl.h, Math.min(1, hsl.s * 1.1), Math.min(0.78, hsl.l + 0.12));
  return { specColor, specBorder };
}

/** DD.MM.YY ~ $N million (day, month, 2-digit year) */
function formatDrawDateJackpot(dateStr, jackpot) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return `${dateStr} ~ $${Math.round(jackpot / 1_000_000)} million`;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  const millions = Math.round(jackpot / 1_000_000);
  return `${day}.${month}.${year} ~ $${millions} million`;
}

const SAVED_ROWS_STORAGE_KEY = "lotto-honey-saved-rows-v1";

function isValidSavedRow(r) {
  return (
    r &&
    typeof r.id === "string" &&
    Array.isArray(r.nums) &&
    r.nums.length > 0 &&
    r.nums.length <= 8 &&
    r.nums.every((n) => typeof n === "number" && n >= 1 && n <= 52) &&
    typeof r.savedNumber === "number" &&
    r.savedNumber >= 1
  );
}

function loadSavedRowsFromStorage() {
  if (typeof window === "undefined") return { savedRows: [], nextSavedNumber: 1 };
  try {
    const raw = window.localStorage.getItem(SAVED_ROWS_STORAGE_KEY);
    if (!raw) return { savedRows: [], nextSavedNumber: 1 };
    const parsed = JSON.parse(raw);
    const rows = Array.isArray(parsed.savedRows) ? parsed.savedRows.filter(isValidSavedRow) : [];
    const maxSaved = rows.reduce((m, row) => Math.max(m, row.savedNumber), 0);
    const minNextFromRows = maxSaved + 1;
    const stored = Number(parsed.nextSavedNumber);
    let nextSavedNumber =
      Number.isFinite(stored) && stored >= 1 ? Math.trunc(stored) : minNextFromRows;
    if (nextSavedNumber < minNextFromRows) nextSavedNumber = minNextFromRows;
    return { savedRows: rows, nextSavedNumber };
  } catch {
    return { savedRows: [], nextSavedNumber: 1 };
  }
}

function persistSavedRowsToStorage(savedRows, nextSavedNumber) {
  try {
    window.localStorage.setItem(
      SAVED_ROWS_STORAGE_KEY,
      JSON.stringify({ savedRows, nextSavedNumber })
    );
  } catch {
    /* quota / private mode */
  }
}

function getPositions(gridRows) {
  const maxCols = Math.max(...gridRows);
  const pos = [];
  let n = 0;
  const maxRowW = (maxCols - 1) * COL_S;
  const gridH = (gridRows.length - 1) * ROW_S;
  for (let ri = 0; ri < gridRows.length; ri += 1) {
    const rc = gridRows[ri];
    const rowW = (rc - 1) * COL_S;
    for (let ci = 0; ci < rc; ci += 1) {
      n += 1;
      pos.push({
        num: n,
        x: -maxRowW / 2 + (maxRowW - rowW) / 2 + ci * COL_S,
        y: gridH / 2 - ri * ROW_S
      });
    }
  }
  return pos;
}

function getGridSize(gridRows) {
  const maxCols = Math.max(...gridRows);
  return {
    w: (maxCols - 1) * COL_S + HEX_W,
    h: (gridRows.length - 1) * ROW_S + HEX_H
  };
}

function NavButton({ dir, arrowColor, onNav, dimmed = false }) {
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  function startHold() {
    onNav(dir, false);
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => onNav(dir, true), 500);
    }, 500);
  }
  function stopHold() {
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
  }
  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
    },
    []
  );
  return (
    <button
      onPointerDown={startHold}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        background: dimmed ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.03)",
        border: `1.5px solid ${dimmed ? "rgba(255,255,255,0.08)" : `${arrowColor}50`}`,
        width: 100,
        height: 42,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        touchAction: "none"
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={dimmed ? "rgba(255,255,255,0.18)" : arrowColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points={dir === 1 ? "6 9 12 15 18 9" : "6 15 12 9 18 15"} />
      </svg>
    </button>
  );
}

function LockIcon({ locked, color = "rgba(255,255,255,0.65)", size = 13 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      {locked ? <path d="M8 11V8a4 4 0 018 0v3" /> : <path d="M8 11V8a4 4 0 018 0" />}
    </svg>
  );
}

function HexToolbarChevron({ pointUp, chevronFill = HONEY_HEX_LABEL }) {
  return (
    <span
      style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        pointerEvents: "none",
        userSelect: "none"
      }}
      aria-hidden="true"
    >
      <svg
        width={13}
        height={13}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: pointUp ? "rotate(180deg)" : "none",
          transformOrigin: "50% 50%"
        }}
      >
        <path fillRule="evenodd" clipRule="evenodd" d={HEX_CHEVRON_DOWN_PATH} fill={chevronFill} />
      </svg>
    </span>
  );
}

function OnionGlyphIcon({ off = false }) {
  return (
    <span
      style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        pointerEvents: "none",
        userSelect: "none",
        color: off ? HONEY_HEX_LABEL : "rgba(255,255,255,0.55)"
      }}
      aria-hidden="true"
    >
      <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d={ONION_GLYPH_PATH} fill="currentColor" />
      </svg>
    </span>
  );
}

export default function App() {
  const [activeNums, setActiveNums] = useState(new Set());
  const [currentRow, setCurrentRow] = useState(0);
  const [selectedSavedId, setSelectedSavedId] = useState(null);
  const [savedRows, setSavedRows] = useState([]);
  const [nextSavedNumber, setNextSavedNumber] = useState(1);
  const [savedRowsHydrated, setSavedRowsHydrated] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedLocked, setSavedLocked] = useState(true);
  /** Brief filled heart + CSS burst after a row is actually saved */
  const [saveHeartFilled, setSaveHeartFilled] = useState(false);
  const [saveHeartBurstKey, setSaveHeartBurstKey] = useState(0);
  const saveHeartClearRef = useRef(null);
  const [justLitNums, setJustLitNums] = useState(() => new Set());
  const prevLitNumsRef = useRef(new Set());
  const litAnimStartTimersRef = useRef(new Map());
  const litAnimEndTimersRef = useRef(new Map());
  const [selectionRevealNums, setSelectionRevealNums] = useState(() => new Set());
  const selectionRevealTimersRef = useRef([]);
  const [newSavedRowId, setNewSavedRowId] = useState(null);
  const savedRowAnimClearRef = useRef(null);
  const [savedRowsGlow, setSavedRowsGlow] = useState(false);
  /** Pulse color: mint when transitioning into locked (green rows), rose when unlocking. */
  const [savedRowsGlowMint, setSavedRowsGlowMint] = useState(true);
  const savedRowsGlowClearRef = useRef(null);
  const [honeycombVisible, setHoneycombVisible] = useState(true);
  /** When honeycomb is hidden: clicking a ball # in rows toggles that # everywhere */
  const [rowGlobalNums, setRowGlobalNums] = useState(() => new Set());
  const [onionIdx, setOnionIdx] = useState(0);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const enableRowAutoScrollRef = useRef(false);
  const [labelPos, setLabelPos] = useState([]);
  const rowsRef = useRef(null);
  const savedSectionRef = useRef(null);
  /** "Lotto Max - Winning numbers" label — scroll into view after toolbar minus (row off or all nums cleared). */
  const winningNumbersTitleRef = useRef(null);
  const toolbarClearScrollWinningTitleRef = useRef(false);
  const scrollRootRef = useRef(null);
  const lastScrollTopPwaNavRef = useRef(-1);
  /** While true, PWA bottom nav ignores scroll deltas (chevron row navigation scroll). */
  const pwaNavScrollFromChevronSuppressRef = useRef(false);
  const pwaNavChevronSuppressClearTimerRef = useRef(null);
  const pinnedHeaderRef = useRef(null);
  const appRootRef = useRef(null);

  const [documentScrollIos] = useState(isIosWebKitDocumentScroll);
  const [iosHeaderSpacerPx, setIosHeaderSpacerPx] = useState(0);

  useEffect(() => {
    if (documentScrollIos) {
      document.documentElement.classList.add("doc-scroll-ios");
    }
    return () => {
      document.documentElement.classList.remove("doc-scroll-ios");
    };
  }, [documentScrollIos]);

  useEffect(() => {
    function focusScrollSection() {
      const target = scrollRootRef.current || appRootRef.current;
      if (!target) return;
      try {
        target.focus({ preventScroll: true });
      } catch {
        target.focus();
      }
    }
    focusScrollSection();
    const rafId = requestAnimationFrame(focusScrollSection);
    window.addEventListener("pageshow", focusScrollSection);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pageshow", focusScrollSection);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (saveHeartClearRef.current) clearTimeout(saveHeartClearRef.current);
      litAnimStartTimersRef.current.forEach((t) => clearTimeout(t));
      litAnimStartTimersRef.current.clear();
      litAnimEndTimersRef.current.forEach((t) => clearTimeout(t));
      litAnimEndTimersRef.current.clear();
      selectionRevealTimersRef.current.forEach((t) => clearTimeout(t));
      selectionRevealTimersRef.current = [];
      if (savedRowAnimClearRef.current) clearTimeout(savedRowAnimClearRef.current);
      if (savedRowsGlowClearRef.current) clearTimeout(savedRowsGlowClearRef.current);
    };
  }, []);

  function toggleSavedLock() {
    const nextLocked = !savedLocked;
    setSavedRowsGlowMint(nextLocked);
    setSavedLocked(nextLocked);
    setSavedRowsGlow(true);
    if (savedRowsGlowClearRef.current) clearTimeout(savedRowsGlowClearRef.current);
    savedRowsGlowClearRef.current = setTimeout(() => {
      setSavedRowsGlow(false);
      savedRowsGlowClearRef.current = null;
    }, 440);
  }

  useEffect(() => {
    const { savedRows: loaded, nextSavedNumber: next } = loadSavedRowsFromStorage();
    setSavedRows(loaded);
    setNextSavedNumber(next);
    setSavedRowsHydrated(true);
  }, []);

  useEffect(() => {
    if (!savedRowsHydrated) return;
    persistSavedRowsToStorage(savedRows, nextSavedNumber);
  }, [savedRows, nextSavedNumber, savedRowsHydrated]);

  /** Never let the issue counter sit below max(savedNumber)+1 (e.g. after deletes or bad storage). */
  useEffect(() => {
    if (!savedRowsHydrated) return;
    const floor = savedRows.reduce((m, r) => Math.max(m, r.savedNumber), 0) + 1;
    setNextSavedNumber((prev) => (prev < floor ? floor : prev));
  }, [savedRows, savedRowsHydrated]);

  useLayoutEffect(() => {
    if (!documentScrollIos) return undefined;
    const el = pinnedHeaderRef.current;
    if (!el) return undefined;
    function measure() {
      setIosHeaderSpacerPx(el.getBoundingClientRect().height);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, [documentScrollIos, savedOpen, savedRows.length, currentRow, onionIdx, honeycombVisible]);

  useLayoutEffect(() => {
    function resetToTop() {
      if (documentScrollIos) {
        window.scrollTo(0, 0);
      } else if (scrollRootRef.current) {
        scrollRootRef.current.scrollTop = 0;
      }
    }
    resetToTop();
    const id = requestAnimationFrame(resetToTop);
    return () => cancelAnimationFrame(id);
  }, [documentScrollIos]);

  const scrollRowIntoViewBelowPinned = useCallback(
    (ri, behavior = "smooth") => {
      const pinned = pinnedHeaderRef.current;
      const cards = rowsRef.current?.querySelectorAll("[data-ri]");
      const card = cards?.[ri];
      if (!pinned || !card) return;
      const stickyH = pinned.getBoundingClientRect().height;
      const cardRect = card.getBoundingClientRect();

      if (documentScrollIos) {
        const delta = cardRect.top - stickyH;
        if (Math.abs(delta) < 1) return;
        window.scrollTo({ top: window.scrollY + delta, behavior });
        return;
      }

      const root = scrollRootRef.current;
      if (!root) return;
      const rootRect = root.getBoundingClientRect();
      const diff = cardRect.top - rootRect.top;
      const delta = diff - stickyH;
      if (Math.abs(delta) < 1) return;
      root.scrollTo({ top: root.scrollTop + delta, behavior });
    },
    [documentScrollIos]
  );

  const scrollSavedSectionIntoView = useCallback(
    (behavior = "smooth") => {
      const pinned = pinnedHeaderRef.current;
      const block = savedSectionRef.current;
      if (!pinned || !block) return;
      const stickyH = pinned.getBoundingClientRect().height;
      const blockRect = block.getBoundingClientRect();

      if (documentScrollIos) {
        const delta = blockRect.top - stickyH;
        if (Math.abs(delta) < 2) return;
        window.scrollTo({ top: window.scrollY + delta, behavior });
        return;
      }

      const root = scrollRootRef.current;
      if (!root) return;
      const rootRect = root.getBoundingClientRect();
      const diff = blockRect.top - rootRect.top;
      const delta = diff - stickyH;
      if (Math.abs(delta) < 2) return;
      root.scrollTo({ top: root.scrollTop + delta, behavior });
    },
    [documentScrollIos]
  );

  const scrollWinningNumbersTitleIntoView = useCallback(
    (behavior = "smooth") => {
      const pinned = pinnedHeaderRef.current;
      const block = winningNumbersTitleRef.current;
      if (!pinned || !block) return;
      const stickyH = pinned.getBoundingClientRect().height;
      const blockRect = block.getBoundingClientRect();

      if (documentScrollIos) {
        const delta = blockRect.top - stickyH;
        if (Math.abs(delta) < 2) return;
        window.scrollTo({ top: window.scrollY + delta, behavior });
        return;
      }

      const root = scrollRootRef.current;
      if (!root) return;
      const rootRect = root.getBoundingClientRect();
      const diff = blockRect.top - rootRect.top;
      const delta = diff - stickyH;
      if (Math.abs(delta) < 2) return;
      root.scrollTo({ top: root.scrollTop + delta, behavior });
    },
    [documentScrollIos]
  );

  useLayoutEffect(() => {
    if (!savedOpen || savedRows.length === 0) return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) scrollSavedSectionIntoView("smooth");
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [savedOpen, savedRows.length, scrollSavedSectionIntoView]);

  /** After toolbar minus: winning row off, or all lit/global numbers cleared (see clearAll). */
  useLayoutEffect(() => {
    if (!toolbarClearScrollWinningTitleRef.current) return;
    toolbarClearScrollWinningTitleRef.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollWinningNumbersTitleIntoView("smooth");
      });
    });
  }, [currentRow, selectedSavedId, activeNums, rowGlobalNums, scrollWinningNumbersTitleIntoView]);

  function readStandalonePwa() {
    if (typeof window === "undefined") return false;
    try {
      const ios = window.navigator && window.navigator.standalone === true;
      const dm = (q) => window.matchMedia(q).matches;
      return (
        ios ||
        dm("(display-mode: standalone)") ||
        dm("(display-mode: fullscreen)") ||
        dm("(display-mode: minimal-ui)")
      );
    } catch {
      return false;
    }
  }

  const [standalonePwa, setStandalonePwa] = useState(readStandalonePwa);
  const [githubDeployLabel, setGithubDeployLabel] = useState(() => shortShaFromThisBuild());
  /** PWA bottom row nav: Gmail-style hide/show from main scroll (see scroll effect). */
  const [pwaBottomNavHidden, setPwaBottomNavHidden] = useState(false);

  useEffect(() => {
    function checkStandalone() {
      setStandalonePwa(readStandalonePwa());
    }
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", checkStandalone);
    return () => mq.removeEventListener("change", checkStandalone);
  }, []);

  useEffect(() => {
    const fromBuild = shortShaFromThisBuild();
    if (fromBuild) {
      setGithubDeployLabel(fromBuild);
      return;
    }

    const ac = new AbortController();
    let cancelled = false;
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    const base = `https://api.github.com/repos/${GITHUB_REPO_FULL}`;

    (async () => {
      try {
        const cRes = await fetch(`${base}/commits/main?per_page=1`, {
          signal: ac.signal,
          headers,
          cache: "no-store"
        });
        if (!cRes.ok || cancelled) return;
        const c = await cRes.json();
        const sha = typeof c.sha === "string" ? c.sha.slice(0, 6).toLowerCase() : null;
        if (sha && /^[0-9a-f]{6}$/.test(sha)) setGithubDeployLabel(sha);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const onionCount = onionIdx === 0 ? 0 : ONION_LEVELS[onionIdx - 1];

  const gridMode = useMemo(() => {
    if (currentRow < 0) return 52;
    const count = Math.max(onionCount, 1);
    for (let i = 0; i < count && currentRow + i < ROWS.length; i += 1) {
      if (ROWS[currentRow + i].maxNum === 52) return 52;
    }
    return ROWS[currentRow].maxNum;
  }, [currentRow, onionCount]);

  const gridRows = gridMode === 52 ? GRID_52 : GRID_50;
  const totalCells = gridMode === 52 ? 52 : 50;
  const activeRowList = useMemo(() => {
    if (currentRow < 0) return [];
    const count = Math.max(onionCount, 1);
    const list = [];
    for (let i = 0; i < count && currentRow + i < ROWS.length; i += 1) {
      list.push({ ri: currentRow + i, depth: i });
    }
    return list;
  }, [currentRow, onionCount]);

  useEffect(() => {
    selectionRevealTimersRef.current.forEach((t) => clearTimeout(t));
    selectionRevealTimersRef.current = [];

    const hasSelection = currentRow >= 0 || Boolean(selectedSavedId);
    if (!hasSelection) {
      setSelectionRevealNums(new Set());
      return;
    }

    const nums = new Set();
    activeRowList.forEach(({ ri }) => {
      ROWS[ri].nums.forEach((n) => {
        if (n >= 1 && n <= totalCells) nums.add(n);
      });
    });
    const savedSel = savedRows.find((row) => row.id === selectedSavedId);
    if (savedSel) {
      savedSel.nums.forEach((n) => {
        if (n >= 1 && n <= totalCells) nums.add(n);
      });
    }
    const ordered = Array.from(nums).sort((a, b) => a - b);

    if (onionCount > 0) {
      setSelectionRevealNums(new Set(ordered));
      return;
    }

    setSelectionRevealNums(new Set());
    ordered.forEach((n, idx) => {
      const t = setTimeout(() => {
        setSelectionRevealNums((prev) => {
          const next = new Set(prev);
          next.add(n);
          return next;
        });
      }, idx * 55);
      selectionRevealTimersRef.current.push(t);
    });
  }, [currentRow, selectedSavedId, activeRowList, savedRows, totalCells, onionCount]);

  const numBrightness = useMemo(() => {
    const map = {};
    if (!honeycombVisible) {
      rowGlobalNums.forEach((n) => {
        if (n >= 1 && n <= totalCells) map[n] = { brightness: 1 };
      });
      activeNums.forEach((n) => {
        if (n <= totalCells) map[n] = { brightness: 1 };
      });
      activeRowList.forEach(({ ri, depth }) => {
        let b;
        if (depth === 0) b = 1;
        else {
          const skinCount = Math.max(onionCount - 1, 1);
          b = skinCount <= 1 ? 0.75 : 0.75 - ((depth - 1) / (skinCount - 1)) * 0.65;
        }
        ROWS[ri].nums.forEach((n) => {
          if (n >= 1 && n <= totalCells && (!map[n] || map[n].brightness < b)) {
            map[n] = { brightness: b };
          }
        });
      });
      const savedSel = savedRows.find((row) => row.id === selectedSavedId);
      if (savedSel) {
        savedSel.nums.forEach((n) => {
          if (n >= 1 && n <= totalCells && (!map[n] || map[n].brightness < 1)) {
            map[n] = { brightness: 1 };
          }
        });
      }
      return map;
    }
    activeNums.forEach((n) => {
      if (n <= totalCells) map[n] = { brightness: 1 };
    });
    activeRowList.forEach(({ ri, depth }) => {
      let b;
      if (depth === 0) b = 1;
      else {
        const skinCount = Math.max(onionCount - 1, 1);
        b = skinCount <= 1 ? 0.75 : 0.75 - ((depth - 1) / (skinCount - 1)) * 0.65;
      }
      ROWS[ri].nums.forEach((n) => {
        if (n >= 1 && n <= totalCells && (!map[n] || map[n].brightness < b)) {
          map[n] = { brightness: b };
        }
      });
    });
    const savedSel = savedRows.find((row) => row.id === selectedSavedId);
    if (savedSel) {
      savedSel.nums.forEach((n) => {
        if (n >= 1 && n <= totalCells && (!map[n] || map[n].brightness < 1)) {
          map[n] = { brightness: 1 };
        }
      });
    }

    const hasSelection = currentRow >= 0 || Boolean(selectedSavedId);
    if (hasSelection) {
      const selectionNums = new Set();
      activeRowList.forEach(({ ri }) => {
        ROWS[ri].nums.forEach((n) => {
          if (n >= 1 && n <= totalCells) selectionNums.add(n);
        });
      });
      if (savedSel) {
        savedSel.nums.forEach((n) => {
          if (n >= 1 && n <= totalCells) selectionNums.add(n);
        });
      }
      selectionNums.forEach((n) => {
        const litByManual = activeNums.has(n) || (!honeycombVisible && rowGlobalNums.has(n));
        if (!selectionRevealNums.has(n) && !litByManual) delete map[n];
      });
    }

    return map;
  }, [
    honeycombVisible,
    rowGlobalNums,
    activeNums,
    activeRowList,
    onionCount,
    totalCells,
    savedRows,
    selectedSavedId,
    currentRow,
    selectionRevealNums
  ]);

  useEffect(() => {
    const currentlyLit = new Set(
      Object.keys(numBrightness)
        .map((n) => Number(n))
        .filter((n) => n >= 1 && n <= totalCells && Boolean(numBrightness[n]))
    );
    const newlyLit = [];
    currentlyLit.forEach((n) => {
      if (!prevLitNumsRef.current.has(n)) newlyLit.push(n);
    });
    if (newlyLit.length > 0) {
      const staggered =
        onionCount === 0 && (currentRow >= 0 || selectedSavedId !== null);
      const sortedNewlyLit = newlyLit.sort((a, b) => a - b);
      sortedNewlyLit.forEach((n, idx) => {
        const oldStart = litAnimStartTimersRef.current.get(n);
        if (oldStart) clearTimeout(oldStart);
        const oldEnd = litAnimEndTimersRef.current.get(n);
        if (oldEnd) clearTimeout(oldEnd);

        const startDelay = staggered ? idx * 55 : 0;
        const startTimer = setTimeout(() => {
          setJustLitNums((prev) => {
            const next = new Set(prev);
            next.add(n);
            return next;
          });
          litAnimStartTimersRef.current.delete(n);

          const endTimer = setTimeout(() => {
            setJustLitNums((prev) => {
              if (!prev.has(n)) return prev;
              const next = new Set(prev);
              next.delete(n);
              return next;
            });
            litAnimEndTimersRef.current.delete(n);
          }, 420);
          litAnimEndTimersRef.current.set(n, endTimer);
        }, startDelay);
        litAnimStartTimersRef.current.set(n, startTimer);
      });
    }
    prevLitNumsRef.current = currentlyLit;
  }, [numBrightness, totalCells, currentRow, selectedSavedId, onionCount]);

  const anyActive = Object.keys(numBrightness).length > 0;
  const manualCount = activeNums.size;
  const manualLimitReached = manualCount >= 7;

  function toggleNum(n) {
    setActiveNums((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else if (next.size < 7) next.add(n);
      return next;
    });
  }

  function saveManualRow() {
    if (activeNums.size === 0) return;
    const nums = Array.from(activeNums).sort((a, b) => a - b);
    const signature = nums.join("-");
    const alreadySaved = savedRows.some((row) => row.nums.join("-") === signature);
    if (alreadySaved) {
      setSavedOpen(true);
      return;
    }
    const id = `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setSavedRows((prev) => [{ id, nums, savedNumber: nextSavedNumber }, ...prev]);
    setNextSavedNumber((prev) => prev + 1);
    setSelectedSavedId(null);
    setNewSavedRowId(id);
    if (savedRowAnimClearRef.current) clearTimeout(savedRowAnimClearRef.current);
    savedRowAnimClearRef.current = setTimeout(() => {
      setNewSavedRowId((prev) => (prev === id ? null : prev));
      savedRowAnimClearRef.current = null;
    }, 720);
    setCurrentRow(-1);
    setSavedOpen(true);
    if (saveHeartClearRef.current) clearTimeout(saveHeartClearRef.current);
    setSaveHeartBurstKey((k) => k + 1);
    setSaveHeartFilled(true);
    saveHeartClearRef.current = setTimeout(() => {
      setSaveHeartFilled(false);
      saveHeartClearRef.current = null;
    }, 950);
  }

  function deleteSavedRow(id) {
    setSavedRows((prev) => prev.filter((row) => row.id !== id));
    setSelectedSavedId((prev) => (prev === id ? null : prev));
  }

  function tapSavedRow(id) {
    setSelectedSavedId((prev) => (prev === id ? null : id));
    setCurrentRow(-1);
  }

  function clearAll() {
    setOnionIdx(0);
    if (currentRow >= 0 || selectedSavedId) {
      if (currentRow >= 0) {
        toolbarClearScrollWinningTitleRef.current = true;
      }
      setCurrentRow(-1);
      setSelectedSavedId(null);
      return;
    }
    toolbarClearScrollWinningTitleRef.current = true;
    setActiveNums(new Set());
    setRowGlobalNums(new Set());
  }

  const arrowNav = useCallback(
    (dir, allowLoop = false) => {
      enableRowAutoScrollRef.current = true;
      if (selectedSavedId != null && savedRows.length > 0) {
        const idx = savedRows.findIndex((r) => r.id === selectedSavedId);
        if (idx !== -1) {
          let nextIdx = idx + dir;
          if (!allowLoop) {
            nextIdx = Math.max(0, Math.min(savedRows.length - 1, nextIdx));
          } else if (nextIdx < 0) {
            nextIdx = savedRows.length - 1;
          } else if (nextIdx >= savedRows.length) {
            nextIdx = 0;
          }
          if (nextIdx !== idx) {
            setSelectedSavedId(savedRows[nextIdx].id);
          }
          return;
        }
      }
      setSelectedSavedId(null);
      setCurrentRow((prev) => {
        let next;
        if (prev === -1) next = dir === 1 ? 0 : ROWS.length - 1;
        else {
          next = prev + dir;
          if (next < 0) next = allowLoop ? ROWS.length - 1 : 0;
          if (next >= ROWS.length) next = allowLoop ? 0 : ROWS.length - 1;
        }
        return next;
      });
    },
    [selectedSavedId, savedRows]
  );

  const bottomNavArrowNav = useCallback(
    (dir, allowLoop) => {
      pwaNavScrollFromChevronSuppressRef.current = true;
      if (pwaNavChevronSuppressClearTimerRef.current != null) {
        clearTimeout(pwaNavChevronSuppressClearTimerRef.current);
      }
      pwaNavChevronSuppressClearTimerRef.current = window.setTimeout(() => {
        pwaNavChevronSuppressClearTimerRef.current = null;
        pwaNavScrollFromChevronSuppressRef.current = false;
        lastScrollTopPwaNavRef.current = -1;
      }, 550);
      arrowNav(dir, allowLoop);
    },
    [arrowNav]
  );

  useEffect(() => {
    if (currentRow < 0) return;
    if (!enableRowAutoScrollRef.current) {
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollRowIntoViewBelowPinned(currentRow, "smooth");
      });
    });
    return () => cancelAnimationFrame(id);
  }, [currentRow, scrollRowIntoViewBelowPinned]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        enableRowAutoScrollRef.current = true;
        arrowNav(1, event.repeat);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        enableRowAutoScrollRef.current = true;
        arrowNav(-1, event.repeat);
      }
    }

    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [arrowNav]);

  const tapRow = (ri) => {
    enableRowAutoScrollRef.current = true;
    setSelectedSavedId(null);
    setCurrentRow((prev) => (prev === ri ? -1 : ri));
  };

  function toggleRowGlobalNum(e, n) {
    if (honeycombVisible || n < 1 || n > totalCells) return;
    e.stopPropagation();
    setRowGlobalNums((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  function hideHoneycomb() {
    setHoneycombVisible(false);
  }

  const buildScene = useCallback((el, gRows, tc) => {
    if (sceneRef.current) {
      cancelAnimationFrame(sceneRef.current.raf);
      sceneRef.current.ren.dispose();
      if (el.contains(sceneRef.current.ren.domElement)) el.removeChild(sceneRef.current.ren.domElement);
    }

    const cW = el.clientWidth || 360;
    const cH = CANVAS_H;
    const pad = 12;
    const gs = getGridSize(gRows);
    const gA = gs.w / gs.h;
    const cA = cW / cH;
    let camW;
    let camH;
    if (cA > gA) {
      camH = gs.h + pad * 2;
      camW = camH * cA;
    } else {
      camW = gs.w + pad * 2;
      camH = camW / cA;
    }

    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-camW / 2, camW / 2, camH / 2, -camH / 2, 1, 100);
    cam.position.z = 10;
    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ren.setSize(cW, cH);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ren.setClearColor(0x000000, 0);
    ren.domElement.style.background = "transparent";
    el.appendChild(ren.domElement);

    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      if (i === 0) shape.moveTo(HEX_R * Math.cos(a), HEX_R * Math.sin(a));
      else shape.lineTo(HEX_R * Math.cos(a), HEX_R * Math.sin(a));
    }
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);

    // Use clean concentric radii for a visually even inset ring.
    const innerOuterR = HEX_R - 1.8;
    const innerInnerR = HEX_R - 3.2;
    const innerRingShape = new THREE.Shape();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      if (i === 0) innerRingShape.moveTo(innerOuterR * Math.cos(a), innerOuterR * Math.sin(a));
      else innerRingShape.lineTo(innerOuterR * Math.cos(a), innerOuterR * Math.sin(a));
    }
    innerRingShape.closePath();
    const innerHole = new THREE.Path();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      if (i === 0) innerHole.moveTo(innerInnerR * Math.cos(a), innerInnerR * Math.sin(a));
      else innerHole.lineTo(innerInnerR * Math.cos(a), innerInnerR * Math.sin(a));
    }
    innerHole.closePath();
    innerRingShape.holes.push(innerHole);
    const innerRingGeo = new THREE.ShapeGeometry(innerRingShape);

    const outR = HEX_R + 1.8;
    const outShape = new THREE.Shape();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      if (i === 0) outShape.moveTo(outR * Math.cos(a), outR * Math.sin(a));
      else outShape.lineTo(outR * Math.cos(a), outR * Math.sin(a));
    }
    outShape.closePath();
    const outGeo = new THREE.ShapeGeometry(outShape);

    const pos = getPositions(gRows);
    const meshes = {};
    pos.forEach(({ num: n, x, y }) => {
      const outMat = new THREE.MeshBasicMaterial({ color: HEX_RING });
      const outMesh = new THREE.Mesh(outGeo, outMat);
      outMesh.position.set(x, y, 0);
      scene.add(outMesh);

      const mat = new THREE.MeshBasicMaterial({ color: HEX_FILL });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 1);
      scene.add(mesh);

      const innerMat = new THREE.MeshBasicMaterial({ color: HEX_FILL, transparent: true, opacity: 0 });
      const innerMesh = new THREE.Mesh(innerRingGeo, innerMat);
      innerMesh.position.set(x, y, 1.5);
      scene.add(innerMesh);

      const { specColor, specBorder } = spectrumSpecColorsForNum(n, tc, THREE);
      meshes[n] = {
        mesh,
        mat,
        innerMesh,
        innerMat,
        outMesh,
        outMat,
        specColor,
        specBorder,
        tgt: 1,
        cur: 1,
        pulse: 0,
        pulseTgt: 0
      };
    });

    const labels = pos.map(({ num: n, x, y }) => {
      const v = new THREE.Vector3(x, y, 1);
      v.project(cam);
      return { num: n, left: ((v.x + 1) / 2) * cW, top: ((-v.y + 1) / 2) * cH };
    });
    setLabelPos(labels);

    const state = { meshes, ren, scene, cam, raf: 0, tc };
    sceneRef.current = state;

    function loop() {
      state.raf = requestAnimationFrame(loop);
      for (let i = 1; i <= tc; i += 1) {
        const m = state.meshes[i];
        m.cur += (m.tgt - m.cur) * 0.14;
        m.pulse += (m.pulseTgt - m.pulse) * 0.5;
        const pulseScale = 1 + m.pulse * 0.0;
        const s = m.cur * pulseScale;
        m.mesh.scale.setScalar(s);
        m.innerMesh.scale.setScalar(s);
        m.outMesh.scale.setScalar(s);
      }
      ren.render(scene, cam);
    }
    loop();
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    buildScene(el, gridRows, totalCells);
    return () => {
      if (!sceneRef.current) return;
      cancelAnimationFrame(sceneRef.current.raf);
      sceneRef.current.ren.dispose();
      if (el.contains(sceneRef.current.ren.domElement)) el.removeChild(sceneRef.current.ren.domElement);
      sceneRef.current = null;
    };
  }, [buildScene, gridRows, totalCells]);

  /** When the grid is shown again, sync drawing buffer size (canvas stays mounted; was off-screen). */
  useLayoutEffect(() => {
    if (!honeycombVisible || !sceneRef.current || !mountRef.current) return;
    const st = sceneRef.current;
    const w = mountRef.current.clientWidth || 360;
    st.ren.setSize(w, CANVAS_H);
    st.ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    st.ren.render(st.scene, st.cam);
  }, [honeycombVisible]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { meshes, tc } = sceneRef.current;
    const black = new THREE.Color(HEX_FILL);
    const darkBorder = new THREE.Color(HEX_RING);
    for (let n = 1; n <= tc; n += 1) {
      const h = meshes[n];
      if (!h) continue;
      const info = numBrightness[n];
      if (info) {
        const b = info.brightness;
        h.mat.color.copy(new THREE.Color().copy(black).lerp(h.specColor, b));
        h.outMat.color.copy(new THREE.Color().copy(darkBorder).lerp(h.specBorder, b));
        h.tgt = 0.95 + b * 0.0;
      } else {
        h.mat.color.set(HEX_FILL);
        h.outMat.color.set(HEX_RING);
        h.tgt = 1;
      }
      h.pulseTgt = justLitNums.has(n) ? 1 : 0;
      h.innerMat.opacity = activeNums.has(n) ? 1 : 0;
    }
  }, [numBrightness, totalCells, activeNums, justLitNums]);

  const savedSelectedIndex = useMemo(() => {
    if (!selectedSavedId) return -1;
    return savedRows.findIndex((r) => r.id === selectedSavedId);
  }, [selectedSavedId, savedRows]);

  const arrowColor =
    savedSelectedIndex >= 0
      ? ROW_COLORS[savedSelectedIndex % ROW_COLORS.length]
      : currentRow >= 0
        ? ROW_COLORS[currentRow % ROW_COLORS.length]
        : HONEY_HEX_LABEL;
  const atTopBoundary =
    savedSelectedIndex >= 0 ? savedSelectedIndex === 0 : currentRow === 0;
  const atBottomBoundary =
    savedSelectedIndex >= 0
      ? savedSelectedIndex >= savedRows.length - 1
      : currentRow === ROWS.length - 1;
  const hasRowLikeSelection = currentRow >= 0 || selectedSavedId !== null;
  /** PWA fixed row nav — only when a winning or saved row is actively selected */
  const showPwaBottomRowNav = standalonePwa && hasRowLikeSelection;

  useEffect(() => {
    if (!showPwaBottomRowNav) {
      setPwaBottomNavHidden(false);
      pwaNavScrollFromChevronSuppressRef.current = false;
      if (pwaNavChevronSuppressClearTimerRef.current != null) {
        clearTimeout(pwaNavChevronSuppressClearTimerRef.current);
        pwaNavChevronSuppressClearTimerRef.current = null;
      }
    }
  }, [showPwaBottomRowNav]);

  /** PWA: Gmail-style — scroll down the list hides bar; scroll up shows it again. */
  useEffect(() => {
    if (!standalonePwa || !showPwaBottomRowNav) return;

    const DELTA = 8;
    const getScrollTop = () =>
      documentScrollIos ? window.scrollY || 0 : scrollRootRef.current?.scrollTop ?? 0;

    let rafOuter = 0;
    let rafPoll = 0;
    let scrollEl = null;

    const onScroll = () => {
      cancelAnimationFrame(rafOuter);
      rafOuter = requestAnimationFrame(() => {
        const st = getScrollTop();
        if (pwaNavScrollFromChevronSuppressRef.current) {
          lastScrollTopPwaNavRef.current = st;
          return;
        }
        if (lastScrollTopPwaNavRef.current < 0) {
          lastScrollTopPwaNavRef.current = st;
          return;
        }
        const dy = st - lastScrollTopPwaNavRef.current;
        lastScrollTopPwaNavRef.current = st;
        if (st <= 1) {
          setPwaBottomNavHidden(false);
        } else if (dy > DELTA) {
          setPwaBottomNavHidden(true);
        } else if (dy < -DELTA) {
          setPwaBottomNavHidden(false);
        }
      });
    };

    lastScrollTopPwaNavRef.current = -1;

    if (documentScrollIos) {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => {
        cancelAnimationFrame(rafOuter);
        window.removeEventListener("scroll", onScroll);
        lastScrollTopPwaNavRef.current = -1;
        if (pwaNavChevronSuppressClearTimerRef.current != null) {
          clearTimeout(pwaNavChevronSuppressClearTimerRef.current);
          pwaNavChevronSuppressClearTimerRef.current = null;
        }
      };
    }

    const tryAttach = () => {
      const el = scrollRootRef.current;
      if (!el) {
        rafPoll = requestAnimationFrame(tryAttach);
        return;
      }
      scrollEl = el;
      el.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    };
    rafPoll = requestAnimationFrame(tryAttach);

    return () => {
      cancelAnimationFrame(rafOuter);
      cancelAnimationFrame(rafPoll);
      scrollEl?.removeEventListener("scroll", onScroll);
      lastScrollTopPwaNavRef.current = -1;
      if (pwaNavChevronSuppressClearTimerRef.current != null) {
        clearTimeout(pwaNavChevronSuppressClearTimerRef.current);
        pwaNavChevronSuppressClearTimerRef.current = null;
      }
    };
  }, [standalonePwa, showPwaBottomRowNav, documentScrollIos]);

  const canTurnOff =
    currentRow >= 0 ||
    selectedSavedId !== null ||
    activeNums.size > 0 ||
    (!honeycombVisible && rowGlobalNums.size > 0);
  const hasManualClear = activeNums.size > 0;
  const topDraw = currentRow >= 0 ? ROWS[currentRow] : ROWS[0] ?? null;
  const topRowColor = ROW_COLORS[(currentRow >= 0 ? currentRow : 0) % ROW_COLORS.length];
  /** Date + jackpot in toolbar only when a winning row is selected (saved-only → blank). */
  const showHeaderDrawDateJackpot = canTurnOff && hasRowLikeSelection && currentRow >= 0;

  const rowsScrollBottomPad =
    showPwaBottomRowNav && !pwaBottomNavHidden
      ? `calc(${NAV_H + 20}px + env(safe-area-inset-bottom, 0px))`
      : standalonePwa
        ? `calc(20px + env(safe-area-inset-bottom, 0px))`
        : "20px";

  return (
    <div
      ref={appRootRef}
      tabIndex={-1}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        ...(documentScrollIos
          ? {
              width: "100%",
              minHeight: "100%",
              display: "block"
            }
          : {
              flex: 1,
              minHeight: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column"
            }),
        boxSizing: "border-box",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        background: UI_BG,
        fontFamily: "Outfit,sans-serif",
        color: "rgba(255,255,255,0.92)",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none"
      }}
    >
      <div
        ref={documentScrollIos ? undefined : scrollRootRef}
        tabIndex={-1}
        style={
          documentScrollIos
            ? {
                display: "block",
                width: "100%",
                minHeight: "min-content"
              }
            : {
                flex: 1,
                minHeight: 0,
                width: "100%",
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                overscrollBehaviorY: "contain",
                display: "flex",
                flexDirection: "column",
                outline: "none"
              }
        }
      >
      <div
        ref={pinnedHeaderRef}
        style={{
          ...(documentScrollIos
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 25,
                paddingLeft: "env(safe-area-inset-left, 0px)",
                paddingRight: "env(safe-area-inset-right, 0px)",
                boxSizing: "border-box"
              }
            : {
                position: "sticky",
                top: 0,
                zIndex: 10,
                flexShrink: 0
              }),
          width: "100%",
          background: UI_NAV_BG,
          paddingTop: "env(safe-area-inset-top, 0px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            width: "100%",
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 6,
            paddingBottom: 0,
            boxSizing: "border-box",
            flexShrink: 0
          }}
        >
          <div style={{ justifySelf: "start" }}>
          <button
            onClick={clearAll}
            style={{
              position: "relative",
              width: 44,
              height: 44,
              border: "none",
              padding: 0,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              alignSelf: "center"
            }}
          >
            <svg
              width="44"
              height="44"
              viewBox="0 0 100 100"
              style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
              aria-hidden="true"
            >
              <polygon
                points="50,2 93,25 93,75 50,98 7,75 7,25"
                fill={canTurnOff ? HONEY_HEX_FACE_RGBA : "rgba(255,255,255,0.05)"}
                stroke={hasRowLikeSelection ? TOOLBAR_ACCENT_PINK : HONEY_HEX_STROKE_RGBA}
                strokeWidth="4"
              />
              {hasManualClear && (
                <polygon
                  points="50,11 85,30 85,70 50,89 15,70 15,30"
                  fill="none"
                  stroke={TOOLBAR_ACCENT_PINK}
                  strokeWidth="4"
                />
              )}
            </svg>
            <span
              style={{
                position: "relative",
                zIndex: 1,
                width: 12,
                height: 2,
                borderRadius: 999,
                background: canTurnOff ? TOOLBAR_ACCENT_PINK : HONEY_HEX_LABEL
              }}
            />
          </button>
          </div>

          <div style={{ justifySelf: "center" }}>
            <button
              type="button"
              onClick={() => (honeycombVisible ? hideHoneycomb() : setHoneycombVisible(true))}
              aria-label={honeycombVisible ? "Hide honeycomb" : "Show honeycomb"}
              title={honeycombVisible ? "Hide honeycomb" : "Show honeycomb"}
              style={{
                position: "relative",
                width: 44,
                height: 44,
                padding: 0,
                border: "none",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0
              }}
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 100 100"
                style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                aria-hidden="true"
              >
                <polygon
                  points="50,2 93,25 93,75 50,98 7,75 7,25"
                  fill={honeycombVisible ? HONEY_HEX_FACE_RGBA : "rgba(255,255,255,0.05)"}
                  stroke={HONEY_HEX_STROKE_RGBA}
                  strokeWidth="4"
                />
              </svg>
              <HexToolbarChevron pointUp={honeycombVisible} chevronFill={TOOLBAR_ACCENT_PINK} />
            </button>
          </div>

          <div
            style={{ justifySelf: "end", width: 44, height: 44, flexShrink: 0, alignSelf: "center" }}
            aria-hidden="true"
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 0,
            paddingBottom: 0,
            marginTop: honeycombVisible ? -12 : 0,
            marginBottom: 0,
            minHeight: 0,
            height: honeycombVisible ? undefined : 0,
            overflow: "visible",
            position: "relative",
            width: "100%"
          }}
        >
          <div
            style={{
              position: honeycombVisible ? "relative" : "absolute",
              left: honeycombVisible ? "auto" : -10000,
              top: 0,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              visibility: honeycombVisible ? "visible" : "hidden",
              pointerEvents: honeycombVisible ? "auto" : "none",
              flexShrink: 0
            }}
            aria-hidden={!honeycombVisible}
          >
            <div style={{ position: "relative", width: "100%", maxWidth: 480 }}>
              <div ref={mountRef} style={{ width: "100%", height: CANVAS_H }} />
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: CANVAS_H, pointerEvents: "auto" }}>
                {labelPos.map(({ num: n, left, top }) => {
                  const info = numBrightness[n];
                  const isOn = Boolean(info);
                  const isBlocked = manualLimitReached && !activeNums.has(n);
                  const labelColor = isBlocked
                    ? "rgba(52,54,58,0.95)"
                    : isOn
                      ? LIT_NUM_COLOR
                      : HONEY_HEX_LABEL;
                  return (
                    <div
                      key={n}
                      onClick={() => {
                        if (!isBlocked) toggleNum(n);
                      }}
                      style={{
                        position: "absolute",
                        left,
                        top,
                        transform: "translate(-50%, -50%)",
                        width: 34,
                        height: 34,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: labelColor,
                        textShadow: isBlocked || isOn ? "none" : ROW_NUM_TEXT_SHADOW_IDLE,
                        pointerEvents: "auto",
                        cursor: isBlocked ? "not-allowed" : "pointer"
                      }}
                    >
                      {n}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: honeycombVisible ? "4px 14px 2px" : "0 14px 2px",
            flexShrink: 0,
            fontSize: 10,
            fontWeight: 300,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)"
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              columnGap: 8,
              marginBottom: 4,
              width: "100%"
            }}
          >
            <div style={{ justifySelf: "start", minWidth: 0 }}>
              {manualCount > 0 ? (
                <button
                  type="button"
                  onClick={saveManualRow}
                  className="save-btn save-btn--ready"
                  aria-label={`Save ${manualCount} numbers to saved rows`}
                  title={`Save ${manualCount} number${manualCount === 1 ? "" : "s"}`}
                  style={{
                    position: "relative",
                    width: 44,
                    height: 44,
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                >
                  <span className="save-btn-glow" aria-hidden="true" />
                  <svg
                    width="44"
                    height="44"
                    viewBox="0 0 100 100"
                    style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                    aria-hidden="true"
                  >
                    <polygon
                      points="50,2 93,25 93,75 50,98 7,75 7,25"
                      fill={HONEY_HEX_FACE_RGBA}
                      stroke={HONEY_HEX_STROKE_RGBA}
                      strokeWidth="4"
                    />
                  </svg>
                  <span
                    key={saveHeartBurstKey}
                    className={`save-heart-wrap${saveHeartFilled ? " save-heart-wrap--burst" : ""}`}
                    style={{
                      position: "relative",
                      zIndex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,80,128,0.98)"
                    }}
                    aria-hidden="true"
                  >
                    <svg
                      className={`save-heart-svg${saveHeartFilled ? " save-heart-svg--filled" : ""}`}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </span>
                </button>
              ) : (
                <div
                  aria-hidden
                  style={{ width: 44, height: 44, flexShrink: 0, pointerEvents: "none" }}
                />
              )}
            </div>
            <div
              style={{
                justifySelf: "center",
                textAlign: "center",
                minWidth: 0,
                maxWidth: "100%",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: 1,
                textTransform: "none",
                color: showHeaderDrawDateJackpot ? topRowColor : "rgba(255,255,255,0.25)",
                lineHeight: 1.25
              }}
            >
              {showHeaderDrawDateJackpot && topDraw
                ? formatDrawDateJackpot(topDraw.date, topDraw.jackpot)
                : "\u00a0"}
            </div>
            <div
              style={{
                justifySelf: "end",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 6,
                flexShrink: 0,
                minHeight: 44,
                /** Honeycomb hidden: shift up by one toolbar hex (same size as show/hide honeycomb). */
                marginTop: honeycombVisible ? 0 : -44
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  flexShrink: 0,
                  minHeight: 44
                }}
              >
                {onionCount > 0 ? (
                  <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                    <svg
                      width="44"
                      height="44"
                      viewBox="0 0 100 100"
                      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                      aria-hidden="true"
                    >
                      <polygon
                        points="50,2 93,25 93,75 50,98 7,75 7,25"
                        fill={HONEY_HEX_FACE_RGBA}
                        stroke={ONION_ACTIVE_HEX_STROKE}
                        strokeWidth="4"
                      />
                    </svg>
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 1,
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "'Outfit', -apple-system, sans-serif",
                        letterSpacing: "-0.055em",
                        textAlign: "center",
                        color: SAVED_LOCK_ICON_GREEN,
                        pointerEvents: "none",
                        lineHeight: 1
                      }}
                    >
                      {onionCount}
                    </span>
                  </div>
                ) : (
                  <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                    <svg
                      width="44"
                      height="44"
                      viewBox="0 0 100 100"
                      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                      aria-hidden="true"
                    >
                      <polygon
                        points="50,2 93,25 93,75 50,98 7,75 7,25"
                        fill="rgba(255,255,255,0.05)"
                        stroke={HONEY_HEX_STROKE_RGBA}
                        strokeWidth="4"
                      />
                    </svg>
                    <OnionGlyphIcon off />
                  </div>
                )}
                <select
                  aria-label="Onion skin level"
                  value={onionIdx}
                  onChange={(e) => setOnionIdx(Number(e.target.value))}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  <option value={0}>OFF</option>
                  {ONION_LEVELS.map((level, idx) => (
                    <option key={level} value={idx + 1}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              {savedRows.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSavedOpen((prev) => !prev)}
                  aria-label={
                    savedOpen
                      ? `Collapse saved numbers (${savedRows.length})`
                      : `Expand saved numbers (${savedRows.length})`
                  }
                  title={
                    savedOpen
                      ? `Hide saved rows (${savedRows.length})`
                      : `Show saved rows (${savedRows.length})`
                  }
                  style={{
                    position: "relative",
                    width: 44,
                    height: 44,
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                >
                  <svg
                    width="44"
                    height="44"
                    viewBox="0 0 100 100"
                    style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                    aria-hidden="true"
                  >
                    <polygon
                      points="50,2 93,25 93,75 50,98 7,75 7,25"
                      fill={HONEY_HEX_FACE_RGBA}
                      stroke={HONEY_HEX_STROKE_RGBA}
                      strokeWidth="4"
                    />
                  </svg>
                  <HexToolbarChevron pointUp={savedOpen} chevronFill={TOOLBAR_ACCENT_PINK} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {documentScrollIos && (
        <div
          aria-hidden
          style={{
            width: "100%",
            height: iosHeaderSpacerPx,
            flexShrink: 0,
            pointerEvents: "none"
          }}
        />
      )}

      {savedOpen && (
        <div ref={savedSectionRef} style={{ flexShrink: 0 }}>
          {savedRows.length > 0 && (
            <div
              style={{
                ...SECTION_LIST_LABEL_STYLE,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 4,
                padding: "8px 8px 4px 14px"
              }}
            >
              <span style={{ lineHeight: 1 }}>Saved</span>
              <button
                type="button"
                onClick={toggleSavedLock}
                style={{
                  width: 24,
                  height: 24,
                  marginRight: 3,
                  borderRadius: 999,
                  border: "none",
                  background: "transparent",
                  color: savedLocked ? SAVED_LOCK_ICON_GREEN : TOOLBAR_ACCENT_PINK,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1,
                  cursor: "pointer"
                }}
                title={savedLocked ? "Unlock all saved rows" : "Lock all saved rows"}
              >
                {savedLocked ? <LockIcon locked color={SAVED_LOCK_ICON_GREEN} size={12} /> : "×"}
              </button>
            </div>
          )}
          <div style={{ flexShrink: 0, padding: `${SECTION_LIST_ROWS_PADDING_TOP}px 0 6px` }}>
          {savedRows.length > 0 &&
            savedRows.map((row, ri) => {
              const color = ROW_COLORS[ri % ROW_COLORS.length];
              const isCurrent = selectedSavedId === row.id;
              /** Selected: same idea as winning rows — near-UI gray with a hint of row stripe (`${color}14` onion tint); a touch darker than 14. */
              const savedRowBg = isCurrent
                ? `${color}10`
                : savedLocked
                  ? SAVED_ROW_LOCKED_BG
                  : SAVED_ROW_UNLOCKED_BG;
              return (
                <div
                  key={row.id}
                  className={[
                    newSavedRowId === row.id ? "saved-row--drop-in" : "",
                    savedRowsGlow
                      ? savedRowsGlowMint
                        ? "saved-row--lock-glow-mint"
                        : "saved-row--lock-glow-rose"
                      : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => tapSavedRow(row.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 8px",
                    marginBottom: 4,
                    background: savedRowBg,
                    border: `2px solid ${isCurrent ? color : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 8,
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flexShrink: 0 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isCurrent ? color : "rgba(255,255,255,0.08)"
                      }}
                    >
                      <span style={{ color: "#000000", opacity: 0.5, fontSize: 11, fontWeight: 700, lineHeight: 1 }}>
                        {savedRows.length - ri}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flex: 1, justifyContent: "center" }}>
                    <div style={{ display: "flex", gap: 4, width: 332 }}>
                      {Array.from({ length: 8 }).map((_, slotIdx) => {
                        const n = row.nums[slotIdx];
                        if (!n) {
                          return <div key={`${row.id}-empty-${slotIdx}`} style={{ width: 38, height: 34, borderRadius: 5, opacity: 0 }} />;
                        }
                        const th = spectrumHexForNum(n, totalCells);
                        const numOn = n >= 1 && n <= totalCells && Boolean(numBrightness[n]);
                        const b = numBrightness[n]?.brightness || 0;
                        return (
                          <div
                            key={`${row.id}-${n}-${slotIdx}`}
                            role="presentation"
                            onClick={(e) => toggleRowGlobalNum(e, n)}
                            style={{
                              width: 38,
                              height: 34,
                              borderRadius: 5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              fontWeight: 600,
                              color: numOn ? LIT_NUM_COLOR : "rgba(255,255,255,0.75)",
                              background: numOn ? themeRgba(th, 0.15 + b * 0.85) : "transparent",
                              textShadow: numOn ? "none" : ROW_NUM_TEXT_SHADOW_IDLE,
                              transition: "all 0.25s",
                              cursor: honeycombVisible ? "inherit" : "pointer"
                            }}
                          >
                            {n}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!savedLocked) deleteSavedRow(row.id);
                    }}
                    disabled={savedLocked}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      border: savedLocked
                        ? "1px solid rgba(255,255,255,0.12)"
                        : "1px solid rgba(255, 80, 128, 0.35)",
                      background: savedLocked ? "rgba(255,255,255,0.03)" : "rgba(255, 80, 128, 0.08)",
                      color: savedLocked ? SAVED_LOCK_ICON_GREEN : TOOLBAR_ACCENT_PINK,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      lineHeight: 1,
                      cursor: savedLocked ? "not-allowed" : "pointer",
                      opacity: 1
                    }}
                    title={savedLocked ? "All saved rows are locked" : "Delete saved row"}
                  >
                    {savedLocked ? <LockIcon locked color={SAVED_LOCK_ICON_GREEN} /> : "×"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        ref={winningNumbersTitleRef}
        style={{
          ...SECTION_LIST_LABEL_STYLE,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10
        }}
      >
        <span>Lotto Max - Winning numbers</span>
        {githubDeployLabel != null ? (
          <span
            style={{
              flexShrink: 0,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: 1.2,
              textTransform: "none",
              color: "rgba(255,255,255,0.38)"
            }}
            title="Commit for this build (set on each Vercel deploy). Locally: latest main from GitHub, no cache."
          >
            {githubDeployLabel}
          </span>
        ) : null}
      </div>

      <div
        ref={rowsRef}
        style={{
          padding: `${SECTION_LIST_ROWS_PADDING_TOP}px 0 ${rowsScrollBottomPad}`
        }}
      >
        {ROWS.map((row, ri) => {
          const color = ROW_COLORS[ri % ROW_COLORS.length];
          const isCurrent = currentRow === ri;
          const onionEntry = activeRowList.find((o) => o.ri === ri);
          const isOnion = Boolean(onionEntry);
          const depth = onionEntry ? onionEntry.depth : -1;

          let cardOpacity = 1;
          if (isOnion && depth > 0) {
            const skinCount = Math.max(onionCount - 1, 1);
            const b = skinCount <= 1 ? 0.75 : 0.75 - ((depth - 1) / (skinCount - 1)) * 0.65;
            cardOpacity = 0.3 + b * 0.7;
          }

          const baseActiveCount = row.nums.filter((n) => n >= 1 && n <= totalCells && Boolean(numBrightness[n])).length;
          const bonusIsActive = row.bonus >= 1 && row.bonus <= totalCells && Boolean(numBrightness[row.bonus]);
          const activeCount = baseActiveCount + (bonusIsActive ? 1 : 0);
          const d = String(row.day ?? "").toLowerCase();
          const drawDayLetter = d === "t" ? "T" : d === "f" ? "F" : "?";

          return (
            <div
              key={`${row.date}-${ri}`}
              data-ri={ri}
              onClick={() => tapRow(ri)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 8px",
                marginBottom: 4,
                background: isOnion ? `${color}14` : UI_CARD,
                border: `2px solid ${
                  isCurrent ? color : isOnion ? `${color}40` : activeCount > 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"
                }`,
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: isOnion ? cardOpacity : 1
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flexShrink: 0 }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isOnion ? color : "rgba(255,255,255,0.05)"
                  }}
                >
                  <span style={{ color: "#000000", opacity: 0.5, fontSize: 10, fontWeight: 600, lineHeight: 1 }}>
                    {ri + 1}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flex: 1, justifyContent: "center" }}>
                  {row.nums.map((n, ci) => {
                    const numOn = n >= 1 && n <= totalCells && Boolean(numBrightness[n]);
                    const th = spectrumHexForNum(n, totalCells);
                    const b = numBrightness[n]?.brightness || 0;
                    return (
                      <div
                        key={`${row.date}-${ci}`}
                        role="presentation"
                        onClick={(e) => toggleRowGlobalNum(e, n)}
                        style={{
                          width: 38,
                          height: 34,
                          borderRadius: 5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 600,
                          color: numOn ? LIT_NUM_COLOR : HONEY_HEX_LABEL,
                          background: numOn ? themeRgba(th, 0.15 + b * 0.85) : UI_NUM_CELL_IDLE,
                          textShadow: numOn ? "none" : ROW_NUM_TEXT_SHADOW_IDLE,
                          transition: "all 0.25s",
                          cursor: honeycombVisible ? "inherit" : "pointer"
                        }}
                      >
                        {n}
                      </div>
                    );
                  })}
                  {(() => {
                    const bonusOn = row.bonus >= 1 && row.bonus <= totalCells && Boolean(numBrightness[row.bonus]);
                    return (
                      <div
                        role="presentation"
                        onClick={(e) => toggleRowGlobalNum(e, row.bonus)}
                        style={{
                          width: 38,
                          height: 34,
                          borderRadius: 5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 600,
                          color: bonusOn ? BONUS_DASH_RGBA : "rgba(255,255,255,0.175)",
                          background: UI_NUM_CELL_IDLE,
                          border: `1px dashed ${BONUS_DASH_RGBA}`,
                          textShadow: "none",
                          transition: "all 0.25s",
                          cursor: honeycombVisible ? "inherit" : "pointer"
                        }}
                        title="Bonus number"
                      >
                        {row.bonus}
                      </div>
                    );
                  })()}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.38)",
                  flexShrink: 0,
                  width: 24,
                  textAlign: "right",
                  paddingRight: 6
                }}
                title={d === "t" ? "Tuesday draw" : d === "f" ? "Friday draw" : undefined}
              >
                {drawDayLetter}
              </div>
            </div>
          );
        })}
      </div>

      </div>

      {showPwaBottomRowNav && (
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 20,
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              background: UI_NAV_BG,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              transform: pwaBottomNavHidden ? "translateY(100%)" : "translateY(0)",
              transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: pwaBottomNavHidden ? "none" : "auto",
              willChange: "transform"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                minHeight: NAV_H + 4,
                paddingTop: 6,
                paddingBottom: 6
              }}
            >
              <NavButton dir={-1} arrowColor={arrowColor} onNav={bottomNavArrowNav} dimmed={atTopBoundary} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 60, justifyContent: "center" }}>
                {savedSelectedIndex >= 0 ? (
                  <>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: ROW_COLORS[savedSelectedIndex % ROW_COLORS.length],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <span style={{ color: "#000000", opacity: 0.5, fontSize: 10, fontWeight: 700, lineHeight: 1 }}>
                        {savedRows.length - savedSelectedIndex}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 400, color: HONEY_HEX_LABEL }}>/ {savedRows.length}</span>
                  </>
                ) : currentRow >= 0 ? (
                  <>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: ROW_COLORS[currentRow % ROW_COLORS.length],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <span style={{ color: "#000000", opacity: 0.5, fontSize: 10, fontWeight: 700, lineHeight: 1 }}>
                        {currentRow + 1}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 400, color: HONEY_HEX_LABEL }}>/ {ROWS.length}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>-</span>
                )}
              </div>
              <NavButton dir={1} arrowColor={arrowColor} onNav={bottomNavArrowNav} dimmed={atBottomBoundary} />
            </div>
          </div>
      )}
    </div>
  );
}
