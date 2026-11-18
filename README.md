# report-dashboard (DEMO)

Bản demo giao diện **dashboard báo cáo KPI theo phòng ban**: tab Tổng quan, tab từng phòng ban, lịch sử các kỳ, ngăn chi tiết KPI.

> **Toàn bộ dữ liệu là GIẢ LẬP.** Công ty, phòng ban, KPI, dự án, người phụ trách và số liệu đều được sinh bởi
> `js/mock-generator.js` với seed cố định; không lấy từ báo cáo của bất kỳ tổ chức nào.
> Màu trạng thái (Xanh/Vàng/Đỏ/Xám) được **gán theo kịch bản minh hoạ**, không phải quy tắc xếp màu thật.

## Xem demo
- Online: GitHub Pages của repo này.
- Trên máy: mở thư mục bằng một web server tĩnh bất kỳ rồi truy cập `index.html`.

## Cấu trúc
| File | Vai trò |
| --- | --- |
| `index.html`, `css/styles.css` | Khung giao diện |
| `js/mock-generator.js` | Sinh dữ liệu giả lập (đóng vai trò pipeline: mọi tỷ lệ, màu, tổng hợp được tạo ở đây) |
| `js/data-provider.js` | Lớp truy xuất dữ liệu; có thể thay bằng nguồn file JSON hoặc API mà không sửa giao diện |
| `js/charts.js` | Biểu đồ SVG tạm cho bản demo |
| `js/app.js` | Giao diện: chỉ hiển thị, lọc, sắp xếp; không tự tính KPI hay màu trạng thái |

## Ghi chú
- Không dùng CDN, không tải tài nguyên ngoài, không có mã theo dõi.
- Biểu đồ sẽ được thay bằng Chart.js (lưu trong repo) ở phiên bản sau.
