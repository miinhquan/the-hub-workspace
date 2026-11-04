# The Hub Workspace — WhatsApp chỉ nhận tin (04/11/2026)

## Phạm vi đã chốt

Dashboard nhận tin, hiển thị hội thoại, số chưa đọc và Inquiry. Bấm Open WhatsApp để trả lời bằng ứng dụng WhatsApp. Không có ô soạn/nút gửi trên Workspace; action send trả 410 và helper Graph chặn mọi method ghi. Không có AI tự trả lời.

Nếu Meta cung cấp smb_message_echoes qua Coexistence, câu trả lời gửi từ Business app sẽ được lưu ở chiều outbound cùng hội thoại. Không đảm bảo mọi thiết bị liên kết đều cung cấp echo; cần test cấu hình thực tế. Không xóa, unregister, migrate số, disconnect thiết bị hoặc tự thay đổi tài khoản Meta.

## Trạng thái kiểm thử

- Đã chạy TypeScript, production build và bộ test CRM/auth/webhook/chat bằng SQLite thật.
- Test bao gồm verify token, HMAC, chống trùng WAMID, tạo khách/Inquiry, nối yêu cầu đang xử lý, Restore, đóng rồi tạo yêu cầu mới, bỏ qua history/contact sync, echo/media, unread/read, trạng thái trễ/trùng, stream, chặn truy cập không đăng nhập, chặn gửi kể cả có token, và không tạo dữ liệu thu–chi.
- Meta trong test là HTTP mock. Chưa nhận webhook số thật hoặc xác nhận Coexistence. Không đưa khách demo vào production.
- Browser preview hiện báo connection refused: chưa xác nhận tương tác chat bằng browser lần này.
- Còn thiếu **META_APP_SECRET** trong runtime để nhận POST webhook thật. Access Token **không bắt buộc cho nhận tin**; chỉ cần nếu muốn chạy nút kiểm tra cấu hình Meta.

## 1. Biến môi trường

| Biến | Giá trị / yêu cầu |
| --- | --- |
| META_APP_SECRET | Bắt buộc: App Secret của đúng Meta App đăng ký webhook, lưu dưới dạng Secret |
| WHATSAPP_VERIFY_TOKEN | Bắt buộc: đúng verify token bạn đã chọn; đã cấu hình bí mật riêng trên Site |
| WHATSAPP_PHONE_NUMBER_ID | 1419832964551265 |
| WHATSAPP_BUSINESS_ACCOUNT_ID | 1101695832558898 |
| WHATSAPP_ACCESS_TOKEN | Không bắt buộc. Chỉ dùng cho GET kiểm tra phone/WABA/Coexistence; cần quyền đọc whatsapp_business_management phù hợp |
| WHATSAPP_GRAPH_VERSION | v25.0: ứng viên cho kiểm tra GET, không dùng gửi tin; cần đối chiếu lại nếu bật kiểm tra Meta |
| INITIAL_ADMIN_HASH | Giữ nguyên secret đăng nhập hiện có khi cập nhật |

Có fallback WHATSAPP_APP_SECRET cho cấu hình cũ, nhưng nên đặt META_APP_SECRET cho bản mới. Không đưa token/App Secret vào frontend, repo hoặc log. `deploy/whatsapp.env.example` không chứa bí mật.

Nhận webhook là Meta gọi vào Workspace, không cần Workspace gọi Graph API để lấy tin. Phiên bản webhook do bạn chọn trong Meta App; giữ phiên bản đang test được nếu chưa đối chiếu xong. Trang lifecycle/Coexistence chính thức của Meta trả HTTP 429 khi kiểm tra ngày 04/11/2026, nên chưa chứng nhận phiên bản Graph mới bằng kết nối thật. Kiểm tra GET tùy chọn sẽ so header facebook-api-version với cấu hình và chỉ ghi verified nếu khớp; không suy đoán khi thiếu header.

## 2. Các bước cấu hình webhook

1. Đặt META_APP_SECRET vào Secrets runtime của Site hiện có hoặc Worker CRM của bạn. Sau khi sửa runtime của Site GPT, deploy lại phiên bản đã lưu để áp dụng cấu hình.
2. Mở đúng Meta App đã test gửi tin > WhatsApp > Configuration / Webhooks.
3. Callback hiện tại: `https://the-hub-private-workspace.bob9697.chatgpt.site/api/webhooks/whatsapp`.
4. Nhập verify token đúng giá trị bạn đã đặt rồi Verify and Save. GET hợp lệ trả nguyên hub.challenge; token sai trả 403.
5. Subscribe trường **messages** của đối tượng whatsapp_business_account. Kiểm tra App đã được subscribe đúng WABA. Trường messages mang tin đến và các status Meta cung cấp.
6. Nếu đã bật Coexistence, đăng ký thêm **smb_message_echoes** theo luồng onboarding hiện tại để nhận tin quán trả lời từ app. Không gỡ số ra rồi đăng ký lại để thử.
7. Dùng một số test nhắn vào số quán, mở Inbox trên Workspace. Tin đầu tạo một khách và một Inquiry; tin sau nối vào yêu cầu đang xử lý.
8. Trả lời trên Business app: kiểm tra echo vào đúng hội thoại. Nếu không có echo, vẫn nhận tin khách qua messages nhưng không thể kết luận câu trả lời app đã được đồng bộ.
9. Khi chuyển sang crm.thehub.express, thay callback thành `https://crm.thehub.express/api/webhooks/whatsapp` sau khi Worker mới/HTTPS/migration đã sẵn sàng. Giữ nguyên số và app.

Không bắt buộc bật access token hay chạy Check Meta connection để bắt đầu nhận tin. Nếu có token, nút này chỉ dùng GET để kiểm tra số thuộc WABA và các field is_on_biz_app/platform_type. Chỉ ghi “verified by Meta” nếu Meta trả true/CLOUD_API; thiếu field/quyền thì để not verified.

## 3. Luồng Inquiry và lịch sử

- Một conversation cho mỗi số điện thoại khách chuẩn hóa.
- Chỉ tin live inbound trong field messages tạo khách/Inquiry. Có tên WhatsApp thì lưu tên, không có thì hiện số. Service mặc định Other để nhân viên bổ sung, không đoán tour hoặc giá.
- Tin tiếp theo nối vào Inquiry chưa đóng. Nếu archived nhưng trạng thái trước đó chưa đóng, tự khôi phục, ghi sự kiện Restore và reset timer theo tin thực chất.
- Nếu yêu cầu cũ Converted/Lost/Rejected/Cancelled/Booked/Completed, tạo yêu cầu mới trong cùng conversation; giữ yêu cầu/lịch sử cũ.
- Tin app gửi qua echo là outbound, không tạo Inquiry. Status, history và smb_app_state_sync không tạo Inquiry; history không được import trong bản này.
- Tin khách và echo trả lời app là hoạt động thực chất; mở hồ sơ, đánh dấu đọc, stream, notification nền và status không reset timer.
- Booked / No Slot / Cancel / Archive / Restore / Cash / Online / Mark as Paid vẫn qua luồng CRM hiện có. Không tự tạo Booking, Paid hay giao dịch Records.
- WAMID UNIQUE + D1 transaction chống lưu trùng; status có unique (wamid,status,timestamp). Echo và status không bị hiểu thành khách mới.

Lịch sử trước khi kết nối không tự xuất hiện. Tính đồng bộ phụ thuộc các webhook Meta thực sự gửi và thiết bị/app hỗ trợ: test điện thoại chính, WhatsApp Web và từng desktop client bạn dùng. Không tự đồng bộ danh bạ hoặc import tin cũ.

## 4. Giao diện

Màu WhatsApp, responsive, dark mode. Mở Inbox từ ô WhatsApp trên Control Center. Tìm tên/số trên database; hiển thị 100 hội thoại gần nhất trong kết quả, tải mỗi trang tin 50 và có Load older messages. Liên kết Inquiry mở panel CRM hiện có. Open WhatsApp dùng link wa.me theo số khách, có thể mở app hoặc trang WhatsApp tùy thiết bị; không đảm bảo chuyển thẳng vào đúng cửa sổ trên mọi hệ điều hành.

SSE kiểm tra revision D1 khoảng mỗi 2 giây, reconnect mỗi 25 giây; fallback refresh 15 giây. Không cần F5. Không có push khi đóng tab. API và stream đều kiểm tra phiên đăng nhập. Admin/staff dùng giống nhau; tạo tài khoản vẫn chỉ admin.

Unread/read là trạng thái nội bộ Workspace, chưa gửi read receipt về khách. Ảnh, PDF, audio/voice và các loại khác có nhãn và giữ metadata cần thiết (media ID, MIME, filename, caption/hash và dữ liệu theo loại nếu Meta cung cấp). Chưa xem, tải binary, phát audio hoặc gửi media từ dashboard. Media ID không thay thế việc sao lưu binary.

Cửa sổ 24 giờ/template áp dụng cho gửi qua Business Platform. Workspace không gửi nên không có ô nhập hay kiểm tra cửa sổ làm cản trở việc xem tin. Bạn trả lời theo chức năng của Business app.

## 5. Database và endpoints

Migration 0002_nappy_bastion.sql và 0003_flat_bromley.sql bổ sung bảng, giữ nguyên migration/dữ liệu CRM trước đó. Schema nằm trong db/schema.ts.

| Bảng | Nội dung |
| --- | --- |
| wa_conversations | Số, tên, customer/inquiry hiện tại, preview, thời gian, read_seq |
| wa_messages | Tin hai chiều, nguồn, WAMID, loại/media metadata, status, seq |
| wa_statuses | Status Meta theo WAMID, timestamp và mã lỗi |
| wa_state | Kết quả kiểm tra tùy chọn, webhook/echo gần nhất; không có secrets |
| wa_sync | Revision phục vụ stream, tạo khi có thay đổi |
| records/events | Khách, Inquiry và Activity Log hiện có |

- GET/POST /api/webhooks/whatsapp: GET verify; POST HMAC-SHA256 từ raw bytes.
- GET /api/whatsapp: hội thoại/tin; yêu cầu đăng nhập.
- POST /api/whatsapp: read hoặc check GET Meta tùy chọn; yêu cầu login + same-origin. Action send luôn bị từ chối.
- GET /api/whatsapp/events: stream; yêu cầu login và kiểm tra lại session trong stream.

## 6. Deploy Cloudflare / subdomain

1. Đây là Worker có backend, không phải ZIP HTML tĩnh. Giải nén source, cài Node/pnpm theo package.json, chạy `pnpm install --frozen-lockfile`.
2. Chạy `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build`.
3. Dùng Worker riêng cho CRM; không sửa Worker marketing bob. Sửa deploy/wrangler.example.jsonc với database_id D1, tên bucket R2 và tên Worker. Giữ main dist/server/index.js và assets dist/client.
4. Áp dụng toàn bộ migration theo thứ tự: `pnpm exec wrangler d1 migrations apply DB --remote --config deploy/wrangler.example.jsonc`. Với preview local dùng --local. Không chạy lại CREATE TABLE cũ trực tiếp trên database đã có.
5. Đặt Secrets INITIAL_ADMIN_HASH, META_APP_SECRET, WHATSAPP_VERIFY_TOKEN. Giữ các ID như bảng trên. Ví dụ: `pnpm exec wrangler secret put META_APP_SECRET --config deploy/wrangler.example.jsonc`. Không cần WHATSAPP_ACCESS_TOKEN cho nhận tin.
6. `pnpm exec wrangler deploy --config deploy/wrangler.example.jsonc`; thêm custom domain crm.thehub.express cho Worker riêng.
7. Dữ liệu/tài khoản trên D1 của Site GPT không tự chuyển sang D1 mới: cần export/import đầy đủ và sao lưu R2 trước khi đổi callback. Không coi database trống là đã chuyển dữ liệu cũ. Xem docs/ACCOUNTS.md nếu cần bootstrap admin mới.
8. Backup toàn D1: `pnpm exec wrangler d1 export DB --remote --config deploy/wrangler.example.jsonc --output backup.sql`. File SQL chứa dữ liệu khách/auth hash, phải cất riêng, không commit hay đưa vào static assets.
9. Backup JSON trong giao diện chỉ gồm CRM records/events, không gồm bảng wa_* và file binary. Bật cron trong cấu hình ví dụ nếu cần archive 48h chạy khi đóng trình duyệt.

## 7. Test số thật còn chờ

- Verify trên Meta; sai token phải bị từ chối.
- Khách test nhắn lần đầu và nhắn tiếp; đúng một khách/Inquiry; replay WAMID không trùng.
- Trả lời từ Business app; kiểm tra echo khi Coexistence thực sự bật, thử riêng từng thiết bị liên kết.
- F5/đăng nhập thiết bị khác vẫn có lịch sử; không đăng nhập không xem được.
- Không có ô gửi. POST send bị từ chối; nhận tin không tạo thu tiền/sale đã xác nhận.

Nguồn chính thức đã đọc: Meta Postman https://www.postman.com/meta/whatsapp-business-platform/overview và chính sách https://whatsappbusiness.com/policy/ . Cần đối chiếu lại lifecycle https://developers.facebook.com/docs/graph-api/changelog/versions và Coexistence https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users khi truy cập được. Không báo kết nối Meta/Coexistence thành công trước khi có sự kiện thật.
