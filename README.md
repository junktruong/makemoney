# MAKE MONEY 2.0 — Personal Wishlist & Savings Tracker PWA

Ứng dụng di động ưu tiên di động (Mobile-First Progressive Web App) giúp người dùng quản lý các nguyện vọng mua sắm, theo dõi thu nhập hàng ngày, tích lũy tiền và đạt được các mục tiêu tài chính đúng kỳ hạn.

Ứng dụng được thiết kế theo kiến trúc **Offline-First**, hoạt động mượt mà ngay cả khi không có kết nối Internet, hỗ trợ lưu trữ hình ảnh sản phẩm đa tầng (IndexedDB Blob trên máy + MongoDB GridFS trên đám mây), và tính toán tài chính bằng số nguyên chuẩn VND.

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Tổng quan tài chính (Dashboard)**:
   - Thẻ hiển thị tổng tiền tiết kiệm, tổng thu nhập, tổng tích lũy, số dư chưa phân bổ và tiến độ mục tiêu.
   - Thẻ nhắc nhở cuối ngày: *"Hôm nay bạn tiết kiệm được bao nhiêu?"* với thao tác nhập liệu dưới 10 giây.
   - Các nút hành động nhanh: `+ Ghi thu nhập`, `+ Thêm tiền tiết kiệm`, `+ Thêm nguyện vọng`.
   - Danh sách nguyện vọng ưu tiên hiển thị kèm ảnh thumbnail và thanh tiến độ.

2. **Quản lý nguyện vọng & Hình ảnh (Wishlist & Image Gallery)**:
   - Thêm/sửa/xóa/lưu trữ và đánh dấu món đồ đã mua kèm hiệu ứng pháo hoa chúc mừng.
   - Tải nhiều hình ảnh từ máy hoặc chụp trực tiếp từ camera điện thoại.
   - **Offline Image Storage**: Ảnh được nén tự động trên trình duyệt, tạo thumbnail 240x240 và lưu dạng Blob vào IndexedDB (Dexie.js), hiển thị ngay lập tức và tồn tại qua các lần F5 mà không cần Internet.
   - **MongoDB GridFS Sync**: Khi có mạng, hàng đợi tự động đẩy ảnh lên MongoDB GridFS để lưu trữ vĩnh viễn trên server mà không lưu Base64 trong MongoDB document.
   - Gallery xem ảnh lớn, dải thumbnail ngang và chế độ phóng to toàn màn hình (Lightbox).

3. **Ghi nhận thu nhập & Tiết kiệm hàng ngày**:
   - Tách biệt rõ ràng giữa Thu nhập (Income) và Tiết kiệm (Savings Contribution).
   - Tự động tính số tiền chi tiêu cá nhân còn lại.
   - Ghi nhận nhanh các nguồn thu (Lương, Thưởng, Freelance, Bán hàng...).

4. **Sổ cái tài chính & Phân bổ tiền (Savings Ledger & Allocation)**:
   - Sổ cái (`SavingsTransaction`) là nguồn chân lý duy nhất (Single Source of Truth).
   - Quy tắc chặt chẽ: không cho phép phân bổ vượt quá số dư có sẵn, không có số dư âm, không trùng lặp giao dịch (Idempotency Key).
   - Cho phép phân bổ tiền từ quỹ chung vào món đồ mong muốn hoặc điều chuyển giữa các mục tiêu.

5. **Kế hoạch mục tiêu (Goal Planner)**:
   - Tính toán số ngày còn lại, số tiền còn thiếu.
   - Tính số tiền cần tiết kiệm mỗi ngày (`remainingAmount / remainingDays`) và mỗi tuần.
   - So sánh với tốc độ tiết kiệm thực tế 7 ngày & 30 ngày gần nhất để cảnh báo *Đúng tiến độ*, *Vượt tiến độ*, hoặc *Chậm tiến độ (cần tiết kiệm thêm bao nhiêu/ngày)*.

6. **Lịch sử & Lịch tháng (Calendar)**:
   - Giao diện lịch trực quan với các chấm trạng thái đánh dấu ngày có thu nhập (xanh lá) và ngày có tiết kiệm (xanh mòng két).
   - Nhấn vào từng ngày để xem chi tiết các giao dịch và ghi chú.
   - Sổ giao dịch Ledger có bộ lọc theo loại giao dịch.

7. **Cài đặt & Quản lý bộ nhớ**:
   - Chuyển đổi giao diện Sáng (Light) / Tối (Dark) / Hệ thống (System).
   - Bảng điều khiển dung lượng ảnh: thống kê số ảnh trong máy, dung lượng MB/KB, số ảnh chờ tải lên, số ảnh đã đồng bộ.
   - Nút dọn dẹp bộ nhớ tạm an toàn (chỉ dọn ảnh đã có trên Cloud, bảo vệ ảnh chưa đồng bộ).
   - Xuất dữ liệu ra file Excel (CSV) và xuất/nhập file sao lưu toàn diện (JSON).

8. **PWA — Cài đặt trên điện thoại**:
   - Cài đặt như ứng dụng gốc trên cả iOS và Android.
   - Service Worker (`sw.js`) lưu cache app shell và hoạt động ngoại tuyến hoàn toàn.
   - Giao diện full-screen, không thanh địa chỉ, hỗ trợ safe-area cho tai thỏ iPhone.

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

- **Frontend**: Next.js App Router (Turbopack), TypeScript, React 19, Tailwind CSS.
- **Icons**: Lucide Icons.
- **State Management**: Zustand.
- **Offline Database**: Dexie.js (IndexedDB).
- **Backend**: Next.js Route Handlers.
- **Database**: MongoDB Atlas & Mongoose.
- **File Storage**: MongoDB GridFS Bucket (`make_money_images`).
- **Validation**: Zod.
- **Testing**: Vitest.
- **PWA**: Web App Manifest, Service Worker.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### 1. Cài đặt thư viện
```bash
pnpm install
```

### 2. Cấu hình biến môi trường
Tạo file `.env.local`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/makemoney?retryWrites=true&w=majority
```
> **Lưu ý**: Nếu chưa cấu hình `MONGODB_URI`, ứng dụng vẫn hoạt động 100% đầy đủ chức năng ở chế độ Offline-First nhờ cơ sở dữ liệu IndexedDB trên thiết bị!

### 3. Khởi chạy môi trường phát triển (Dev)
```bash
pnpm dev
```
Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

### 4. Chạy kiểm thử (Unit Test)
```bash
pnpm test
```

### 5. Build bản Production
```bash
pnpm build
pnpm start
```

---

## 📱 HƯỚNG DẪN CÀI ĐẶT PWA LÊN ĐIỆN THOẠI

### Trên iPhone / iPad (Safari):
1. Mở ứng dụng trong trình duyệt **Safari**.
2. Nhấn vào biểu tượng **Chia sẻ (Share)** ở thanh công cụ dưới màn hình.
3. Cuộn xuống chọn **Thêm vào màn hình chính (Add to Home Screen)**.
4. Nhấn **Thêm (Add)** ở góc trên bên phải. Biểu tượng Make Money sẽ xuất hiện trên màn hình điện thoại như ứng dụng tải từ App Store.

### Trên điện thoại Android (Chrome):
1. Mở ứng dụng bằng **Google Chrome**.
2. Nhấn vào thông báo *"Thêm Make Money vào màn hình chính"* hoặc nhấn menu 3 chấm góc phải và chọn *"Cài đặt ứng dụng"*.
3. Xác nhận cài đặt.

---

## 📂 KIẾN TRÚC DỮ LIỆU & API

### RESTful APIs:
- `GET /api/dashboard`: Tải dữ liệu tổng hợp cho màn hình chính trong 1 round-trip.
- `GET, POST /api/wishlist`: Lấy danh sách hoặc tạo nguyện vọng mới.
- `PATCH, DELETE /api/wishlist/[id]`: Cập nhật hoặc xóa nguyện vọng.
- `GET, POST /api/records`: Quản lý nhật ký thu nhập/tiết kiệm hàng ngày.
- `PATCH, DELETE /api/records/[id]`: Chỉnh sửa hoặc xóa bản ghi ngày.
- `GET /api/savings/summary`: Tính toán tóm tắt số dư và tiến độ sổ cái.
- `GET /api/savings/transactions`: Danh sách lịch sử giao dịch.
- `POST /api/savings/contribute`: Đóng góp tiền vào quỹ tiết kiệm chung.
- `POST /api/savings/allocate`: Phân bổ tiền từ quỹ chung vào nguyện vọng.
- `POST /api/savings/reallocate`: Điều chuyển tiền giữa các mục tiêu.
- `POST /api/images/upload`: Tải ảnh lên MongoDB GridFS.
- `GET /api/images/[id]`: Stream ảnh từ GridFS với HTTP Cache headers.
- `GET /api/images/[id]/thumbnail`: Stream ảnh thu nhỏ từ GridFS.
- `DELETE /api/images/[id]`: Xóa file ảnh khỏi GridFS.
- `POST /api/sync/push`: Đẩy thay đổi từ IndexedDB lên MongoDB Atlas.
- `GET /api/sync/pull`: Kéo các thay đổi mới từ MongoDB Atlas về thiết bị.
- `GET /api/export`: Xuất dữ liệu ra file CSV hoặc JSON.

---

## 🔒 AN TOÀN & BẢO MẬT DỮ LIỆU
- **Idempotency**: Mọi giao dịch tài chính và đồng bộ đều mang `idempotencyKey` duy nhất, ngăn ngừa hoàn toàn tình trạng ghi đè hoặc cộng dồn 2 lần do mạng chập chờn.
- **Không lưu Base64 trong MongoDB**: Tránh làm phình database và chậm queries; ảnh được quản lý qua GridFS chunks và streams.
- **An toàn ngoại tuyến**: Ứng dụng không bao giờ âm thầm xóa hay làm mất các bản ghi tài chính chưa đồng bộ khi dọn dẹp cache.
# makemoney
# makemoney
