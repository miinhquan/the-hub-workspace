# The Hub Workspace — bản gọn, 05/11/2026

## Những gì thay đổi

- Bỏ Tour Library, Operators và POS Import khỏi menu More và giao diện.
- Bỏ chọn tour/nhà tour từ danh mục: nhập tên tour hoặc nội dung dịch vụ trực tiếp. Tên nhà tour là ghi chú tuỳ chọn ở Inquiry/Booking.
- Booked vẫn cần tên khách và ghi nhận xác nhận của nhà tour. Không cần tạo tài khoản/danh bạ nhà tour trước.
- No Slot không tạo Booking hoặc giao dịch thu tiền; đóng lượt hỏi nhà tour và giữ Inquiry để tìm phương án khác. Cancel giữ lịch sử yêu cầu.
- Không thu thập hoặc cộng số POS vào báo cáo Workspace. File POS dùng riêng trong chat kế toán.
- Giữ Inbox WhatsApp chỉ nhận tin, Booked/No Slot/Cancel, Payments, Record a sale, Expenses, Analytics, Archive/Restore, Activity Log, Documents, admin/staff, dark mode, privacy/data-deletion.
- Export vẫn phải có Electricity, Water (cho nhập 0 nếu đúng thực tế) và Submit monthly expense review. Chi phí đại lý/nhà tour nằm ngoài báo cáo; không coi net cash flow là lợi nhuận đã trừ tiền đại lý.
- Không xoá dữ liệu lịch sử trong database. ID tour/nhà tour cũ được dùng để đọc lại tên khi cần. Không có migration mới.

## Cách sử dụng hằng ngày

1. Khách nhắn WhatsApp → mở Inbox → mở Inquiry của khách. Việc nhận tin chỉ hoạt động khi cấu hình Meta/Worker của bạn đã hoàn tất.
2. Ghi tên tour/dịch vụ, ngày đi, số khách. Nếu cần tra tour: Copy context for ChatGPT, dán vào chat tra cứu tour và đính kèm PDF ở chat đó.
3. Liên hệ nhà tour qua WhatsApp/Zalo như hiện tại. Có thể nhập tên nhà tour trực tiếp, không có danh bạ Operators.
4. Nhà tour xác nhận: điền Confirmation/note, bấm Booked. Sau đó mở Booking → Edit details bổ sung giá bán và thông tin còn thiếu.
5. Nhận tiền: chọn Record payment/refund → Cash hoặc Online → số tiền → Mark as paid. Khách lẻ không có booking: dùng Record a sale. Chỉ ghi một lần cho cùng khoản thu.
6. Cuối tháng điền tiền điện/nước và chi phí cửa hàng → Submit monthly expense review → Finance → chọn tháng và tiền tệ → Export Excel. Không cộng VND và USD với nhau.
7. File POS xuất riêng; đính kèm trong chat kế toán cùng báo cáo Workspace khi cần tính tổng. Không nhập lại các giao dịch POS thành Record a sale nếu chúng đã được ghi ở POS để cộng tổng sau.

## Cập nhật ws.thehub.express

Bản Sites đã cập nhật không tự cập nhật Worker Cloudflare của bạn. Làm trên source đã deploy thành công, giữ nguyên các thiết lập đang dùng.

### 1. Chuẩn bị

- Giữ một bản sao thư mục source hiện tại và phiên bản deployment đang chạy để có thể quay lại.
- Không chép secrets ra file source. Không tạo Worker/database mới, không reset D1.
- Nếu muốn backup dữ liệu đầy đủ: dùng D1 export của Cloudflare; backup JSON trong giao diện chỉ có CRM records/events, không chứa toàn bộ WhatsApp hoặc file R2.

### 2. Chép bản cập nhật

Gói UPDATE nhỏ gồm đúng các file thay đổi và hướng dẫn. Giải nén ra một thư mục riêng. Copy các thư mục app, lib, tests và docs vào thư mục source hiện tại (thư mục có package.json) và chọn Replace khi được hỏi. Các thư mục được gộp; không xoá thư mục app/lib cũ trước khi chép.

Gói UPDATE không chứa cấu hình Worker, D1, R2, secrets, migrations hay file lock. Do đó không đè cấu hình riêng của bạn. Gói source đầy đủ cũng có sẵn nếu cần tham khảo; không lấy wrangler.example.jsonc có placeholder thay cấu hình thực tế.

Nếu cập nhật qua GitHub: upload đúng các file trong UPDATE vào repo Worker hiện tại, giữ nguyên cấu trúc thư mục (không upload thư mục UPDATE như một lớp bên ngoài), commit và chờ Cloudflare build/deploy theo pipeline đang chạy.

### 3. Build và deploy bằng CLI nếu bạn đang dùng CLI

Mở Terminal/PowerShell trong thư mục source đang dùng. Chạy tuần tự:

```
pnpm exec tsc --noEmit
pnpm test
node tests/workspace-simple.test.mjs
pnpm build
```

Nếu chưa có node_modules, chạy `pnpm install --frozen-lockfile` trước. UPDATE không thay dependency. Bộ test mới được chạy riêng ở dòng thứ ba để hoạt động cả khi package.json cũ chưa có script mới.

Sau đó dùng đúng file cấu hình Worker mà bạn đã dùng lần deploy thành công. Ví dụ, CHỈ khi file đó thực tế là deploy/wrangler.jsonc:

```
pnpm exec wrangler deploy --config deploy/wrangler.jsonc
```

Nếu file cấu hình của bạn có tên khác, thay đường dẫn trong lệnh bằng tên thật. Giữ nguyên name, database_id, DB, BUCKET, vars, secrets, domain ws.thehub.express và cron hiện tại. Không chạy migration/reset database cho bản cập nhật này.

Nếu bạn đang dùng Cloudflare Git build tự động, push/commit source là đủ để pipeline đang cấu hình chạy. Không kéo thả ZIP source vào mục upload tài sản tĩnh.

### 4. Kiểm tra sau cập nhật

- Mở ws.thehub.express và Ctrl+Shift+R.
- More không còn Tour Library, Operators, POS Import.
- Tạo một Inquiry khi có yêu cầu thật: nhập tour trực tiếp, không cần danh mục có sẵn. Không ghi nhận thanh toán giả để thử trên dữ liệu kinh doanh.
- Booked yêu cầu ghi chú xác nhận; No Slot/Cancel không sinh giao dịch thu tiền.
- Thử xem một hồ sơ cũ: tên tour/nhà tour còn đọc được và lịch sử vẫn có.
- Inbox nhận tin như trước. Không cần đổi callback webhook, Verify Token, App Secret hoặc đăng ký lại số.
- /privacy và /data-deletion vẫn mở công khai; API dữ liệu vẫn yêu cầu đăng nhập.

### 5. Nếu cần quay về bản trước

Vào Worker hiện tại → Deployments → chọn deployment thành công trước đó và chức năng rollback mà Cloudflare cung cấp. Đây chỉ là đổi phiên bản code; không xoá D1/R2. Không tạo database mới để khắc phục lỗi giao diện.

## Kiểm thử của bản này

Kiểm tra TypeScript, bộ test auth/CRM/WhatsApp và build production. Test mới chạy route thật và SQL thật trên SQLite tách biệt: nhập tên tour/nhà tour khi không có danh mục, Booked tạo đúng một Booking, chống xác nhận trùng, payment, No Slot/Cancel, Archive/Restore, từ chối ghi vào module đã bỏ, đọc dữ liệu cũ, POS không vào ledger, request nhà tour nhập tay, từ chối người chưa đăng nhập. Meta trong test là mock, không nhắn khách hoặc thay đổi tài khoản thật. Cấu hình và tin thực tế trên Cloudflare của bạn cần kiểm tra sau khi bạn deploy.
