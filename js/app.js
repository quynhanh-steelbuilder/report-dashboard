/*
 * GIAO DIỆN DASHBOARD – BẢN XEM TRƯỚC THIẾT KẾ
 * Nguyên tắc: chỉ lấy dữ liệu qua DataProvider; KHÔNG tính KPI, % đạt, RAG hay số liệu tổng hợp
 * (mọi giá trị đó đã có sẵn trong dữ liệu). Giao diện chỉ định dạng, lọc, sắp xếp, chọn chuỗi để hiển thị.
 */
(function () {
  'use strict';
  const P = window.DataProvider, Ch = window.Charts, APP = window.APP_CONFIG || {};
  const main = document.getElementById('main'), side = document.getElementById('sidebar');
  const drawer = document.getElementById('drawer'), drawerBody = document.getElementById('drawer-body');

  const RAG = { xanh: ['Xanh', '●'], vang: ['Vàng', '▲'], do: ['Đỏ', '■'], xam: ['Xám', '○'], khong_xep_mau: ['Không xếp màu', '–'] };
  const COLOR = { xanh: '#2E7D32', vang: '#F2A900', do: '#C62828', xam: '#9AA5B1', khong_xep_mau: '#CBD2D9', navy: '#1F3A5F', plan: '#5B6770', cmp: '#9FB3C8' };
  const TT = { co_gia_tri: 'Có số liệu', thieu_du_lieu: 'Thiếu dữ liệu', khong_doc_duoc: 'Không đọc được', khong_ap_dung: 'Không áp dụng' };
  const XM = { chua_xac_minh: 'Chưa xác minh', da_xac_minh: 'Đã xác minh', can_xac_minh: 'Cần xác minh', mau_thuan: 'Mâu thuẫn nguồn' };
  const HD = { moi: 'Mới', dang_lam: 'Đang làm', xong: 'Hoàn thành', qua_han: 'Quá hạn', huy: 'Huỷ' };
  const HDC = { moi: '#6B8FB3', dang_lam: '#1F3A5F', xong: '#2E7D32', qua_han: '#C62828', huy: '#9AA5B1' };
  const NOP = { dung_han: 'Nộp đúng hạn', tre: 'Nộp trễ', chua_nop: 'Chưa nộp' };
  const CACH = { excel_chuan: 'File mẫu chuẩn', excel: 'Excel', chu: 'Trích chữ', bieu_do: 'Dữ liệu biểu đồ', anh: 'Đọc từ ảnh', lay_cheo: 'Từ nguồn của đơn vị khác' };
  const CHIEU = { tang: 'Càng cao càng tốt', giam: 'Càng thấp càng tốt', bang_0: 'Mục tiêu bằng 0', theo_doi: 'Chỉ theo dõi' };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = (v, dp = 0) => (v === null || v === undefined) ? '—' : new Intl.NumberFormat('vi-VN', { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(v);
  const pf = (p, dp = 1) => (p === null || p === undefined) ? '—' : nf(p * 100, dp) + '%';
  const nk = ky => ky ? 'T' + ky.slice(5) + '/' + ky.slice(0, 4) : '';
  const fd = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '—';
  const gv = r => { if (!r) return null; const v = r.loai_du_lieu === 'tinh_toan' ? (r.tinh_toan && r.tinh_toan.gia_tri) : (r.gia_tri_chuan_hoa && r.gia_tri_chuan_hoa.gia_tri); return v === undefined ? null : v; };

  // ---------- trạng thái ----------
  const S = { ky: null, ss: '', trang: 'overview', rag: '', f: { rag: '', tt: '', xm: '', nhom: '', q: '' }, vd: 'tat_ca', trend: null, kpiOpen: null, hist: { tu: '', den: '', tt: '' } };
  let CFG = null, KYS = [], suppress = false, token = 0;
  const cache = { dm: {}, tq: {}, pb: {}, ser: {} };
  const dm = ky => cache.dm[ky] || (cache.dm[ky] = P.getDanhMuc(ky));
  const tq = ky => cache.tq[ky] || (cache.tq[ky] = P.getTongQuan(ky));
  const pb = (ky, ma) => { const k = ky + '|' + ma; return cache.pb[k] || (cache.pb[k] = P.getPhongBan(ky, ma)); };
  const ser = (ma, kpi) => { const k = ma + '|' + kpi; return cache.ser[k] || (cache.ser[k] = P.getChuoiKpi(ma, kpi)); };
  const prevKy = ky => { const i = KYS.findIndex(k => k.ky === ky); return i > 0 ? KYS[i - 1].ky : ''; };
  const kyInfo = ky => KYS.find(k => k.ky === ky);

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, ''); const [path, qs] = raw.split('?'); const parts = (path || '').split('/').filter(Boolean);
    if (parts[0] && kyInfo(parts[0])) S.ky = parts[0];
    S.trang = parts[1] || 'overview';
    const q = new URLSearchParams(qs || '');
    S.rag = q.get('rag') || ''; S.kpiOpen = q.get('kpi') || null;
    if (q.has('ss')) S.ss = q.get('ss');
  }
  function writeHash() {
    const q = new URLSearchParams();
    if (S.ss !== prevKy(S.ky)) q.set('ss', S.ss);
    if (S.rag) q.set('rag', S.rag);
    if (S.kpiOpen) q.set('kpi', S.kpiOpen);
    const h = '#/' + S.ky + '/' + S.trang + (q.toString() ? '?' + q.toString() : '');
    if (location.hash !== h) { suppress = true; location.hash = h; }
  }
  function go(trang) { S.trang = trang; S.rag = ''; S.f = { rag: '', tt: '', xm: '', nhom: '', q: '' }; S.trend = null; S.kpiOpen = null; closeDrawer(false); writeHash(); render(); main.focus({ preventScroll: true }); window.scrollTo(0, 0); document.body.classList.remove('nav-open'); }

  // ---------- khung chung ----------
  const ragBadge = (mau, extra) => `<span class="rag rag-${mau}" title="${esc(RAG[mau][0])}"><span aria-hidden="true">${RAG[mau][1]}</span> ${esc(RAG[mau][0])}${extra ? ' · ' + esc(extra) : ''}</span>`;
  const tag = (text, cls) => `<span class="tag ${cls || ''}">${esc(text)}</span>`;
  function statusTags(r, dict) {
    const out = [];
    if (r.trang_thai_du_lieu && r.trang_thai_du_lieu !== 'co_gia_tri') out.push(tag(TT[r.trang_thai_du_lieu], 'tag-' + r.trang_thai_du_lieu));
    const x = r.xac_minh && r.xac_minh.trang_thai;
    if (x === 'can_xac_minh') out.push(tag('⚠ ' + XM[x], 'tag-warn'));
    else if (x === 'mau_thuan') out.push(tag('⚠ ' + XM[x], 'tag-bad'));
    else if (x === 'da_xac_minh') out.push(tag('✓ ' + XM[x], 'tag-ok'));
    else if (x === 'chua_xac_minh' && r.trang_thai_du_lieu === 'co_gia_tri') out.push(tag(XM[x], 'tag-neutral'));
    (r.nhan || []).forEach(n => out.push(tag(dict[n] || n, 'tag-info')));
    return out.join(' ');
  }
  const card = (id, title, sub, alt, cls) => `<section class="card ${cls || ''}"><header class="card-h"><div><h3>${esc(title)}</h3>${sub ? `<p class="card-sub">${esc(sub)}</p>` : ''}</div>${alt != null ? `<button type="button" class="btn-link" data-toggle-table="${id}" aria-expanded="false" aria-controls="${id}-t">Xem dạng bảng</button>` : ''}</header><div class="chart" id="${id}"></div>${alt != null ? `<div class="alt-table" id="${id}-t" hidden>${alt}</div>` : ''}</section>`;
  const plain = (title, sub, body, cls, right) => `<section class="card ${cls || ''}"><header class="card-h"><div><h3>${esc(title)}</h3>${sub ? `<p class="card-sub">${esc(sub)}</p>` : ''}</div>${right || ''}</header>${body}</section>`;
  const table = (head, rows, cls) => `<div class="tbl-wrap"><table class="tbl ${cls || ''}"><thead><tr>${head.map(h => `<th${typeof h === 'object' ? ` class="${h.c}"` : ''}>${esc(typeof h === 'object' ? h.t : h)}</th>`).join('')}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="${head.length}" class="empty-cell">Không có dữ liệu</td></tr>`}</tbody></table></div>`;
  const empty = (title, text) => `<div class="empty"><div class="empty-ico" aria-hidden="true">◌</div><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}</div>`;
  const skeleton = () => `<div class="skel"><div class="sk sk-h"></div><div class="sk-row">${'<div class="sk sk-card"></div>'.repeat(4)}</div><div class="sk-row"><div class="sk sk-big"></div><div class="sk sk-big"></div></div></div>`;
  const errBox = e => `<div class="empty err"><div class="empty-ico" aria-hidden="true">!</div><h3>Không tải được dữ liệu</h3><p>${esc(e && e.ma === 'sai_moi_truong' ? 'Dữ liệu không thuộc môi trường của bản giao diện này, nên không hiển thị.' : (e && (e.ma || e.message)) || 'Lỗi không xác định')}</p><button class="btn" data-retry>Thử lại</button></div>`;
  function stat(label, value, sub, cls, go) { return `<div class="stat ${cls || ''}" ${go ? `data-stat="${go}" role="button" tabindex="0"` : ''}><div class="stat-l">${esc(label)}</div><div class="stat-v">${value}</div><div class="stat-s">${sub || ''}</div></div>`; }

  // ---------- render chính ----------
  async function render() {
    const tok = ++token;
    syncTop();
    main.innerHTML = skeleton();
    try {
      const [d, t] = await Promise.all([dm(S.ky), tq(S.ky)]);
      if (t.moi_truong !== APP.moi_truong) throw { ma: 'sai_moi_truong' };
      if (tok !== token) return;
      renderSide(d, t);
      syncRelease(t);
      if (S.trang === 'overview') await viewOverview(d, t, tok);
      else if (S.trang === 'lich-su') await viewHistory(tok);
      else await viewDept(d, t, S.trang, tok);
      if (tok === token && S.kpiOpen) { const [ma, kpi] = S.kpiOpen.split(':'); openKpi(ma, kpi, false); }
    } catch (e) { if (tok === token) { main.innerHTML = errBox(e); console.error(e); } }
  }

  function syncTop() {
    const sel = document.getElementById('sel-ky'), ss = document.getElementById('sel-ss');
    sel.innerHTML = KYS.slice().reverse().map(k => `<option value="${k.ky}" ${k.ky === S.ky ? 'selected' : ''}>${nk(k.ky)}${k.phat_hanh.trang_thai !== 'da_duyet' ? ' (nháp)' : ''}</option>`).join('');
    ss.innerHTML = `<option value="">Không so sánh</option>` + KYS.slice().reverse().filter(k => k.ky !== S.ky).map(k => `<option value="${k.ky}" ${k.ky === S.ss ? 'selected' : ''}>${nk(k.ky)}</option>`).join('');
  }
  function syncRelease(t) {
    const b = document.getElementById('release'), ph = t.phat_hanh;
    b.className = 'release ' + (ph.trang_thai === 'da_duyet' ? 'ok' : 'draft');
    b.innerHTML = `${esc(ph.nhan)} · ${esc(ph.ma)}${ph.ngay_duyet ? ' · ' + fd(ph.ngay_duyet) : ''}`;
    b.title = 'Chốt số liệu ' + fd(t.ngay_chot) + (ph.ly_do_dieu_chinh ? ' · Điều chỉnh: ' + ph.ly_do_dieu_chinh : '');
  }
  function renderSide(d, t) {
    const T = t.tong_quan;
    const groups = d.nhom.map(g => {
      const items = d.phong_ban.filter(p => p.nhom === g.ma).map(p => {
        const st = T.phong_ban[p.ma] || {};
        return `<a href="#/${S.ky}/${p.ma}" data-go="${p.ma}" class="nav-item ${S.trang === p.ma ? 'active' : ''}" ${S.trang === p.ma ? 'aria-current="page"' : ''}><span class="dot dot-${st.tinh_trang || 'xam'}" aria-hidden="true"></span><span class="nav-t">${esc(p.ten_chuan)}</span>${st.so_do ? `<span class="nav-n" title="${st.so_do} KPI Đỏ">${st.so_do}</span>` : ''}${st.nop === 'chua_nop' ? '<span class="nav-n gray" title="Chưa nộp">!</span>' : ''}</a>`;
      }).join('');
      return `<div class="nav-g"><div class="nav-gt">${esc(g.ten)}</div>${items}</div>`;
    }).join('');
    side.innerHTML = `<a href="#/${S.ky}/overview" data-go="overview" class="nav-item top ${S.trang === 'overview' ? 'active' : ''}"><span class="ico" aria-hidden="true">▦</span> Tổng quan công ty</a>
      <a href="#/${S.ky}/lich-su" data-go="lich-su" class="nav-item top ${S.trang === 'lich-su' ? 'active' : ''}"><span class="ico" aria-hidden="true">⟲</span> Lịch sử báo cáo</a>
      <div class="nav-sep">Phòng ban</div>${groups}
      <div class="nav-foot">Chấm màu: phòng ban có KPI Đỏ / Vàng / tất cả Xanh / chưa có dữ liệu</div>`;
  }

  // ---------- A. TỔNG QUAN ----------
  async function viewOverview(d, t, tok) {
    const T = t.tong_quan;
    let ssT = null; if (S.ss) ssT = await tq(S.ss).catch(() => null);
    if (tok !== token) return;
    const pbName = ma => (d.phong_ban.find(p => p.ma === ma) || {}).ten_chuan || ma;
    const kpiName = ma => (d.kpi.find(k => k.ma === ma) || {}).ten || ma;
    const ssTxt = ssT ? `<span class="cmp">${nk(S.ss)}: ${pf(ssT.tong_quan.kpi.ty_le_dat, 0)}</span>` : '';
    const nhomRows = d.nhom.map(g => { const c = T.theo_nhom[g.ma]; return `<tr><td>${esc(g.ten)}</td>${['xanh', 'vang', 'do', 'xam', 'khong_xep_mau'].map(m => `<td class="num">${c[m]}</td>`).join('')}</tr>`; });
    const pbSorted = d.phong_ban.map(p => ({ p, st: T.phong_ban[p.ma] })).sort((a, b) => (b.st.ty_le_dat ?? -1) - (a.st.ty_le_dat ?? -1));
    const pbRows = pbSorted.map(x => `<tr><td>${esc(x.p.ten_chuan)}</td><td class="num">${pf(x.st.ty_le_dat)}</td><td class="num">${x.st.dem_rag.xanh}/${x.st.dem_rag.xanh + x.st.dem_rag.vang + x.st.dem_rag.do}</td><td>${ssT ? pf((ssT.tong_quan.phong_ban[x.p.ma] || {}).ty_le_dat) : '—'}</td></tr>`);
    const hdRows = ['moi', 'dang_lam', 'xong', 'qua_han'].map(k => `<tr><td>${HD[k]}</td><td class="num">${T.hanh_dong[k]}</td></tr>`);

    main.innerHTML = `
      <div class="page-h"><div><h1>Tổng quan công ty</h1><p class="muted">Kỳ ${nk(S.ky)} · chốt số liệu ${fd(t.ngay_chot)}${S.ss ? ` · so sánh với ${nk(S.ss)}` : ''}</p></div></div>
      <div class="stats">
        ${stat('Phòng ban nộp đúng hạn', `${T.nop.dung_han}<small>/${T.nop.tong}</small>`, `${T.nop.tre} nộp trễ · ${T.nop.chua_nop} chưa nộp`, T.nop.chua_nop ? 'warn' : '')}
        ${stat('KPI có số liệu', `${T.kpi.co_du_lieu}<small>/${T.kpi.ap_dung}</small>`, `${T.kpi.ap_dung - T.kpi.co_du_lieu} thiếu hoặc không đọc được`)}
        ${stat('Tỷ lệ KPI đạt', pf(T.kpi.ty_le_dat, 0), `${T.dem_rag.xanh} Xanh / ${T.kpi.xep_mau} KPI được xếp màu ${ssTxt}`)}
        ${stat('KPI Đỏ', T.dem_rag.do, `${T.dem_rag.vang} Vàng · ${T.dem_rag.xam} Xám`, T.dem_rag.do ? 'bad' : '', 'do')}
        ${stat('Hành động quá hạn', T.hanh_dong.qua_han, `${T.hanh_dong.xong}/${T.hanh_dong.tong} hành động đã hoàn thành`, T.hanh_dong.qua_han ? 'bad' : '')}
      </div>
      <div class="grid g-2">
        ${card('c-nhom', 'Tình trạng KPI theo nhóm', 'Bấm vào một màu để lọc ma trận RAG', table(['Nhóm', 'Xanh', 'Vàng', 'Đỏ', 'Xám', 'Không xếp màu'], nhomRows))}
        ${card('c-pb', 'So sánh hiệu suất phòng ban', 'Tỷ lệ KPI Xanh trên số KPI được xếp màu · bấm để mở phòng ban', table(['Phòng ban', 'Tỷ lệ đạt', 'KPI Xanh', 'Kỳ so sánh'], pbRows))}
      </div>
      <div class="grid g-31">
        ${plain('KPI trọng điểm', 'Nhóm KPI được chọn theo dõi ở cấp công ty · bấm để xem chi tiết', '<div class="kcards" id="trong-diem"><div class="sk sk-card"></div><div class="sk sk-card"></div><div class="sk sk-card"></div></div>')}
        ${card('c-hd', 'Tình trạng hoàn thành công việc', `Hành động khắc phục của ${T.nop.tong} phòng ban trong kỳ`, table(['Trạng thái', 'Số lượng'], hdRows))}
      </div>
      <section class="card" id="matrix-card"></section>
      <div class="grid g-21">
        <section class="card" id="issues-card"></section>
        ${plain('Chất lượng dữ liệu', 'Những điểm cần kiểm tra trước khi dùng số liệu', dqList(T.chat_luong))}
      </div>`;

    const order = ['xanh', 'vang', 'do', 'xam', 'khong_xep_mau'];
    const rows = d.nhom.map(g => ({ label: g.ten, parts: order.map(m => ({ key: m, label: RAG[m][0], value: T.theo_nhom[g.ma][m], color: COLOR[m] })) }));
    rows.push({ label: 'Toàn công ty', bold: true, parts: order.map(m => ({ key: m, label: RAG[m][0], value: T.dem_rag[m], color: COLOR[m] })) });
    const drawNhom = () => Ch.stacked(document.getElementById('c-nhom'), rows, { active: S.rag, title: 'Tình trạng KPI theo nhóm', onPart: onNhom });
    function onNhom(pt) { S.rag = S.rag === pt.key ? '' : pt.key; writeHash(); renderMatrix(d, T); drawNhom(); document.getElementById('matrix-card').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    drawNhom();

    Ch.barPct(document.getElementById('c-pb'), pbSorted.map(x => ({
      label: x.p.ten_chuan, value: x.st.ty_le_dat, color: COLOR[x.st.tinh_trang] || COLOR.navy,
      note: x.st.nop === 'chua_nop' ? 'Chưa nộp báo cáo' : 'Chưa có KPI xếp màu',
      tip: `<b>${esc(x.p.ten_chuan)}</b><div>Tỷ lệ đạt: ${pf(x.st.ty_le_dat)}</div><div>Xanh ${x.st.dem_rag.xanh} · Vàng ${x.st.dem_rag.vang} · Đỏ ${x.st.dem_rag.do} · Xám ${x.st.dem_rag.xam}</div>${ssT ? `<div class="tip-x">${nk(S.ss)}: ${pf((ssT.tong_quan.phong_ban[x.p.ma] || {}).ty_le_dat)}</div>` : ''}<div class="tip-x">Bấm để mở phòng ban</div>`,
      onClick: () => go(x.p.ma)
    })), { title: 'So sánh hiệu suất phòng ban' });

    Ch.donut(document.getElementById('c-hd'), ['moi', 'dang_lam', 'xong', 'qua_han'].map(k => ({ key: k, label: HD[k], value: T.hanh_dong[k], color: HDC[k] })),
      { center: pf(T.hanh_dong.ty_le_hoan_thanh, 0), sub: 'đã hoàn thành', title: 'Tình trạng hoàn thành công việc' });

    renderMatrix(d, T);
    renderIssues(d, T, pbName, kpiName);

    // KPI trọng điểm
    const box = document.getElementById('trong-diem');
    const cells = d.kpi_trong_diem.map(code => { for (const row of T.ma_tran) { const o = row.o.find(x => x.ma_kpi === code); if (o) return { row, o }; } return null; }).filter(Boolean);
    const series = await Promise.all(cells.map(c => ser(c.row.ma_phong_ban, c.o.ma_kpi)));
    if (tok !== token) return;
    box.innerHTML = cells.map((c, i) => {
      const cat = d.kpi.find(k => k.ma === c.o.ma_kpi);
      const vals = series[i].filter(s => s.ky <= S.ky).slice(-12).map(s => s.trang_thai_du_lieu === 'co_gia_tri' ? s.gia_tri : null);
      return kcard({ ten: cat.ten, pb: pbName(c.row.ma_phong_ban), dv: cat.don_vi_tinh, dp: cat.so_thap_phan, val: c.o.trang_thai_du_lieu === 'co_gia_tri' ? c.o.gia_tri : null, tt: c.o.trang_thai_du_lieu, pct: c.o.ty_le_dat, mau: c.o.mau, spark: vals, attrs: `data-kpi="${c.o.ma_kpi}" data-pb="${c.row.ma_phong_ban}"` });
    }).join('');
  }

  function kcard(o) {
    const big = o.tt === 'co_gia_tri' ? `${nf(o.val, o.dp)}<small> ${esc(o.dv)}</small>` : `<span class="na">—</span><small> ${esc(TT[o.tt] || '')}</small>`;
    return `<button type="button" class="kcard kc-${o.mau}" ${o.attrs}><div class="kc-top"><span class="kc-t">${esc(o.ten)}</span>${ragBadge(o.mau)}</div>${o.pb ? `<div class="kc-pb">${esc(o.pb)}</div>` : ''}<div class="kc-v">${big}</div><div class="kc-s">${o.sub || (o.pct !== null && o.pct !== undefined ? 'Đạt ' + pf(o.pct) + ' kế hoạch' : '&nbsp;')}</div><div class="kc-sp">${Ch.spark(o.spark || [], COLOR.navy)}</div>${o.tags ? `<div class="kc-tags">${o.tags}</div>` : ''}</button>`;
  }

  function renderMatrix(d, T) {
    const box = document.getElementById('matrix-card'); if (!box) return;
    const filt = ['', 'do', 'vang', 'xanh', 'xam'].map(m => `<button type="button" class="seg ${S.rag === m ? 'on' : ''}" data-rag-filter="${m}">${m ? RAG[m][1] + ' ' + RAG[m][0] : 'Tất cả'}</button>`).join('');
    const rows = T.ma_tran.map(row => {
      const p = d.phong_ban.find(x => x.ma === row.ma_phong_ban), st = T.phong_ban[row.ma_phong_ban];
      const chips = row.o.map(o => {
        const cat = d.kpi.find(k => k.ma === o.ma_kpi); const dim = S.rag && o.mau !== S.rag;
        const val = o.trang_thai_du_lieu === 'co_gia_tri' ? nf(o.gia_tri, cat.so_thap_phan) + ' ' + cat.don_vi_tinh : TT[o.trang_thai_du_lieu];
        return `<button type="button" class="chip chip-${o.mau} ${dim ? 'dim' : ''}" data-kpi="${o.ma_kpi}" data-pb="${row.ma_phong_ban}" title="${esc(cat.ten + ': ' + val + (o.ty_le_dat !== null ? ' · đạt ' + pf(o.ty_le_dat) : ''))}"><span aria-hidden="true">${RAG[o.mau][1]}</span> ${esc(cat.ten)}${o.xac_minh === 'can_xac_minh' || o.xac_minh === 'mau_thuan' ? ' ⚠' : ''}</button>`;
      }).join('');
      return `<tr><th scope="row"><a href="#/${S.ky}/${p.ma}" data-go="${p.ma}">${esc(p.ten_chuan)}</a><div class="sub">${NOP[st.nop]}</div></th><td>${chips}</td></tr>`;
    }).join('');
    box.innerHTML = `<header class="card-h"><div><h3>Ma trận RAG phòng ban × KPI</h3><p class="card-sub">Mỗi ô là một KPI · bấm để xem chi tiết, nguồn và giải trình</p></div><div class="segs" role="group" aria-label="Lọc theo màu">${filt}</div></header>
      <div class="tbl-wrap"><table class="tbl matrix"><tbody>${rows}</tbody></table></div>`;
  }

  function renderIssues(d, T, pbName, kpiName) {
    const box = document.getElementById('issues-card'); if (!box) return;
    const L = { kpi_do: 'KPI Đỏ', qua_han: 'Quá hạn', can_bod: 'Cần BOD quyết', chua_nop: 'Chưa nộp' };
    const tabs = ['tat_ca', 'kpi_do', 'qua_han', 'can_bod'].map(k => `<button type="button" class="seg ${S.vd === k ? 'on' : ''}" data-vd="${k}">${k === 'tat_ca' ? 'Tất cả' : L[k]} <span class="n">${k === 'tat_ca' ? T.can_chu_y.length : T.can_chu_y.filter(x => x.loai === k).length}</span></button>`).join('');
    const list = T.can_chu_y.filter(x => S.vd === 'tat_ca' || x.loai === S.vd);
    const rows = list.map(x => `<tr class="${x.ma_kpi ? 'clickable' : ''}" ${x.ma_kpi ? `data-kpi="${x.ma_kpi}" data-pb="${x.ma_phong_ban}" tabindex="0"` : ''}><td><span class="tag tag-${x.loai}">${L[x.loai]}</span></td><td><a href="#/${S.ky}/${x.ma_phong_ban}" data-go="${x.ma_phong_ban}">${esc(pbName(x.ma_phong_ban))}</a></td><td>${esc(x.mo_ta)}</td><td class="nowrap">${x.han ? fd(x.han) : ''}</td></tr>`);
    box.innerHTML = `<header class="card-h"><div><h3>Vấn đề cần chú ý</h3><p class="card-sub">Gom từ KPI Đỏ, hành động quá hạn, đề xuất cần BOD quyết và đơn vị chưa nộp</p></div><div class="segs">${tabs}</div></header>${table(['Loại', 'Phòng ban', 'Nội dung', 'Hạn'], rows, 'issues')}`;
  }

  function dqList(c) {
    const items = [['chua_nop', 'Phòng ban chưa nộp báo cáo', c.chua_nop, 'bad'], ['tre', 'Phòng ban nộp trễ', c.tre, 'warn'], ['thieu', 'KPI thiếu dữ liệu', c.thieu, 'warn'], ['khong_doc', 'KPI không đọc được nguồn', c.khong_doc, 'warn'],
      ['can_xac_minh', 'KPI cần xác minh (biến động bất thường)', c.can_xac_minh, 'warn'], ['mau_thuan', 'KPI mâu thuẫn giữa các nguồn', c.mau_thuan, 'bad'], ['rag_tam', 'KPI xếp màu tạm (không có kế hoạch)', c.rag_tam, 'info'], ['khong_ap_dung', 'KPI không áp dụng trong kỳ', c.khong_ap_dung, 'neutral']];
    return `<ul class="dq">${items.map(i => `<li class="${i[2] ? i[3] : 'zero'}"><span>${esc(i[1])}</span><b>${i[2]}</b></li>`).join('')}</ul>`;
  }

  // ---------- B. PHÒNG BAN ----------
  async function viewDept(d, t, ma, tok) {
    const info = d.phong_ban.find(p => p.ma === ma);
    if (!info) { main.innerHTML = empty('Không tìm thấy phòng ban', 'Phòng ban này không có trong danh mục của kỳ đang xem.'); return; }
    const p = await pb(S.ky, ma);
    const pss = S.ss ? await pb(S.ss, ma).catch(() => null) : null;
    const series = await Promise.all(p.kpi.map(r => ser(ma, r.ma_kpi)));
    if (tok !== token) return;
    const dict = d.tu_dien_nhan, cat = code => d.kpi.find(k => k.ma === code), nhom = d.nhom.find(g => g.ma === info.nhom);
    const serOf = code => (series[p.kpi.findIndex(r => r.ma_kpi === code)] || []).filter(s => s.ky <= S.ky).slice(-12);
    const td = p.tien_do_hanh_dong;

    main.innerHTML = `
      <div class="page-h">
        <div><div class="crumb">${esc(nhom.ten)}</div><h1>${esc(p.ten_chuan)}</h1>
          <p class="muted">Kỳ ${nk(S.ky)} · hạn nộp ${fd(p.nop.han_nop)} · ${p.nop.ngay_nop ? 'nộp ' + fd(p.nop.ngay_nop) : 'chưa nộp'} · ${p.file_nguon.length ? 'nguồn: ' + p.file_nguon.map(f => esc(f.ten_file)).join(', ') : 'chưa có file nguồn'}</p></div>
        <div class="head-badges"><span class="tag tag-nop-${p.nop.trang_thai}">${NOP[p.nop.trang_thai]}${p.nop.so_ngay_tre ? ' ' + p.nop.so_ngay_tre + ' ngày' : ''}</span>${p.trang_thai_doc.trang_thai === 'doc_mot_phan' ? tag('Đọc được một phần nguồn', 'tag-warn') : ''}</div>
      </div>
      <div class="summary">
        <p>${esc(p.tom_tat)}</p>
        <div class="pills">${['xanh', 'vang', 'do', 'xam', 'khong_xep_mau'].filter(m => p.dem_rag[m]).map(m => `<span class="pill p-${m}">${RAG[m][1]} ${p.dem_rag[m]} ${RAG[m][0]}</span>`).join('')}</div>
      </div>
      ${p.nop.trang_thai === 'chua_nop' ? `<div class="notice bad">Đơn vị chưa nộp báo cáo kỳ ${nk(S.ky)}. Các KPI hiển thị trạng thái "Thiếu dữ liệu"; kế hoạch (nếu có) lấy từ báo cáo kỳ trước.</div>` : ''}
      <div class="kcards dept">${p.kpi.map(r => {
        const c = cat(r.ma_kpi); const sp = serOf(r.ma_kpi).map(s => s.trang_thai_du_lieu === 'co_gia_tri' ? s.gia_tri : null);
        const tail = r.ty_le_dat.gia_tri !== null ? 'đạt ' + pf(r.ty_le_dat.gia_tri) : (r.trang_thai_du_lieu === 'co_gia_tri' ? esc(r.ty_le_dat.ly_do || '') : '');
        const sub = r.ke_hoach.gia_tri !== null ? `KH ${nf(r.ke_hoach.gia_tri, c.so_thap_phan)}${tail ? ' · ' + tail : ''}` : esc(r.ke_hoach.ly_do || r.ty_le_dat.ly_do || 'Không có kế hoạch');
        return kcard({ ten: c.ten, dv: c.don_vi_tinh, dp: c.so_thap_phan, val: gv(r), tt: r.trang_thai_du_lieu, pct: r.ty_le_dat.gia_tri, mau: r.rag.mau, spark: sp, sub: sub + cmpLine(r, c, pss), tags: statusTags(r, dict), attrs: `data-kpi="${r.ma_kpi}" data-pb="${ma}"` });
      }).join('')}</div>
      <div class="grid g-2">
        ${card('c-avp', 'Kết quả thực hiện so với kế hoạch', 'Tỷ lệ đạt đã tính sẵn · vạch đậm = 100% kế hoạch', table(['KPI', 'Kế hoạch', 'Thực tế', 'Tỷ lệ đạt', 'RAG'], p.kpi.map(r => { const c = cat(r.ma_kpi); return `<tr><td>${esc(c.ten)}</td><td class="num">${nf(r.ke_hoach.gia_tri, c.so_thap_phan)}</td><td class="num">${nf(gv(r), c.so_thap_phan)}</td><td class="num">${pf(r.ty_le_dat.gia_tri)}</td><td>${RAG[r.rag.mau][0]}</td></tr>`; })))}
        <section class="card" id="trend-card"></section>
      </div>
      <section class="card" id="kpi-table-card"></section>
      <div class="grid g-2">
        ${plain('Tiến độ hành động', td.tong ? `${td.xong}/${td.tong - td.huy} hành động đã hoàn thành` : 'Chưa có hành động', progress(td) + actionsTable(p))}
        ${plain('Vấn đề tồn đọng và rủi ro', 'Trích từ báo cáo của đơn vị; không tự suy diễn nguyên nhân', issuesList(p, cat))}
      </div>
      ${p.dac_thu.length ? `<div class="grid g-2">${p.dac_thu.map((b, i) => b.loai === 'bang' ? plain(b.tieu_de, 'Nội dung đặc thù · nguồn: ' + (b.nguon.file || '') + ' · ' + b.nguon.vi_tri, dtTable(b)) : card('dt-' + i, b.tieu_de, 'Nội dung đặc thù · nguồn: ' + (b.nguon.file || '') + ' · ' + b.nguon.vi_tri, table(['Hạng mục', 'Giá trị (' + b.don_vi + ')'], b.du_lieu.map(x => `<tr><td>${esc(x.nhan)}</td><td class="num">${nf(x.gia_tri, b.dp || 0)}</td></tr>`)))).join('')}</div>` : ''}
      ${plain('Chất lượng dữ liệu của phòng ban', p.chat_luong_du_lieu.length ? p.chat_luong_du_lieu.length + ' điểm cần kiểm tra' : 'Không có cảnh báo', p.chat_luong_du_lieu.length ? `<ul class="dq-list">${p.chat_luong_du_lieu.map(x => `<li class="clickable" data-kpi="${x.ma_kpi}" data-pb="${ma}" tabindex="0">${esc(x.mo_ta)}</li>`).join('')}</ul>` : '<p class="muted pad">Tất cả KPI có số liệu và không có cảnh báo.</p>')}`;

    Ch.barPct(document.getElementById('c-avp'), p.kpi.map(r => {
      const c = cat(r.ma_kpi);
      return { label: c.ten, value: r.ty_le_dat.gia_tri, color: COLOR[r.rag.mau], note: r.trang_thai_du_lieu !== 'co_gia_tri' ? TT[r.trang_thai_du_lieu] : (r.ty_le_dat.ly_do || 'Không tính tỷ lệ'),
        tip: `<b>${esc(c.ten)}</b><div>Thực tế: ${nf(gv(r), c.so_thap_phan)} ${esc(c.don_vi_tinh)}</div><div>Kế hoạch: ${nf(r.ke_hoach.gia_tri, c.so_thap_phan)}</div><div>Tỷ lệ đạt: ${pf(r.ty_le_dat.gia_tri)} · ${RAG[r.rag.mau][0]}</div><div class="tip-x">Bấm để xem chi tiết</div>`,
        onClick: () => openKpi(ma, r.ma_kpi) };
    }), { title: 'Kết quả so với kế hoạch' });
    p.dac_thu.forEach((b, i) => { if (b.loai === 'bieu_do_cot') Ch.columns(document.getElementById('dt-' + i), b.du_lieu, { unit: b.don_vi, title: b.tieu_de, dp: b.dp || 0 }); });

    renderTrend(p, d, serOf);
    renderKpiTable(p, d, pss);
  }

  function cmpLine(r, c, pss) {
    if (!S.ss) return '';
    if (S.ss === r.so_sanh.ky && r.so_sanh.trang_thai === 'da_tinh') {
      const up = r.so_sanh.chenh_lech > 0, same = r.so_sanh.chenh_lech === 0;
      return `<br><span class="delta ${same ? '' : up ? 'up' : 'down'}">${same ? '→' : up ? '▲' : '▼'} ${nf(Math.abs(r.so_sanh.chenh_lech), c.so_thap_phan)} so ${nk(r.so_sanh.ky)}</span>`;
    }
    const o = pss && pss.kpi.find(x => x.ma_kpi === r.ma_kpi);
    return `<br><span class="delta">${nk(S.ss)}: ${o && o.trang_thai_du_lieu === 'co_gia_tri' ? nf(gv(o), c.so_thap_phan) : 'không có số liệu'}</span>`;
  }
  function progress(td) {
    const den = td.tong - td.huy; if (!den) return '<p class="muted pad">Đơn vị không có hành động trong kỳ.</p>';
    const seg = k => td[k] ? `<span style="width:${td[k] / den * 100}%;background:${HDC[k]}" title="${HD[k]}: ${td[k]}"></span>` : '';
    return `<div class="prog" role="img" aria-label="Hoàn thành ${td.xong}, đang làm ${td.dang_lam}, mới ${td.moi}, quá hạn ${td.qua_han}">${seg('xong')}${seg('dang_lam')}${seg('moi')}${seg('qua_han')}</div>
      <div class="prog-l">${['xong', 'dang_lam', 'moi', 'qua_han'].map(k => `<span><i style="background:${HDC[k]}"></i>${HD[k]} ${td[k]}</span>`).join('')}</div>`;
  }
  function actionsTable(p) {
    const rows = p.van_de.filter(v => v.hanh_dong || v.loai === 'van_de').map(v => `<tr class="${v.trang_thai === 'qua_han' ? 'row-bad' : ''}"><td>${v.hanh_dong ? esc(v.hanh_dong) : '<i class="muted">Nguồn không nêu hành động</i>'}</td><td>${esc(v.nguoi_phu_trach || '—')}</td><td class="nowrap">${fd(v.han)}</td><td><span class="st st-${v.trang_thai}">${HD[v.trang_thai]}</span></td></tr>`);
    return table(['Hành động', 'Phụ trách', 'Hạn', 'Trạng thái'], rows, 'compact');
  }
  function issuesList(p, cat) {
    if (!p.van_de.length) return '<p class="muted pad">Không có vấn đề hoặc rủi ro được nêu trong kỳ.</p>';
    return `<ul class="issues-l">${p.van_de.map(v => `<li class="${v.ma_kpi ? 'clickable' : ''}" ${v.ma_kpi ? `data-kpi="${v.ma_kpi}" data-pb="${p.ma_phong_ban}" tabindex="0"` : ''}>
      <div class="il-h">${tag(v.loai === 'rui_ro' ? 'Rủi ro' : 'Vấn đề', v.loai === 'rui_ro' ? 'tag-warn' : 'tag-bad')} ${v.can_bod ? tag('Cần BOD quyết', 'tag-can_bod') : ''} <span class="st st-${v.trang_thai}">${HD[v.trang_thai]}</span></div>
      <div class="il-t">${esc(v.mo_ta)}</div>
      <div class="il-s">Nguyên nhân: ${v.nguyen_nhan ? esc(v.nguyen_nhan) : '<i>Đơn vị chưa giải trình</i>'}</div>
      ${v.can_bod ? `<div class="il-s">Đề xuất: ${esc(v.noi_dung_de_xuat)}</div>` : ''}</li>`).join('')}</ul>`;
  }
  function dtTable(b) {
    const cell = (v, c) => c.kieu === 'text' ? esc(v) : c.kieu === 'pct' ? pf(v) : c.kieu === 'pct_dau' ? `<span class="${v > 0 ? 'up' : v < 0 ? 'down' : ''}">${v > 0 ? '+' : ''}${pf(v)}</span>` : nf(v, c.dp);
    return table(b.cot.map(c => c.kieu === 'text' ? c.ten : { t: c.ten, c: 'num' }), b.dong.map(r => `<tr>${r.map((v, i) => `<td class="${b.cot[i].kieu === 'text' ? '' : 'num'}">${cell(v, b.cot[i])}</td>`).join('')}</tr>`));
  }

  function renderTrend(p, d, serOf) {
    const box = document.getElementById('trend-card'); if (!box) return;
    const nguong = CFG.nguong_xu_huong;
    const cands = p.kpi.filter(r => d.kpi.find(k => k.ma === r.ma_kpi));
    if (!S.trend || !cands.find(r => r.ma_kpi === S.trend)) S.trend = (cands.find(r => serOf(r.ma_kpi).filter(s => s.trang_thai_du_lieu === 'co_gia_tri').length >= nguong) || cands[0]).ma_kpi;
    const c = d.kpi.find(k => k.ma === S.trend), s = serOf(S.trend);
    const n = s.filter(x => x.trang_thai_du_lieu === 'co_gia_tri').length;
    const opts = cands.map(r => { const cc = d.kpi.find(k => k.ma === r.ma_kpi); return `<option value="${r.ma_kpi}" ${r.ma_kpi === S.trend ? 'selected' : ''}>${esc(cc.ten)}</option>`; }).join('');
    const alt = table(['Kỳ', 'Thực tế', 'Kế hoạch', 'Trạng thái'], s.map(x => `<tr><td>${nk(x.ky)}</td><td class="num">${x.trang_thai_du_lieu === 'co_gia_tri' ? nf(x.gia_tri, c.so_thap_phan) : '—'}</td><td class="num">${nf(x.ke_hoach, c.so_thap_phan)}</td><td>${x.trang_thai_du_lieu === 'co_gia_tri' ? (x.rag ? RAG[x.rag][0] : '') : TT[x.trang_thai_du_lieu]}</td></tr>`));
    box.innerHTML = `<header class="card-h"><div><h3>Xu hướng theo kỳ</h3><p class="card-sub">${esc(c.don_vi_tinh)} · ${esc(CHIEU[c.chieu])} · bấm chú giải để bật/tắt chuỗi</p></div><div class="row-gap"><label class="sr" for="trend-sel">Chọn KPI</label><select id="trend-sel" class="sel sm">${opts}</select><button type="button" class="btn-link" data-toggle-table="c-trend" aria-expanded="false">Xem dạng bảng</button></div></header>
      <div class="chart" id="c-trend"></div><div class="alt-table" id="c-trend-t" hidden>${alt}</div>`;
    const el = document.getElementById('c-trend');
    if (n < nguong) { el.innerHTML = empty('Chưa đủ dữ liệu để vẽ xu hướng', `KPI này mới có ${n} kỳ có số liệu (cần tối thiểu ${nguong} kỳ). Xem dạng bảng để thấy số liệu hiện có.`); return; }
    Ch.line(el, { title: 'Xu hướng ' + c.ten, labels: s.map(x => nk(x.ky)), dp: c.so_thap_phan, unit: c.don_vi_tinh,
      series: [{ key: 'tt', label: 'Thực tế', color: COLOR.navy, data: s.map(x => x.trang_thai_du_lieu === 'co_gia_tri' ? x.gia_tri : null) },
               { key: 'kh', label: 'Kế hoạch', color: COLOR.plan, dashed: true, data: s.map(x => x.ke_hoach) }],
      extra: s.map(x => x.trang_thai_du_lieu !== 'co_gia_tri' ? TT[x.trang_thai_du_lieu] : (x.rag ? 'RAG: ' + RAG[x.rag][0] : '') + (x.xac_minh && x.xac_minh !== 'da_xac_minh' ? ' · ' + XM[x.xac_minh] : '')) });
  }

  function renderKpiTable(p, d, pss) {
    const box = document.getElementById('kpi-table-card'); if (!box) return;
    const f = S.f, dict = d.tu_dien_nhan;
    const opt = (o, v) => Object.keys(o).map(k => `<option value="${k}" ${v === k ? 'selected' : ''}>${esc(o[k])}</option>`).join('');
    const rows = p.kpi.filter(r => {
      const c = d.kpi.find(k => k.ma === r.ma_kpi);
      return (!f.rag || r.rag.mau === f.rag) && (!f.tt || r.trang_thai_du_lieu === f.tt) && (!f.xm || r.xac_minh.trang_thai === f.xm) && (!f.nhom || c.nhom_kpi === f.nhom) && (!f.q || (c.ten + ' ' + c.ma).toLowerCase().includes(f.q.toLowerCase()));
    }).map(r => {
      const c = d.kpi.find(k => k.ma === r.ma_kpi);
      const val = r.trang_thai_du_lieu === 'co_gia_tri' ? nf(gv(r), c.so_thap_phan) : `<span class="na" title="${esc(r.ly_do_trang_thai || '')}">—</span>`;
      const cmp = !S.ss ? '—' : (S.ss === r.so_sanh.ky && r.so_sanh.trang_thai === 'da_tinh') ? `<span class="delta ${r.so_sanh.chenh_lech > 0 ? 'up' : r.so_sanh.chenh_lech < 0 ? 'down' : ''}">${r.so_sanh.chenh_lech > 0 ? '+' : ''}${nf(r.so_sanh.chenh_lech, c.so_thap_phan)}</span>` : (() => { const o = pss && pss.kpi.find(x => x.ma_kpi === r.ma_kpi); return o && o.trang_thai_du_lieu === 'co_gia_tri' ? nf(gv(o), c.so_thap_phan) : '—'; })();
      const src = r.loai_du_lieu === 'tinh_toan' ? 'Tính toán' : (r.nguon[0] ? CACH[r.nguon[0].cach_trich_xuat] || r.nguon[0].cach_trich_xuat : '—');
      return `<tr class="clickable" data-kpi="${r.ma_kpi}" data-pb="${p.ma_phong_ban}" tabindex="0"><td class="code">${esc(r.ma_kpi)}</td><td><b>${esc(c.ten)}</b><div class="sub">${esc(c.nhom_kpi)} · ${esc(CHIEU[c.chieu])}</div></td><td>${esc(c.don_vi_tinh)}</td><td class="num">${nf(r.ke_hoach.gia_tri, c.so_thap_phan)}</td><td class="num">${val}</td><td class="num">${pf(r.ty_le_dat.gia_tri)}</td><td>${ragBadge(r.rag.mau, r.rag.rag_tam ? 'tạm' : '')}</td><td class="num">${cmp}</td><td>${statusTags(r, dict) || '<span class="muted">—</span>'}</td><td class="sub">${esc(src)}</td></tr>`;
    });
    box.innerHTML = `<header class="card-h"><div><h3>Bảng KPI đầy đủ</h3><p class="card-sub">${p.kpi.length} KPI · bấm một dòng để xem chi tiết, nguồn và giải trình${S.ss ? ' · cột so sánh: ' + nk(S.ss) : ''}</p></div></header>
      <div class="filters">
        <label>Màu RAG<select class="sel sm" data-f="rag"><option value="">Tất cả</option>${opt({ xanh: 'Xanh', vang: 'Vàng', do: 'Đỏ', xam: 'Xám', khong_xep_mau: 'Không xếp màu' }, f.rag)}</select></label>
        <label>Trạng thái dữ liệu<select class="sel sm" data-f="tt"><option value="">Tất cả</option>${opt(TT, f.tt)}</select></label>
        <label>Xác minh<select class="sel sm" data-f="xm"><option value="">Tất cả</option>${opt(XM, f.xm)}</select></label>
        <label>Nhóm KPI<select class="sel sm" data-f="nhom"><option value="">Tất cả</option>${d.nhom_kpi.map(n => `<option ${f.nhom === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        <label class="grow">Tìm<input class="sel sm" data-f="q" type="search" placeholder="Tên hoặc mã KPI" value="${esc(f.q)}"></label>
        ${f.rag || f.tt || f.xm || f.nhom || f.q ? '<button type="button" class="btn-link" data-clear-f>Xoá lọc</button>' : ''}
      </div>
      ${table(['Mã', 'KPI', 'ĐVT', { t: 'Kế hoạch', c: 'num' }, { t: 'Thực tế', c: 'num' }, { t: '% đạt', c: 'num' }, 'RAG', { t: 'So sánh', c: 'num' }, 'Trạng thái', 'Cách lấy'], rows, 'kpi')}`;
    box._ctx = { p, d, pss };
  }

  // ---------- C. LỊCH SỬ BÁO CÁO ----------
  async function viewHistory(tok) {
    const H = S.hist;
    const list = KYS.filter(k => (!H.tu || k.ky >= H.tu) && (!H.den || k.ky <= H.den) && (!H.tt || (H.tt === 'dieu_chinh' ? !!k.phat_hanh.thay_the_cho : k.phat_hanh.trang_thai === H.tt)));
    const opts = (v) => `<option value="">—</option>` + KYS.map(k => `<option value="${k.ky}" ${v === k.ky ? 'selected' : ''}>${nk(k.ky)}</option>`).join('');
    const order = ['xanh', 'vang', 'do', 'xam'];
    const rows = list.slice().reverse().map(k => {
      const r = k.tom_tat.dem_rag, tot = order.reduce((a, m) => a + r[m], 0);
      const bar = `<div class="mini">${order.map(m => r[m] ? `<span style="width:${r[m] / tot * 100}%;background:${COLOR[m]}" title="${RAG[m][0]}: ${r[m]}"></span>` : '').join('')}</div>`;
      return `<tr class="${k.ky === S.ky ? 'row-cur' : ''}"><td><b>${nk(k.ky)}</b>${k.ky === S.ky ? ' <span class="tag tag-info">đang xem</span>' : ''}</td><td>${esc(k.phat_hanh.ma)}${k.phat_hanh.thay_the_cho ? ` <span class="tag tag-warn" title="${esc(k.phat_hanh.ly_do_dieu_chinh)}">điều chỉnh</span>` : ''}</td>
        <td><span class="st ${k.phat_hanh.trang_thai === 'da_duyet' ? 'st-xong' : 'st-moi'}">${esc(k.phat_hanh.nhan)}</span></td><td class="nowrap">${fd(k.ngay_chot)}</td><td class="nowrap">${fd(k.phat_hanh.ngay_duyet)}</td>
        <td class="num">${k.tom_tat.nop_dung_han}/${k.tom_tat.tong_pb}</td><td class="num">${pf(k.tom_tat.ty_le_dat, 0)}</td><td>${bar}</td>
        <td class="nowrap"><button type="button" class="btn sm" data-view-ky="${k.ky}">Xem kỳ này</button> <button type="button" class="btn-link" data-ss-ky="${k.ky}">So sánh</button></td></tr>`;
    });
    main.innerHTML = `
      <div class="page-h"><div><h1>Lịch sử báo cáo</h1><p class="muted">Các kỳ đã phát hành · dữ liệu đã duyệt không bị ghi đè; bản điều chỉnh tạo phiên bản mới</p></div></div>
      <div class="filters card pad-s">
        <label>Từ kỳ<select class="sel sm" data-h="tu">${opts(H.tu)}</select></label>
        <label>Đến kỳ<select class="sel sm" data-h="den">${opts(H.den)}</select></label>
        <label>Trạng thái<select class="sel sm" data-h="tt"><option value="">Tất cả</option><option value="da_duyet" ${H.tt === 'da_duyet' ? 'selected' : ''}>Đã duyệt</option><option value="da_kiem_tra" ${H.tt === 'da_kiem_tra' ? 'selected' : ''}>Bản nháp chờ duyệt</option><option value="dieu_chinh" ${H.tt === 'dieu_chinh' ? 'selected' : ''}>Có điều chỉnh</option></select></label>
        ${H.tu || H.den || H.tt ? '<button type="button" class="btn-link" data-clear-h>Xoá lọc</button>' : ''}
      </div>
      <div class="grid g-2">
        ${card('c-hist', 'Tỷ lệ KPI đạt toàn công ty theo kỳ', 'Bấm chú giải để bật/tắt chuỗi', table(['Kỳ', 'Tỷ lệ đạt', 'KPI Đỏ', 'Hành động quá hạn'], list.map(k => `<tr><td>${nk(k.ky)}</td><td class="num">${pf(k.tom_tat.ty_le_dat)}</td><td class="num">${k.tom_tat.dem_rag.do}</td><td class="num">${k.tom_tat.hanh_dong_qua_han}</td></tr>`)))}
        ${card('c-hist-rag', 'Phân bố RAG theo kỳ', 'Số KPI theo màu ở mỗi kỳ', null)}
      </div>
      ${plain('Danh sách kỳ báo cáo', list.length + ' kỳ khớp bộ lọc', list.length ? table(['Kỳ', 'Phiên bản', 'Trạng thái', 'Chốt số liệu', 'Ngày duyệt', { t: 'Nộp đúng hạn', c: 'num' }, { t: 'Tỷ lệ đạt', c: 'num' }, 'Phân bố RAG', ''], rows, 'hist') : empty('Không có kỳ nào khớp bộ lọc', 'Thử nới khoảng thời gian hoặc bỏ lọc trạng thái.'))}
      ${plain('Kỳ chưa có dữ liệu', 'Sẽ bổ sung khi dữ liệu lịch sử được nhập và duyệt', `<ul class="pending">${CFG.ky_cho_bo_sung.map(k => `<li><b>${nk(k)}</b><span class="tag tag-neutral">Chưa có dữ liệu</span></li>`).join('')}</ul>`)}`;
    if (!list.length) return;
    Ch.line(document.getElementById('c-hist'), { title: 'Tỷ lệ KPI đạt theo kỳ', labels: list.map(k => nk(k.ky)), dp: 1, unit: '%', min0: true,
      series: [{ key: 'dat', label: 'Tỷ lệ KPI đạt (%)', color: COLOR.navy, data: list.map(k => k.tom_tat.ty_le_dat === null ? null : Math.round(k.tom_tat.ty_le_dat * 1000) / 10) },
               { key: 'do', label: 'Số KPI Đỏ', color: COLOR.do, data: list.map(k => k.tom_tat.dem_rag.do) }],
      extra: list.map(k => k.phat_hanh.thay_the_cho ? 'Bản điều chỉnh ' + k.phat_hanh.ma : k.phat_hanh.trang_thai !== 'da_duyet' ? 'Bản nháp chờ duyệt' : '') });
    Ch.stacked(document.getElementById('c-hist-rag'), list.slice(-8).reverse().map(k => ({ label: nk(k.ky), parts: order.map(m => ({ key: m, label: RAG[m][0], value: k.tom_tat.dem_rag[m], color: COLOR[m] })) })),
      { title: 'Phân bố RAG theo kỳ', onPart: (pt, row) => { const k = list.find(x => nk(x.ky) === row.label); if (k) { S.ky = k.ky; S.ss = prevKy(k.ky); S.rag = pt.key; S.trang = 'overview'; writeHash(); render(); } } });
  }

  // ---------- Ngăn chi tiết KPI ----------
  async function openKpi(ma, kpi, push = true) {
    S.kpiOpen = ma + ':' + kpi; if (push) writeHash();
    drawer.hidden = false; drawer.setAttribute('aria-hidden', 'false'); document.body.classList.add('drawer-open');
    drawerBody.innerHTML = '<div class="sk sk-h"></div><div class="sk sk-big"></div>';
    try {
      const [p, d, s] = await Promise.all([pb(S.ky, ma), dm(S.ky), ser(ma, kpi)]);
      const r = p.kpi.find(x => x.ma_kpi === kpi), c = d.kpi.find(x => x.ma === kpi);
      if (!r || !c) { drawerBody.innerHTML = empty('Không có KPI này trong kỳ'); return; }
      const sv = s.filter(x => x.ky <= S.ky).slice(-12), n = sv.filter(x => x.trang_thai_du_lieu === 'co_gia_tri').length;
      const kv = (k, v) => `<div class="kv"><span>${esc(k)}</span><b>${v}</b></div>`;
      const src = r.nguon.length ? table(['File', 'Vị trí', 'Cách lấy', 'Nội dung nguồn'], r.nguon.map(x => `<tr><td>${esc(x.file)}</td><td>${esc(x.vi_tri)}</td><td>${esc(CACH[x.cach_trich_xuat] || x.cach_trich_xuat)}${x.lay_cheo_tu ? ' (' + esc(x.lay_cheo_tu) + ')' : ''}</td><td>${x.noi_dung_nguon ? esc(x.noi_dung_nguon) : '<i>Không trích được</i>'}</td></tr>`), 'compact') : '<p class="muted">Không có nguồn trực tiếp (KPI tính toán hoặc không có dữ liệu).</p>';
      const tp = r.tinh_toan ? `<h4>Tính toán</h4><div class="formula">${esc(r.tinh_toan.cong_thuc)}</div><div class="comp">${r.tinh_toan.thanh_phan.map(t => `<button type="button" class="chip chip-xam" data-kpi="${t.ma_kpi}" data-pb="${t.ma_phong_ban}">${esc((d.kpi.find(k => k.ma === t.ma_kpi) || {}).ten || t.ma_kpi)} · ${esc((d.phong_ban.find(x => x.ma === t.ma_phong_ban) || {}).ten_chuan || t.ma_phong_ban)}</button>`).join('')}</div>` : '';
      drawerBody.innerHTML = `
        <div class="dr-h"><div class="crumb">${esc(p.ten_chuan)} · ${esc(c.ma)}</div><h2 id="drawer-title">${esc(c.ten)}</h2><div class="dr-tags">${ragBadge(r.rag.mau, r.rag.rag_tam ? 'tạm' : '')} ${statusTags(r, d.tu_dien_nhan)}</div></div>
        <div class="kv-grid">
          ${kv('Thực tế', r.trang_thai_du_lieu === 'co_gia_tri' ? nf(gv(r), c.so_thap_phan) + ' ' + esc(c.don_vi_tinh) : esc(TT[r.trang_thai_du_lieu]))}
          ${kv('Kế hoạch', r.ke_hoach.gia_tri !== null ? nf(r.ke_hoach.gia_tri, c.so_thap_phan) + ' ' + esc(c.don_vi_tinh) : esc(r.ke_hoach.ly_do || TT[r.ke_hoach.trang_thai_du_lieu]))}
          ${kv('Tỷ lệ đạt', r.ty_le_dat.gia_tri !== null ? pf(r.ty_le_dat.gia_tri) : '<span class="muted">' + esc(r.ty_le_dat.ly_do || 'Không tính') + '</span>')}
          ${kv('Căn cứ xếp màu', esc((d.tu_dien_can_cu || {})[r.rag.can_cu] || r.rag.can_cu) + (r.rag.ly_do_xam ? '<div class="sub">' + esc(r.rag.ly_do_xam) + '</div>' : ''))}
          ${kv('So với kỳ trước', r.so_sanh.trang_thai === 'da_tinh' ? `${r.so_sanh.chenh_lech > 0 ? '+' : ''}${nf(r.so_sanh.chenh_lech, c.so_thap_phan)} (${nk(r.so_sanh.ky)}: ${nf(r.so_sanh.gia_tri, c.so_thap_phan)})` : 'Chưa có dữ liệu kỳ trước')}
          ${kv('Chiều tốt', esc(CHIEU[c.chieu]))}
        </div>
        ${r.trang_thai_du_lieu !== 'co_gia_tri' ? `<div class="notice">${esc(TT[r.trang_thai_du_lieu])}: ${esc(r.ly_do_trang_thai || '')}</div>` : ''}
        <h4>Xác minh</h4><p>${esc(XM[r.xac_minh.trang_thai])}${r.xac_minh.nguoi_xac_minh ? ' · ' + esc(r.xac_minh.nguoi_xac_minh) + ' · ' + fd(r.xac_minh.ngay_xac_minh) : ''}${r.xac_minh.ghi_chu ? '<br><span class="muted">' + esc(r.xac_minh.ghi_chu) + '</span>' : ''}</p>
        <h4>Nguồn dữ liệu</h4>${src}
        ${r.gia_tri_nguon ? `<div class="kv-grid sm">${kv('Giá trị gốc', nf(r.gia_tri_nguon.gia_tri, r.quy_tac_quy_doi ? 0 : c.so_thap_phan) + ' ' + esc(r.gia_tri_nguon.don_vi))}${kv('Giá trị chuẩn hoá', nf(gv(r), c.so_thap_phan) + ' ' + esc(c.don_vi_tinh))}${kv('Quy tắc quy đổi', r.quy_tac_quy_doi ? esc(r.quy_tac_quy_doi.mo_ta) : 'Không quy đổi')}</div>` : ''}
        ${tp}
        <h4>Giải trình từ nguồn</h4><p>${r.giai_trinh.co_trong_nguon ? esc(r.giai_trinh.noi_dung) + `<br><span class="muted">${esc(r.giai_trinh.nguon.vi_tri)}</span>` : '<i class="muted">' + (r.rag.mau === 'do' || r.rag.mau === 'vang' ? 'Đơn vị chưa giải trình' : 'Nguồn không có ghi chú') + '</i>'}</p>
        <h4>Xu hướng</h4><div class="chart" id="dr-chart"></div>
        <details><summary>Xem dạng bảng</summary>${table(['Kỳ', 'Thực tế', 'Kế hoạch', 'Trạng thái'], sv.map(x => `<tr><td>${nk(x.ky)}</td><td class="num">${x.trang_thai_du_lieu === 'co_gia_tri' ? nf(x.gia_tri, c.so_thap_phan) : '—'}</td><td class="num">${nf(x.ke_hoach, c.so_thap_phan)}</td><td>${x.trang_thai_du_lieu === 'co_gia_tri' ? (x.rag ? RAG[x.rag][0] : '') : TT[x.trang_thai_du_lieu]}</td></tr>`), 'compact')}</details>`;
      const el = document.getElementById('dr-chart');
      if (n < CFG.nguong_xu_huong) el.innerHTML = `<p class="muted">Chưa đủ dữ liệu để vẽ xu hướng (${n}/${CFG.nguong_xu_huong} kỳ có số liệu).</p>`;
      else Ch.line(el, { title: 'Xu hướng ' + c.ten, labels: sv.map(x => nk(x.ky)), dp: c.so_thap_phan, unit: c.don_vi_tinh,
        series: [{ key: 'tt', label: 'Thực tế', color: COLOR.navy, data: sv.map(x => x.trang_thai_du_lieu === 'co_gia_tri' ? x.gia_tri : null) }, { key: 'kh', label: 'Kế hoạch', color: COLOR.plan, dashed: true, data: sv.map(x => x.ke_hoach) }] });
      document.getElementById('drawer-close').focus();
    } catch (e) { drawerBody.innerHTML = errBox(e); }
  }
  function closeDrawer(push = true) {
    if (drawer.hidden) return;
    drawer.hidden = true; drawer.setAttribute('aria-hidden', 'true'); document.body.classList.remove('drawer-open'); Ch.hideTip();
    if (S.kpiOpen) { S.kpiOpen = null; if (push) writeHash(); }
  }

  // ---------- sự kiện ----------
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-go],[data-kpi],[data-toggle-table],[data-rag-filter],[data-vd],[data-view-ky],[data-ss-ky],[data-clear-f],[data-clear-h],[data-retry],[data-stat],#drawer-close,#drawer-backdrop,#nav-toggle');
    if (!t) return;
    if (t.matches('[data-go]')) { e.preventDefault(); go(t.dataset.go); }
    else if (t.matches('[data-kpi]')) { e.preventDefault(); openKpi(t.dataset.pb, t.dataset.kpi); }
    else if (t.matches('[data-toggle-table]')) { const id = t.dataset.toggleTable, tb = document.getElementById(id + '-t'), ch = document.getElementById(id); const show = tb.hidden; tb.hidden = !show; ch.hidden = show; t.textContent = show ? 'Xem biểu đồ' : 'Xem dạng bảng'; t.setAttribute('aria-expanded', String(show)); }
    else if (t.matches('[data-rag-filter]')) { S.rag = t.dataset.ragFilter; writeHash(); render(); }
    else if (t.matches('[data-vd]')) { S.vd = t.dataset.vd; Promise.all([dm(S.ky), tq(S.ky)]).then(([d, tt]) => renderIssues(d, tt.tong_quan, ma => (d.phong_ban.find(p => p.ma === ma) || {}).ten_chuan || ma)); }
    else if (t.matches('[data-view-ky]')) { S.ky = t.dataset.viewKy; S.ss = prevKy(S.ky); S.trang = 'overview'; writeHash(); render(); }
    else if (t.matches('[data-ss-ky]')) { if (t.dataset.ssKy === S.ky) return; S.ss = t.dataset.ssKy; S.trang = 'overview'; writeHash(); render(); }
    else if (t.matches('[data-clear-f]')) { S.f = { rag: '', tt: '', xm: '', nhom: '', q: '' }; const b = document.getElementById('kpi-table-card'); if (b && b._ctx) renderKpiTable(b._ctx.p, b._ctx.d, b._ctx.pss); }
    else if (t.matches('[data-clear-h]')) { S.hist = { tu: '', den: '', tt: '' }; render(); }
    else if (t.matches('[data-retry]')) { cache.dm = {}; cache.tq = {}; cache.pb = {}; cache.ser = {}; render(); }
    else if (t.matches('[data-stat]')) { S.rag = t.dataset.stat; S.trang = 'overview'; writeHash(); render(); }
    else if (t.matches('#drawer-close,#drawer-backdrop')) closeDrawer();
    else if (t.matches('#nav-toggle')) { const o = document.body.classList.toggle('nav-open'); t.setAttribute('aria-expanded', String(o)); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeDrawer(); document.body.classList.remove('nav-open'); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-kpi], li[data-kpi], [data-stat]')) { e.preventDefault(); e.target.click(); }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'sel-ky') { S.ky = t.value; S.ss = prevKy(S.ky); S.kpiOpen = null; closeDrawer(false); writeHash(); render(); }
    else if (t.id === 'sel-ss') { S.ss = t.value; writeHash(); render(); }
    else if (t.id === 'trend-sel') { S.trend = t.value; pb(S.ky, S.trang).then(p => Promise.all([dm(S.ky), Promise.all(p.kpi.map(r => ser(S.trang, r.ma_kpi)))]).then(([d, series]) => renderTrend(p, d, code => (series[p.kpi.findIndex(r => r.ma_kpi === code)] || []).filter(s => s.ky <= S.ky).slice(-12)))); }
    else if (t.dataset.f && t.dataset.f !== 'q') { S.f[t.dataset.f] = t.value; const b = document.getElementById('kpi-table-card'); if (b && b._ctx) renderKpiTable(b._ctx.p, b._ctx.d, b._ctx.pss); }
    else if (t.dataset.h) { S.hist[t.dataset.h] = t.value; render(); }
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.f === 'q') { S.f.q = t.value; const b = document.getElementById('kpi-table-card'); if (b && b._ctx) { renderKpiTable(b._ctx.p, b._ctx.d, b._ctx.pss); const i = b.querySelector('[data-f="q"]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
  });
  window.addEventListener('hashchange', () => { if (suppress) { suppress = false; return; } const before = S.kpiOpen; parseHash(); if (!S.kpiOpen && before) closeDrawer(false); render(); });

  // ---------- khởi động ----------
  (async function init() {
    try {
      CFG = await P.getCauHinh();
      if (CFG.moi_truong !== APP.moi_truong) throw { ma: 'sai_moi_truong' };
      KYS = await P.getDanhSachKy();
      S.ky = KYS[KYS.length - 1].ky; S.ss = prevKy(S.ky);
      parseHash();
      if (!location.hash.includes('ss=')) S.ss = prevKy(S.ky);
      document.getElementById('env-name').textContent = APP.ten_moi_truong || APP.moi_truong;
      render();
    } catch (e) { main.innerHTML = errBox(e); console.error(e); }
  })();
})();
