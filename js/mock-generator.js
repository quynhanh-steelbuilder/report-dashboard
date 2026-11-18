/*
 * DEMO – BỘ SINH DỮ LIỆU GIẢ LẬP (đóng vai trò "pipeline" xử lý dữ liệu)
 * - Không đọc bất kỳ file nào; chỉ dùng seed cố định → chạy lại luôn ra cùng dữ liệu.
 * - Công ty, phòng ban, KPI, dự án, người phụ trách, số liệu đều là GIẢ LẬP.
 * - Màu trạng thái (Xanh/Vàng/Đỏ) được GÁN THEO KỊCH BẢN MINH HOẠ, không phải quy tắc xếp màu của tổ chức nào.
 * - Mọi giá trị hiển thị (tỷ lệ, màu, tổng quan, đếm trạng thái) được tạo ở file này, KHÔNG ở giao diện.
 */
(function (global) {
  'use strict';

  var SEED = 20261118;
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry32(SEED);
  function rr(a, b) { return a + (b - a) * rnd(); }
  function rd(v, d) { if (v === null || v === undefined || isNaN(v)) return null; var p = Math.pow(10, d || 0); return Math.round(v * p) / p; }
  // Định dạng số trong chuỗi hiển thị theo kiểu vi-VN (dấu chấm hàng nghìn, dấu phẩy thập phân); không đổi giá trị dữ liệu.
  function soVN(v, dp) { return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }).format(v); }
  // Chia tổng theo tỷ trọng rồi làm tròn theo phần dư lớn nhất, để tổng các phần luôn bằng tổng ban đầu (sau làm tròn).
  function chiaTron(tong, tyTrong, dp) {
    var p = Math.pow(10, dp || 0), T = Math.round(tong * p), s = tyTrong.reduce(function (a, b) { return a + b; }, 0);
    var raw = tyTrong.map(function (w) { return s ? T * w / s : 0; }), base = raw.map(Math.floor);
    var du = T - base.reduce(function (a, b) { return a + b; }, 0);
    raw.map(function (v, i) { return { i: i, r: v - base[i] }; }).sort(function (a, b) { return b.r - a.r || a.i - b.i; })
      .slice(0, du).forEach(function (x) { base[x.i] += 1; });
    return base.map(function (b) { return b / p; });
  }
  function pick(a) { return a[Math.floor(rnd() * a.length)]; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // ---- Kỳ báo cáo giả lập: 2025-11 → 2026-11 (13 kỳ) ----
  var KY = [];
  (function () { var y = 2025, m = 11; for (var i = 0; i < 13; i++) { KY.push(y + '-' + pad(m)); m++; if (m > 12) { m = 1; y++; } } })();
  var KY_MOI = KY[KY.length - 1];
  var KY_CHO_BO_SUNG = ['2025-09', '2025-10'];
  function nhanKy(ky) { return 'T' + ky.slice(5) + '/' + ky.slice(0, 4); }
  function thangSau(ky) { var y = +ky.slice(0, 4), m = +ky.slice(5, 7) + 1; if (m > 12) { m = 1; y++; } return y + '-' + pad(m); }
  function ngayChot(ky) { return thangSau(ky) + '-07'; }
  function cuoiThang(ky) { var y = +ky.slice(0, 4), m = +ky.slice(5, 7); return ky + '-' + pad(new Date(y, m, 0).getDate()); }
  function congNgay(d, n) { var x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); }

  // ---- Danh mục giả lập (KHÔNG theo cấu trúc nội bộ) ----
  var NHOM = [
    { ma: 'SX', ten: 'Sản xuất' }, { ma: 'CL', ten: 'Chất lượng' }, { ma: 'KD', ten: 'Kinh doanh' },
    { ma: 'CU', ten: 'Chuỗi cung ứng' }, { ma: 'NS', ten: 'Nhân sự & An toàn' }, { ma: 'KT', ten: 'Kỹ thuật' }
  ];
  var PB = [
    { ma: 'A1', ten_chuan: 'Xưởng Cơ khí', nhom: 'SX', vai_tro: 'Quản đốc Xưởng Cơ khí' },
    { ma: 'A2', ten_chuan: 'Xưởng Lắp ráp', nhom: 'SX', vai_tro: 'Quản đốc Xưởng Lắp ráp' },
    { ma: 'A3', ten_chuan: 'Phòng Bảo trì Thiết bị', nhom: 'SX', vai_tro: 'Trưởng phòng Bảo trì' },
    { ma: 'B1', ten_chuan: 'Phòng Kiểm soát Chất lượng', nhom: 'CL', vai_tro: 'Trưởng phòng QC' },
    { ma: 'B2', ten_chuan: 'Phòng Đảm bảo Chất lượng', nhom: 'CL', vai_tro: 'Trưởng phòng QA' },
    { ma: 'C1', ten_chuan: 'Kinh doanh Trong nước', nhom: 'KD', vai_tro: 'Giám đốc Kinh doanh Trong nước' },
    { ma: 'C2', ten_chuan: 'Kinh doanh Xuất khẩu', nhom: 'KD', vai_tro: 'Giám đốc Kinh doanh Xuất khẩu' },
    { ma: 'D1', ten_chuan: 'Phòng Mua hàng', nhom: 'CU', vai_tro: 'Trưởng phòng Mua hàng' },
    { ma: 'D2', ten_chuan: 'Phòng Kho vận', nhom: 'CU', vai_tro: 'Trưởng phòng Kho vận' },
    { ma: 'E1', ten_chuan: 'Phòng Nhân sự', nhom: 'NS', vai_tro: 'Trưởng phòng Nhân sự' },
    { ma: 'E2', ten_chuan: 'Ban An toàn', nhom: 'NS', vai_tro: 'Trưởng ban An toàn' },
    { ma: 'F1', ten_chuan: 'Phòng Thiết kế Kỹ thuật', nhom: 'KT', vai_tro: 'Trưởng phòng Thiết kế' }
  ];
  // chieu: tang | giam | bang_0 | theo_doi ; kh = kế hoạch gốc ; dp = số chữ số thập phân hiển thị
  var KPI = [
    { ma: 'D-SX-01', ten: 'Sản lượng hoàn thành', dv: 'nghìn sp', chieu: 'tang', nhom_kpi: 'Quy trình', pb: 'A1', kh: 900, dp: 1, nguon_dv: 'sp', he_so: 0.001 },
    { ma: 'D-SX-02', ten: 'Giờ công trên 1.000 sản phẩm', dv: 'giờ/nghìn sp', chieu: 'giam', nhom_kpi: 'Quy trình', pb: 'A1', kh: 28, dp: 1 },
    { ma: 'D-SX-03', ten: 'Tỷ lệ phế phẩm', dv: '%', chieu: 'giam', nhom_kpi: 'Tài chính', pb: 'A1', kh: 2.5, dp: 2 },
    { ma: 'D-SX-04', ten: 'Đơn hàng lắp ráp hoàn thành', dv: 'đơn', chieu: 'tang', nhom_kpi: 'Khách hàng', pb: 'A2', kh: 120, dp: 0 },
    { ma: 'D-SX-05', ten: 'Giao hàng đúng hạn', dv: '%', chieu: 'tang', nhom_kpi: 'Khách hàng', pb: 'A2', kh: 95, dp: 1 },
    { ma: 'D-SX-06', ten: 'Chi phí sản xuất đơn vị', dv: 'nghìn đ/sp', chieu: 'giam', nhom_kpi: 'Tài chính', pb: 'A2', kh: 18, dp: 2 },
    { ma: 'D-BT-01', ten: 'Thời gian dừng máy ngoài kế hoạch', dv: 'giờ', chieu: 'giam', nhom_kpi: 'Quy trình', pb: 'A3', kh: 40, dp: 0 },
    { ma: 'D-BT-02', ten: 'Hoàn thành bảo trì theo kế hoạch', dv: '%', chieu: 'tang', nhom_kpi: 'Quy trình', pb: 'A3', kh: 100, dp: 0 },
    { ma: 'D-CL-01', ten: 'Lỗi nội bộ phát sinh', dv: 'phiếu', chieu: 'giam', nhom_kpi: 'Quy trình', pb: 'B1', kh: 30, dp: 0 },
    { ma: 'D-CL-02', ten: 'Lỗi nội bộ trên 1 triệu sản phẩm', dv: 'phiếu/triệu sp', chieu: 'giam', nhom_kpi: 'Quy trình', pb: 'B1', dp: 1,
      tinh_toan: { cong_thuc: 'D-CL-01 ÷ D-SX-01 × 1.000', thanh_phan: [{ ma_kpi: 'D-CL-01', ma_phong_ban: 'B1' }, { ma_kpi: 'D-SX-01', ma_phong_ban: 'A1' }] } },
    { ma: 'D-CL-03', ten: 'Khiếu nại khách hàng', dv: 'vụ', chieu: 'giam', nhom_kpi: 'Khách hàng', pb: 'B1', kh: 2, dp: 0 },
    { ma: 'D-CL-04', ten: 'Hồ sơ chất lượng đúng hạn', dv: '%', chieu: 'tang', nhom_kpi: 'Quy trình', pb: 'B2', kh: 98, dp: 1 },
    { ma: 'D-CL-05', ten: 'Đánh giá nội bộ hoàn thành', dv: 'lượt', chieu: 'tang', nhom_kpi: 'Quy trình', pb: 'B2', kh: 6, dp: 0 },
    { ma: 'D-KD-01', ten: 'Doanh thu', dv: 'tỷ đồng', chieu: 'tang', nhom_kpi: 'Tài chính', pb: 'C1', kh: 45, dp: 1 },
    { ma: 'D-KD-02', ten: 'Tỷ lệ thu tiền lũy kế', dv: '%', chieu: 'tang', nhom_kpi: 'Tài chính', pb: 'C1', kh: 85, dp: 1 },
    { ma: 'D-KD-03', ten: 'Hợp đồng ký mới', dv: 'hợp đồng', chieu: 'tang', nhom_kpi: 'Khách hàng', pb: 'C1', kh: 5, dp: 0 },
    { ma: 'D-KD-04', ten: 'Doanh thu xuất khẩu', dv: 'nghìn USD', chieu: 'tang', nhom_kpi: 'Tài chính', pb: 'C2', kh: 1200, dp: 0 },
    { ma: 'D-KD-05', ten: 'Công nợ quá hạn', dv: 'nghìn USD', chieu: 'giam', nhom_kpi: 'Tài chính', pb: 'C2', kh: 150, dp: 0 },
    { ma: 'D-KD-06', ten: 'Container xuất', dv: 'cont', chieu: 'tang', nhom_kpi: 'Khách hàng', pb: 'C2', kh: 60, dp: 0 },
    { ma: 'D-CU-01', ten: 'Yêu cầu mua đáp ứng đúng hạn', dv: '%', chieu: 'tang', nhom_kpi: 'Khách hàng', pb: 'D1', kh: 92, dp: 1 },
    { ma: 'D-CU-02', ten: 'Tiết kiệm chi phí mua', dv: '%', chieu: 'tang', nhom_kpi: 'Tài chính', pb: 'D1', kh: 3, dp: 2 },
    { ma: 'D-CU-03', ten: 'Biến động giá nguyên liệu chính', dv: '%', chieu: 'theo_doi', nhom_kpi: 'Tài chính', pb: 'D1', dp: 1 },
    { ma: 'D-CU-04', ten: 'Giá trị tồn kho', dv: 'tỷ đồng', chieu: 'giam', nhom_kpi: 'Tài chính', pb: 'D2', kh: 60, dp: 1 },
    { ma: 'D-CU-05', ten: 'Độ chính xác tồn kho', dv: '%', chieu: 'tang', nhom_kpi: 'Quy trình', pb: 'D2', kh: 99, dp: 1, tu: '2026-10' },
    { ma: 'D-NS-01', ten: 'Tổng nhân sự cuối kỳ', dv: 'người', chieu: 'theo_doi', nhom_kpi: 'Nguồn lực', pb: 'E1', dp: 0, goc: 640 },
    { ma: 'D-NS-02', ten: 'Tỷ lệ nghỉ việc', dv: '%', chieu: 'giam', nhom_kpi: 'Nguồn lực', pb: 'E1', kh: 2.0, dp: 2 },
    { ma: 'D-NS-03', ten: 'Đáp ứng tuyển dụng', dv: '%', chieu: 'tang', nhom_kpi: 'Nguồn lực', pb: 'E1', kh: 90, dp: 1 },
    { ma: 'D-AT-01', ten: 'Tai nạn lao động', dv: 'vụ', chieu: 'bang_0', nhom_kpi: 'Nguồn lực', pb: 'E2', kh: 0, dp: 0 },
    { ma: 'D-AT-02', ten: 'Vi phạm an toàn', dv: 'lượt', chieu: 'giam', nhom_kpi: 'Nguồn lực', pb: 'E2', kh: 10, dp: 0 },
    { ma: 'D-KT-01', ten: 'Bản vẽ phát hành', dv: 'bản vẽ', chieu: 'tang', nhom_kpi: 'Quy trình', pb: 'F1', kh: 1500, dp: 0 },
    { ma: 'D-KT-02', ten: 'Năng suất thiết kế', dv: 'bản vẽ/người', chieu: 'tang', nhom_kpi: 'Nguồn lực', pb: 'F1', kh: 95, dp: 1, tu: '2026-09' }
  ];
  var KPI_TRONG_DIEM = ['D-KD-01', 'D-SX-01', 'D-SX-05', 'D-KD-05', 'D-CU-01', 'D-AT-01'];

  // ---- Kịch bản cố định để bao phủ các tình huống hiển thị ----
  var KB = {
    'D-SX-01|2026-11': 'vang', 'D-SX-02|2026-11': 'bat_thuong', 'D-SX-05|2026-10': 'vang', 'D-SX-05|2026-11': 'do',
    'D-SX-04|2026-11': 'vuot', 'D-BT-02|2026-08': 'khong_ap_dung', 'D-CL-03|2026-11': 'zero', 'D-CL-05|2026-11': 'khong_ke_hoach',
    'D-KD-01|2026-11': 'vuot', 'D-KD-05|2026-11': 'do', 'D-KD-06|2026-11': 'khong_doc',
    'D-CU-01|2026-09': 'xanh', 'D-CU-01|2026-10': 'vang', 'D-CU-01|2026-11': 'keo_dai', 'D-CU-02|2026-11': 'thieu',
    'D-NS-02|2026-11': 'do', 'D-AT-01|2026-09': 'do', 'D-KT-01|2026-11': 'mau_thuan', 'D-AT-02|2026-11': 'xanh'
  };
  var PB_CHUA_NOP = { '2026-11': ['D2'] };
  var PB_TRE = { '2026-11': { C2: 3 }, '2026-09': { C1: 2 }, '2026-06': { F1: 1 } };

  var POOL_NN = [
    'Thiếu nguyên vật liệu đầu vào trong nửa đầu kỳ',
    'Một thiết bị chính dừng để sửa chữa đột xuất',
    'Đơn hàng dồn vào cuối kỳ',
    'Thiếu nhân sự có tay nghề ở ca đêm',
    'Khách hàng thay đổi yêu cầu kỹ thuật, phải làm lại một phần'
  ];
  var POOL_HD = [
    'Bổ sung ca làm việc tăng cường trong 2 tuần đầu kỳ',
    'Rà soát kế hoạch cấp vật tư hằng tuần với Phòng Mua hàng',
    'Đào tạo lại tổ vận hành theo quy trình chuẩn',
    'Làm việc với nhà cung cấp để rút ngắn thời gian giao',
    'Lập kế hoạch bảo trì phòng ngừa cho thiết bị chính'
  ];
  var POOL_RR = [
    'Giá nguyên liệu chính có thể tăng trong kỳ tới',
    'Một khách hàng lớn đề nghị giãn tiến độ thanh toán',
    'Nguy cơ thiếu nhân sự trong mùa cao điểm',
    'Thiết bị cũ có nguy cơ hỏng, ảnh hưởng tiến độ'
  ];

  function kpiCuaPb(ma) { return KPI.filter(function (k) { return k.pb === ma; }); }
  function tenFile(pb, ky) { return pb + '_baocao_' + ky + '.xlsx (giả lập)'; }
  function maBam(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; } return 'sha256:gia-lap-' + h.toString(16); }
  function giaTri(r) { if (!r) return null; var v = r.loai_du_lieu === 'tinh_toan' ? (r.tinh_toan && r.tinh_toan.gia_tri) : (r.gia_tri_chuan_hoa && r.gia_tri_chuan_hoa.gia_tri); return v === undefined ? null : v; }
  function ragXam(mau, lyDo, canCu) { return { mau: mau, can_cu: canCu || 'thieu', rag_tam: false, vang_lien_tiep: false, ly_do_xam: lyDo }; }

  function khung(k, ky) {
    return {
      ma_kpi: k.ma, pham_vi: null,
      trang_thai_du_lieu: null, ly_do_trang_thai: null,
      loai_du_lieu: k.tinh_toan ? 'tinh_toan' : 'nguon',
      gia_tri_nguon: null, quy_tac_quy_doi: null, gia_tri_chuan_hoa: null, tinh_toan: null,
      ke_hoach: { trang_thai_du_lieu: 'thieu_du_lieu', gia_tri: null, nguon: null, ly_do: null },
      ty_le_dat: { gia_tri: null, trang_thai: 'khong_tinh', ly_do: null },
      rag: null,
      so_sanh: { ky: null, gia_tri: null, chenh_lech: null, ty_le_thay_doi: null, trang_thai: 'khong_co_ky_so_sanh' },
      xac_minh: { trang_thai: ky === KY_MOI ? 'chua_xac_minh' : 'da_xac_minh', nguoi_xac_minh: ky === KY_MOI ? null : 'Người rà soát (giả lập)', ngay_xac_minh: ky === KY_MOI ? null : congNgay(ngayChot(ky), 2), ghi_chu: null, ho_so: ky === KY_MOI ? null : 'xac-minh-01.json (giả lập)' },
      nguon: [],
      giai_trinh: { co_trong_nguon: false, noi_dung: null, nguyen_nhan: null, nguon: null },
      nhan: []
    };
  }

  function kichBan(k, ky) {
    var o = KB[k.ma + '|' + ky]; if (o) return o;
    if (k.chieu === 'bang_0') return 'zero';
    var x = rnd();
    return x < 0.5 ? 'xanh' : x < 0.62 ? 'vuot' : x < 0.83 ? 'vang' : 'do';
  }
  function sinhKH(k) {
    if (k.chieu === 'theo_doi') return null;
    if (k.chieu === 'bang_0') return 0;
    if (k.dv === '%') return k.kh;
    return rd(k.kh * (1 + rr(-0.06, 0.06)), k.dp);
  }
  function sinhGiaTri(k, sc, kh, truoc) {
    if (k.chieu === 'theo_doi') {
      if (k.goc) return Math.round((truoc || k.goc) * (1 + rr(-0.02, 0.03)));
      return rd(rr(-4, 4), k.dp);
    }
    if (sc === 'zero') return 0;
    if (k.chieu === 'bang_0') return sc === 'do' ? 1 : 0;
    if (sc === 'keo_dai') sc = 'vang';
    var p = sc === 'vuot' ? rr(1.15, 1.3) : sc === 'xanh' ? rr(1.0, 1.08) : sc === 'vang' ? rr(0.915, 0.985) : sc === 'do' ? rr(0.7, 0.86) : rr(0.95, 1.05);
    var v = k.chieu === 'tang' ? kh * p : kh / p;
    if (k.dv === '%' && k.chieu === 'tang' && v > 100) v = 100;
    return rd(v, k.dp);
  }
  // Màu trạng thái trong DEMO được gán theo KỊCH BẢN minh hoạ (không cài quy tắc/ngưỡng xếp màu thật).
  var MAU_KB = { xanh: 'xanh', vuot: 'xanh', zero: 'xanh', khong_ke_hoach: 'xanh', vang: 'vang', do: 'do', bat_thuong: 'do', keo_dai: 'do' };
  // Tỷ lệ thực hiện so với kế hoạch (chỉ để hiển thị): KPI "càng cao càng tốt" = TT/KH, "càng thấp càng tốt" = KH/TT.
  function tyLe(k, tt, kh) {
    if (k.chieu === 'theo_doi' || k.chieu === 'bang_0' || kh === null || kh === undefined) return null;
    if (k.chieu === 'tang') return kh ? tt / kh : null;
    return tt === 0 ? null : kh / tt;
  }

  var GOC = {};   // ma_kpi -> ky -> {tt, kh}
  function soSanh(k, r, i, tt) {
    var lich = GOC[k.ma] || {};
    var kyTruoc = i > 0 ? KY[i - 1] : null, truoc = kyTruoc ? lich[kyTruoc] : null;
    if (truoc && truoc.tt !== null && tt !== null) {
      r.so_sanh = { ky: kyTruoc, gia_tri: truoc.tt, chenh_lech: rd(tt - truoc.tt, k.dp), ty_le_thay_doi: truoc.tt !== 0 ? rd((tt - truoc.tt) / truoc.tt, 4) : null, trang_thai: 'da_tinh' };
    } else {
      r.so_sanh = { ky: kyTruoc, gia_tri: null, chenh_lech: null, ty_le_thay_doi: null, trang_thai: 'khong_co_ky_so_sanh' };
    }
    return truoc;
  }
  function apRag(k, r, tt, kh, sc) {
    if (k.chieu === 'theo_doi') {
      r.rag = { mau: 'khong_xep_mau', can_cu: 'theo_doi', rag_tam: false, vang_lien_tiep: false, ly_do_xam: null };
      r.ty_le_dat = { gia_tri: null, trang_thai: 'khong_tinh', ly_do: 'KPI theo dõi, không đặt kế hoạch' };
      return;
    }
    var p = tyLe(k, tt, kh);
    r.ty_le_dat = { gia_tri: p === null ? null : rd(p, 4), trang_thai: p === null ? 'khong_tinh' : 'da_tinh',
      ly_do: p !== null ? null : kh === null ? 'Không có kế hoạch' : k.chieu === 'bang_0' ? 'Mục tiêu bằng 0: không tính tỷ lệ' : 'Thực tế bằng 0: không tính tỷ lệ' };
    r.rag = { mau: MAU_KB[sc] || 'xanh', can_cu: kh === null ? 'tam' : 'KH', rag_tam: kh === null, vang_lien_tiep: sc === 'keo_dai', ly_do_xam: null };
    if (kh === null) r.nhan.push('rag_tam');
    if (sc === 'keo_dai') r.nhan.push('vang_lien_tiep');
  }
  function giaiTrinh(r) {
    if ((r.rag.mau === 'do' || r.rag.mau === 'vang') && rnd() < 0.6) {
      var nn = pick(POOL_NN);
      r.giai_trinh = { co_trong_nguon: true, noi_dung: 'Đơn vị nêu: ' + nn.charAt(0).toLowerCase() + nn.slice(1) + '.', nguyen_nhan: nn, nguon: { file: r.nguon[0] ? r.nguon[0].file : null, vi_tri: 'Sheet "Hành động"' } };
    }
  }

  function taoBanGhi(k, ky, i) {
    var lich = GOC[k.ma] || (GOC[k.ma] = {});
    var r = khung(k, ky);
    if (k.tu && ky < k.tu) {
      r.trang_thai_du_lieu = 'khong_ap_dung'; r.ly_do_trang_thai = 'KPI bắt đầu theo dõi từ ' + nhanKy(k.tu);
      r.ke_hoach = { trang_thai_du_lieu: 'khong_ap_dung', gia_tri: null, nguon: null, ly_do: null };
      r.rag = ragXam('khong_xep_mau', 'KPI chưa áp dụng ở kỳ này', 'khong_ap_dung'); r.xac_minh.trang_thai = 'chua_xac_minh'; r.xac_minh.nguoi_xac_minh = null; r.xac_minh.ngay_xac_minh = null; r.xac_minh.ho_so = null;
      lich[ky] = null; return r;
    }
    var kh0 = sinhKH(k);
    if ((PB_CHUA_NOP[ky] || []).indexOf(k.pb) >= 0) {
      r.trang_thai_du_lieu = 'thieu_du_lieu'; r.ly_do_trang_thai = 'Đơn vị chưa nộp báo cáo kỳ này';
      r.ke_hoach = { trang_thai_du_lieu: kh0 === null ? 'khong_ap_dung' : 'co_gia_tri', gia_tri: kh0, nguon: kh0 === null ? null : { file: tenFile(k.pb, KY[i - 1] || ky), vi_tri: 'Sheet "Kế hoạch"' }, ly_do: null };
      r.rag = ragXam('xam', 'Thiếu số liệu thực tế: đơn vị chưa nộp báo cáo');
      soSanh(k, r, i, null); lich[ky] = null; return r;
    }
    var sc = kichBan(k, ky);
    if (sc === 'khong_ap_dung') {
      r.trang_thai_du_lieu = 'khong_ap_dung'; r.ly_do_trang_thai = 'Không có hạng mục bảo trì theo kế hoạch trong kỳ (nguồn ghi rõ)';
      r.ke_hoach = { trang_thai_du_lieu: 'khong_ap_dung', gia_tri: null, nguon: null, ly_do: null };
      r.rag = ragXam('khong_xep_mau', 'KPI không áp dụng ở kỳ này', 'khong_ap_dung');
      lich[ky] = null; return r;
    }
    var kh = sc === 'khong_ke_hoach' ? null : kh0;
    if (kh === null) {
      r.ke_hoach = { trang_thai_du_lieu: k.chieu === 'theo_doi' ? 'khong_ap_dung' : 'thieu_du_lieu', gia_tri: null, nguon: null, ly_do: k.chieu === 'theo_doi' ? 'KPI theo dõi, không đặt kế hoạch' : 'Nguồn không nêu kế hoạch kỳ này' };
    } else {
      r.ke_hoach = { trang_thai_du_lieu: 'co_gia_tri', gia_tri: kh, nguon: { file: tenFile(k.pb, KY[i - 1] || ky), vi_tri: 'Sheet "Kế hoạch" (báo cáo kỳ trước)' }, ly_do: null };
    }
    if (sc === 'thieu') {
      r.trang_thai_du_lieu = 'thieu_du_lieu'; r.ly_do_trang_thai = 'Báo cáo có dòng KPI nhưng ô thực tế để trống';
      r.rag = ragXam('xam', 'Thiếu số liệu thực tế'); soSanh(k, r, i, null); lich[ky] = null; return r;
    }
    if (sc === 'khong_doc') {
      r.trang_thai_du_lieu = 'khong_doc_duoc'; r.ly_do_trang_thai = 'Phần số liệu trong file nguồn là ảnh scan, chưa trích được';
      r.nguon = [{ file: k.pb + '_bao-cao_' + ky + '.pdf (giả lập)', ma_bam_file: maBam(k.ma + ky + 'pdf'), vi_tri: 'Trang 3 · bảng ảnh scan', noi_dung_nguon: null, cach_trich_xuat: 'anh', lay_cheo_tu: null }];
      r.rag = ragXam('xam', 'Không đọc được số liệu nguồn'); soSanh(k, r, i, null); lich[ky] = null; return r;
    }
    var truocGT = i > 0 && lich[KY[i - 1]] ? lich[KY[i - 1]].tt : null;
    var tt = (sc === 'bat_thuong' && truocGT !== null) ? rd(truocGT * 1.6, k.dp) : sinhGiaTri(k, sc, kh !== null ? kh : (k.kh || k.goc || 0), truocGT);
    r.trang_thai_du_lieu = 'co_gia_tri';
    if (k.nguon_dv) {
      r.gia_tri_nguon = { gia_tri: rd(tt / k.he_so, 0), don_vi: k.nguon_dv };
      r.quy_tac_quy_doi = { mo_ta: k.nguon_dv + ' → ' + k.dv + ': chia 1.000', he_so: k.he_so };
    } else {
      r.gia_tri_nguon = { gia_tri: tt, don_vi: k.dv };
    }
    r.gia_tri_chuan_hoa = { gia_tri: tt, don_vi: k.dv };
    var dong = 2 + KPI.indexOf(k);
    r.nguon = [{ file: tenFile(k.pb, ky), ma_bam_file: maBam(k.pb + ky), vi_tri: 'Sheet "Số liệu" · dòng ' + dong, noi_dung_nguon: k.ten + ': ' + soVN(r.gia_tri_nguon.gia_tri, k.nguon_dv ? 0 : k.dp) + ' ' + r.gia_tri_nguon.don_vi, cach_trich_xuat: 'excel_chuan', lay_cheo_tu: null }];
    soSanh(k, r, i, tt);
    apRag(k, r, tt, kh, sc);
    if (sc === 'bat_thuong') {
      r.nhan.push('bat_thuong');
      r.xac_minh = { trang_thai: 'can_xac_minh', nguoi_xac_minh: null, ngay_xac_minh: null, ghi_chu: 'Giá trị tăng khoảng 60% so với kỳ trước; giữ nguyên số liệu nguồn, chờ đơn vị xác nhận', ho_so: null };
    }
    if (sc === 'mau_thuan') {
      var v2 = rd(tt * 1.07, k.dp);
      r.nguon.push({ file: 'B1_doi-chieu_' + ky + '.xlsx (giả lập)', ma_bam_file: maBam('dc' + ky), vi_tri: 'Sheet "Tổng hợp" · ô D12', noi_dung_nguon: k.ten + ': ' + soVN(rd(v2 / (k.he_so || 1), 0), 0) + ' ' + (k.nguon_dv || k.dv), cach_trich_xuat: 'lay_cheo', lay_cheo_tu: 'B1' });
      r.nhan.push('lay_cheo');
      r.xac_minh = { trang_thai: 'mau_thuan', nguoi_xac_minh: null, ngay_xac_minh: null, ghi_chu: 'Hai nguồn lệch nhau: ' + soVN(tt, k.dp) + ' và ' + soVN(v2, k.dp) + ' ' + k.dv + '. Chưa chọn nguồn; trạng thái để Xám chờ xác minh', ho_so: null };
      r.rag = ragXam('xam', 'Mâu thuẫn giữa hai nguồn, chờ xác minh');
      r.ty_le_dat = { gia_tri: null, trang_thai: 'khong_tinh', ly_do: 'Mâu thuẫn nguồn' };
    }
    giaiTrinh(r);
    lich[ky] = { tt: tt, kh: kh };
    return r;
  }

  function taoBanGhiTinhToan(k, ky, i, recs) {
    var lich = GOC[k.ma] || (GOC[k.ma] = {});
    var r = khung(k, ky);
    var a = recs['D-CL-01'], b = recs['D-SX-01'];
    r.tinh_toan = { cong_thuc: k.tinh_toan.cong_thuc, thanh_phan: k.tinh_toan.thanh_phan, gia_tri: null };
    var ta = giaTri(a), tb = giaTri(b);
    if (ta === null || tb === null || tb === 0) {
      r.trang_thai_du_lieu = 'thieu_du_lieu'; r.ly_do_trang_thai = 'Thiếu thành phần để tính (cần cả D-CL-01 và D-SX-01)';
      r.rag = ragXam('xam', 'Thiếu thành phần tính toán'); soSanh(k, r, i, null); lich[ky] = null; return r;
    }
    var tt = rd(ta / tb * 1000, k.dp);
    var kha = a.ke_hoach.gia_tri, khb = b.ke_hoach.gia_tri;
    var kh = (kha !== null && khb) ? rd(kha / khb * 1000, k.dp) : null;
    r.trang_thai_du_lieu = 'co_gia_tri';
    r.tinh_toan.gia_tri = tt;
    r.ke_hoach = kh === null ? { trang_thai_du_lieu: 'thieu_du_lieu', gia_tri: null, nguon: null, ly_do: 'Thiếu kế hoạch của thành phần' }
      : { trang_thai_du_lieu: 'co_gia_tri', gia_tri: kh, nguon: { file: null, vi_tri: 'Tính từ kế hoạch D-CL-01 và D-SX-01' }, ly_do: null };
    soSanh(k, r, i, tt);
    // Demo: màu của KPI tính toán lấy theo kịch bản của thành phần chính (minh hoạ)
    apRag(k, r, tt, kh, a.rag.mau === 'vang' ? 'vang' : a.rag.mau === 'do' ? 'do' : 'xanh');
    var ws = [a.xac_minh.trang_thai, b.xac_minh.trang_thai];
    if (ws.indexOf('mau_thuan') >= 0 || ws.indexOf('can_xac_minh') >= 0) { r.xac_minh = { trang_thai: 'can_xac_minh', nguoi_xac_minh: null, ngay_xac_minh: null, ghi_chu: 'Một thành phần đang cần xác minh', ho_so: null }; }
    lich[ky] = { tt: tt, kh: kh };
    return r;
  }

  // ---- Sinh bản ghi KPI cho mọi kỳ ----
  var REC = {};
  KY.forEach(function (ky, i) {
    var recs = {};
    KPI.forEach(function (k) { if (!k.tinh_toan) recs[k.ma] = taoBanGhi(k, ky, i); });
    KPI.forEach(function (k) { if (k.tinh_toan) recs[k.ma] = taoBanGhiTinhToan(k, ky, i, recs); });
    REC[ky] = recs;
  });

  // ---- Vấn đề / hành động (sinh một lần cho mỗi kỳ, trạng thái tính theo kỳ đang xem) ----
  var VD = {};   // ky -> pb -> [items]
  KY.forEach(function (ky) {
    VD[ky] = {};
    PB.forEach(function (p) {
      var list = [], n = 0;
      if ((PB_CHUA_NOP[ky] || []).indexOf(p.ma) >= 0) { VD[ky][p.ma] = list; return; }
      kpiCuaPb(p.ma).forEach(function (k) {
        var r = REC[ky][k.ma];
        if (!r.rag || (r.rag.mau !== 'do' && r.rag.mau !== 'vang') || list.length >= 2) return;
        var coNguon = r.giai_trinh.co_trong_nguon;
        var bod = rnd() < 0.22;
        list.push({
          ma: p.ma + '-' + ky + '-' + pad(++n), ma_kpi: k.ma, loai: 'van_de',
          mo_ta: k.ten + (r.rag.mau === 'do' ? ' không đạt' : ' chưa đạt') + ' kế hoạch ' + nhanKy(ky) + (r.rag.vang_lien_tiep ? ' (cảnh báo kéo dài)' : ''),
          nguyen_nhan: coNguon ? r.giai_trinh.nguyen_nhan : null,
          hanh_dong: rnd() < 0.88 ? pick(POOL_HD) : null,
          nguoi_phu_trach: p.vai_tro, han: cuoiThang(thangSau(ky)),
          can_bod: bod, noi_dung_de_xuat: bod ? 'Đề nghị BOD phê duyệt bổ sung nguồn lực cho hành động khắc phục (giả lập)' : null,
          co_trong_nguon: coNguon, nguon: { file: tenFile(p.ma, ky), vi_tri: 'Sheet "Hành động"' }, _o: rnd(), ky_tao: ky
        });
      });
      if (rnd() < 0.4) {
        list.push({ ma: p.ma + '-' + ky + '-' + pad(++n), ma_kpi: null, loai: 'rui_ro', mo_ta: pick(POOL_RR), nguyen_nhan: null,
          hanh_dong: rnd() < 0.7 ? pick(POOL_HD) : null, nguoi_phu_trach: p.vai_tro, han: cuoiThang(thangSau(ky)), can_bod: false, noi_dung_de_xuat: null,
          co_trong_nguon: true, nguon: { file: tenFile(p.ma, ky), vi_tri: 'Sheet "Hành động"' }, _o: rnd(), ky_tao: ky });
      }
      VD[ky][p.ma] = list;
    });
  });
  function vanDeTheoKy(ky, ma) {
    var i = KY.indexOf(ky), out = [];
    [0, 1, 2].forEach(function (lui) {
      var kt = KY[i - lui]; if (!kt) return;
      (VD[kt][ma] || []).forEach(function (it) {
        var tt;
        if (lui === 0) tt = it._o < 0.5 ? 'moi' : 'dang_lam';
        else if (lui === 1) tt = it._o < 0.78 ? 'xong' : 'qua_han';
        else { if (it._o < 0.9) return; tt = 'qua_han'; }
        var c = JSON.parse(JSON.stringify(it)); delete c._o; c.trang_thai = tt; out.push(c);
      });
    });
    return out;
  }

  // ---- Nội dung đặc thù (khai báo bằng dữ liệu, giao diện hiển thị chung) ----
  function dacThu(ma, ky) {
    var recs = REC[ky];
    switch (ma) {
      case 'A1': {
        var tong = giaTri(recs['D-SX-01']) || 0;
        // Tỷ trọng dao động ±5% (giữ nguyên số lần gọi rr để không làm lệch chuỗi ngẫu nhiên phía sau), tổng các dòng = D-SX-01.
        var t = chiaTron(tong, [0.3, 0.32, 0.22, 0.16].map(function (w) { return w * rr(0.95, 1.05); }), 1);
        return [{ tieu_de: 'Sản lượng theo dòng sản phẩm', loai: 'bieu_do_cot', don_vi: 'nghìn sp', dp: 1, du_lieu: [{ nhan: 'Dòng A', gia_tri: t[0] }, { nhan: 'Dòng B', gia_tri: t[1] }, { nhan: 'Dòng C', gia_tri: t[2] }, { nhan: 'Dòng D', gia_tri: t[3] }], nguon: { file: tenFile('A1', ky), vi_tri: 'Sheet "Chi tiết"' } }];
      }
      case 'B1': {
        var loi = giaTri(recs['D-CL-01']) || 0, nhom = [['Gia công', 0.34], ['Lắp ráp', 0.24], ['Hoàn thiện', 0.18], ['Vật tư đầu vào', 0.14], ['Đóng gói', 0.1]];
        var sl = chiaTron(loi, nhom.map(function (x) { return x[1]; }), 0);
        var arr = nhom.map(function (x, i) { return { nhan: x[0], gia_tri: sl[i] }; });
        arr.sort(function (a, b) { return b.gia_tri - a.gia_tri; });
        return [{ tieu_de: 'Lỗi nội bộ theo công đoạn (Pareto)', loai: 'bieu_do_cot', don_vi: 'phiếu', du_lieu: arr, nguon: { file: tenFile('B1', ky), vi_tri: 'Sheet "Chi tiết"' } }];
      }
      case 'C1': {
        var rows = ['DA-101', 'DA-102', 'DA-103', 'DA-104', 'DA-105'].map(function (d) { var hd = rd(rr(12, 60), 1), thu = rd(hd * rr(0.15, 0.98), 1); return [d, hd, thu, rd(thu / hd, 4)]; });
        return [{ tieu_de: 'Thu tiền theo dự án (giả lập)', loai: 'bang', cot: [{ ten: 'Dự án', kieu: 'text' }, { ten: 'Giá trị hợp đồng (tỷ đồng)', kieu: 'so', dp: 1 }, { ten: 'Đã thu (tỷ đồng)', kieu: 'so', dp: 1 }, { ten: 'Tỷ lệ đã thu', kieu: 'pct' }], dong: rows, nguon: { file: tenFile('C1', ky), vi_tri: 'Sheet "Chi tiết"' } }];
      }
      case 'C2': {
        if ((PB_CHUA_NOP[ky] || []).indexOf('C2') >= 0) return [];
        var mk = ['Thị trường A', 'Thị trường B', 'Thị trường C', 'Khác'].map(function (m) { return [m, Math.round(rr(120, 520)), Math.round(rr(5, 25))]; });
        return [{ tieu_de: 'Xuất khẩu theo thị trường', loai: 'bang', cot: [{ ten: 'Thị trường', kieu: 'text' }, { ten: 'Doanh thu (nghìn USD)', kieu: 'so', dp: 0 }, { ten: 'Container', kieu: 'so', dp: 0 }], dong: mk, nguon: { file: tenFile('C2', ky), vi_tri: 'Sheet "Chi tiết"' } }];
      }
      case 'D1': {
        var g = ['Nguyên liệu A', 'Nguyên liệu B', 'Bao bì', 'Phụ liệu'].map(function (m) { var gia = rd(rr(15, 60), 1); return [m, gia, rd(rr(-0.06, 0.08), 4)]; });
        return [{ tieu_de: 'Giá nguyên liệu chính', loai: 'bang', cot: [{ ten: 'Nhóm', kieu: 'text' }, { ten: 'Giá kỳ này (nghìn đ/đơn vị)', kieu: 'so', dp: 1 }, { ten: 'Thay đổi so kỳ trước', kieu: 'pct_dau' }], dong: g, nguon: { file: tenFile('D1', ky), vi_tri: 'Sheet "Chi tiết"' } }];
      }
      case 'E2': {
        var tn = KY.slice(0, KY.indexOf(ky) + 1).filter(function (x) { return x.slice(0, 4) === ky.slice(0, 4); }).reduce(function (s, x) { return s + (giaTri(REC[x]['D-AT-01']) || 0); }, 0);
        return [{ tieu_de: 'Phân loại sự cố an toàn (lũy kế năm)', loai: 'bang', cot: [{ ten: 'Mức độ', kieu: 'text' }, { ten: 'Số vụ', kieu: 'so', dp: 0 }], dong: [['Nghiêm trọng', 0], ['Tai nạn có thương tích', tn], ['Sự cố không thương tích', Math.round(rr(3, 9))], ['Hành vi không an toàn', Math.round(rr(30, 70))]], nguon: { file: tenFile('E2', ky), vi_tri: 'Sheet "Chi tiết"' } }];
      }
      case 'F1': {
        var kl = giaTri(recs['D-KT-01']) || 0, nk = chiaTron(kl, [0.55, 0.3, 0.15], 0);
        return [{ tieu_de: 'Bản vẽ phát hành theo nhóm khách hàng', loai: 'bieu_do_cot', don_vi: 'bản vẽ', du_lieu: [{ nhan: 'Nhóm KH 1', gia_tri: nk[0] }, { nhan: 'Nhóm KH 2', gia_tri: nk[1] }, { nhan: 'Nhóm KH 3', gia_tri: nk[2] }], nguon: { file: tenFile('F1', ky), vi_tri: 'Sheet "Chi tiết"' } }];
      }
      default: return [];
    }
  }

  // ---- Lắp dataset từng kỳ (giống "gói phát hành") ----
  function demRag(list) { var d = { xanh: 0, vang: 0, do: 0, xam: 0, khong_xep_mau: 0 }; list.forEach(function (r) { d[r.rag.mau]++; }); return d; }
  function phatHanh(ky) {
    if (ky === KY_MOI) return { ma: 'r01', trang_thai: 'da_kiem_tra', nhan: 'Bản nháp – chờ duyệt', ngay_duyet: null, thay_the_cho: null, ly_do_dieu_chinh: null };
    if (ky === '2026-08') return { ma: 'r02', trang_thai: 'da_duyet', nhan: 'Đã duyệt (bản điều chỉnh)', ngay_duyet: congNgay(ngayChot(ky), 9), thay_the_cho: 'r01', ly_do_dieu_chinh: 'Đơn vị gửi bổ sung số liệu giao hàng sau khi đã duyệt (giả lập)' };
    return { ma: 'r01', trang_thai: 'da_duyet', nhan: 'Đã duyệt', ngay_duyet: congNgay(ngayChot(ky), 3), thay_the_cho: null, ly_do_dieu_chinh: null };
  }
  var TEN_NHAN = { rag_tam: 'Xếp màu tạm', vang_lien_tiep: 'Cảnh báo kéo dài', bat_thuong: 'Biến động bất thường', lay_cheo: 'Số liệu từ đơn vị khác', doc_anh: 'Đọc từ ảnh' };
  var TEN_CAN_CU = { KH: 'So với kế hoạch', tam: 'Xếp màu tạm (không có kế hoạch)', thieu: 'Thiếu dữ liệu', theo_doi: 'KPI theo dõi', khong_ap_dung: 'Không áp dụng' };
  var DANH_MUC = {
    nhom: NHOM,
    phong_ban: PB.map(function (p) { return { ma: p.ma, ten_chuan: p.ten_chuan, nhom: p.nhom }; }),
    kpi: KPI.map(function (k) { return { ma: k.ma, ten: k.ten, don_vi_tinh: k.dv, chieu: k.chieu, nhom_kpi: k.nhom_kpi, ap_dung_cho: [k.pb], loai: k.tinh_toan ? 'tinh_toan' : 'nguon', cong_thuc: k.tinh_toan ? k.tinh_toan.cong_thuc : null, so_thap_phan: k.dp, ap_dung_tu: k.tu || null }; }),
    nhom_kpi: ['Tài chính', 'Khách hàng', 'Quy trình', 'Nguồn lực'],
    kpi_trong_diem: KPI_TRONG_DIEM,
    tu_dien_nhan: TEN_NHAN,
    tu_dien_can_cu: TEN_CAN_CU
  };

  function phongBanKy(p, ky) {
    var recs = kpiCuaPb(p.ma).map(function (k) { return REC[ky][k.ma]; });
    var chuaNop = (PB_CHUA_NOP[ky] || []).indexOf(p.ma) >= 0, tre = (PB_TRE[ky] || {})[p.ma] || 0;
    var dem = demRag(recs), xep = dem.xanh + dem.vang + dem.do;
    var vd = vanDeTheoKy(ky, p.ma);
    var td = { tong: 0, moi: 0, dang_lam: 0, xong: 0, qua_han: 0, huy: 0 };
    vd.forEach(function (x) { td.tong++; td[x.trang_thai]++; });
    td.ty_le_hoan_thanh = td.tong - td.huy ? rd(td.xong / (td.tong - td.huy), 4) : null;
    var tenDo = recs.filter(function (r) { return r.rag.mau === 'do'; }).map(function (r) { return KPI.filter(function (k) { return k.ma === r.ma_kpi; })[0].ten; });
    var thieu = recs.filter(function (r) { return r.trang_thai_du_lieu === 'thieu_du_lieu' || r.trang_thai_du_lieu === 'khong_doc_duoc'; }).length;
    var tomTat = chuaNop ? 'Đơn vị chưa nộp báo cáo kỳ này; chưa có số liệu để đánh giá.'
      : (xep ? 'Đạt ' + dem.xanh + '/' + xep + ' KPI được xếp màu' : 'Chưa có KPI nào đủ dữ liệu để xếp màu')
        + (dem.do ? '; ' + dem.do + ' KPI Đỏ: ' + tenDo.join(', ') : '')
        + (thieu ? '; ' + thieu + ' KPI thiếu hoặc không đọc được số liệu' : '') + '.';
    var cl = [];
    recs.forEach(function (r) {
      var c = KPI.filter(function (k) { return k.ma === r.ma_kpi; })[0];
      if (r.trang_thai_du_lieu === 'thieu_du_lieu') cl.push({ muc: 'thieu', ma_kpi: r.ma_kpi, mo_ta: c.ten + ': thiếu dữ liệu (' + r.ly_do_trang_thai + ')' });
      if (r.trang_thai_du_lieu === 'khong_doc_duoc') cl.push({ muc: 'khong_doc', ma_kpi: r.ma_kpi, mo_ta: c.ten + ': không đọc được (' + r.ly_do_trang_thai + ')' });
      if (r.xac_minh.trang_thai === 'can_xac_minh') cl.push({ muc: 'can_xac_minh', ma_kpi: r.ma_kpi, mo_ta: c.ten + ': cần xác minh (' + (r.xac_minh.ghi_chu || '') + ')' });
      if (r.xac_minh.trang_thai === 'mau_thuan') cl.push({ muc: 'mau_thuan', ma_kpi: r.ma_kpi, mo_ta: c.ten + ': mâu thuẫn nguồn' });
      if (r.rag.rag_tam) cl.push({ muc: 'rag_tam', ma_kpi: r.ma_kpi, mo_ta: c.ten + ': RAG tạm (không có kế hoạch)' });
    });
    return {
      ma_phong_ban: p.ma, ten_chuan: p.ten_chuan, nhom: p.nhom,
      nop: { han_nop: ngayChot(ky), ngay_nop: chuaNop ? null : congNgay(ngayChot(ky), tre ? tre : -Math.floor(rr(0, 3))), trang_thai: chuaNop ? 'chua_nop' : tre ? 'tre' : 'dung_han', so_ngay_tre: tre },
      trang_thai_doc: chuaNop ? { trang_thai: 'thieu', ly_do: 'Chưa nhận được báo cáo' } : (recs.some(function (r) { return r.trang_thai_du_lieu === 'khong_doc_duoc'; }) ? { trang_thai: 'doc_mot_phan', ly_do: 'Một phần nguồn là ảnh scan' } : { trang_thai: 'da_doc', ly_do: null }),
      file_nguon: chuaNop ? [] : [{ ten_file: tenFile(p.ma, ky), dinh_dang: 'xlsx', ma_bam: maBam(p.ma + ky) }],
      tom_tat: tomTat, dem_rag: dem, so_kpi_xep_mau: xep, ty_le_dat: xep ? rd(dem.xanh / xep, 4) : null,
      tinh_trang: chuaNop ? 'xam' : dem.do ? 'do' : dem.vang ? 'vang' : xep ? 'xanh' : 'xam',
      kpi: recs, van_de: vd, tien_do_hanh_dong: td,
      de_xuat: vd.filter(function (x) { return x.can_bod; }).map(function (x) { return { ma: x.ma, noi_dung: x.noi_dung_de_xuat, lien_quan: x.mo_ta, han_can_quyet: congNgay(ngayChot(ky), 10) }; }),
      dac_thu: chuaNop ? [] : dacThu(p.ma, ky),
      chat_luong_du_lieu: cl
    };
  }

  function tongQuan(ky, pbs) {
    var all = [], nop = { tong: pbs.length, dung_han: 0, tre: 0, chua_nop: 0 }, hd = { tong: 0, moi: 0, dang_lam: 0, xong: 0, qua_han: 0, huy: 0 };
    var theoPb = {}, maTran = [], canChuY = [], cl = { thieu: 0, khong_doc: 0, khong_ap_dung: 0, can_xac_minh: 0, mau_thuan: 0, rag_tam: 0 };
    var theoNhom = {}; NHOM.forEach(function (g) { theoNhom[g.ma] = { xanh: 0, vang: 0, do: 0, xam: 0, khong_xep_mau: 0 }; });
    pbs.forEach(function (p) {
      nop[p.nop.trang_thai]++;
      theoPb[p.ma_phong_ban] = { ty_le_dat: p.ty_le_dat, tinh_trang: p.tinh_trang, so_do: p.dem_rag.do, dem_rag: p.dem_rag, nop: p.nop.trang_thai };
      ['tong', 'moi', 'dang_lam', 'xong', 'qua_han', 'huy'].forEach(function (k) { hd[k] += p.tien_do_hanh_dong[k]; });
      maTran.push({ ma_phong_ban: p.ma_phong_ban, o: p.kpi.map(function (r) { return { ma_kpi: r.ma_kpi, mau: r.rag.mau, gia_tri: giaTri(r), trang_thai_du_lieu: r.trang_thai_du_lieu, ty_le_dat: r.ty_le_dat.gia_tri, vang_lien_tiep: r.rag.vang_lien_tiep, xac_minh: r.xac_minh.trang_thai }; }) });
      p.kpi.forEach(function (r) {
        all.push(r); theoNhom[p.nhom][r.rag.mau]++;
        if (r.trang_thai_du_lieu === 'thieu_du_lieu') cl.thieu++;
        if (r.trang_thai_du_lieu === 'khong_doc_duoc') cl.khong_doc++;
        if (r.trang_thai_du_lieu === 'khong_ap_dung') cl.khong_ap_dung++;
        if (r.xac_minh.trang_thai === 'can_xac_minh') cl.can_xac_minh++;
        if (r.xac_minh.trang_thai === 'mau_thuan') cl.mau_thuan++;
        if (r.rag.rag_tam) cl.rag_tam++;
        if (r.rag.mau === 'do') {
          var c = KPI.filter(function (k) { return k.ma === r.ma_kpi; })[0];
          canChuY.push({ loai: 'kpi_do', ma_phong_ban: p.ma_phong_ban, ma_kpi: r.ma_kpi, mo_ta: c.ten + ' ' + (r.rag.vang_lien_tiep ? '· cảnh báo kéo dài' : r.ty_le_dat.gia_tri !== null ? '· đạt ' + soVN(rd(r.ty_le_dat.gia_tri * 100, 1), 1) + '% kế hoạch' : '· ' + (r.ty_le_dat.ly_do || 'không đạt')), han: null, _s: r.ty_le_dat.gia_tri === null ? 0.5 : r.ty_le_dat.gia_tri });
        }
      });
      p.van_de.forEach(function (v) {
        if (v.trang_thai === 'qua_han') canChuY.push({ loai: 'qua_han', ma_phong_ban: p.ma_phong_ban, ma_kpi: v.ma_kpi, mo_ta: 'Hành động quá hạn: ' + (v.hanh_dong || v.mo_ta), han: v.han, _s: 2 });
        if (v.can_bod) canChuY.push({ loai: 'can_bod', ma_phong_ban: p.ma_phong_ban, ma_kpi: v.ma_kpi, mo_ta: v.noi_dung_de_xuat, han: congNgay(ngayChot(ky), 10), _s: 3 });
      });
      if (p.nop.trang_thai === 'chua_nop') canChuY.push({ loai: 'chua_nop', ma_phong_ban: p.ma_phong_ban, ma_kpi: null, mo_ta: 'Chưa nộp báo cáo kỳ này', han: p.nop.han_nop, _s: 1 });
    });
    canChuY.sort(function (a, b) { return a._s - b._s; });
    canChuY.forEach(function (x) { delete x._s; });
    var dem = demRag(all), xep = dem.xanh + dem.vang + dem.do;
    hd.ty_le_hoan_thanh = hd.tong - hd.huy ? rd(hd.xong / (hd.tong - hd.huy), 4) : null;
    var apDung = all.filter(function (r) { return r.trang_thai_du_lieu !== 'khong_ap_dung'; }).length;
    return {
      nop: nop, dem_rag: dem, theo_nhom: theoNhom,
      kpi: { tong: all.length, ap_dung: apDung, co_du_lieu: all.filter(function (r) { return r.trang_thai_du_lieu === 'co_gia_tri'; }).length, xep_mau: xep, ty_le_dat: xep ? rd(dem.xanh / xep, 4) : null },
      hanh_dong: hd, phong_ban: theoPb, ma_tran: maTran, can_chu_y: canChuY, chat_luong: Object.assign(cl, { chua_nop: nop.chua_nop, tre: nop.tre })
    };
  }

  var DATASETS = {};
  KY.forEach(function (ky) {
    var pbs = PB.map(function (p) { return phongBanKy(p, ky); });
    DATASETS[ky] = {
      schema_version: '1.1.0', moi_truong: 'demo', nguon_du_lieu: 'synthetic', ky_bao_cao: ky,
      lan_chay: { ma: 'run-01', ngay_tao: ngayChot(ky) + 'T09:00:00+07:00', ngay_chot_so_lieu: ngayChot(ky), phien_ban_pipeline: 'mock-0.1', thay_the_cho: null, ly_do_dieu_chinh: null, bo_sinh_synthetic: { ten: 'mock-generator.js', phien_ban: '0.1', seed: SEED } },
      phat_hanh: phatHanh(ky), danh_muc: DANH_MUC, tong_quan: tongQuan(ky, pbs), phong_ban: pbs
    };
  });

  global.MockPipeline = {
    cau_hinh: { moi_truong: 'demo', schema_ho_tro: ['1.1'], nguong_xu_huong: 3, ky_cho_bo_sung: KY_CHO_BO_SUNG, tu_dien_nhan: TEN_NHAN },
    ky: KY.slice(),
    datasets: DATASETS,
    nhanKy: nhanKy
  };
})(window);
