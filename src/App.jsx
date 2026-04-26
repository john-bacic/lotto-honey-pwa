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
/** Light purple — frequency `Nx:` column + active toolbar frequency hex stroke and label. */
const FREQUENCY_LIGHT_PURPLE = "rgba(170,150,255,0.9)";
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

/** Toolbar onion glyph (16×16) */
const ONION_GLYPH_PATH =
  "M15.8535 1.5605L14.4395 0.146478C14.2442 -0.0488261 13.9277 -0.0488261 13.7324 0.146478L12.9043 0.974598C12.2494 1.63346 11.3581 2.00259 10.429 1.99998L7.49999 2.00324C3.91221 2.00063 1.00068 4.90683 0.998043 8.49542C0.997391 9.60154 1.27864 10.6901 1.8164 11.6569H0.5C0.223959 11.6569 0 11.8809 0 12.1569C0 12.433 0.223959 12.6569 0.5 12.6569H1.8431C2.06706 12.6563 2.28777 12.7064 2.49024 12.8028L1.12565 14.1667C0.930348 14.362 0.930348 14.679 1.12565 14.8744C1.32096 15.0697 1.63803 15.0697 1.83334 14.8744L3.19792 13.5098C3.29427 13.7116 3.34441 13.933 3.34375 14.1569V15.5C3.34375 15.776 3.56771 16 3.84375 16C4.1198 16 4.34375 15.776 4.34375 15.5V14.1836C7.47973 15.9271 11.4356 14.7975 13.179 11.6614C13.7162 10.6946 13.9981 9.60669 13.9974 8.50059L14 5.57088C13.9974 4.64185 14.3665 3.75061 15.0254 3.09562L15.8535 2.2675C16.0488 2.07219 16.0488 1.75578 15.8535 1.56048L15.8535 1.5605ZM3.27348 12.0195C1.33083 9.6842 1.64917 6.21686 3.98377 4.27395C6.0221 2.57799 8.98044 2.57799 11.0189 4.27395L10.308 4.98424C8.36602 3.43342 5.53449 3.74987 3.9838 5.69192C2.67195 7.33455 2.67195 9.66662 3.9838 11.3084L3.27348 12.0195ZM5.73251 6.73227C4.89396 7.57277 4.76114 8.88726 5.4148 9.87878L4.698 10.5956C3.54175 9.04613 3.86077 6.85337 5.40959 5.69713C6.65113 4.7707 8.35487 4.7707 9.5964 5.69713L8.87961 6.41391C7.88741 5.76028 6.57294 5.89308 5.73238 6.73227H5.73251ZM8.14654 7.14633L6.14653 9.14631C5.78976 8.39893 6.10617 7.50313 6.85356 7.14633C7.26242 6.95102 7.73767 6.95102 8.14654 7.14633ZM11.3893 12.3891C9.37695 14.3963 6.16737 14.5427 3.98112 12.7263L11.7267 4.9808C13.5431 7.16689 13.3967 10.3766 11.3894 12.3889L11.3893 12.3891ZM14.3177 2.38913C13.5917 3.11113 13.136 4.06023 13.0266 5.078C12.4967 4.22319 11.776 3.50315 10.9218 2.97316C11.9394 2.86378 12.8886 2.40805 13.6107 1.68215L14.0859 1.20754L14.793 1.91457L14.3177 2.38913Z";
const FREQUENCY_GLYPH_PATH =
  "M6.28897 0.000659856C6.20496 0.00631994 6.1259 0.042258 6.06636 0.101644C6.00691 0.16112 5.97093 0.240093 5.96526 0.324009L5.04561 13.1344L3.82786 7.24749C3.81266 7.16852 3.77066 7.09727 3.70878 7.04579C3.64699 6.99431 3.56919 6.96583 3.48869 6.9652H0.349415C0.224574 6.9652 0.109169 7.03169 0.0467472 7.13968C-0.0155824 7.24767 -0.0155824 7.38072 0.0467472 7.48873C0.109167 7.59672 0.224565 7.6632 0.349415 7.6632H3.20617L4.87092 15.7211C4.89341 15.8322 4.9686 15.9254 5.07258 15.9708C5.17655 16.0163 5.29617 16.0083 5.39304 15.9493C5.49 15.8904 5.55206 15.7879 5.55944 15.6748L6.43288 3.48541L7.67625 11.7332H7.67634C7.69109 11.8444 7.75855 11.9416 7.85757 11.9943C7.9566 12.0471 8.07506 12.0489 8.1756 11.9992C8.27625 11.9495 8.34667 11.8544 8.36484 11.7438L9.39757 5.70809L10.4663 12.4214C10.481 12.5325 10.5485 12.6297 10.6475 12.6824C10.7465 12.7352 10.865 12.7371 10.9655 12.6873C11.0662 12.6376 11.1366 12.5426 11.1548 12.4319L12.095 7.66397H15.6506V7.66406C15.7754 7.66406 15.8908 7.59749 15.9532 7.48949C16.0156 7.38159 16.0156 7.24852 15.9532 7.14054C15.8908 7.03254 15.7754 6.96606 15.6506 6.96606H11.8074C11.727 6.9666 11.6492 6.99508 11.5874 7.04647C11.5257 7.09777 11.4836 7.16902 11.4683 7.2479L10.8466 10.3837L9.75728 3.51154L9.75737 3.51145C9.74163 3.40049 9.67346 3.30391 9.57407 3.25198C9.4746 3.20006 9.35623 3.19916 9.25611 3.24956C9.15592 3.29996 9.08621 3.39556 9.06885 3.50624L8.04126 9.49063L6.65912 0.293359C6.64544 0.207109 6.59984 0.129215 6.53131 0.0750381C6.46277 0.0208614 6.37633 -0.00564183 6.28917 0.00100519L6.28897 0.000659856Z";

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
/** Honeycomb mesh/label wave — keep in sync with `buildScene` loop and minus-clear deferral. */
const HONEY_WAVE_HOP_MS = 40;
const HONEY_WAVE_PULSE_MS = 135;
const HONEY_WAVE_TAIL_MS = 80;

function honeyWaveTotalDurationMs(maxD) {
  return maxD * HONEY_WAVE_HOP_MS + HONEY_WAVE_PULSE_MS + HONEY_WAVE_TAIL_MS;
}

const ONION_LEVELS = [2, 3, 5, 8, 13, 21];
const FREQUENCY_LEVELS = [8, 13, 21, 34, 55, 89, 144, 233];

/**
 * Inner onion rows (depth ≥ 1): brightness b linear from ONION_INNER_BRIGHT_TOP (75%) at the
 * shallowest inner row down to ONION_INNER_BRIGHT_BOTTOM (20%) at the deepest inner row.
 * Primary row (depth 0) stays 1.
 */
const ONION_INNER_BRIGHT_TOP = 0.75;
const ONION_INNER_BRIGHT_BOTTOM = 0.2;

function onionInnerBrightnessForDepth(depth, onionCount) {
  if (depth <= 0) return 1;
  const lastInnerDepth = onionCount - 1;
  if (lastInnerDepth < 1) return ONION_INNER_BRIGHT_TOP;
  if (lastInnerDepth === 1) return ONION_INNER_BRIGHT_TOP;
  const t = (depth - 1) / (lastInnerDepth - 1);
  return ONION_INNER_BRIGHT_TOP + (ONION_INNER_BRIGHT_BOTTOM - ONION_INNER_BRIGHT_TOP) * t;
}

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

/** Local calendar date → DD.MM.YY (matches winning-row toolbar format). */
function formatDateDdMmYy(d) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

/** Lotto Max draws Tue/Fri — next draw date on/after local “today” (stub until scheduled/API). */
function nextTueOrFriDrawDate(from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < 14; i += 1) {
    const wd = d.getDay();
    if (wd === 2 || wd === 5) return new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/** Placeholder jackpot until per-draw data is wired (latest est. for next Lotto Max draw). */
const NEXT_DRAW_JACKPOT_PLACEHOLDER = 55_000_000;
const NEXT_DRAW_MAXMILLIONS_PLACEHOLDER = 4;
const NEXT_DRAW_BONUS_PRIZES_PLACEHOLDER = 55;

/** Two lines for toolbar “next draw” block; second line is shorter and right-aligned under “million”. */
function nextDrawToolbarLines(from = new Date()) {
  const next = nextTueOrFriDrawDate(from);
  const millions = Math.round(NEXT_DRAW_JACKPOT_PLACEHOLDER / 1_000_000);
  return {
    dateAndJackpot: `next: ${formatDateDdMmYy(next)} ~ $${millions} million`,
    extras: `+${NEXT_DRAW_MAXMILLIONS_PLACEHOLDER} max +${NEXT_DRAW_BONUS_PRIZES_PLACEHOLDER}\u00a0\u00d7\u00a0$100k`
  };
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

/**
 * Distance from top of honey canvas to bottom tip of outer hex on the bottom row
 * (same projection as `buildScene` / `labelPos`).
 */
function honeyBottomOuterHexBottomFromCanvasTopPx(gridRows, canvasW, canvasH) {
  const pad = 12;
  const gs = getGridSize(gridRows);
  const gA = gs.w / gs.h;
  const cW = Math.max(120, canvasW);
  const cH = canvasH;
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
  const cam = new THREE.OrthographicCamera(-camW / 2, camW / 2, camH / 2, -camH / 2, 1, 100);
  cam.position.z = 10;
  cam.updateProjectionMatrix();
  const pos = getPositions(gridRows);
  let nFirstBottom = 1;
  for (let i = 0; i < gridRows.length - 1; i += 1) nFirstBottom += gridRows[i];
  const p = pos.find((x) => x.num === nFirstBottom);
  if (!p) return cH * 0.9;
  const outR = HEX_R + 1.8;
  /** Vertex at angle −π/2 is local (0, −R): bottom tip in Three y-up (matches `Shape` loop). */
  const tmp = new THREE.Vector3(p.x, p.y - outR, 1);
  tmp.project(cam);
  return ((-tmp.y + 1) / 2) * cH;
}

/** Fisher–Yates shuffle (same pattern as Slater `shuffleArray`). */
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Hex cells sharing an edge with `num` in the current grid (uses same geometry as `getPositions`). */
function getAdjacentNums(num, gridRows) {
  const pos = getPositions(gridRows);
  const me = pos.find((p) => p.num === num);
  if (!me) return [];
  let minD = Infinity;
  const dists = [];
  for (const p of pos) {
    if (p.num === num) continue;
    const d = Math.hypot(p.x - me.x, p.y - me.y);
    dists.push({ p, d });
    if (d < minD) minD = d;
  }
  if (!Number.isFinite(minD) || minD < 1e-4) return [];
  const tol = minD * 0.1 + 0.75;
  return dists.filter(({ d }) => d <= minD + tol).map(({ p }) => p.num);
}

/** Shortest path length from `origin` to every cell (for outward wave timing). */
function bfsHoneyDistances(origin, gridRows) {
  const total = gridRows.reduce((sum, r) => sum + r, 0);
  const distMap = { [origin]: 0 };
  const q = [origin];
  for (let qi = 0; qi < q.length; qi += 1) {
    const u = q[qi];
    const neigh = getAdjacentNums(u, gridRows);
    for (let j = 0; j < neigh.length; j += 1) {
      const v = neigh[j];
      if (distMap[v] !== undefined) continue;
      distMap[v] = distMap[u] + 1;
      q.push(v);
    }
  }
  let maxD = 0;
  for (let n = 1; n <= total; n += 1) {
    const d = distMap[n];
    if (d !== undefined && d > maxD) maxD = d;
  }
  return { distMap, maxD };
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
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d={ONION_GLYPH_PATH} fill="currentColor" />
      </svg>
    </span>
  );
}

function FrequencyGlyphIcon({ off = false }) {
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
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d={FREQUENCY_GLYPH_PATH} fill="currentColor" />
      </svg>
    </span>
  );
}

export default function App() {
  const [activeNums, setActiveNums] = useState(new Set());
  /** Randomly generated picks (no inset keyline). */
  const [randomNums, setRandomNums] = useState(() => new Set());
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
  /** Save button rotating rim: only spins after a manual toggle-on; clears on save / full clear. */
  const [hasUnsavedManualAdd, setHasUnsavedManualAdd] = useState(false);
  /** Minus clear wave: snapshot lives on `honeyMeshWaveRef` so the Three.js loop fades cells smoothly. */
  const [minusClearWaveActive, setMinusClearWaveActive] = useState(false);
  const [onionIdx, setOnionIdx] = useState(0);
  const [frequencyIdx, setFrequencyIdx] = useState(0);
  const mountRef = useRef(null);
  const randomToolbarBtnRef = useRef(null);
  const [randomToolbarLiftY, setRandomToolbarLiftY] = useState(0);
  const randomToolbarLiftYRef = useRef(0);
  /** Slater-style random cascade: staggered cell flashes then staged reveal (see `pickRandomManual`). */
  const randomCascadeTimersRef = useRef([]);
  const randomCascadeLockRef = useRef(false);
  const randomCascadeRevertRef = useRef(null);
  const [randomCascadeBusy, setRandomCascadeBusy] = useState(false);
  const [randomCascadePhaseOneActive, setRandomCascadePhaseOneActive] = useState(false);
  const [randomCascadeRingActive, setRandomCascadeRingActive] = useState(false);
  const [randomCascadeSlowing, setRandomCascadeSlowing] = useState(false);
  const [randomCascadeRingFading, setRandomCascadeRingFading] = useState(false);
  const [randomCascadeSpinMs, setRandomCascadeSpinMs] = useState(1250);
  const [randomCascadeRampMs, setRandomCascadeRampMs] = useState(1000);
  const [randomCascadeGlowHue, setRandomCascadeGlowHue] = useState(0);
  const [randomCascadeResync, setRandomCascadeResync] = useState(0);
  const sceneRef = useRef(null);
  /** Manual honeycomb tap: scale-down BFS wave — outward when adding a #, inward when removing. */
  const honeyMeshWaveRef = useRef(null);
  /** Overlay digit inner (num → span): loop() applies scale only; parent keeps translate. */
  const honeyLabelElByNumRef = useRef({});
  /** Toolbar minus: finalize timer only (ring clears use rAF + `minusWaveClearMetaRef`). */
  const clearMinusRingTimersRef = useRef([]);
  /** Minus wave: same `t0` / `distMap` as `honeyMeshWaveRef`; rAF clears `orderedNums` one cell per frame. */
  const minusWaveClearMetaRef = useRef(null);
  const enableRowAutoScrollRef = useRef(false);
  const [labelPos, setLabelPos] = useState([]);
  const rowsRef = useRef(null);
  const savedSectionRef = useRef(null);
  /** "Lotto Max - Winning numbers" label — scroll into view after toolbar minus (row off or all nums cleared). */
  const winningNumbersTitleRef = useRef(null);
  /** "Number Frequency" title — scroll into view when a window is chosen or a digit is tapped. */
  const frequencyTitleRef = useRef(null);
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
      clearMinusRingTimersRef.current.forEach((id) => clearTimeout(id));
      clearMinusRingTimersRef.current = [];
      randomCascadeTimersRef.current.forEach((id) => {
        clearTimeout(id);
        clearInterval(id);
      });
      randomCascadeTimersRef.current = [];
      randomCascadeLockRef.current = false;
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

  useEffect(() => {
    if (!savedOpen) return;
    setSavedLocked(true);
  }, [savedOpen]);

  /** Selecting any winning/saved row drops random picks; only manual locks persist across row views. */
  useEffect(() => {
    if (currentRow < 0 && selectedSavedId == null) return;
    setRandomNums((prev) => (prev.size > 0 ? new Set() : prev));
  }, [currentRow, selectedSavedId]);

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

  const scrollFrequencyTitleIntoView = useCallback(
    (behavior = "smooth") => {
      const pinned = pinnedHeaderRef.current;
      const block = frequencyTitleRef.current;
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

  /** When user picks a frequency window (only via dropdown), keep the section title in view under the pinned header. */
  useLayoutEffect(() => {
    if (frequencyIdx <= 0) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollFrequencyTitleIntoView("smooth");
      });
    });
    return () => cancelAnimationFrame(id);
  }, [frequencyIdx, scrollFrequencyTitleIntoView]);

  useLayoutEffect(() => {
    if (!savedOpen || savedRows.length === 0) return;
    /** Number Frequency is above Saved — avoid scrolling down to Saved and pushing Frequency off-screen. */
    if (frequencyIdx > 0) return;
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
  }, [savedOpen, savedRows.length, frequencyIdx, scrollSavedSectionIntoView]);

  /** After toolbar minus: winning row off, or all lit/global numbers cleared (see clearAll). */
  useLayoutEffect(() => {
    if (!toolbarClearScrollWinningTitleRef.current) return;
    if (frequencyIdx > 0) {
      toolbarClearScrollWinningTitleRef.current = false;
      return;
    }
    toolbarClearScrollWinningTitleRef.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollWinningNumbersTitleIntoView("smooth");
      });
    });
  }, [currentRow, selectedSavedId, activeNums, rowGlobalNums, frequencyIdx, scrollWinningNumbersTitleIntoView]);

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
  const oldestDrawCount = ROWS.length;
  const selectedFrequencyWindow =
    frequencyIdx === 0
      ? 0
      : frequencyIdx <= FREQUENCY_LEVELS.length
        ? FREQUENCY_LEVELS[frequencyIdx - 1]
        : oldestDrawCount;
  const frequencyDisplay =
    frequencyIdx === 0
      ? null
      : frequencyIdx <= FREQUENCY_LEVELS.length
        ? String(FREQUENCY_LEVELS[frequencyIdx - 1])
        : String(oldestDrawCount);
  const frequencyGroups = useMemo(() => {
    if (selectedFrequencyWindow <= 0) return null;
    const windowRows = ROWS.slice(0, Math.min(selectedFrequencyWindow, ROWS.length));
    if (windowRows.length === 0) return null;

    const maxNumInWindow = windowRows.reduce((m, row) => Math.max(m, row.maxNum || 50), 50);
    const counts = Array.from({ length: maxNumInWindow + 1 }, () => 0);
    windowRows.forEach((row) => {
      row.nums.forEach((n) => {
        if (n >= 1 && n <= maxNumInWindow) counts[n] += 1;
      });
    });

    const groupsMap = new Map();
    for (let n = 1; n <= maxNumInWindow; n += 1) {
      const c = counts[n];
      if (!groupsMap.has(c)) groupsMap.set(c, []);
      groupsMap.get(c).push(n);
    }

    const maxCount = Math.max(...counts.slice(1), 0);
    const groups = [];
    for (let c = maxCount; c >= 0; c -= 1) {
      const nums = groupsMap.get(c) || [];
      if (nums.length > 0) groups.push({ count: c, nums });
    }
    return { groups, maxNumInWindow };
  }, [selectedFrequencyWindow, oldestDrawCount]);

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

  useLayoutEffect(() => {
    if (!honeycombVisible) {
      randomToolbarLiftYRef.current = 0;
      setRandomToolbarLiftY(0);
      return undefined;
    }
    const el = mountRef.current;
    if (!el) return undefined;
    let ro = null;
    let cancelled = false;
    const measureRandomLift = () => {
      if (cancelled) return;
      const canvasEl = mountRef.current;
      const btn = randomToolbarBtnRef.current;
      if (!canvasEl || !btn || canvasEl.clientWidth < 20) return;
      const B = honeyBottomOuterHexBottomFromCanvasTopPx(gridRows, canvasEl.clientWidth, CANVAS_H);
      const rCanvas = canvasEl.getBoundingClientRect();
      const rBtn = btn.getBoundingClientRect();
      const targetBottom = rCanvas.top + B;
      /** Subtract any currently applied lift so we always measure from the button's natural position. */
      const currentLift = randomToolbarLiftYRef.current;
      const naturalBtnBottom = rBtn.bottom - currentLift;
      const newLift = -Math.round(naturalBtnBottom - targetBottom);
      if (newLift === currentLift) return;
      randomToolbarLiftYRef.current = newLift;
      setRandomToolbarLiftY(newLift);
    };
    const scheduleMeasure = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(measureRandomLift);
      });
    };
    scheduleMeasure();
    /** iOS PWA layout often settles late (safe-area / sticky); poll a few frames. */
    const followUpTimers = [80, 200, 480, 1000].map((ms) =>
      setTimeout(scheduleMeasure, ms)
    );
    ro = new ResizeObserver(() => scheduleMeasure());
    ro.observe(el);
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("orientationchange", scheduleMeasure);
    return () => {
      cancelled = true;
      followUpTimers.forEach((id) => clearTimeout(id));
      if (ro) ro.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("orientationchange", scheduleMeasure);
    };
  }, [
    honeycombVisible,
    gridRows,
    labelPos,
    iosHeaderSpacerPx,
    activeNums.size,
    randomNums.size,
    savedRows.length
  ]);

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
      randomNums.forEach((n) => {
        if (n <= totalCells) map[n] = { brightness: 1 };
      });
      activeRowList.forEach(({ ri, depth }) => {
        const b = onionInnerBrightnessForDepth(depth, onionCount);
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
    randomNums.forEach((n) => {
      if (n <= totalCells) map[n] = { brightness: 1 };
    });
    rowGlobalNums.forEach((n) => {
      if (n >= 1 && n <= totalCells) map[n] = { brightness: 1 };
    });
    activeRowList.forEach(({ ri, depth }) => {
      const b = onionInnerBrightnessForDepth(depth, onionCount);
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
        const litByManual = activeNums.has(n) || randomNums.has(n) || rowGlobalNums.has(n);
        if (!selectionRevealNums.has(n) && !litByManual) delete map[n];
      });
    }

    return map;
  }, [
    honeycombVisible,
    rowGlobalNums,
    activeNums,
    randomNums,
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
  const selectedCount = useMemo(() => {
    const merged = new Set(activeNums);
    randomNums.forEach((n) => merged.add(n));
    return merged.size;
  }, [activeNums, randomNums]);
  const manualCount = selectedCount;
  const manualLimitReached = selectedCount >= 7;

  /** BFS scale wave on honeycomb meshes + labels (`inward` = toggling off / contracting). */
  function startHoneycombMeshWave(n, inward) {
    if (n < 1 || n > totalCells) return;
    const { distMap, maxD } = bfsHoneyDistances(n, gridRows);
    honeyMeshWaveRef.current = {
      t0: performance.now(),
      distMap,
      maxD,
      inward
    };
  }

  function toggleNum(n) {
    setActiveNums((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else if (selectedCount < 7) {
        next.add(n);
        /** Adding a new number arms the save-button rotating rim. */
        setHasUnsavedManualAdd(true);
      }
      return next;
    });
  }

  function pickRandomManual() {
    if (randomCascadeLockRef.current) return;

    /** Reset any row/saved toggles; keep only manual locked picks as the base. */
    setCurrentRow(-1);
    setSelectedSavedId(null);
    setRowGlobalNums(new Set());

    const manualLocked = Array.from(activeNums).filter((n) => n >= 1 && n <= totalCells);
    const manualLockedSet = new Set(manualLocked);
    const needRandom = Math.max(0, 7 - manualLockedSet.size);
    const pool = Array.from({ length: totalCells }, (_, i) => i + 1).filter((n) => !manualLockedSet.has(n));
    shuffleInPlace(pool);
    const finalRandom = pool.slice(0, needRandom).sort((a, b) => a - b);

    if (!honeycombVisible) {
      setRandomNums(new Set(finalRandom));
      setHasUnsavedManualAdd(true);
      return;
    }

    /** Slater `toggleRandomSevenButtons`: shuffle all cells, stagger 10ms, 2×200ms color pulse each, then reveal at 100ms steps. */
    randomCascadeLockRef.current = true;
    randomCascadeRevertRef.current = { manual: new Set(activeNums), random: new Set(randomNums) };
    setRandomCascadeBusy(true);
    setRandomCascadePhaseOneActive(true);
    setRandomCascadeRingActive(true);
    setRandomCascadeSlowing(true);
    setRandomCascadeRingFading(false);
    setRandomCascadeSpinMs(1100);
    setRandomNums(new Set());
    const phaseOneMs = (Math.max(0, totalCells - 1) * 10) + 600;
    const phaseTwoMs = Math.max(0, finalRandom.length - 1) * 100;
    setRandomCascadeRampMs(Math.max(350, phaseOneMs + phaseTwoMs));

    const flashHue = Math.random();
    setRandomCascadeGlowHue(Math.round(flashHue * 360));
    const flashFill = new THREE.Color().setHSL(flashHue, 1, 0.62);
    const flashRing = new THREE.Color().setHSL(flashHue, 1, 0.28);
    const shuffled = shuffleInPlace(Array.from({ length: totalCells }, (_, i) => i + 1));
    let completed = 0;

    function pushCascadeTimer(id) {
      randomCascadeTimersRef.current.push(id);
    }

    function onCellCascadeDone() {
      completed += 1;
      if (completed < totalCells) return;
      setRandomCascadePhaseOneActive(false);
      randomCascadeRevertRef.current = null;
      const sorted = [...finalRandom];
      const preRevealSlowdownMs = 0;
      sorted.forEach((n, order) => {
        pushCascadeTimer(
          setTimeout(() => {
            setRandomNums((prev) => {
              const next = new Set(prev);
              next.add(n);
              return next;
            });
          }, preRevealSlowdownMs + order * 100)
        );
      });
      setHasUnsavedManualAdd(true);
      const lastRevealMs = sorted.length > 0 ? preRevealSlowdownMs + (sorted.length - 1) * 100 : preRevealSlowdownMs;
      const unlockAfter = lastRevealMs + 120;
      const fadeLeadMs = 420;
      const fadeStartMs = Math.max(0, unlockAfter - fadeLeadMs);
      pushCascadeTimer(
        setTimeout(() => {
          setRandomCascadeRingFading(true);
        }, fadeStartMs)
      );
      pushCascadeTimer(
        setTimeout(() => {
          randomCascadeLockRef.current = false;
          setRandomCascadeRingFading(false);
          setRandomCascadePhaseOneActive(false);
          setRandomCascadeRingActive(false);
          setRandomCascadeSlowing(false);
          setRandomCascadeBusy(false);
        }, unlockAfter)
      );
    }

    shuffled.forEach((n, index) => {
      pushCascadeTimer(
        setTimeout(() => {
          const st = sceneRef.current;
          const m = st?.meshes?.[n];
          if (!m) {
            onCellCascadeDone();
            return;
          }
          const origMat = m.mat.color.clone();
          const origOut = m.outMat.color.clone();
          let flashesDone = 0;
          const iv = setInterval(() => {
            if (flashesDone < 2) {
              m.mat.color.copy(flashFill);
              m.outMat.color.copy(flashRing);
              flashesDone += 1;
            } else {
              clearInterval(iv);
              m.mat.color.copy(origMat);
              m.outMat.color.copy(origOut);
              onCellCascadeDone();
            }
          }, 200);
          pushCascadeTimer(iv);
        }, index * 10)
      );
    });
  }

  function saveManualRow() {
    const merged = new Set(activeNums);
    randomNums.forEach((n) => merged.add(n));
    if (merged.size === 0) return;
    setSavedLocked(true);
    setSavedRowsGlowMint(true);
    setSavedRowsGlow(false);
    if (savedRowsGlowClearRef.current) {
      clearTimeout(savedRowsGlowClearRef.current);
      savedRowsGlowClearRef.current = null;
    }
    const nums = Array.from(merged).sort((a, b) => a - b);
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
    /** Save committed → stop the rotating rim until user toggles on a new number. */
    setHasUnsavedManualAdd(false);
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

  function flushMinusRingClearTimers() {
    clearMinusRingTimersRef.current.forEach((id) => clearTimeout(id));
    clearMinusRingTimersRef.current = [];
    minusWaveClearMetaRef.current = null;
    setMinusClearWaveActive(false);
  }

  function clearAll() {
    const scrollWinningTitleAfterClear = frequencyIdx <= 0;
    const winningRowWasSelected = currentRow >= 0;
    const hadRowLikeSelection = currentRow >= 0 || selectedSavedId !== null;

    /** Snapshot every cell currently lit (any source) — Three.js loop fades each as the wave passes. */
    const litAtStart = {};
    let litCount = 0;
    Object.keys(numBrightness).forEach((key) => {
      const n = Number(key);
      if (n >= 1 && n <= totalCells) {
        litAtStart[n] = numBrightness[n].brightness || 1;
        litCount += 1;
      }
    });
    const innerAtStart = {};
    activeNums.forEach((n) => {
      if (n >= 1 && n <= totalCells) innerAtStart[n] = 1;
    });
    rowGlobalNums.forEach((n) => {
      if (n >= 1 && n <= totalCells) innerAtStart[n] = 1;
    });

    if (litCount === 0) {
      flushMinusRingClearTimers();
      setOnionIdx(0);
      if (scrollWinningTitleAfterClear) {
        toolbarClearScrollWinningTitleRef.current = true;
      }
      setActiveNums(new Set());
      setRandomNums(new Set());
      setRowGlobalNums(new Set());
      setHasUnsavedManualAdd(false);
      setCurrentRow(-1);
      setSelectedSavedId(null);
      return;
    }

    flushMinusRingClearTimers();
    const t0 = performance.now();
    /** Origin = cell 4 (top-right). Wave radiates toward the bottom-left corner. */
    const { distMap, maxD } = bfsHoneyDistances(4, gridRows);
    honeyMeshWaveRef.current = {
      t0,
      distMap,
      maxD,
      inward: false,
      minusClear: true,
      litAtStart,
      innerAtStart
    };
    minusWaveClearMetaRef.current = {
      t0,
      distMap,
      maxD
    };
    setMinusClearWaveActive(true);

    const waveEndMs = honeyWaveTotalDurationMs(maxD);
    const timerId = setTimeout(() => {
      minusWaveClearMetaRef.current = null;
      /** Cells already faded to dark inside the loop — flushing state here doesn't visibly jump. */
      setActiveNums(new Set());
      setRandomNums(new Set());
      setRowGlobalNums(new Set());
      setHasUnsavedManualAdd(false);
      if (hadRowLikeSelection) {
        if (winningRowWasSelected && scrollWinningTitleAfterClear) {
          toolbarClearScrollWinningTitleRef.current = true;
        }
        setCurrentRow(-1);
        setSelectedSavedId(null);
      } else if (scrollWinningTitleAfterClear) {
        toolbarClearScrollWinningTitleRef.current = true;
      }
      setOnionIdx(0);
      setMinusClearWaveActive(false);
    }, waveEndMs);
    clearMinusRingTimersRef.current.push(timerId);
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
    /** Frequency panel is tall; avoid jumping the list so the winning rows don't scroll under the header. */
    if (frequencyIdx > 0) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollRowIntoViewBelowPinned(currentRow, "smooth");
      });
    });
    return () => cancelAnimationFrame(id);
  }, [currentRow, frequencyIdx, scrollRowIntoViewBelowPinned]);

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
    if (n < 1 || n > totalCells) return;
    e.stopPropagation();
    startHoneycombMeshWave(n, rowGlobalNums.has(n));
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

  /** Frequency window is only set here or cleared in `clearAll` — never coupled to row/onion selection. */
  function handleFrequencyLevelChange(e) {
    setFrequencyIdx(Number(e.target.value));
  }

  function handleOnionLevelChange(e) {
    const nextOnionIdx = Number(e.target.value);
    setOnionIdx(nextOnionIdx);
    if (nextOnionIdx > 0) {
      enableRowAutoScrollRef.current = true;
      setSelectedSavedId(null);
      setCurrentRow(0);
    }
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
        pulseTgt: 0,
        /** Minus-clear fade multiplier (animated per-frame in `loop()`). */
        fadeMul: 1
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

    /** Single Three.js color buffer reused per frame to avoid GC churn. */
    const tmpColor = new THREE.Color();
    const black = new THREE.Color(HEX_FILL);
    const darkBorder = new THREE.Color(HEX_RING);

    function loop() {
      state.raf = requestAnimationFrame(loop);
      const wv = honeyMeshWaveRef.current;
      const elapsed = wv ? performance.now() - wv.t0 : 0;
      /** Toggle on / minus clear: outward (d=0 first). Toggle off: inward (periphery first). Same scale-down dip. */
      const waveDipAmp = 0.1;
      const minusActive = Boolean(wv && wv.minusClear && wv.litAtStart);
      /** Smooth fade window per cell starting when wave reaches it; finishes well inside wave tail. */
      const minusFadeMs = 200;
      if (wv && elapsed > honeyWaveTotalDurationMs(wv.maxD)) {
        /** On the frame the minus-clear wave ends, snap any previously lit cell back to base. */
        if (wv.minusClear && wv.litAtStart) {
          for (let n = 1; n <= tc; n += 1) {
            if (!wv.litAtStart[n]) continue;
            const mm = state.meshes[n];
            if (!mm) continue;
            mm.fadeMul = 0;
            mm.mat.color.set(HEX_FILL);
            mm.outMat.color.set(HEX_RING);
            if (wv.innerAtStart && wv.innerAtStart[n]) mm.innerMat.opacity = 0;
            const labelEl = honeyLabelElByNumRef.current[n];
            if (labelEl) labelEl.style.color = "";
          }
        }
        honeyMeshWaveRef.current = null;
      }
      for (let i = 1; i <= tc; i += 1) {
        const m = state.meshes[i];
        m.cur += (m.tgt - m.cur) * 0.14;
        m.pulse += (m.pulseTgt - m.pulse) * 0.5;
        const pulseScale = 1 + m.pulse * 0.0;
        let waveDip = 0;
        if (wv && wv.distMap) {
          const d = wv.distMap[i];
          if (d !== undefined) {
            const inward = Boolean(wv.inward);
            const ringDelay = inward
              ? (wv.maxD - d) * HONEY_WAVE_HOP_MS
              : d * HONEY_WAVE_HOP_MS;
            const tCell = elapsed - ringDelay;
            if (tCell >= 0 && tCell < HONEY_WAVE_PULSE_MS) {
              waveDip = Math.sin((tCell / HONEY_WAVE_PULSE_MS) * Math.PI) * waveDipAmp;
            }
          }
        }
        const s = m.cur * pulseScale * (1 - waveDip);
        m.mesh.scale.setScalar(s);
        m.innerMesh.scale.setScalar(s);
        m.outMesh.scale.setScalar(s);

        let labelMul = 1;
        if (minusActive) {
          const baseB = wv.litAtStart[i] || 0;
          const wasInner = wv.innerAtStart && wv.innerAtStart[i] ? 1 : 0;
          const d = wv.distMap[i];
          let target = 1;
          let snapToZero = false;
          if (baseB > 0 && d !== undefined) {
            const tFade = elapsed - d * HONEY_WAVE_HOP_MS;
            if (tFade > 0) {
              /** Ease-out: smooth, slightly front-loaded fade as the wave passes through the cell. */
              const t = Math.min(1, tFade / minusFadeMs);
              target = 1 - Math.sin((t * Math.PI) / 2);
              if (t >= 1) snapToZero = true;
            }
          }
          if (snapToZero) {
            m.fadeMul = 0;
          } else {
            m.fadeMul += (target - m.fadeMul) * 0.32;
          }
          if (baseB > 0) {
            const effB = baseB * m.fadeMul;
            tmpColor.copy(black).lerp(m.specColor, effB);
            m.mat.color.copy(tmpColor);
            tmpColor.copy(darkBorder).lerp(m.specBorder, effB);
            m.outMat.color.copy(tmpColor);
            if (wasInner) m.innerMat.opacity = m.fadeMul;
            labelMul = m.fadeMul;
          }
        } else if (m.fadeMul !== 1) {
          m.fadeMul = 1;
        }

        const labelEl = honeyLabelElByNumRef.current[i];
        if (labelEl) {
          labelEl.style.transform = `scale(${1 - waveDip})`;
          if (minusActive && wv.litAtStart[i]) {
            /** Lit label is `LIT_NUM_COLOR` (#000); fade toward idle `HONEY_HEX_LABEL` (#757575). */
            const c = Math.round(0x75 * (1 - labelMul));
            labelEl.style.color = `rgb(${c},${c},${c})`;
          } else if (labelEl.style.color) {
            labelEl.style.color = "";
          }
        }
      }
      ren.render(scene, cam);
    }
    loop();
  }, [honeyMeshWaveRef, honeyLabelElByNumRef]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    honeyMeshWaveRef.current = null;
    buildScene(el, gridRows, totalCells);
    return () => {
      honeyMeshWaveRef.current = null;
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
      /** Inner keyline indicates only manual honeycomb picks, not row/saved global toggles. */
      h.innerMat.opacity = activeNums.has(n) ? 1 : 0;
    }
  }, [numBrightness, totalCells, activeNums, rowGlobalNums, justLitNums, randomCascadeResync]);

  useEffect(() => {
    if (honeycombVisible) return;
    if (!randomCascadeLockRef.current && randomCascadeTimersRef.current.length === 0) return;
    randomCascadeTimersRef.current.forEach((id) => {
      clearTimeout(id);
      clearInterval(id);
    });
    randomCascadeTimersRef.current = [];
    randomCascadeLockRef.current = false;
    setRandomCascadeRingFading(false);
    setRandomCascadePhaseOneActive(false);
    setRandomCascadeRingActive(false);
    setRandomCascadeSlowing(false);
    setRandomCascadeBusy(false);
    setRandomCascadeSpinMs(1100);
    const rev = randomCascadeRevertRef.current;
    randomCascadeRevertRef.current = null;
    if (rev) {
      setActiveNums(rev.manual ?? new Set());
      setRandomNums(rev.random ?? new Set());
    }
    setRandomCascadeResync((x) => x + 1);
  }, [honeycombVisible]);

  /** Linear random-ring deceleration: fast at start, linearly toward near-stop. */
  useEffect(() => {
    if (!randomCascadeRingActive || !randomCascadeSlowing) return undefined;
    const startMs = 1100;
    /** Same feel, just slower overall by phase end. */
    const endMs = 1500;
    const rampMs = Math.max(300, randomCascadeRampMs);
    let rafId = 0;
    const t0 = performance.now();
    const tick = () => {
      const elapsed = performance.now() - t0;
      const p = Math.min(1, elapsed / rampMs);
      setRandomCascadeSpinMs(Math.round(startMs + (endMs - startMs) * p));
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    setRandomCascadeSpinMs(startMs);
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [randomCascadeRingActive, randomCascadeSlowing, randomCascadeRampMs]);

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
    randomNums.size > 0 ||
    rowGlobalNums.size > 0 ||
    frequencyIdx > 0;
  const hasManualClear = activeNums.size > 0 || randomNums.size > 0;
  const hasExpandButton = savedRows.length > 0;
  const hasRightBottomControls = manualCount > 0 || savedRows.length > 0;
  const showSaveButton = manualCount > 0 && !randomCascadeBusy;
  const randomIconFill =
    randomCascadeRingActive || randomCascadeRingFading
      ? `hsl(${randomCascadeGlowHue} 95% 72%)`
      : HONEY_HEX_LABEL;
  const topDraw = currentRow >= 0 ? ROWS[currentRow] : ROWS[0] ?? null;
  const topRowColor = ROW_COLORS[(currentRow >= 0 ? currentRow : 0) % ROW_COLORS.length];
  /** Date + jackpot in toolbar only when a winning row is selected (saved-only → blank). */
  const showHeaderDrawDateJackpot = canTurnOff && hasRowLikeSelection && currentRow >= 0;
  /** "Next draw" placeholder is visible only in fully idle state. */
  const showHeaderNextDrawPlaceholder = !canTurnOff && !randomCascadeBusy;
  const nextDrawToolbarPlaceholderLines = nextDrawToolbarLines();
  const toolbarHeader = useMemo(
    () =>
      showHeaderDrawDateJackpot && topDraw
        ? {
            key: `draw|${topDraw.date}|${topDraw.jackpot}`,
            color: topRowColor,
            letterSpacing: 1,
            whiteSpace: undefined,
            title: undefined,
            align: "center",
            primary: formatDrawDateJackpot(topDraw.date, topDraw.jackpot),
            secondary: null
          }
        : showHeaderNextDrawPlaceholder
          ? {
            key: `next|${nextDrawToolbarPlaceholderLines.dateAndJackpot}|${nextDrawToolbarPlaceholderLines.extras}`,
            color: SAVED_LOCK_ICON_GREEN,
            letterSpacing: 0.35,
            whiteSpace: "normal",
            title: "Upcoming Tue/Fri draw (placeholder date & jackpot until automated)",
            align: "right",
            primary: nextDrawToolbarPlaceholderLines.dateAndJackpot,
            secondary: nextDrawToolbarPlaceholderLines.extras
          }
          : {
            key: "blank",
            color: SAVED_LOCK_ICON_GREEN,
            letterSpacing: 0.35,
            whiteSpace: "normal",
            title: undefined,
            align: "center",
            primary: "",
            secondary: null
          },
    [
      showHeaderDrawDateJackpot,
      topDraw,
      topRowColor,
      showHeaderNextDrawPlaceholder,
      nextDrawToolbarPlaceholderLines
    ]
  );

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
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          paddingTop: "env(safe-area-inset-top, 0px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.28)"
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
          <div
            style={{ justifySelf: "start", width: 44, height: 44, flexShrink: 0, alignSelf: "center" }}
            aria-hidden="true"
          />

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

          <div style={{ justifySelf: "end" }}>
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
                  const isBlocked =
                    manualLimitReached && !activeNums.has(n) && !randomNums.has(n) && !rowGlobalNums.has(n);
                  const labelColor = isBlocked
                    ? UI_BG
                    : isOn
                      ? LIT_NUM_COLOR
                      : HONEY_HEX_LABEL;
                  return (
                    <div
                      key={n}
                      onClick={() => {
                        if (isBlocked) return;
                        const isManualOn = activeNums.has(n);
                        const isRandomOn = randomNums.has(n);
                        const isRowGlobalOn = rowGlobalNums.has(n);
                        /** Random hit while visible => lock it in (promote to manual inset), don't turn it off. */
                        if (!isManualOn && isRandomOn) {
                          startHoneycombMeshWave(n, false);
                          setActiveNums((prev) => {
                            if (prev.has(n)) return prev;
                            const next = new Set(prev);
                            next.add(n);
                            return next;
                          });
                          setRandomNums((prev) => {
                            if (!prev.has(n)) return prev;
                            const next = new Set(prev);
                            next.delete(n);
                            return next;
                          });
                          setHasUnsavedManualAdd(true);
                          return;
                        }
                        const willTurnOff = isManualOn || isRowGlobalOn;
                        startHoneycombMeshWave(n, willTurnOff);
                        if (willTurnOff) {
                          /** Allow turning off row/saved toggles directly from the honeycomb. */
                          setActiveNums((prev) => {
                            if (!prev.has(n)) return prev;
                            const next = new Set(prev);
                            next.delete(n);
                            return next;
                          });
                          setRowGlobalNums((prev) => {
                            if (!prev.has(n)) return prev;
                            const next = new Set(prev);
                            next.delete(n);
                            return next;
                          });
                          setRandomNums((prev) => {
                            if (!prev.has(n)) return prev;
                            const next = new Set(prev);
                            next.delete(n);
                            return next;
                          });
                          return;
                        }
                        toggleNum(n);
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
                        fontSize: 14,
                        fontWeight: 600,
                        color: labelColor,
                        textShadow:
                          isBlocked || isOn || randomCascadePhaseOneActive
                            ? "none"
                            : ROW_NUM_TEXT_SHADOW_IDLE,
                        pointerEvents: "auto",
                        cursor: isBlocked ? "not-allowed" : "pointer"
                      }}
                    >
                      <span
                        ref={(el) => {
                          if (el) honeyLabelElByNumRef.current[n] = el;
                          else delete honeyLabelElByNumRef.current[n];
                        }}
                        style={{
                          display: "inline-block",
                          transformOrigin: "50% 50%",
                          lineHeight: 1
                        }}
                      >
                        {n}
                      </span>
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
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                  minHeight: 44
                }}
              >
                <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                  {onionCount > 0 ? (
                    <>
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
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                  <select
                    aria-label="Onion skin level"
                    value={onionIdx}
                    onChange={handleOnionLevelChange}
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
                <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                  {frequencyDisplay ? (
                    <>
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
                          stroke={FREQUENCY_LIGHT_PURPLE}
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
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "'Outfit', -apple-system, sans-serif",
                          letterSpacing: "-0.03em",
                          textAlign: "center",
                          color: FREQUENCY_LIGHT_PURPLE,
                          pointerEvents: "none",
                          lineHeight: 1
                        }}
                      >
                        {frequencyDisplay}
                      </span>
                    </>
                  ) : (
                    <>
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
                      <FrequencyGlyphIcon off />
                    </>
                  )}
                  <select
                    aria-label="Frequency span"
                    value={frequencyIdx}
                    onChange={handleFrequencyLevelChange}
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
                    {FREQUENCY_LEVELS.map((level, idx) => (
                      <option key={`${level}d`} value={idx + 1}>
                        {level}d
                      </option>
                    ))}
                    <option value={FREQUENCY_LEVELS.length + 1}>{oldestDrawCount}d</option>
                  </select>
                </div>
              </div>
            </div>
            <div
              style={{
                justifySelf: "center",
                position: "relative",
                textAlign: toolbarHeader.align === "center" ? "center" : undefined,
                display: toolbarHeader.align === "center" ? undefined : "flex",
                justifyContent: toolbarHeader.align === "center" ? undefined : "center",
                minWidth: 0,
                maxWidth: "100%",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: toolbarHeader.letterSpacing ?? 0.35,
                textTransform: "none",
                color: toolbarHeader.color ?? SAVED_LOCK_ICON_GREEN,
                lineHeight: 1.25,
                whiteSpace: toolbarHeader.whiteSpace,
                textShadow: ROW_NUM_TEXT_SHADOW_IDLE
              }}
              title={toolbarHeader.title}
            >
              {toolbarHeader.secondary == null ? (
                toolbarHeader.primary
              ) : (
                <div style={{ textAlign: toolbarHeader.align === "right" ? "right" : "center" }}>
                  <div>{toolbarHeader.primary}</div>
                  <div>{toolbarHeader.secondary}</div>
                </div>
              )}
            </div>
            <div
              style={{
                justifySelf: "end",
                display: "flex",
                position: "relative",
                alignItems: "flex-end",
                justifyContent: "flex-end",
                gap: honeycombVisible && manualCount > 0 && !hasExpandButton ? 6 : 0,
                flexShrink: 0,
                minHeight: 44,
                /** Keep save controls on this lower toolbar row when honeycomb is hidden (avoid overlap with top-right minus). */
                marginTop: 0
              }}
            >
              {honeycombVisible ? (
                <button
                  ref={randomToolbarBtnRef}
                  className={`save-btn random-btn${randomCascadeRingActive ? " save-btn--ready random-btn--ready" : ""}${randomCascadeRingFading ? " random-btn--fading" : ""}`}
                  type="button"
                  disabled={randomCascadeBusy}
                  onClick={pickRandomManual}
                  aria-busy={randomCascadeBusy}
                  aria-label="Pick 7 random numbers on the honeycomb"
                  title="Random: replace manual picks with 7 random numbers"
                  style={{
                    position: hasExpandButton ? "absolute" : "relative",
                    right: hasExpandButton ? 0 : undefined,
                    bottom: hasExpandButton ? 52 : undefined,
                    zIndex: 1,
                    width: 44,
                    height: 44,
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: randomCascadeBusy ? "default" : "pointer",
                    flexShrink: 0,
                    order: manualCount > 0 && !hasExpandButton ? 2 : 0,
                    opacity: randomCascadeBusy ? 0.92 : 1,
                    transform:
                      hasExpandButton && randomToolbarLiftY
                        ? `translateY(${randomToolbarLiftY}px)`
                        : undefined,
                    "--random-glow-hue": randomCascadeGlowHue,
                    "--random-spin-ms": `${randomCascadeSpinMs}ms`
                  }}
                >
                  <span className="save-btn-rot-glow" aria-hidden="true" />
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
                  <svg
                    width="19"
                    height="12"
                    viewBox="0 0 19 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ position: "relative", zIndex: 1 }}
                    aria-hidden="true"
                  >
                    <path
                      d="M0 0.00047973V0.927061H4.13452L6.24413 3.12114L6.56588 3.44911L7.20549 2.80734L6.8927 2.47386L4.51442 0.000330891H0.453767L0 0.00047973ZM14.7857 0.00047973L4.13452 11.0805H0V12H4.51455L9.64933 6.66172L14.7857 12H19V11.0805H15.1674L10.2855 6.00181L15.1674 0.926739H19V0.00015745L18.5459 0L14.7857 0.00047973Z"
                      fill={randomIconFill}
                    />
                  </svg>
                </button>
              ) : null}
              {hasRightBottomControls ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 6,
                    flexShrink: 0,
                    order: manualCount > 0 && !hasExpandButton ? 1 : 0,
                    minHeight: 44
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
                  {showSaveButton ? (
                    <button
                      type="button"
                      onClick={saveManualRow}
                      className={`save-btn${hasUnsavedManualAdd ? " save-btn--ready" : ""}`}
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
                      <span className="save-btn-rot-glow" aria-hidden="true" />
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
                  ) : null}
                  {!showSaveButton ? (
                    <div
                      aria-hidden
                      style={{ width: 44, height: 44, flexShrink: 0, pointerEvents: "none" }}
                    />
                  ) : null}
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
                    <HexToolbarChevron
                      pointUp={savedOpen}
                      chevronFill={savedOpen ? SAVED_LOCK_ICON_GREEN : TOOLBAR_ACCENT_PINK}
                    />
                  </button>
                ) : null}
                </div>
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

      {frequencyGroups && (
        <div style={{ flexShrink: 0 }}>
          <div
            ref={frequencyTitleRef}
            style={{
              ...SECTION_LIST_LABEL_STYLE,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10
            }}
          >
            <span>Number Frequency</span>
          </div>
          <div
            style={{
              flexShrink: 0,
              paddingTop: SECTION_LIST_ROWS_PADDING_TOP + 4,
              paddingRight: 14,
              paddingBottom: 6,
              paddingLeft: 0,
              marginLeft: -6
            }}
          >
            {frequencyGroups.groups.map(({ count, nums }) => (
              <div
                key={`freq-${count}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                  marginBottom: 6
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 24,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    fontSize: 13,
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                    color: FREQUENCY_LIGHT_PURPLE,
                    lineHeight: 1,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                    fontVariantNumeric: "tabular-nums"
                  }}
                >
                  {count}x:
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 3,
                    minHeight: 24
                  }}
                >
                  {nums.map((n, idx) => {
                    const nColor = spectrumHexForNum(n, frequencyGroups.maxNumInWindow);
                    const isZero = count === 0;
                    const litByManualToggle =
                      n >= 1 &&
                      n <= totalCells &&
                      (activeNums.has(n) || rowGlobalNums.has(n));
                    const litForChip = Boolean(numBrightness[n]) || litByManualToggle;
                    /** Chips for row/onion selection; also honeycomb picks and row-ball toggles (incl. 0x). */
                    const showChip = litForChip && (!isZero || litByManualToggle);
                    const onionChipBrightness = numBrightness[n]?.brightness ?? 1;
                    const chipFillAlpha =
                      showChip && onionCount > 0 ? 0.15 + onionChipBrightness * 0.85 : showChip ? 0.9 : 0;
                    return (
                      <div
                        key={`freq-${count}-${n}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3
                        }}
                      >
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            requestAnimationFrame(() => {
                              requestAnimationFrame(() => scrollFrequencyTitleIntoView("smooth"));
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              requestAnimationFrame(() => {
                                requestAnimationFrame(() => scrollFrequencyTitleIntoView("smooth"));
                              });
                            }
                          }}
                          style={{
                            width: "auto",
                            minWidth: 21,
                            height: 24,
                            padding: "0 0",
                            borderRadius: showChip ? 7 : 0,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 400,
                            letterSpacing: "-0.01em",
                            color: showChip ? "#000000" : isZero ? TOOLBAR_ACCENT_PINK : "rgba(120,100,230,0.9)",
                            background: showChip ? themeRgba(nColor, chipFillAlpha) : "transparent",
                            lineHeight: 1,
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                            cursor: "pointer"
                          }}
                        >
                          {n}
                        </span>
                        {idx < nums.length - 1 ? (
                          <span
                            style={{
                              color: "rgba(120,100,230,0.85)",
                              fontSize: 14,
                              lineHeight: 1,
                              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace"
                            }}
                          >
                            ·
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
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
                paddingRight: 24
              }}
            >
              <span style={{ lineHeight: 1 }}>Saved</span>
              <button
                type="button"
                onClick={toggleSavedLock}
                style={{
                  width: 24,
                  height: 24,
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
                    padding: "7px 22px 7px 14px",
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
            const b = onionInnerBrightnessForDepth(depth, onionCount);
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
                          cursor: "pointer"
                        }}
                      >
                        {n}
                      </div>
                    );
                  })}
                  {(() => {
                    const bonusOn = row.bonus >= 1 && row.bonus <= totalCells && Boolean(numBrightness[row.bonus]);
                    const thBonus = spectrumHexForNum(row.bonus, totalCells);
                    const bBonus = numBrightness[row.bonus]?.brightness || 0;
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
                          color: bonusOn ? LIT_NUM_COLOR : isCurrent ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.175)",
                          background: bonusOn
                            ? themeRgba(thBonus, 0.15 + bBonus * 0.85)
                            : isCurrent
                              ? "rgba(19,20,24,0.0)"
                              : UI_NUM_CELL_IDLE,
                          border: `1px dashed ${BONUS_DASH_RGBA}`,
                          textShadow: bonusOn ? "none" : ROW_NUM_TEXT_SHADOW_IDLE,
                          transition: "all 0.25s",
                          cursor: "pointer"
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
                  paddingRight: 29
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
