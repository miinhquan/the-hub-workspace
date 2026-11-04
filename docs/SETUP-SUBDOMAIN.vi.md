# Đưa The Hub Workspace lên workspace.thehub.express

## Subdomain có miễn phí không?

Bạn đã sở hữu thehub.express thì không cần mua thêm tên miền workspace.thehub.express. Tạo tên miền con/bản ghi DNS trên Cloudflare không mất thêm phí đăng ký tên miền. Vẫn cần gia hạn tên miền chính; hosting, database, lưu file và Access phụ thuộc gói/hạn mức sử dụng. Không mặc định mọi dịch vụ đều miễn phí hoặc tự bật gói trả tiền.

Workspace là app có backend và dữ liệu riêng. Website khách hàng và email domain không cần chuyển đổi.

## A. Chuẩn bị một lần

1. Chọn `workspace.thehub.express` (hoặc `admin.thehub.express`). Tạo Worker mới tên `the-hub-workspace`, tách với Worker `bob` của website công khai.
2. Trong Cloudflare, tạo D1 database `the-hub-workspace`; ghi lại Database ID. Tạo R2 bucket `the-hub-workspace-documents`, giữ bucket riêng tư. Nếu Cloudflare yêu cầu kích hoạt dịch vụ/cước, kiểm tra điều kiện trước khi đồng ý.
3. Vào Zero Trust → Access → Applications → Add application → Self-hosted. Đặt hostname `workspace.thehub.express`. Tạo policy Allow chỉ email của bạn; bật cách đăng nhập phù hợp (ví dụ email OTP hoặc Google). Không chọn Everyone/Bypass. Sao chép Team domain và Application AUD.
4. Cài Node.js >=22.13, pnpm và Wrangler từ nguồn chính thức. Giải nén source. Chạy `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build`.
5. Sao chép `deploy/wrangler.example.jsonc` thành `deploy/wrangler.jsonc`. Điền Database ID, tên bucket, Team domain dạng `ten-team.cloudflareaccess.com` (không https), Application AUD và OWNER_EMAIL. Đây là cấu hình nhận diện; không đưa token quản trị Cloudflare vào source.
6. Đăng nhập CLI bằng `pnpm exec wrangler login`. Tài khoản Cloudflare phải có quyền với Worker, D1 và R2 của bạn.

## B. Triển khai app

Chạy từ thư mục source:

```
pnpm exec wrangler d1 migrations apply DB --remote --config deploy/wrangler.jsonc
pnpm exec wrangler deploy --config deploy/wrangler.jsonc
```

Kiểm tra kỹ tài khoản/database đích trước lệnh migration. Bộ source lần đầu có migration tạo bảng; những lần sau giữ migration cũ và thêm migration mới khi đổi schema.

App kiểm tra chữ ký JWT của Cloudflare Access, issuer, thời hạn, AUD và email. Nếu chưa cấu hình đúng, API từ chối phục vụ dữ liệu. `workers.dev` và preview URL bị tắt trong mẫu để hạn chế đường truy cập ngoài hostname chính.

## C. Gắn subdomain

1. Cloudflare → Workers & Pages → chọn Worker `the-hub-workspace` vừa deploy.
2. Settings → Domains & Routes → Add → Custom Domain.
3. Nhập `workspace.thehub.express` → Add. Cloudflare tự tạo bản ghi DNS phù hợp và cấp chứng chỉ HTTPS. Nếu tên đó đã có bản ghi trùng, xem và xử lý đúng bản ghi của tên con đó.
4. Đợi chứng chỉ Active rồi mở https://workspace.thehub.express và đăng nhập bằng email được Allow.
5. Mở cửa sổ ẩn danh/đăng xuất kiểm tra: người chưa được phép không đọc được record hoặc download file. Thử tạo inquiry, tải lại trang, tạo operator request rồi xác nhận, ghi thanh toán thử và xuất Excel.
6. Kiểm tra Worker → Settings → Triggers: cron `*/5 * * * *` đã có. Mã nguồn có scheduled handler; khi cron chạy, inquiry đủ 48 giờ không hoạt động được archive mềm. Xem Worker logs nếu job lỗi.

Không cần đổi nameserver lần nữa. Không thay bản ghi MX/SPF/DKIM/DMARC và không sửa route của Worker bob để tạo subdomain này.

## D. Những lần sửa sau

Sửa source → chạy test/typecheck/build → migration nếu có → deploy lại Worker cũ. Dữ liệu D1/R2 không nằm trong file ZIP và không bị thay bằng source khi cập nhật giao diện. Giữ nguyên binding/database/bucket để dùng tiếp dữ liệu.

Bản private Site hiện tại có database riêng. Đưa code sang Cloudflare của bạn không tự mang record hoặc file đã nhập theo. Nếu muốn chuyển dữ liệu, cần bước xuất/nhập D1 và sao chép R2 riêng. Bản này chưa có nút restore JSON.

## Tài liệu chính thức

- Custom Domain: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- Cloudflare Access: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/
- D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
- Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
