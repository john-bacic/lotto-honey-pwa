import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { getDrawRows } from "./lib/draws";

/** Base + honeycomb off-state (minus hex screenshot): outer #212226, face #323339, text #757575 */
const UI_BG = "#212226";
const UI_CARD = "#323339";
const UI_NUM_CELL_IDLE = "#323339";
/** Bottom nav + pinned top (toolbar, honeycomb, save row) */
const UI_NAV_BG = "rgba(45, 45, 50, 0.96)";
const HONEY_HEX_FACE_RGBA = "rgba(50,51,57,0.98)";
const HONEY_HEX_STROKE_RGBA = "rgba(42,43,49,0.95)";
const HONEY_HEX_LABEL = "#757575";
const HEX_FILL = 0x323339;
const HEX_RING = 0x2a2b31;
/** Digit legibility on row chips — white on spectrum needs separation from fill */
const ROW_NUM_TEXT_SHADOW_LIT = "0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.45)";
const ROW_NUM_TEXT_SHADOW_IDLE = "0 1px 1px rgba(0,0,0,0.5)";

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
const NAV_H = 68;
const ONION_LEVELS = [2, 3, 5, 8, 13, 21];

const ROWS = getDrawRows();

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
    const minNext = rows.length > 0 ? Math.max(...rows.map((row) => row.savedNumber)) + 1 : 1;
    let nextSavedNumber =
      typeof parsed.nextSavedNumber === "number" && parsed.nextSavedNumber >= 1
        ? parsed.nextSavedNumber
        : minNext;
    if (nextSavedNumber < minNext) nextSavedNumber = minNext;
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

function LockIcon({ locked, color = "rgba(255,255,255,0.65)" }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {locked ? <rect x="5" y="11" width="14" height="10" rx="2" /> : <rect x="5" y="11" width="14" height="10" rx="2" />}
      {locked ? <path d="M8 11V8a4 4 0 018 0v3" /> : <path d="M8 11V8a4 4 0 018 0" />}
    </svg>
  );
}

export default function App() {
  const [activeNums, setActiveNums] = useState(new Set());
  const [currentRow, setCurrentRow] = useState(0);
  const [selectedSavedId, setSelectedSavedId] = useState(null);
  const [savedRows, setSavedRows] = useState([]);
  const [nextSavedNumber, setNextSavedNumber] = useState(1);
  const [savedRowsHydrated, setSavedRowsHydrated] = useState(false);
  const [savedOpen, setSavedOpen] = useState(true);
  const [savedLocked, setSavedLocked] = useState(true);
  const [onionIdx, setOnionIdx] = useState(0);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [labelPos, setLabelPos] = useState([]);
  const rowsRef = useRef(null);
  const scrollRootRef = useRef(null);
  const pinnedHeaderRef = useRef(null);

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
    const { savedRows: loaded, nextSavedNumber: next } = loadSavedRowsFromStorage();
    setSavedRows(loaded);
    setNextSavedNumber(next);
    setSavedRowsHydrated(true);
  }, []);

  useEffect(() => {
    if (!savedRowsHydrated) return;
    persistSavedRowsToStorage(savedRows, nextSavedNumber);
  }, [savedRows, nextSavedNumber, savedRowsHydrated]);

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
  }, [documentScrollIos, savedOpen, savedRows.length, currentRow, onionIdx]);

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

  useEffect(() => {
    function checkStandalone() {
      setStandalonePwa(readStandalonePwa());
    }
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", checkStandalone);
    return () => mq.removeEventListener("change", checkStandalone);
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

  const numBrightness = useMemo(() => {
    const map = {};
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
  }, [activeNums, activeRowList, onionCount, totalCells, savedRows, selectedSavedId]);

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
    setSelectedSavedId(id);
    setCurrentRow(-1);
    setSavedOpen(true);
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
    if (currentRow >= 0 || selectedSavedId) {
      setCurrentRow(-1);
      setSelectedSavedId(null);
      return;
    }
    setActiveNums(new Set());
  }

  function arrowNav(dir, allowLoop = false) {
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
  }

  useEffect(() => {
    if (currentRow < 0) return;
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
        arrowNav(1, event.repeat);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        arrowNav(-1, event.repeat);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const tapRow = (ri) => {
    setSelectedSavedId(null);
    setCurrentRow((prev) => (prev === ri ? -1 : ri));
  };

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

    const innerOuterR = HEX_R - 1.1;
    const innerInnerR = HEX_R - 3.1;
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
        cur: 1
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
        m.mesh.scale.setScalar(m.cur);
        m.innerMesh.scale.setScalar(m.cur);
        m.outMesh.scale.setScalar(m.cur);
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
        h.tgt = 0.95 + b * 0.1;
      } else {
        h.mat.color.set(HEX_FILL);
        h.outMat.color.set(HEX_RING);
        h.tgt = 1;
      }
      h.innerMat.opacity = activeNums.has(n) ? 1 : 0;
    }
  }, [numBrightness, totalCells, activeNums]);

  const arrowColor = currentRow >= 0 ? ROW_COLORS[currentRow % ROW_COLORS.length] : HONEY_HEX_LABEL;
  const atTopBoundary = currentRow === 0;
  const atBottomBoundary = currentRow === ROWS.length - 1;
  const hasRowLikeSelection = currentRow >= 0 || selectedSavedId !== null;
  const canTurnOff = currentRow >= 0 || selectedSavedId !== null || activeNums.size > 0;
  const hasManualClear = activeNums.size > 0;
  const topDraw = currentRow >= 0 ? ROWS[currentRow] : null;
  const topRowColor = ROW_COLORS[(currentRow >= 0 ? currentRow : 0) % ROW_COLORS.length];

  const rowsScrollBottomPad = standalonePwa
    ? `calc(${NAV_H + 20}px + env(safe-area-inset-bottom, 0px))`
    : "20px";

  return (
    <div
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
                flexDirection: "column"
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
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 6,
            paddingBottom: 0,
            boxSizing: "border-box",
            flexShrink: 0
          }}
        >
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
                fill={canTurnOff ? HONEY_HEX_FACE_RGBA : "rgba(255,255,255,0.05)"}
                stroke={
                  hasRowLikeSelection
                    ? "rgba(255,80,128,0.98)"
                    : HONEY_HEX_STROKE_RGBA
                }
                strokeWidth="4"
              />
              {hasManualClear && (
                <polygon
                  points="50,11 85,30 85,70 50,89 15,70 15,30"
                  fill="none"
                  stroke="rgba(255,80,128,0.98)"
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
                background: canTurnOff ? "rgba(255,80,128,0.98)" : HONEY_HEX_LABEL
              }}
            />
          </button>

          <div
            style={{
              position: "relative",
              height: 32,
              borderRadius: 999,
              padding: "0 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: onionCount > 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${onionCount > 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
              color: onionCount > 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1,
              fontFamily: "'Outfit', -apple-system, sans-serif",
              flexShrink: 0
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={onionCount > 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2C6.5 6 4 9.5 4 13a8 8 0 0016 0c0-3.5-2.5-7-8-11z" />
              <path d="M12 6c-3.5 2.5-5 5-5 8a5 5 0 0010 0c0-3-1.5-5.5-5-8z" opacity="0.5" />
            </svg>
            {onionCount > 0 && <span>{onionCount}</span>}
            {onionCount > 0 && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.65 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
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
              <option value={0}>off</option>
              {ONION_LEVELS.map((level, idx) => (
                <option key={level} value={idx + 1}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 0,
            marginTop: -18
          }}
        >
          <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 480 }}>
              <div ref={mountRef} style={{ width: "100%", height: CANVAS_H }} />
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: CANVAS_H, pointerEvents: "auto" }}>
                {labelPos.map(({ num: n, left, top }) => {
                  const info = numBrightness[n];
                  const b = info ? info.brightness : 0;
                  const isOn = Boolean(info);
                  const isManuallySelected = activeNums.has(n);
                  const isBlocked = manualLimitReached && !isManuallySelected;
                  const labelColor = isBlocked
                    ? "rgba(52,54,58,0.95)"
                    : isOn
                      ? `rgba(255,255,255,${0.2 + b * 0.8})`
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
                        textShadow: isOn ? ROW_NUM_TEXT_SHADOW_LIT : isBlocked ? "none" : ROW_NUM_TEXT_SHADOW_IDLE,
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
            padding: "4px 14px 2px",
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
              <button
                onClick={saveManualRow}
                disabled={manualCount === 0}
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: manualCount > 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                  color: manualCount > 0 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.25)",
                  borderRadius: 999,
                  height: 24,
                  padding: "0 10px",
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  cursor: manualCount > 0 ? "pointer" : "not-allowed",
                  fontFamily: "Outfit,sans-serif",
                  flexShrink: 0
                }}
              >
                Save {manualCount}
              </button>
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
                color: topRowColor,
                lineHeight: 1.25
              }}
            >
              {topDraw ? formatDrawDateJackpot(topDraw.date, topDraw.jackpot) : null}
            </div>
            <div
              style={{
                justifySelf: "end",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
                minHeight: 24
              }}
            >
              {savedRows.length > 0 && (
                <>
                  <button
                    onClick={() => setSavedOpen((prev) => !prev)}
                    style={{
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.6)",
                      borderRadius: 999,
                      height: 24,
                      padding: "0 10px",
                      fontSize: 10,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontFamily: "Outfit,sans-serif"
                    }}
                  >
                    {savedOpen ? "Hide" : "Show"} ({savedRows.length})
                  </button>
                  <button
                    onClick={() => setSavedLocked((prev) => !prev)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: savedLocked ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer"
                    }}
                    title={savedLocked ? "Unlock all saved rows" : "Lock all saved rows"}
                  >
                    <LockIcon locked={savedLocked} color={savedLocked ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)"} />
                  </button>
                </>
              )}
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
        <div style={{ flexShrink: 0, maxHeight: 180, overflowY: "auto", padding: "0 12px 6px" }}>
          {savedRows.length > 0 &&
            savedRows.map((row, ri) => {
              const color = ROW_COLORS[ri % ROW_COLORS.length];
              const isCurrent = selectedSavedId === row.id;
              return (
                <div
                  key={row.id}
                  onClick={() => tapSavedRow(row.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 8px",
                    marginBottom: 4,
                    background: isCurrent ? `${color}14` : UI_CARD,
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
                        fontSize: 11,
                        fontWeight: 700,
                        color: isCurrent ? "#fff" : "rgba(255,255,255,0.6)",
                        background: isCurrent ? color : "rgba(255,255,255,0.08)"
                      }}
                    >
                      {row.savedNumber}
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
                        const isOn = Boolean(numBrightness[n]);
                        return (
                          <div
                            key={`${row.id}-${n}-${slotIdx}`}
                            style={{
                              width: 38,
                              height: 34,
                              borderRadius: 5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              fontWeight: 600,
                              color: isOn ? "rgba(255,255,255,0.95)" : HONEY_HEX_LABEL,
                              background: isOn ? themeRgba(th, 0.82) : UI_NUM_CELL_IDLE,
                              textShadow: isOn ? ROW_NUM_TEXT_SHADOW_LIT : ROW_NUM_TEXT_SHADOW_IDLE
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
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.55)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      lineHeight: 1,
                      cursor: savedLocked ? "not-allowed" : "pointer",
                      opacity: savedLocked ? 0.8 : 1
                    }}
                    title={savedLocked ? "All saved rows are locked" : "Delete saved row"}
                  >
                    {savedLocked ? <LockIcon locked color="rgba(255,255,255,0.6)" /> : "×"}
                  </button>
                </div>
              );
            })}
        </div>
      )}

      <div
        style={{
          padding: "8px 14px 4px",
          flexShrink: 0,
          fontSize: 10,
          fontWeight: 300,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.25)"
        }}
      >
        <span>Rows</span>
      </div>

      <div
        ref={rowsRef}
        style={{
          padding: `4px 12px ${rowsScrollBottomPad}`
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
                    fontSize: 10,
                    fontWeight: 600,
                    color: isOnion ? "#fff" : "rgba(255,255,255,0.4)",
                    background: isOnion ? color : "rgba(255,255,255,0.05)"
                  }}
                >
                  {ri + 1}
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
                        style={{
                          width: 38,
                          height: 34,
                          borderRadius: 5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 600,
                          color: numOn ? `rgba(255,255,255,${0.3 + b * 0.7})` : HONEY_HEX_LABEL,
                          background: numOn ? themeRgba(th, 0.15 + b * 0.85) : UI_NUM_CELL_IDLE,
                          textShadow: numOn ? ROW_NUM_TEXT_SHADOW_LIT : ROW_NUM_TEXT_SHADOW_IDLE,
                          transition: "all 0.25s"
                        }}
                      >
                        {n}
                      </div>
                    );
                  })}
                  {(() => {
                    const bonusOn = row.bonus >= 1 && row.bonus <= totalCells && Boolean(numBrightness[row.bonus]);
                    const bonusHex = spectrumHexForNum(row.bonus, totalCells);
                    const bonusBrightness = numBrightness[row.bonus]?.brightness || 0;
                    const textAlpha = bonusOn ? (0.3 + bonusBrightness * 0.7) * 0.5 : 0.35 * 0.5;
                    const bgAlpha = (0.15 + bonusBrightness * 0.85) * 0.5;
                    return (
                      <div
                        style={{
                          width: 38,
                          height: 34,
                          borderRadius: 5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 600,
                          color: `rgba(255,255,255,${textAlpha})`,
                          background: bonusOn ? themeRgba(bonusHex, bgAlpha) : UI_NUM_CELL_IDLE,
                          border: "1px dashed rgba(255,255,255,0.2)",
                          textShadow: bonusOn ? ROW_NUM_TEXT_SHADOW_LIT : ROW_NUM_TEXT_SHADOW_IDLE,
                          transition: "all 0.25s"
                        }}
                        title="Bonus number"
                      >
                        {row.bonus}
                      </div>
                    );
                  })()}
              </div>
              <div style={{ fontSize: 9, fontWeight: 500, color: activeCount > 0 ? "rgba(255,255,255,0.3)" : "transparent", flexShrink: 0, width: 24, textAlign: "right" }}>
                {activeCount > 0 ? `${activeCount}/7` : "0/7"}
              </div>
            </div>
          );
        })}
      </div>

      </div>

      {standalonePwa && (
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
              WebkitBackdropFilter: "blur(12px)"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                minHeight: NAV_H + 8,
                paddingTop: 8,
                paddingBottom: 8
              }}
            >
              <NavButton dir={1} arrowColor={arrowColor} onNav={arrowNav} dimmed={atBottomBoundary} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 60, justifyContent: "center" }}>
                {currentRow >= 0 ? (
                  <>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: ROW_COLORS[currentRow % ROW_COLORS.length],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#fff"
                      }}
                    >
                      {currentRow + 1}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 400, color: HONEY_HEX_LABEL }}>/ {ROWS.length}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>-</span>
                )}
              </div>
              <NavButton dir={-1} arrowColor={arrowColor} onNav={arrowNav} dimmed={atTopBoundary} />
            </div>
          </div>
      )}
    </div>
  );
}
