import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";

const ROWS = [
  { nums: [7,12,29,38,39,44,52], maxNum: 52 },
  { nums: [4,13,20,31,37,43,51], maxNum: 52 },
  { nums: [1,11,16,20,28,32,45], maxNum: 50 },
  { nums: [3,8,15,19,23,29,37],  maxNum: 50 },
  { nums: [2,4,6,25,38,44,47],   maxNum: 50 },
  { nums: [6,11,31,38,40,46,50], maxNum: 50 },
  { nums: [5,34,37,38,48,49,50], maxNum: 50 },
  { nums: [6,11,32,33,34,39,49], maxNum: 50 },
  { nums: [2,14,25,31,36,41,47], maxNum: 50 },
  { nums: [7,10,24,25,34,45,49], maxNum: 50 },
  { nums: [6,7,23,25,29,30,38],  maxNum: 50 },
  { nums: [14,16,22,28,33,37,48],maxNum: 50 },
  { nums: [3,6,12,21,28,35,41],  maxNum: 50 },
  { nums: [1,3,4,18,20,23,31],   maxNum: 50 },
];

const ROW_COLORS = [
  "#ff78b4", "#00ff8c", "#00dcdc", "#ffcc00", "#ff5aa8",
  "#00e070", "#00b8c8", "#e6b82e", "#7a9fff", "#ff9ec8",
  "#40ffb8", "#40e8e8", "#ffd940", "#5ae0ff"
];

const HEX_FILL = 0x323339;
const HEX_RING = 0x2a2b31;
const UI_NUM_CELL_IDLE = "#323339";
const HONEY_HEX_LABEL = "#757575";
const ROW_NUM_TEXT_SHADOW_LIT = "0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.45)";
const ROW_NUM_TEXT_SHADOW_IDLE = "0 1px 1px rgba(0,0,0,0.5)";

const GRID_50 = [4,5,6,7,6,7,6,5,4]; // = 50
const GRID_52 = [4,5,6,7,8,7,6,5,4]; // = 52

const HEX_R = 20;
const HEX_W = Math.sqrt(3) * HEX_R;
const HEX_H = 2 * HEX_R;
const COL_S = HEX_W + 2;
const ROW_S = HEX_H * 0.75 + 1.5;
const CANVAS_H = 370;
const NAV_H = 56;
const ONION_LEVELS = [2, 3, 5, 8, 13];

function spectrumT(num, totalCells) {
  const i = Math.max(0, Math.min(num - 1, totalCells - 1));
  return totalCells <= 1 ? 0 : i / (totalCells - 1);
}
function spectrumHexForNum(num, totalCells) {
  const c = new THREE.Color();
  c.setHSL(spectrumT(num, totalCells), 0.82, 0.46);
  return `#${c.getHexString()}`;
}
function themeRgba(hex, a) {
  const x = hex.replace("#", "");
  return `rgba(${parseInt(x.slice(0, 2), 16)},${parseInt(x.slice(2, 4), 16)},${parseInt(x.slice(4, 6), 16)},${a})`;
}
function spectrumSpecColorsForNum(n, totalCells) {
  const t = spectrumT(n, totalCells);
  const specColor = new THREE.Color().setHSL(t, 0.82, 0.46);
  const specBorder = specColor.clone();
  const hsl = { h: 0, s: 0, l: 0 };
  specBorder.getHSL(hsl);
  specBorder.setHSL(hsl.h, Math.min(1, hsl.s * 1.1), Math.min(0.78, hsl.l + 0.12));
  return { specColor, specBorder };
}

function getPositions(gridRows) {
  const maxCols = Math.max(...gridRows);
  const pos = [];
  let n = 0;
  const maxRowW = (maxCols - 1) * COL_S;
  const gridH = (gridRows.length - 1) * ROW_S;
  for (let ri = 0; ri < gridRows.length; ri++) {
    const rc = gridRows[ri];
    const rowW = (rc - 1) * COL_S;
    for (let ci = 0; ci < rc; ci++) {
      n++;
      pos.push({ num: n, x: -maxRowW/2 + (maxRowW - rowW)/2 + ci * COL_S, y: gridH/2 - ri * ROW_S });
    }
  }
  return pos;
}

function getGridSize(gridRows) {
  const maxCols = Math.max(...gridRows);
  return {
    w: (maxCols - 1) * COL_S + HEX_W,
    h: (gridRows.length - 1) * ROW_S + HEX_H,
    maxCols,
  };
}

function NavButton({ dir, arrowColor, onNav }) {
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  function startHold() { onNav(dir); timerRef.current = setTimeout(() => { intervalRef.current = setInterval(() => onNav(dir), 500); }, 500); }
  function stopHold() { clearTimeout(timerRef.current); clearInterval(intervalRef.current); }
  useEffect(() => () => { clearTimeout(timerRef.current); clearInterval(intervalRef.current); }, []);
  return (
    <button onPointerDown={startHold} onPointerUp={stopHold} onPointerLeave={stopHold}
      onContextMenu={e => e.preventDefault()}
      style={{ background: "rgba(255,255,255,0.03)", border: `1.5px solid ${arrowColor}50`,
        width: 100, height: 42, borderRadius: 999, display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer", padding: 0, touchAction: "none" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={arrowColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points={dir === 1 ? "6 9 12 15 18 9" : "6 15 12 9 18 15"} />
      </svg>
    </button>
  );
}

export default function App() {
  const [activeNums, setActiveNums] = useState(new Set());
  const [currentRow, setCurrentRow] = useState(-1);
  const [onionIdx, setOnionIdx] = useState(1);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [labelPos, setLabelPos] = useState([]);
  const rowsRef = useRef(null);

  const onionCount = onionIdx === 0 ? 0 : ONION_LEVELS[onionIdx - 1];

  // Determine which grid to show based on current row
  const gridMode = useMemo(() => {
    if (currentRow < 0) return 50;
    // If ANY active row (current + onion skins) is a 52-row, show 52 grid
    const count = Math.max(onionCount, 1);
    for (let i = 0; i < count && currentRow + i < ROWS.length; i++) {
      if (ROWS[currentRow + i].maxNum === 52) return 52;
    }
    return ROWS[currentRow].maxNum;
  }, [currentRow, onionCount]);

  const gridRows = gridMode === 52 ? GRID_52 : GRID_50;
  const totalCells = gridMode === 52 ? 52 : 50;
  const positions = useMemo(() => getPositions(gridRows), [gridMode]);
  const gridSize = useMemo(() => getGridSize(gridRows), [gridMode]);

  const activeRowList = useMemo(() => {
    if (currentRow < 0) return [];
    const count = Math.max(onionCount, 1);
    const list = [];
    for (let i = 0; i < count && currentRow + i < ROWS.length; i++) {
      list.push({ ri: currentRow + i, depth: i });
    }
    return list;
  }, [currentRow, onionCount]);

  const numBrightness = useMemo(() => {
    const map = {};
    activeNums.forEach(n => { if (n <= totalCells) map[n] = { brightness: 1 }; });
    activeRowList.forEach(({ ri, depth }) => {
      let b;
      if (depth === 0) b = 1;
      else {
        const skinCount = Math.max(onionCount - 1, 1);
        b = skinCount <= 1 ? 0.75 : 0.75 - ((depth - 1) / (skinCount - 1)) * 0.65;
      }
      ROWS[ri].nums.forEach(n => {
        if (n >= 1 && n <= totalCells && (!map[n] || map[n].brightness < b)) {
          map[n] = { brightness: b };
        }
      });
    });
    return map;
  }, [activeNums, activeRowList, onionCount, totalCells]);

  const anyActive = Object.keys(numBrightness).length > 0;

  function toggleNum(n) {
    setActiveNums(prev => { const next = new Set(prev); next.has(n) ? next.delete(n) : next.add(n); return next; });
  }
  function clearAll() { setActiveNums(new Set()); setCurrentRow(-1); }
  function arrowNav(dir) {
    setCurrentRow(prev => {
      let next;
      if (prev === -1) next = dir === 1 ? 0 : ROWS.length - 1;
      else { next = prev + dir; if (next < 0) next = ROWS.length - 1; if (next >= ROWS.length) next = 0; }
      setTimeout(() => {
        const cards = rowsRef.current?.querySelectorAll("[data-ri]");
        if (cards?.[next]) cards[next].scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
      return next;
    });
  }
  function cycleOnion() { setOnionIdx(prev => (prev + 1) % (ONION_LEVELS.length + 1)); }
  function tapRow(ri) { setCurrentRow(prev => prev === ri ? -1 : ri); }

  // Build/rebuild Three.js scene when grid mode changes
  const buildScene = useCallback((el, gRows, tc) => {
    // Clear old
    if (sceneRef.current) {
      cancelAnimationFrame(sceneRef.current.raf);
      sceneRef.current.ren.dispose();
      if (el.contains(sceneRef.current.ren.domElement)) el.removeChild(sceneRef.current.ren.domElement);
    }

    const cW = el.clientWidth || 360, cH = CANVAS_H, pad = 12;
    const gs = getGridSize(gRows);
    const gA = gs.w / gs.h, cA = cW / cH;
    let camW, camH;
    if (cA > gA) { camH = gs.h + pad * 2; camW = camH * cA; }
    else { camW = gs.w + pad * 2; camH = camW / cA; }

    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-camW/2, camW/2, camH/2, -camH/2, 1, 100);
    cam.position.z = 10;
    const ren = new THREE.WebGLRenderer({ antialias: true });
    ren.setSize(cW, cH); ren.setPixelRatio(Math.min(window.devicePixelRatio, 2)); ren.setClearColor(0x212226);
    el.appendChild(ren.domElement);

    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i++) { const a = (Math.PI/3)*i - Math.PI/2; i===0 ? shape.moveTo(HEX_R*Math.cos(a), HEX_R*Math.sin(a)) : shape.lineTo(HEX_R*Math.cos(a), HEX_R*Math.sin(a)); }
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    const outR = HEX_R + 1.8;
    const outShape = new THREE.Shape();
    for (let i = 0; i < 6; i++) { const a = (Math.PI/3)*i - Math.PI/2; i===0 ? outShape.moveTo(outR*Math.cos(a), outR*Math.sin(a)) : outShape.lineTo(outR*Math.cos(a), outR*Math.sin(a)); }
    outShape.closePath();
    const outGeo = new THREE.ShapeGeometry(outShape);

    const pos = getPositions(gRows);
    const meshes = {};
    pos.forEach(({ num: n, x, y }) => {
      const outMat = new THREE.MeshBasicMaterial({ color: HEX_RING });
      const outMesh = new THREE.Mesh(outGeo, outMat); outMesh.position.set(x, y, 0); scene.add(outMesh);
      const mat = new THREE.MeshBasicMaterial({ color: HEX_FILL });
      const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, 1); scene.add(mesh);
      const { specColor, specBorder } = spectrumSpecColorsForNum(n, tc);
      meshes[n] = { mesh, mat, outMesh, outMat,
        specColor, specBorder,
        tgt: 1, cur: 1 };
    });

    const labels = pos.map(({ num: n, x, y }) => {
      const v = new THREE.Vector3(x, y, 1); v.project(cam);
      return { num: n, left: ((v.x+1)/2)*cW, top: ((-v.y+1)/2)*cH };
    });
    setLabelPos(labels);

    const state = { meshes, ren, scene, cam, raf: 0, tc };
    sceneRef.current = state;

    function loop() {
      state.raf = requestAnimationFrame(loop);
      for (let i = 1; i <= tc; i++) { const m = state.meshes[i]; m.cur += (m.tgt - m.cur) * 0.14; m.mesh.scale.setScalar(m.cur); m.outMesh.scale.setScalar(m.cur); }
      ren.render(scene, cam);
    }
    loop();
  }, []);

  // Init and rebuild when gridMode changes
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    buildScene(el, gridRows, totalCells);
    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.raf);
        sceneRef.current.ren.dispose();
        if (el.contains(sceneRef.current.ren.domElement)) el.removeChild(sceneRef.current.ren.domElement);
        sceneRef.current = null;
      }
    };
  }, [gridMode]);

  // Update hex colors
  useEffect(() => {
    if (!sceneRef.current) return;
    const { meshes, tc } = sceneRef.current;
    const black = new THREE.Color(HEX_FILL);
    const darkBorder = new THREE.Color(HEX_RING);
    for (let n = 1; n <= tc; n++) {
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
    }
  });

  const arrowColor = currentRow >= 0 ? ROW_COLORS[currentRow % ROW_COLORS.length] : "rgba(255,255,255,0.35)";

  return (
    <div onContextMenu={e => e.preventDefault()} style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#212226", fontFamily: "Outfit,sans-serif",
      color: "rgba(255,255,255,0.92)", userSelect: "none",
      WebkitUserSelect: "none", WebkitTouchCallout: "none",
    }}>
      {/* Clear */}
      <button onClick={clearAll} style={{
        position: "fixed", top: 12, left: 12, zIndex: 30,
        width: 32, height: 32, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: anyActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: anyActive ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
        fontSize: 20, fontWeight: 300, cursor: "pointer", fontFamily: "Outfit",
      }}>−</button>

      {/* Onion skin */}
      <button onClick={cycleOnion} style={{
        position: "fixed", top: 12, right: 12, zIndex: 30,
        height: 32, borderRadius: 999, padding: "0 12px",
        display: "flex", alignItems: "center", gap: 6,
        background: onionCount > 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${onionCount > 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
        color: onionCount > 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
        fontSize: 11, fontWeight: 600, letterSpacing: 1,
        cursor: "pointer", fontFamily: "'Outfit', -apple-system, sans-serif",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={onionCount > 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C6.5 6 4 9.5 4 13a8 8 0 0016 0c0-3.5-2.5-7-8-11z" />
          <path d="M12 6c-3.5 2.5-5 5-5 8a5 5 0 0010 0c0-3-1.5-5.5-5-8z" opacity="0.5" />
        </svg>
        {onionCount > 0 ? onionCount : "off"}
      </button>

      {/* Count + grid mode */}
      <div style={{
        position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)",
        zIndex: 30, fontSize: 10, fontWeight: 300, letterSpacing: 1,
        color: "rgba(255,255,255,0.3)", pointerEvents: "none",
        display: "flex", gap: 8, alignItems: "center",
      }}>
        {anyActive && <span><span style={{ color: "#7dd3fc", fontWeight: 500 }}>{Object.keys(numBrightness).length}</span> / {totalCells}</span>}
        {currentRow >= 0 && (
          <span style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "1px 6px", fontSize: 9 }}>
            1–{ROWS[currentRow].maxNum}
          </span>
        )}
      </div>

      {/* Honeycomb */}
      <div style={{
        flexShrink: 0, display: "flex", flexDirection: "column",
        alignItems: "center", width: "100%",
        background: "rgba(45, 45, 50, 0.96)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        paddingTop: 40,
      }}>
        <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 420 }}>
            <div ref={mountRef} style={{ width: "100%", height: CANVAS_H }} />
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: CANVAS_H, pointerEvents: "none" }}>
              {labelPos.map(({ num: n, left, top }) => {
                const info = numBrightness[n];
                const b = info ? info.brightness : 0;
                const isOn = !!info;
                const labelColor = isOn
                  ? `rgba(255,255,255,${0.2 + b * 0.8})`
                  : HONEY_HEX_LABEL;
                return (
                  <div key={n} onClick={() => toggleNum(n)} style={{
                    position: "absolute", left, top, transform: "translate(-50%, -50%)",
                    width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                    color: labelColor,
                    textShadow: isOn ? ROW_NUM_TEXT_SHADOW_LIT : ROW_NUM_TEXT_SHADOW_IDLE,
                    pointerEvents: "auto", cursor: "pointer",
                  }}>{n}</div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Rows label */}
      <div style={{ padding: "8px 14px 4px", flexShrink: 0, fontSize: 10, fontWeight: 300, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Rows</div>

      {/* Row cards */}
      <div ref={rowsRef} style={{ flex: 1, overflowY: "auto", padding: `4px 12px ${NAV_H + 20}px` }}>
        {ROWS.map((row, ri) => {
          const color = ROW_COLORS[ri % ROW_COLORS.length];
          const isCurrent = currentRow === ri;
          const onionEntry = activeRowList.find(o => o.ri === ri);
          const isOnion = !!onionEntry;
          const depth = onionEntry ? onionEntry.depth : -1;
          const is52 = row.maxNum === 52;

          let cardOpacity = 1;
          if (isOnion && depth > 0) {
            const skinCount = Math.max(onionCount - 1, 1);
            const b = skinCount <= 1 ? 0.75 : 0.75 - ((depth - 1) / (skinCount - 1)) * 0.65;
            cardOpacity = 0.3 + b * 0.7;
          }

          const activeCount = row.nums.filter(n => n >= 1 && n <= totalCells && !!numBrightness[n]).length;

          return (
            <div key={ri} data-ri={ri} onClick={() => tapRow(ri)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 8px", marginBottom: 4,
              background: isOnion ? color + "14" : "#323238",
              border: `2px solid ${isCurrent ? color : isOnion ? color + "40" : activeCount > 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
              borderRadius: 8, cursor: "pointer", transition: "all 0.2s",
              opacity: isOnion ? cardOpacity : 1,
            }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flexShrink: 0,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 600,
                  color: isOnion ? "#fff" : "rgba(255,255,255,0.4)",
                  background: isOnion ? color : "rgba(255,255,255,0.05)",
                }}>{ri + 1}</div>
                {is52 && <div style={{ fontSize: 7, color: "rgba(255,255,255,0.2)", fontWeight: 500 }}>52</div>}
              </div>
              <div style={{ display: "flex", gap: 4, flex: 1, justifyContent: "center" }}>
                {row.nums.map((n, ci) => {
                  const numOn = n >= 1 && n <= totalCells && !!numBrightness[n];
                  const th = spectrumHexForNum(n, totalCells);
                  const b = numBrightness[n]?.brightness || 0;
                  return (
                    <div key={ci} style={{
                      width: 38, height: 34, borderRadius: 5,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 600,
                      color: numOn ? `rgba(255,255,255,${0.3 + b * 0.7})` : HONEY_HEX_LABEL,
                      background: numOn ? themeRgba(th, 0.15 + b * 0.85) : UI_NUM_CELL_IDLE,
                      textShadow: numOn ? ROW_NUM_TEXT_SHADOW_LIT : ROW_NUM_TEXT_SHADOW_IDLE,
                      transition: "all 0.25s",
                    }}>{n}</div>
                  );
                })}
              </div>
              <div style={{
                fontSize: 9, fontWeight: 500,
                color: activeCount > 0 ? "rgba(255,255,255,0.3)" : "transparent",
                flexShrink: 0, width: 24, textAlign: "right",
              }}>{activeCount > 0 ? `${activeCount}/7` : "0/7"}</div>
            </div>
          );
        })}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: NAV_H + 8,
        background: "rgba(12,12,20,0.95)", borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 24, zIndex: 20,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", paddingBottom: 8,
      }}>
        <NavButton dir={1} arrowColor={arrowColor} onNav={arrowNav} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 60, justifyContent: "center" }}>
          {currentRow >= 0 ? (
            <>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: ROW_COLORS[currentRow % ROW_COLORS.length],
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "#fff" }}>{currentRow + 1}</div>
              <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.35)" }}>/ {ROWS.length}</span>
            </>
          ) : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>—</span>}
        </div>
        <NavButton dir={-1} arrowColor={arrowColor} onNav={arrowNav} />
      </div>
    </div>
  );
}
