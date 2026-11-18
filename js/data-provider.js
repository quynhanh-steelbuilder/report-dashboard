/*
 * LỚP TRUY XUẤT DỮ LIỆU (Data Provider) – bản demo dùng MockProvider.
 * Giao diện chỉ gọi các hàm dưới đây. Có thể thay MockProvider bằng FileProvider (đọc JSON qua HTTP)
 * hoặc ApiProvider (gọi /api/v1/...) mà giao diện không phải sửa.
 * Provider chỉ TRẢ dữ liệu đã tính sẵn; không tính KPI, % đạt hay RAG.
 */
(function (global) {
  'use strict';
  var M = global.MockPipeline;
  function tra(v) { return new Promise(function (res) { setTimeout(function () { res(JSON.parse(JSON.stringify(v))); }, 80); }); }
  function loi(ma, chiTiet) { return Promise.reject({ ma: ma, chi_tiet: chiTiet }); }
  function ds(ky) { return M.datasets[ky]; }

  global.DataProvider = {
    loai: 'mock',
    getCauHinh: function () { return tra(M.cau_hinh); },
    getDanhSachKy: function () {
      return tra(M.ky.map(function (ky) {
        var d = ds(ky), t = d.tong_quan;
        return { ky: ky, ngay_chot: d.lan_chay.ngay_chot_so_lieu, phat_hanh: d.phat_hanh,
          tom_tat: { nop_dung_han: t.nop.dung_han, tong_pb: t.nop.tong, tre: t.nop.tre, chua_nop: t.nop.chua_nop, dem_rag: t.dem_rag, ty_le_dat: t.kpi.ty_le_dat, hanh_dong_qua_han: t.hanh_dong.qua_han } };
      }));
    },
    getDanhMuc: function (ky) { var d = ds(ky); return d ? tra(d.danh_muc) : loi('khong_tim_thay', ky); },
    getTongQuan: function (ky) {
      var d = ds(ky); if (!d) return loi('khong_tim_thay', ky);
      return tra({ moi_truong: d.moi_truong, schema_version: d.schema_version, ky_bao_cao: ky, ngay_chot: d.lan_chay.ngay_chot_so_lieu, phat_hanh: d.phat_hanh, tong_quan: d.tong_quan });
    },
    getPhongBan: function (ky, ma) {
      var d = ds(ky); if (!d) return loi('khong_tim_thay', ky);
      var p = d.phong_ban.filter(function (x) { return x.ma_phong_ban === ma; })[0];
      return p ? tra(p) : loi('khong_tim_thay', ma);
    },
    getChuoiKpi: function (ma, kpi, tuKy, denKy) {
      var out = M.ky.filter(function (ky) { return (!tuKy || ky >= tuKy) && (!denKy || ky <= denKy); }).map(function (ky) {
        var p = ds(ky).phong_ban.filter(function (x) { return x.ma_phong_ban === ma; })[0];
        var r = p && p.kpi.filter(function (x) { return x.ma_kpi === kpi; })[0];
        if (!r) return { ky: ky, trang_thai_du_lieu: 'khong_ap_dung', gia_tri: null, ke_hoach: null, rag: null, xac_minh: null };
        var v = r.loai_du_lieu === 'tinh_toan' ? r.tinh_toan.gia_tri : (r.gia_tri_chuan_hoa ? r.gia_tri_chuan_hoa.gia_tri : null);
        return { ky: ky, trang_thai_du_lieu: r.trang_thai_du_lieu, gia_tri: v === undefined ? null : v, ke_hoach: r.ke_hoach.gia_tri, ty_le_dat: r.ty_le_dat.gia_tri, rag: r.rag.mau, xac_minh: r.xac_minh.trang_thai };
      });
      return tra(out);
    },
    getThongTinPhatHanh: function (ky) { var d = ds(ky); return d ? tra({ ky: ky, phat_hanh: d.phat_hanh, lan_chay: d.lan_chay }) : loi('khong_tim_thay', ky); }
  };
})(window);
