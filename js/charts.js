/*
 * BIỂU ĐỒ CHO BẢN XEM TRƯỚC THIẾT KẾ (SVG, không thư viện ngoài).
 * Chỉ dùng trong giai đoạn thiết kế vì chưa được tải thư viện. Bản xây dựng thay bằng Chart.js
 * qua cùng các hàm component (barPct, line, donut, stacked, columns, spark).
 * Có: tooltip khi rê chuột/focus, bật/tắt chuỗi qua chú giải, bấm để điều hướng.
 */
(function (global) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var tipEl = null;
  function tip() { if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'chart-tip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl); } return tipEl; }
  function showTip(html, x, y) {
    var t = tip(); t.innerHTML = html; t.style.display = 'block';
    var w = t.offsetWidth, h = t.offsetHeight, px = x + 14, py = y + 14;
    if (px + w > window.innerWidth - 8) px = x - w - 14;
    if (py + h > window.innerHeight - 8) py = y - h - 14;
    t.style.left = Math.max(8, px) + 'px'; t.style.top = Math.max(8, py) + 'px';
  }
  function hideTip() { if (tipEl) tipEl.style.display = 'none'; }
  function el(name, attrs, parent) { var e = document.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function txt(parent, x, y, s, attrs) { var t = el('text', Object.assign({ x: x, y: y }, attrs || {}), parent); t.textContent = s; return t; }
  function bind(node, html, onClick, label) {
    node.setAttribute('tabindex', '0');
    if (label) node.setAttribute('aria-label', label);
    node.addEventListener('mousemove', function (e) { showTip(html, e.clientX, e.clientY); });
    node.addEventListener('mouseleave', hideTip);
    node.addEventListener('focus', function () { var r = node.getBoundingClientRect(); showTip(html, r.right, r.top); });
    node.addEventListener('blur', hideTip);
    if (onClick) {
      node.style.cursor = 'pointer';
      node.addEventListener('click', function () { hideTip(); onClick(); });
      node.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hideTip(); onClick(); } });
    }
  }
  function svg(container, w, h, title) {
    container.innerHTML = '';
    var s = el('svg', { viewBox: '0 0 ' + w + ' ' + h, width: '100%', role: 'img', 'aria-label': title || 'Biểu đồ', preserveAspectRatio: 'xMinYMin meet' }, container);
    return s;
  }
  function legend(container, items, hidden, onToggle) {
    var box = document.createElement('div'); box.className = 'legend';
    items.forEach(function (it) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'legend-item' + (hidden[it.key] ? ' off' : '');
      b.setAttribute('aria-pressed', hidden[it.key] ? 'false' : 'true');
      b.innerHTML = '<span class="sw" style="background:' + it.color + (it.dashed ? ';background:repeating-linear-gradient(90deg,' + it.color + ' 0 4px,transparent 4px 7px)' : '') + '"></span>' + it.label;
      b.addEventListener('click', function () { hidden[it.key] = !hidden[it.key]; onToggle(); });
      box.appendChild(b);
    });
    container.appendChild(box);
  }
  // Vẽ theo chiều rộng thật của khung để chữ luôn đúng cỡ; tự vẽ lại khi đổi kích thước cửa sổ
  var REG = [];
  function width(container, def) { var w = container.clientWidth - 28; return w > 0 ? Math.max(300, w) : def; }
  function register(container, fn) { REG = REG.filter(function (r) { return r.c !== container && document.body.contains(r.c); }); REG.push({ c: container, fn: fn }); }
  var rt = null;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { REG = REG.filter(function (r) { return document.body.contains(r.c); }); REG.forEach(function (r) { if (r.c.offsetParent !== null) r.fn(); }); }, 150); });
  function nf(v, dp) { return v === null || v === undefined ? '—' : new Intl.NumberFormat('vi-VN', { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }).format(v); }
  function trunc(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  // Thanh ngang theo % đạt, có vạch 100%
  function barPct(container, items, opts) {
    opts = opts || {};
    register(container, function () { barPct(container, items, opts); });
    var W = width(container, 640), rowH = 34, top = 22, H = top + items.length * rowH + 10, L = Math.min(210, Math.round(W * 0.36)), R = W - 62;
    var maxCh = Math.max(12, Math.floor((L - 14) / 6.6));
    var max = Math.max(1.2, Math.max.apply(null, items.map(function (i) { return i.value || 0; })) * 1.05);
    var s = svg(container, W, H, opts.title);
    var x = function (v) { return L + (R - L) * (v / max); };
    [0, 0.5, 1].forEach(function (g) { el('line', { x1: x(g), x2: x(g), y1: top - 6, y2: H - 6, class: g === 1 ? 'ref' : 'grid' }, s); txt(s, x(g), 12, nf(g * 100, 0) + '%', { class: 'axis', 'text-anchor': 'middle' }); });
    items.forEach(function (it, i) {
      var y = top + i * rowH;
      txt(s, L - 10, y + rowH / 2 + 4, trunc(it.label, maxCh), { class: 'lbl', 'text-anchor': 'end' });
      if (it.value === null || it.value === undefined) {
        txt(s, L + 6, y + rowH / 2 + 4, it.note || 'Không tính tỷ lệ', { class: 'muted-t' });
        var hit = el('rect', { x: L, y: y + 6, width: R - L, height: rowH - 12, fill: 'transparent' }, s);
        bind(hit, it.tip, it.onClick, it.label);
        return;
      }
      var b = el('rect', { x: L, y: y + 7, width: Math.max(2, x(it.value) - L), height: rowH - 14, rx: 3, fill: it.color, class: 'bar' }, s);
      txt(s, x(it.value) + 6, y + rowH / 2 + 4, nf(it.value * 100, 1) + '%', { class: 'val' });
      bind(b, it.tip, it.onClick, it.label + ': ' + nf(it.value * 100, 1) + '%');
    });
  }

  // Đường xu hướng, có bật/tắt chuỗi, khoảng trống khi thiếu dữ liệu (không nội suy)
  function line(container, cfg) {
    container._hidden = container._hidden || {};
    var hidden = container._hidden;
    register(container, draw);
    function draw() {
      var W = width(container, 640), H = 250, L = 56, R = W - 16, T = 14, B = H - 34;
      var s = svg(container, W, H, cfg.title);
      var vis = cfg.series.filter(function (se) { return !hidden[se.key]; });
      var vals = []; vis.forEach(function (se) { se.data.forEach(function (v) { if (v !== null && v !== undefined) vals.push(v); }); });
      var mn = vals.length ? Math.min.apply(null, vals) : 0, mx = vals.length ? Math.max.apply(null, vals) : 1;
      if (mn === mx) { mn = mn - 1; mx = mx + 1; }
      var pad = (mx - mn) * 0.12; mn = Math.max(cfg.min0 ? 0 : -Infinity, mn - pad); if (mn < 0 && vals.every(function (v) { return v >= 0; })) mn = 0; mx = mx + pad;
      var n = cfg.labels.length, x = function (i) { return n === 1 ? (L + R) / 2 : L + (R - L) * i / (n - 1); }, y = function (v) { return B - (B - T) * (v - mn) / (mx - mn); };
      for (var g = 0; g <= 4; g++) { var gv = mn + (mx - mn) * g / 4; el('line', { x1: L, x2: R, y1: y(gv), y2: y(gv), class: 'grid' }, s); txt(s, L - 8, y(gv) + 4, nf(gv, cfg.dp), { class: 'axis', 'text-anchor': 'end' }); }
      var step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((R - L) / 62))));
      cfg.labels.forEach(function (lb, i) { if (i % step === 0 || i === n - 1) txt(s, x(i), H - 12, lb, { class: 'axis', 'text-anchor': 'middle' }); });
      vis.forEach(function (se) {
        var d = '', pen = false;
        se.data.forEach(function (v, i) { if (v === null || v === undefined) { pen = false; return; } d += (pen ? 'L' : 'M') + x(i) + ' ' + y(v) + ' '; pen = true; });
        if (d) el('path', { d: d, fill: 'none', stroke: se.color, 'stroke-width': se.dashed ? 2 : 2.5, 'stroke-dasharray': se.dashed ? '6 5' : 'none' }, s);
        se.data.forEach(function (v, i) { if (v === null || v === undefined) return; el('circle', { cx: x(i), cy: y(v), r: se.dashed ? 2.5 : 3.5, fill: se.dashed ? '#fff' : se.color, stroke: se.color, 'stroke-width': 1.5 }, s); });
      });
      cfg.labels.forEach(function (lb, i) {
        var html = '<b>' + lb + '</b>' + cfg.series.filter(function (se) { return !hidden[se.key]; }).map(function (se) {
          var v = se.data[i]; return '<div><span class="sw" style="background:' + se.color + '"></span>' + se.label + ': ' + (v === null || v === undefined ? '<i>không có số liệu</i>' : nf(v, cfg.dp) + ' ' + (cfg.unit || '')) + '</div>';
        }).join('') + (cfg.extra && cfg.extra[i] ? '<div class="tip-x">' + cfg.extra[i] + '</div>' : '');
        var hit = el('rect', { x: x(i) - (R - L) / Math.max(1, n - 1) / 2, y: T, width: (R - L) / Math.max(1, n - 1), height: B - T, fill: 'transparent' }, s);
        bind(hit, html, null, lb);
      });
      legend(container, cfg.series.map(function (se) { return { key: se.key, label: se.label, color: se.color, dashed: se.dashed }; }), hidden, draw);
    }
    draw();
  }

  // Donut có chú giải bật/tắt
  function donut(container, items, opts) {
    container._hidden = container._hidden || {};
    var hidden = container._hidden;
    function draw() {
      var W = 210, H = 210, cx = 105, cy = 105, r = 88, ri = 58;
      var s = svg(container, W, H, opts && opts.title);
      var vis = items.filter(function (i) { return !hidden[i.key] && i.value > 0; });
      var tot = vis.reduce(function (a, b) { return a + b.value; }, 0), a0 = -Math.PI / 2;
      if (!tot) { el('circle', { cx: cx, cy: cy, r: (r + ri) / 2, fill: 'none', stroke: '#E4E7EB', 'stroke-width': r - ri }, s); }
      vis.forEach(function (it) {
        var a1 = a0 + 2 * Math.PI * it.value / tot, large = a1 - a0 > Math.PI ? 1 : 0;
        var p = vis.length === 1 ? 'M' + cx + ' ' + (cy - r) + ' A' + r + ' ' + r + ' 0 1 1 ' + (cx - 0.01) + ' ' + (cy - r) + ' L' + (cx - 0.01) + ' ' + (cy - ri) + ' A' + ri + ' ' + ri + ' 0 1 0 ' + cx + ' ' + (cy - ri) + ' Z'
          : 'M' + (cx + r * Math.cos(a0)) + ' ' + (cy + r * Math.sin(a0)) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + (cx + r * Math.cos(a1)) + ' ' + (cy + r * Math.sin(a1)) +
            ' L' + (cx + ri * Math.cos(a1)) + ' ' + (cy + ri * Math.sin(a1)) + ' A' + ri + ' ' + ri + ' 0 ' + large + ' 0 ' + (cx + ri * Math.cos(a0)) + ' ' + (cy + ri * Math.sin(a0)) + ' Z';
        var seg = el('path', { d: p, fill: it.color, class: 'seg' }, s);
        bind(seg, '<b>' + it.label + '</b><div>' + it.value + ' (' + nf(it.value / tot * 100, 0) + '%)</div>', it.onClick, it.label);
        a0 = a1;
      });
      if (opts && opts.center) { txt(s, cx, cy + 2, opts.center, { class: 'donut-c', 'text-anchor': 'middle' }); }
      if (opts && opts.sub) { txt(s, cx, cy + 22, opts.sub, { class: 'axis', 'text-anchor': 'middle' }); }
      legend(container, items.map(function (it) { return { key: it.key, label: it.label + ' · ' + it.value, color: it.color }; }), hidden, draw);
    }
    draw();
  }

  // Thanh chồng 100% theo hàng
  function stacked(container, rows, opts) {
    register(container, function () { stacked(container, rows, opts); });
    var W = width(container, 640), rowH = 34, top = 6, H = top + rows.length * rowH + 4, L = Math.min(160, Math.round(W * 0.3)), R = W - 40;
    var s = svg(container, W, H, opts && opts.title);
    rows.forEach(function (row, i) {
      var y = top + i * rowH, tot = row.parts.reduce(function (a, b) { return a + b.value; }, 0), x0 = L;
      txt(s, L - 10, y + rowH / 2 + 4, trunc(row.label, 22), { class: 'lbl' + (row.bold ? ' b' : ''), 'text-anchor': 'end' });
      if (!tot) { txt(s, L + 6, y + rowH / 2 + 4, 'Chưa có dữ liệu', { class: 'muted-t' }); return; }
      row.parts.forEach(function (pt) {
        if (!pt.value) return;
        var w = (R - L) * pt.value / tot;
        var r = el('rect', { x: x0, y: y + 7, width: Math.max(1, w - 1), height: rowH - 14, fill: pt.color, class: 'bar' + (opts && opts.active && opts.active !== pt.key ? ' dim' : '') }, s);
        if (w > 22) txt(s, x0 + w / 2, y + rowH / 2 + 4, String(pt.value), { class: 'in-bar', 'text-anchor': 'middle', fill: pt.key === 'vang' ? '#1F2933' : '#fff' });
        bind(r, '<b>' + row.label + '</b><div>' + pt.label + ': ' + pt.value + ' (' + nf(pt.value / tot * 100, 0) + '%)</div>', opts && opts.onPart ? function () { opts.onPart(pt, row); } : null, row.label + ' ' + pt.label + ' ' + pt.value);
        x0 += w;
      });
      txt(s, R + 8, y + rowH / 2 + 4, String(tot), { class: 'axis' });
    });
  }

  // Cột đứng đơn giản (nội dung đặc thù)
  function columns(container, items, opts) {
    register(container, function () { columns(container, items, opts); });
    var W = width(container, 640), H = 230, L = 50, R = W - 10, T = 12, B = H - 36;
    var s = svg(container, W, H, opts && opts.title);
    var mx = Math.max.apply(null, items.map(function (i) { return i.gia_tri || 0; })) * 1.15 || 1;
    var bw = (R - L) / items.length;
    for (var g = 0; g <= 4; g++) { var gv = mx * g / 4, gy = B - (B - T) * g / 4; el('line', { x1: L, x2: R, y1: gy, y2: gy, class: 'grid' }, s); txt(s, L - 6, gy + 4, nf(gv, 0), { class: 'axis', 'text-anchor': 'end' }); }
    items.forEach(function (it, i) {
      var h = (B - T) * (it.gia_tri || 0) / mx, x = L + i * bw + bw * 0.2;
      var r = el('rect', { x: x, y: B - h, width: bw * 0.6, height: h, rx: 3, fill: opts.color || '#1F3A5F', class: 'bar' }, s);
      txt(s, x + bw * 0.3, B - h - 6, nf(it.gia_tri, opts.dp || 0), { class: 'val', 'text-anchor': 'middle' });
      txt(s, x + bw * 0.3, H - 14, trunc(it.nhan, 16), { class: 'axis', 'text-anchor': 'middle' });
      bind(r, '<b>' + it.nhan + '</b><div>' + nf(it.gia_tri, opts.dp || 0) + ' ' + (opts.unit || '') + '</div>', null, it.nhan);
    });
  }

  // Sparkline (chuỗi số, null = khoảng trống)
  function spark(values, color) {
    var W = 96, H = 28, n = values.length, v = values.filter(function (x) { return x !== null && x !== undefined; });
    if (v.length < 2) return '<svg class="spark" viewBox="0 0 96 28" aria-hidden="true"><line x1="0" y1="14" x2="96" y2="14" stroke="#E4E7EB" stroke-dasharray="3 3"/></svg>';
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v); if (mn === mx) { mn -= 1; mx += 1; }
    var d = '', pen = false;
    values.forEach(function (x, i) { if (x === null || x === undefined) { pen = false; return; } var px = n === 1 ? 48 : i * (W - 4) / (n - 1) + 2, py = H - 3 - (H - 6) * (x - mn) / (mx - mn); d += (pen ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1) + ' '; pen = true; });
    return '<svg class="spark" viewBox="0 0 96 28" aria-hidden="true"><path d="' + d + '" fill="none" stroke="' + (color || '#1F3A5F') + '" stroke-width="2"/></svg>';
  }

  global.Charts = { barPct: barPct, line: line, donut: donut, stacked: stacked, columns: columns, spark: spark, hideTip: hideTip };
})(window);
