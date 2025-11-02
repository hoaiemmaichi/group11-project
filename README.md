## group11-project — Hoạt động 7: Hướng dẫn chạy ứng dụng (chi tiết)

Tập trung vào: cách cấu hình environment, chạy backend & frontend, seed dữ liệu, và các lệnh curl để kiểm thử toàn bộ flow: đăng ký, đăng nhập, refresh token, upload avatar, reset password, xem logs và kiểm tra phân quyền.
Hướng dẫn sử dụng môi trường đã triển khai

Frontend (web): https://group11-project-sage.vercel.app
Backend (API): https://group11-projectbackend.onrender.com

Mục đích: hướng dẫn nhanh cách kiểm thử toàn bộ chức năng (signup/login/refresh/upload/reset/roles) trên môi trường đã deploy.

1) Dùng giao diện web

- Mở: https://group11-project-sage.vercel.app
- Đăng nhập bằng tài khoản seed (nếu backend đã seed trên môi trường):
  - admin: lenguyenthaib@gmail.com / 123456
  - mod: lntb230104@gmail.com.com / 12345678
  - user: user2@gmail.com / 12345678
- Hoặc đăng ký tài khoản mới qua giao diện và thực hiện các chức năng:
  - Upload avatar (tải file từ máy hoặc dán image URL)
  - Forgot password → reset password
  - Kiểm tra phần phân quyền dành cho admin/moderator (mô tả ngắn về quyền bên dưới)

2) Lưu ý kỹ thuật khi dùng deployment

- CORS: backend đã cấu hình để cho phép origin của frontend (Vercel) nên UI ↔ API sẽ giao tiếp trực tiếp.
- Email: nếu backend trên Render có SMTP thì chức năng forgot/reset sẽ gửi email thực; nếu không có SMTP, backend có thể dùng Ethereal và in preview URL trong logs — để lấy preview URL bạn phải xem logs của service backend trên Render.
- Upload avatar: backend có thể upload lên Cloudinary (repo có cấu hình Cloudinary). Nếu Cloudinary được bật trên server, ảnh sẽ lưu trên Cloudinary. Nếu không, lưu local không phù hợp với hosting như Render, nên dùng imageUrl upload thay thế.

3) Một số curl ví dụ với API deployed

Login (lấy access + refresh token):

```bash
curl -v -X POST https://group11-projectbackend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user2@gmail.com","password":"12345678"}'
```

Refresh:

```bash
curl -v -X POST https://group11-projectbackend.onrender.com/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<PASTE_REFRESH_TOKEN>"}'
```

Upload avatar (imageUrl):

```bash
curl -v -X POST https://group11-projectbackend.onrender.com/upload/avatar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"imageUrl":"https://example.com/sample.jpg"}'
```

Forgot password:

```bash
curl -v -X POST https://group11-projectbackend.onrender.com/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user2@gmail.com"}'
```

4) Xem logs trên Render

- Vào dashboard Render, chọn service backend, mở phần "Logs" để xem output console (những thông tin như Ethereal preview URL, lỗi upload, hoặc traceback sẽ xuất ở đây).


5)Phân quyền (roles) — tóm tắt nhanh

- Admin:
  - Quản lý người dùng (tạo, xem, cập nhật, đổi role, xóa mọi user).
  - Xem logs hoạt động và stream real-time.

- Moderator:
  - Xem danh sách người dùng và chỉnh sửa các trường an toàn (name, email).
  - Không thể đổi role, không thể đọc logs.

- User:
  - Xem/cập nhật profile của chính mình, upload avatar, reset password, xóa tài khoản bản thân.

- Guest:
  - Có thể đăng ký, đăng nhập và yêu cầu reset password; không truy cập các route protected.









## 1) Yêu cầu trước khi chạy group11-project tải về từ nhánh main

- Node.js (14+), npm 
- MongoDB (Local/Atlas). Có connection string cho `MONGODB_URI`.
- Cloudinary để upload ảnh (hoặc dùng fallback lưu local)
- Thông tin SMTP/Gmail để gửi email (nếu không có, server sẽ fallback sang Ethereal cho dev)

## 2) File .env mẫu (`backend/.env`)
file `backend/.env` với nội dung mẫu sau:

```
# Cấu hình môi trường Backend
# Lưu ý: KHÔNG commit thông tin nhạy cảm lên repo công khai.
# Bạn có thể thay giá trị MONGODB_URI bằng connection string của riêng bạn.

# Cổng server
PORT=3000

# Chuỗi kết nối MongoDB (ví dụ Atlas). Hãy thay bằng chuỗi của bạn.
MONGODB_URI=mongodb+srv://hoaiem:hoaiem1234@groupdb.14hxmuu.mongodb.net/groupDB?retryWrites=true&w=majority

# Khóa JWT dùng để ký token (thay bằng giá trị mạnh hơn trong thực tế)
JWT_SECRET=dev_secret_change_me

EMAIL_USER=lenguyenthaib@gmail.com
EMAIL_PASSWORD=lentazhogopeimhm
APP_BASE_URL=http://localhost:3001
EMAIL_DEBUG=true

# Ngăn fallback Ethereal (chỉ dùng cho dev). Đặt false để KHÔNG dùng Ethereal.
ALLOW_ETHEREAL=false

# Cấu hình SMTP tường minh (ưu tiên dùng nếu đủ 4 biến bên dưới)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=lenguyenthaib@gmail.com
SMTP_PASS=lentazhogopeimhm

# Thời lượng refresh token (milliseconds). Mặc định 7 ngày = 604800000 ms.
REFRESH_TOKEN_EXPIRES_MS=604800000
```

Ghi chú:
- Nếu không cấu hình Cloudinary, avatar sẽ được lưu tại `backend/uploads/avatars/` và trả về URL tĩnh từ server.
- Nếu không cấu hình SMTP/EMAIL, server cố gắng dùng Ethereal (email test) và log preview URL ra console.

## 3) Cài đặt & chạy

3.1 Backend

```bash
cd backend
npm install
# (dev) tự reload khi thay đổi
npx nodemon server.js
# hoặc chạy trực tiếp
npm start
```

Server mặc định lắng nghe trên `http://localhost:3000` (hoặc `PORT` bạn cấu hình). Kiểm tra sức khỏe: `GET /health`.

3.2 Frontend

```bash
cd frontend
npm install
npm start
```

Frontend dev mặc định ở `http://localhost:3001`. Nếu frontend chạy port khác, thêm origin đó vào `allowedOrigins` trong `backend/server.js`.

## 4) Seed dữ liệu (tạo user mẫu)

Script có sẵn: `backend/scripts/seedRoles.js` — chạy để tạo 3 tài khoản mẫu (admin/moderator/user):

```bash
cd backend
node scripts/seedRoles.js
```

Tài khoản :
- admin: lenguyenthaib@gmail.com / 123456
- mod: lntb230104@gmail.com.com / 12345678
- user: user2@gmail.com / 12345678

## 5) Kiểm thử các luồng bằng curl (ví dụ)

Lưu ý: thay `http://localhost:3000` nếu backend chạy trên host/port khác.

1) Signup

```bash
curl -v -X POST http://localhost:3000/auth/signup \
	-H "Content-Type: application/json" \
	-d '{"name":"Test User","email":"test1@example.com","password":"Pass@123","confirmPassword":"Pass@123"}'
```

2) Login — nhận access token & refresh token

```bash
curl -v -X POST http://localhost:3000/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"user@example.com","password":"User@123"}'
```

Response mẫu: JSON chứa `token` (access token), `refreshToken`, và `user`.

3) Refresh (rotate)

```bash
curl -v -X POST http://localhost:3000/auth/refresh \
	-H "Content-Type: application/json" \
	-d '{"refreshToken":"<PASTE_REFRESH_TOKEN_HERE>"}'
```

4) Logout (thu hồi refresh token server-side)

```bash
curl -v -X POST http://localhost:3000/auth/logout \
	-H "Content-Type: application/json" \
	-d '{"refreshToken":"<OPTIONAL_REFRESH_TOKEN>"}'
```

5) Upload avatar — bằng imageUrl (JSON)

```bash
curl -v -X POST http://localhost:3000/upload/avatar \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <ACCESS_TOKEN>" \
	-d '{"imageUrl":"https://example.com/sample.jpg"}'
```

6) Upload avatar — multipart/form-data (tệp local)

```bash
curl -v -X POST http://localhost:3000/upload/avatar \
	-H "Authorization: Bearer <ACCESS_TOKEN>" \
	-F "avatar=@/absolute/path/to/avatar.jpg"
```

7) Forgot password (gửi email chứa token/reset link)

```bash
curl -v -X POST http://localhost:3000/auth/forgot-password \
	-H "Content-Type: application/json" \
	-d '{"email":"user@example.com"}'
```

Nếu dùng Ethereal fallback, console backend sẽ in ra preview URL (ví dụ: `Ethereal preview URL: https://...`) — mở URL đó để xem nội dung mail và lấy `rawToken`.

8) Reset password

```bash
curl -v -X POST http://localhost:3000/auth/reset-password \
	-H "Content-Type: application/json" \
	-d '{"token":"<TOKEN_FROM_EMAIL>","newPassword":"NewPass@123","confirmNewPassword":"NewPass@123"}'
```

## 6) Endpoints chẩn đoán & debugging

- `GET /health` — trả `dbState` để biết trạng thái kết nối MongoDB.
- `GET /auth/mail-status` — kiểm tra cấu hình email và mode (smtp/gmail/ethereal).
- `GET /upload-status` — kiểm tra cấu hình Cloudinary detection.
- Console backend in logs chi tiết request/response (token ngắn, hash để không lộ token thật).

## 7) Lưu ý bảo mật & vận hành

- Không commit `backend/.env` chứa secret.
- Đặt `JWT_SECRET`, Cloudinary keys, SMTP creds ở môi trường production (CI/CD provider secrets) — không put trực tiếp vào repo.
- Refresh tokens được lưu dưới dạng hash trong DB để có thể thu hồi/rotate.

---

## 8) Phân quyền (roles) — mô tả chức năng

Hệ thống hiện có 3 role chính: `admin`, `moderator`, `user` (và trường hợp chưa xác thực - "guest"). Dưới đây là mô tả các quyền tương ứng dựa trên middleware RBAC và các route hiện có:

- Admin
	- Xem danh sách tất cả người dùng (`GET /users`).
	- Tạo người dùng mới (`POST /users`).
	- Cập nhật thông tin người dùng (thông qua `PUT /users/:id` các trường an toàn) và đặc biệt có thể thay đổi `role` qua `PATCH /users/:id/role`.
	- Xóa bất kỳ người dùng nào (`DELETE /users/:id`).
	- Đọc toàn bộ logs hoạt động (`GET /logs`) và kết nối stream SSE real-time (`/logs/stream?token=...`).

- Moderator
	- Xem danh sách người dùng (`GET /users`).
	- Cập nhật thông tin người dùng (chỉ các trường an toàn như `name`, `email`) qua `PUT /users/:id`.
	- Không được phép thay đổi role của người khác, không được tạo người dùng mới, và không có quyền đọc logs.

- User (tài khoản bình thường)
	- Truy cập và cập nhật profile của chính mình (`GET /profile`, `PUT /profile`).
	- Upload avatar (qua `/upload/avatar`).
	- Thực hiện các thao tác đăng nhập/đăng xuất/refresh token/forgot-reset password.
	- Chỉ có thể xóa chính mình (endpoint `DELETE /users/:id` áp dụng `adminOrSelfByParamId` — admin có thể xóa ai cũng được; người dùng chỉ có thể xóa khi `:id` trùng với `req.user.id`).

- Guest (chưa xác thực)
	- Có thể gọi các endpoint công khai như `GET /` , `POST /auth/signup`, `POST /auth/login`, `POST /auth/forgot-password`.
	- Không có quyền truy cập vào các route protected (`/users`, `/profile`, `/upload`, `/logs`, ...).

Ghi chú:
- Middleware RBAC chính là `backend/middleware/rbac.js` — các check cụ thể: `requireRole('admin')`, `checkRole('admin','moderator')`, và helper `adminOrSelfByParamId('id')` để cho phép admin hoặc hành động trên chính tài khoản của mình.
- Nếu bạn muốn thay đổi hoặc mở rộng quyền (ví dụ: thêm role `editor` hoặc quyền granular hơn), cập nhật các middleware và các route tương ứng.

