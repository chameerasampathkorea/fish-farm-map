'use strict';
const NS = 'http://www.w3.org/2000/svg';
const tanks = [];
function rect(id, x, y, w, h) {
  tanks.push({ id: String(id), points: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] });
}
function polygon(id, points) {
  tanks.push({ id: String(id), points });
}

[314, 313, 312, 311].forEach((id, i) => rect(id, 90 + i * 83, 270, 83, 125));
[324, 323, 322, 321].forEach((id, i) => rect(id, 90 + i * 83, 415, 83, 125));
rect(214, 480, 270, 113, 125);
[213, 212, 211].forEach((id, i) => rect(id, 593 + i * 83, 270, 83, 125));
[224, 223, 222, 221].forEach((id, i) => rect(id, 512 + i * 82.5, 415, 82.5, 125));
[111, 112, 113].forEach((id, i) => rect(id, 900 + i * 93, 155, 93, 103));
polygon(114, [[1210, 155], [1250, 155], [1300, 208], [1300, 258], [1210, 258]]);
[121, 122, 123].forEach((id, i) => rect(id, 900 + i * 93, 285, 93, 112));
rect(124, 1210, 285, 90, 112);
polygon(125, [[1300, 258], [1332, 287], [1416, 397], [1300, 397]]);
[131, 132, 133].forEach((id, i) => rect(id, 900 + i * 93, 425, 93, 115));
[134, 135, 136].forEach((id, i) => rect(id, 1210 + i * 82, 425, 82, 115));
polygon(137, [[1482, 464], [1526, 501], [1540, 521], [1540, 552], [1482, 552]]);

const stockKey = 'korea-fish-farm-stock-v1';
const maxQuantity = 1000000;
let stock = {};
const settingsKey = 'korea-fish-farm-settings-v1';
let settings = { farmName: 'Korea Fish Farm', showCounts: true };
const draftKey = 'korea-fish-farm-json-draft-v1';
let publishedData = null, editorEnabled = false, snapshotUpdatedAt = null, loadSequence = 0;

const svg = document.getElementById('farm');
const scene = document.getElementById('scene');
const viewport = document.getElementById('viewport');
const initial = { x: 0, y: 0, w: 1620, h: 690 };
let view = { ...initial }, selected = null;

function node(tag, attrs, parent = scene) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent.append(e);
  return e;
}
function path(points) {
  return points.map((p, i) => (i ? 'L' : 'M') + p.join(' ')).join(' ') + 'Z';
}
function bounds(points) {
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
function centroid(points) {
  let area = 0, x = 0, y = 0;
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length], cross = p[0] * q[1] - q[0] * p[1];
    area += cross;
    x += (p[0] + q[0]) * cross;
    y += (p[1] + q[1]) * cross;
  });
  return { x: x / (3 * area), y: y / (3 * area) };
}
function inside(x, y, points) {
  let yes = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [a, b] = points[i], [c, d] = points[j];
    if (((b > y) !== (d > y)) && (x < (c - a) * (y - b) / (d - b) + a)) yes = !yes;
  }
  return yes;
}

// Lightweight background base (No heavy filters or patterns)
node('rect', { x: 30, y: 105, width: 1550, height: 490, rx: 15, fill: 'url(#ground)' });
node('rect', { x: 51, y: 125, width: 1508, height: 450, rx: 10, fill: '#b8beb2' });
node('path', { d: 'M73 552H1455M440 251V552M862 235V550', fill: 'none', stroke: '#e5e6d9', 'stroke-width': 13 });
node('path', { d: 'M92 250H415M482 250H842M902 135H1237', fill: 'none', stroke: '#3b4943', 'stroke-width': 7, 'stroke-linecap': 'round' });
for (let i = 0; i < 10; i++) {
  const x = 90 + i * 155;
  node('path', { d: `M${x} 576v12`, stroke: '#788579', 'stroke-width': 3 });
}

// Simple static trees without drop-shadow filters
[[45, 82], [1570, 87], [43, 610], [1570, 610], [620, 86], [820, 87]].forEach(([x, y]) => {
  const g = node('g', {});
  node('circle', { cx: x, cy: y, r: 22, fill: '#6d8961' }, g);
  node('circle', { cx: x - 9, cy: y - 5, r: 15, fill: '#91a87a' }, g);
  node('circle', { cx: x + 6, cy: y + 7, r: 14, fill: '#557b53' }, g);
});

// Ultra-lightweight tank generation (No clipPaths, no animated ripples/bubbles, no shadows)
tanks.forEach(tank => {
  const d = path(tank.points), b = bounds(tank.points), c = centroid(tank.points);
  tank.bounds = b;
  tank.center = c;

  // Pre-calculate valid inner grid positions once at startup
  const candidates = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const x = b.x + 14 + (col + 0.5) * (b.w - 28) / 8;
      const y = b.y + 14 + (row + 0.5) * (b.h - 28) / 8;
      if (inside(x, y, tank.points)) candidates.push({ x, y });
    }
  }
  tank.candidates = candidates;

  const g = node('g', {
    class: 'tank',
    tabindex: 0,
    role: 'button',
    'aria-label': `Tank ${tank.id}`,
    'aria-pressed': 'false',
    'data-tank': tank.id
  });
  tank.element = g;

  const title = node('title', {}, g);
  title.textContent = `Tank ${tank.id}`;
  tank.title = title;

  // Tank rim & water surface
  tank.surface = node('path', { d, fill: 'url(#water)', stroke: 'url(#rim)', 'stroke-width': 10, 'stroke-linejoin': 'round' }, g);

  // Static fish container
  tank.school = node('g', { class: 'fish-school', opacity: 0.75 }, g);

  // Selection border & text labels
  node('path', { d, class: 'selection', 'stroke-linejoin': 'round' }, g);
  const label = node('text', { x: c.x, y: c.y + 6, 'text-anchor': 'middle' }, g);
  label.textContent = tank.id;

  tank.countLabel = node('text', { x: c.x, y: c.y - 17, 'text-anchor': 'middle', class: 'count-label', visibility: 'hidden' }, g);
  tank.emptyLabel = node('text', { x: c.x, y: c.y + 25, 'text-anchor': 'middle', class: 'empty-label', visibility: 'hidden' }, g);
  tank.emptyLabel.textContent = 'Empty';

  g.addEventListener('click', () => { if (!dragged) selectTank(tank.id); });
  g.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectTank(tank.id);
    }
  });
});

const select = document.getElementById('tank-select');
for (const tank of [...tanks].sort((a, b) => Number(a.id) - Number(b.id))) {
  const o = document.createElement('option');
  o.value = tank.id;
  o.textContent = tank.id;
  select.append(o);
}

let renderPending = false;
const zElem = document.getElementById('zoom-level');

function update() {
  view.w = Math.max(180, Math.min(initial.w * 1.5, view.w));
  view.h = view.w * initial.h / initial.w;
  view.x = Math.max(-initial.w * 0.35, Math.min(initial.w - view.w * 0.1, view.x));
  view.y = Math.max(-initial.h * 0.35, Math.min(initial.h - view.h * 0.1, view.y));

  if (!renderPending) {
    renderPending = true;
    requestAnimationFrame(() => {
      svg.setAttribute('viewBox', `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`);
      if (zElem) zElem.value = `${Math.round(initial.w / view.w * 100)}%`;
      renderPending = false;
    });
  }
}

function focusBounds(b) {
  const w = Math.max(300, b.w + 150, (b.h + 130) * initial.w / initial.h);
  view = { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - w * initial.h / initial.w / 2, w, h: w * initial.h / initial.w };
  update();
}

function selectionDetails() {
  const form = document.getElementById('stock-form');
  form.hidden = !selected || !editorEnabled;
  if (!selected) return;
  const q = stock[selected];
  const description = q === undefined ? 'Fish quantity not set' : q === 0 ? 'Empty · 0 fish' : `${q.toLocaleString()} fish`;
  document.getElementById('selection').innerHTML = `<span class="selection-icon">≈</span><h3>Tank ${selected}</h3><p>Block ${selected[0]} · ${description}</p>`;
  document.getElementById('fish-quantity').value = q === undefined ? '' : String(q);
  document.getElementById('stock-message').textContent = '';
}

function selectTank(id) {
  const t = tanks.find(t => t.id === id);
  if (!t) return;
  selected = id;
  select.value = id;
  tanks.forEach(t => {
    const isSel = t.id === id;
    t.element.classList.toggle('selected', isSel);
    t.element.setAttribute('aria-pressed', String(isSel));
  });
  focusBounds(t.bounds);
  selectionDetails();
}

function reset() {
  selected = null;
  select.value = '';
  tanks.forEach(t => {
    t.element.classList.remove('selected');
    t.element.setAttribute('aria-pressed', 'false');
  });
  view = { ...initial };
  update();
  document.getElementById('selection').innerHTML = '<span class="selection-icon">⌖</span><h3>Take a closer look</h3><p>Click a tank on the map or choose its number above.</p>';
  document.getElementById('stock-form').hidden = true;
}

// Cap maximum fish icons per tank to 24 (instead of 120) so DOM stays super fast
function renderStock() {
  const largest = Math.max(0, ...Object.values(stock));
  const unit = Math.max(1, Math.ceil(largest / 24));

  for (const tank of tanks) {
    const q = stock[tank.id], b = tank.bounds;
    const empty = q === 0;
    tank.element.classList.toggle('empty', empty);
    tank.emptyLabel.setAttribute('visibility', empty ? 'visible' : 'hidden');
    tank.surface.setAttribute('fill', empty ? 'url(#dry)' : 'url(#water)');
    tank.school.replaceChildren();

    const description = q === undefined ? 'quantity not set' : empty ? 'Empty, 0 fish' : `${q.toLocaleString()} fish`;
    tank.element.setAttribute('aria-label', `Tank ${tank.id}, ${description}`);
    tank.title.textContent = `Tank ${tank.id} — ${description}`;

    const count = q > 0 ? Math.min(24, Math.max(1, Math.round(q / unit))) : 0;
    if (!count) continue;

    const candidates = tank.candidates;
    const size = Math.max(0.22, Math.min(0.5, Math.sqrt(b.w * b.h / count) / 38));
    const frag = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const p = candidates[Math.floor((i + 0.5) * candidates.length / count)] || tank.center;
      const deg = (Number(tank.id) * 37 + i * 137) % 360;
      const u = document.createElementNS(NS, 'use');
      u.setAttribute('href', '#fishShape');
      u.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${deg}) scale(${size.toFixed(2)})`);
      frag.append(u);
    }
    tank.school.append(frag);
  }

  document.getElementById('fish-scale').textContent = largest === 0
    ? 'Set fish quantities to populate the tanks'
    : unit === 1
      ? '1 fish symbol = 1 fish'
      : `1 fish symbol ≈ ${unit.toLocaleString()} fish · Same scale for all tanks`;

  const configured = Object.values(stock);
  const emptyCount = configured.filter(q => q === 0).length;
  const occupied = configured.filter(q => q > 0).length;
  document.getElementById('stock-summary').textContent = `${occupied} stocked · ${emptyCount} empty · ${32 - configured.length} not set`;
  renderCountLabels();
}

function renderCountLabels() {
  for (const tank of tanks) {
    const q = stock[tank.id];
    const text = q === undefined ? '' : `${q.toLocaleString()} fish`;
    tank.countLabel.textContent = text;
    tank.countLabel.setAttribute('style', `font-size:${Math.min(10, (tank.bounds.w - 14) / Math.max(1, text.length * 0.6))}px`);
    tank.countLabel.setAttribute('visibility', settings.showCounts && q !== undefined ? 'visible' : 'hidden');
  }
  document.getElementById('show-counts').checked = settings.showCounts;
}

document.getElementById('show-counts').addEventListener('change', e => {
  settings.showCounts = e.target.checked;
  renderCountLabels();
  if (editorEnabled) {
    saveDraft();
    document.getElementById('label-message').textContent = 'Draft changed.';
  }
});

function applyFarmName() {
  document.getElementById('farm-brand').textContent = settings.farmName;
  document.getElementById('farm-footer').textContent = settings.farmName;
  document.getElementById('farm-name').value = settings.farmName;
  document.title = `${settings.farmName} | Aerial Tank Map`;
}

document.getElementById('farm-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!editorEnabled) return;
  const name = document.getElementById('farm-name').value.trim();
  if (!name || name.length > 80) return;
  settings.farmName = name;
  saveDraft();
  applyFarmName();
});

function updateDate(now = new Date()) {
  const date = document.getElementById('farm-date');
  date.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', day: '2-digit', month: 'short', year: 'numeric' }).format(now);
}
applyFarmName();
updateDate();
setInterval(updateDate, 60000);

function setQuantity(id, q) {
  if (!editorEnabled || !tanks.some(t => t.id === id) || !Number.isSafeInteger(q) || q < 0 || q > maxQuantity) return false;
  stock[id] = q;
  saveDraft();
  renderStock();
  selectionDetails();
  return true;
}

document.getElementById('stock-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!selected) return;
  const input = document.getElementById('fish-quantity'), raw = input.value.trim();
  if (!raw || !/^\d+$/.test(raw) || !setQuantity(selected, Number(raw))) {
    document.getElementById('stock-message').textContent = 'Enter a valid number.';
  }
});
document.getElementById('mark-empty').onclick = () => { if (selected) setQuantity(selected, 0); };

function normalizeData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.version !== 1) throw new Error('Version mismatch');
  return {
    version: 1,
    farmName: data.farmName.trim(),
    showCounts: data.showCounts ?? true,
    updatedAt: data.updatedAt ?? null,
    tanks: Object.fromEntries([...tanks].sort((a, b) => Number(a.id) - Number(b.id)).map(t => [t.id, data.tanks[t.id] ?? null]))
  };
}
function snapshot(timestamp = snapshotUpdatedAt) {
  return {
    version: 1,
    farmName: settings.farmName,
    showCounts: settings.showCounts,
    updatedAt: timestamp,
    tanks: Object.fromEntries([...tanks].sort((a, b) => Number(a.id) - Number(b.id)).map(t => [t.id, stock[t.id] ?? null]))
  };
}
function applyData(data) {
  stock = {};
  for (const [id, q] of Object.entries(data.tanks)) if (q !== null) stock[id] = q;
  settings = { farmName: data.farmName, showCounts: data.showCounts };
  snapshotUpdatedAt = data.updatedAt;
  applyFarmName();
  renderStock();
  selectionDetails();
}
function saveDraft() {
  try {
    localStorage.setItem(draftKey, JSON.stringify(snapshot()));
    return true;
  } catch {
    return false;
  }
}

function toggleEditor(enabled) {
  editorEnabled = enabled;
  document.getElementById('edit-mode').textContent = enabled ? 'Close draft editor' : 'Edit / export JSON';
  document.getElementById('json-tools').hidden = !enabled;
  document.getElementById('farm-settings').hidden = !enabled;
  document.getElementById('reload-data').disabled = enabled;
  selectionDetails();
}
document.getElementById('edit-mode').onclick = () => toggleEditor(!editorEnabled);

async function loadPublished() {
  const sequence = ++loadSequence;
  try {
    const response = await fetch('./farm-data.json', { cache: 'no-store' });
    const data = normalizeData(await response.json());
    if (sequence !== loadSequence) return;
    publishedData = data;
    if (!editorEnabled) applyData(data);
    document.getElementById('data-status').textContent = 'Showing published farm-data.json.';
  } catch (e) {
    document.getElementById('data-status').textContent = 'Could not load published JSON.';
  }
}

document.getElementById('reload-data').onclick = () => { if (!editorEnabled) loadPublished(); };
document.getElementById('export-json').onclick = () => {
  const blob = new Blob([JSON.stringify(snapshot(new Date().toISOString()), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url;
  a.download = 'farm-data.json';
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// JSON Import & Local Draft handlers
const jsonImport = document.getElementById('json-import');
document.getElementById('json-import-open').onclick = () => jsonImport.click();
jsonImport.onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = normalizeData(JSON.parse(await file.text()));
    applyData(data);
    saveDraft();
    document.getElementById('json-message').textContent = 'Imported JSON file.';
  } catch {
    document.getElementById('json-message').textContent = 'Invalid JSON file.';
  }
  jsonImport.value = '';
};

document.getElementById('load-draft').onclick = () => {
  try {
    const raw = localStorage.getItem(draftKey);
    if (!raw) {
      document.getElementById('json-message').textContent = 'No saved draft found.';
      return;
    }
    applyData(normalizeData(JSON.parse(raw)));
    document.getElementById('json-message').textContent = 'Loaded saved draft.';
  } catch {
    document.getElementById('json-message').textContent = 'Could not load draft.';
  }
};

document.getElementById('import-previous').onclick = () => {
  try {
    const raw = localStorage.getItem(stockKey);
    if (!raw) {
      document.getElementById('json-message').textContent = 'No previous browser counts found.';
      return;
    }
    const oldStock = JSON.parse(raw);
    for (const [id, q] of Object.entries(oldStock)) {
      if (Number.isSafeInteger(q) && q >= 0) stock[id] = q;
    }
    saveDraft();
    renderStock();
    selectionDetails();
    document.getElementById('json-message').textContent = 'Loaded previous browser counts.';
  } catch {
    document.getElementById('json-message').textContent = 'Could not load previous counts.';
  }
};

function atClient(x, y, cachedRect) {
  const r = cachedRect || svg.getBoundingClientRect();
  return {
    x: view.x + ((x - r.left) / r.width) * view.w,
    y: view.y + ((y - r.top) / r.height) * view.h
  };
}

function zoom(factor, point = { x: view.x + view.w / 2, y: view.y + view.h / 2 }) {
  const w = Math.max(180, Math.min(initial.w * 1.5, view.w * factor));
  const f = w / view.w;
  view.x = point.x - (point.x - view.x) * f;
  view.y = point.y - (point.y - view.y) * f;
  view.w = w;
  update();
}

document.getElementById('zoom-in').onclick = () => zoom(0.8);
document.getElementById('zoom-out').onclick = () => zoom(1.25);
document.getElementById('fit').onclick = reset;
document.getElementById('reset').onclick = reset;
select.onchange = () => select.value ? selectTank(select.value) : reset();
document.querySelectorAll('[data-block]').forEach(button => button.onclick = () => {
  const group = tanks.filter(t => t.id[0] === button.dataset.block);
  focusBounds(bounds(group.flatMap(t => t.points)));
});

// Fullscreen button support
const fullscreenBtn = document.getElementById('fullscreen');
if (fullscreenBtn) {
  fullscreenBtn.onclick = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };
}

// =========================================================================
// ZERO-LAG TOUCH & MOUSE PAN/ZOOM (CACHED RECT, NO LAYOUT THRASHING)
// =========================================================================
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault());

viewport.addEventListener('wheel', e => {
  e.preventDefault();
  zoom(Math.exp(Math.max(-200, Math.min(200, e.deltaY)) * 0.0015), atClient(e.clientX, e.clientY));
}, { passive: false });

let dragged = false;
let prevDist = -1;
let prevCenter = null;
let activeRect = null;

viewport.addEventListener('touchstart', e => {
  if (e.target.closest('button') || e.target.closest('select')) return;
  activeRect = viewport.getBoundingClientRect(); // Cached once per gesture!
  if (e.touches.length === 2) {
    e.preventDefault();
    const t1 = e.touches[0], t2 = e.touches[1];
    prevDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    prevCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
  } else if (e.touches.length === 1) {
    dragged = false;
    prevDist = -1;
    prevCenter = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
}, { passive: false });

viewport.addEventListener('touchmove', e => {
  if (!prevCenter || !activeRect) return;
  e.preventDefault();

  if (e.touches.length === 2 && prevDist > 0) {
    dragged = true;
    const t1 = e.touches[0], t2 = e.touches[1];
    const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    if (newDist > 10) {
      const currentCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
      const zoomFactor = prevDist / newDist;

      const cx = view.x + ((currentCenter.x - activeRect.left) / activeRect.width) * view.w;
      const cy = view.y + ((currentCenter.y - activeRect.top) / activeRect.height) * view.h;

      const targetW = Math.max(180, Math.min(initial.w * 1.5, view.w * zoomFactor));
      const f = targetW / view.w;

      view.x = cx - (cx - view.x) * f;
      view.y = cy - (cy - view.y) * f;
      view.w = targetW;

      const dx = (currentCenter.x - prevCenter.x) * (view.w / activeRect.width);
      const dy = (currentCenter.y - prevCenter.y) * (view.h / activeRect.height);
      view.x -= dx;
      view.y -= dy;

      update();
      prevDist = newDist;
      prevCenter = currentCenter;
    }
  } else if (e.touches.length === 1) {
    const t = e.touches[0];
    if (!dragged && Math.hypot(t.clientX - prevCenter.x, t.clientY - prevCenter.y) > 3) {
      dragged = true;
    }
    const dx = (t.clientX - prevCenter.x) * (view.w / activeRect.width);
    const dy = (t.clientY - prevCenter.y) * (view.h / activeRect.height);

    view.x -= dx;
    view.y -= dy;
    update();

    prevCenter = { x: t.clientX, y: t.clientY };
  }
}, { passive: false });

function endTouchHandler(e) {
  if (e.touches.length === 2) {
    const t1 = e.touches[0], t2 = e.touches[1];
    prevDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    prevCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
  } else if (e.touches.length === 1) {
    prevDist = -1;
    prevCenter = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else {
    prevDist = -1;
    prevCenter = null;
    activeRect = null;
  }
}
viewport.addEventListener('touchend', endTouchHandler, { passive: true });
viewport.addEventListener('touchcancel', endTouchHandler, { passive: true });

// Desktop Mouse Drag Support
let mouseDown = false;
viewport.addEventListener('mousedown', e => {
  if (e.button !== 0 || e.target.closest('button') || e.target.closest('select')) return;
  mouseDown = true;
  dragged = false;
  activeRect = viewport.getBoundingClientRect();
  prevCenter = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mousemove', e => {
  if (!mouseDown || !prevCenter || !activeRect) return;
  if (!dragged && Math.hypot(e.clientX - prevCenter.x, e.clientY - prevCenter.y) > 3) {
    dragged = true;
  }
  const dx = (e.clientX - prevCenter.x) * (view.w / activeRect.width);
  const dy = (e.clientY - prevCenter.y) * (view.h / activeRect.height);
  view.x -= dx;
  view.y -= dy;
  update();
  prevCenter = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => {
  mouseDown = false;
  prevCenter = null;
  activeRect = null;
});

function mode(aerial) {
  viewport.classList.toggle('aerial', aerial);
  ['topview', 'aerialview'].forEach((id, i) => {
    const on = Boolean(i) === aerial;
    const btn = document.getElementById(id);
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
  });
}
document.getElementById('topview').onclick = () => mode(false);
document.getElementById('aerialview').onclick = () => mode(true);

const dialog = document.getElementById('reference-dialog');
document.getElementById('reference-open').onclick = () => dialog.showModal();
document.getElementById('reference-close').onclick = () => dialog.close();

update();
renderStock();
loadPublished();
