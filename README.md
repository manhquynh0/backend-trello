# 📋 Trello Backend API (RESTful & Realtime)

> Hệ thống Backend RESTful API và Realtime WebSocket cho ứng dụng quản lý công việc phong cách Trello/Kanban, xây dựng với **Node.js**, **Express**, **MongoDB**, **Redis** và **Socket.IO**.

[![Test Coverage](https://img.shields.io/badge/Coverage-92.74%25-brightgreen.svg)](https://github.com/manhquynh0/backend-trello)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-blue.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-green.svg)](https://www.mongodb.com/)
[![Cache](https://img.shields.io/badge/Cache-Redis-red.svg)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 1. Xác thực & Phân quyền (Authentication & Authorization)
* **JWT Authentication:** Xác thực 2 lớp với **Access Token** & **Refresh Token** lưu trữ an toàn trong `HTTP-Only Cookies` (chống XSS).
* **Cơ chế cấp lại Token tự động:** API `/refresh_token` hỗ trợ gia hạn phiên làm việc không gián đoạn.
* **Xác thực Email & Quên mật khẩu:** Tích hợp Brevo (Sendinblue) gửi email kích hoạt tài khoản và cấp lại mật khẩu ngẫu nhiên an toàn.
* **RBAC (Role-Based Access Control):** Hệ thống phân quyền đa cấp bậc:
  * `OWNER` (Chủ sở hữu Board): Toàn quyền quản lý, lưu trữ, khôi phục hoặc xóa Board.
  * `MEMBER` (Thành viên Board): Tạo/di chuyển Column, di chuyển Card, mời thành viên mới.
  * `MEMBER_CARD` (Thành viên Thẻ): Chỉnh sửa nội dung Card, kế thừa toàn bộ quyền của Member Board qua mô hình kế thừa vai trò đệ quy (`ROLE_HIERARCHY`).

### 2. Quản Lý Workspace (Boards, Columns, Cards)
* **Board:** Tạo mới, chỉnh sửa thông tin, đổi ảnh nền Cover (upload Cloudinary), lưu trữ vào thùng rác (soft delete), khôi phục, phân trang tìm kiếm danh sách Boards.
* **Column & Card:** Thêm/sửa/xóa Column, Card. Kéo thả Card trong cùng Column hoặc khác Column với cơ chế **Debounce Redis Cache** giúp giảm tải ghi DB tức thời và đồng bộ chính xác thứ tự (`cardOrderIds`).
* **Tính năng chuyên sâu trên Card:**
  * Quản lý checklist công việc (Checklist & Sub-items).
  * Gắn nhãn màu (Labels) theo dõi mức độ ưu tiên/trạng thái.
  * Tải lên tệp đính kèm đa định dạng (ảnh, tài liệu PDF, DOCX, XLSX...) thông qua Cloudinary.
  * Bình luận (Comments) và phân công thành viên tham gia Card (Join/Leave).
  * Bộ lọc thẻ thông minh theo: thành viên, nhãn, hạn chót (overdue, today, next 7 days), checklist hoàn thành và file đính kèm.

### 3. Giao Tiếp Thời Gian Thực (Realtime Collaboration)
* Tích hợp **Socket.IO** đồng bộ tức thời:
  * Kéo thả Card và Column giữa các người dùng đang cùng mở Board.
  * Thông báo mời tham gia Board theo thời gian thực.
  * Thông báo thành viên tham gia/rời Thẻ.

### 4. Hiệu Năng & Bảo Mật (Performance & Security)
* **Redis Caching:** Lưu trữ đệm thông tin chi tiết Board, danh sách phân trang Boards giúp phản hồi API dưới 10ms.
* **MongoDB TTL Index:** Tự động xóa vĩnh viễn dữ liệu trong thùng rác sau 30 ngày (`deletedAt` TTL index).
* **Rate Limiting:** Sử dụng `express-rate-limit` kết hợp Redis Store:
  * Giới hạn chung 100 requests / 5 phút trên toàn bộ API v1.
  * Giới hạn nghiêm ngặt 5 lần thử / 5 phút trên các route nhạy cảm (`/login`, `/register`, `/forgotPassword`).
* **Validation chặt chẽ:** Sử dụng `Joi` schema kiểm tra dữ liệu đầu vào trước khi vào Controller.

### 5. Bộ Kiểm Thử Tự Động (Unit Testing)
* Đạt độ bao phủ **>92% Statements** với Jest và Supertest (37 Test Suites, 294 Test Cases).
* Kiểm thử cô lập toàn diện các tầng: Controller, Service, Model, Middleware, Validations, Config, Helpers.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ |
| :--- | :--- |
| **Runtime** | Node.js (ES6+ với Babel compiler) |
| **Framework** | Express.js v4 |
| **Cơ sở dữ liệu** | MongoDB (Official MongoDB Native Driver v7+) |
| **Caching & Queue** | Redis Cloud / Local (`ioredis` v6+) |
| **Realtime** | Socket.IO v4 |
| **Bảo mật & Token** | `jsonwebtoken`, `bcryptjs`, `cookie-parser`, `cors` |
| **Rate Limit** | `express-rate-limit`, `rate-limit-redis` |
| **Lưu trữ tệp** | Cloudinary API, `multer`, `streamifier` |
| **Email Service** | Brevo API (`@getbrevo/brevo`) |
| **Validation** | Joi |
| **Testing** | Jest v30, Supertest |

---

## 📂 Cấu Trúc Thư Mục (Project Structure)

```text
trello-api/
├── build/                      # Mã nguồn sau khi build Babel (production)
├── coverage/                   # Báo cáo độ bao phủ Jest Coverage
├── src/
│   ├── config/                 # Cấu hình Database, Redis, CORS, RBAC, TTL Indexes
│   │   ├── cors.js
│   │   ├── createIndexs.js
│   │   ├── database.js
│   │   ├── rabcConfig.js
│   │   └── redis.js
│   ├── controllers/            # Tầng điều hướng Request & Response
│   │   ├── boardController.js
│   │   ├── cardController.js
│   │   ├── columnController.js
│   │   ├── invitationController.js
│   │   └── userController.js
│   ├── helpers/                # Tiện ích bổ trợ (Redis cache helper, ...)
│   ├── middlewares/            # Middlewares: Auth, RBAC, Rate Limit, Upload, Error
│   │   ├── authMiddleware.js
│   │   ├── errorHandlingMiddleware.js
│   │   ├── multerUpLoadMiddleware.js
│   │   ├── rabcMiddleware.js
│   │   └── ratelimitingMiddleware.js
│   ├── models/                 # Tầng truy vấn cơ sở dữ liệu MongoDB
│   │   ├── boardModel.js
│   │   ├── cardModel.js
│   │   ├── columnModel.js
│   │   ├── invitationModel.js
│   │   └── userModel.js
│   ├── providers/              # Tích hợp dịch vụ bên thứ 3 (Jwt, Brevo, Cloudinary)
│   ├── routes/v1/              # Định nghĩa API Routes theo chuẩn REST
│   ├── services/               # Xử lý toàn bộ Business Logic nghiệp vụ
│   ├── sockets/                # Sự kiện WebSockets (Drag, Invite, Join)
│   ├── utils/                  # Hằng số, mã lỗi ApiError, thuật toán phân trang
│   ├── validations/            # Joi validation schemas cho các endpoints
│   ├── tests/                  # Bộ unit test toàn diện (37 test suites, 294 tests)
│   │   ├── config/
│   │   ├── helpers/
│   │   ├── middlewares/
│   │   └── modules/            # Test modules theo cấu trúc miền (boards, cards, ...)
│   ├── app.js                  # Khởi tạo Express App & Middlewares
│   └── server.js               # Điểm khởi động Server, kết nối DB & WebSockets
├── .env.example                # Mẫu cấu hình biến môi trường
├── jest.config.cjs             # Cấu hình Jest test runner
└── package.json
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án (Getting Started)

### 1. Yêu cầu môi trường (Prerequisites)
* **Node.js:** `v18.x` trở lên
* **Yarn:** hoặc `npm`
* **MongoDB:** Bản local hoặc MongoDB Atlas Cloud URI
* **Redis Server:** Bản local (cổng 6379) hoặc Redis Cloud

### 2. Cài đặt mã nguồn
```bash
# Clone repository
git clone https://github.com/manhquynh0/backend-trello.git

# Di chuyển vào thư mục API
cd backend-trello/trello-api

# Cài đặt các dependencies
yarn install
# hoặc: npm install
```

### 3. Cấu hình biến môi trường (.env)
Tạo file `.env` từ file mẫu `.env.example` và điền các thông tin:

```env
# Application
BUILD_MODE='dev'
APP_HOST='localhost'
APP_PORT=3000

# Database (MongoDB)
MONGODB_URI='mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority'
DATABASE_NAME='trello-production'

# Cache (Redis)
REDIS_URL='redis://default:<password>@<host>:<port>'
REDIS_DEFAULT_TTL=3600

# JWT Secrets
ACCESS_SECRET_SIGNATURE='your_access_token_secret'
ACCESS_TOKEN_LIFE='1h'
REFRESH_SECRET_SIGNATURE='your_refresh_token_secret'
REFRESH_TOKEN_LIFE='14d'

# Email Service (Brevo)
BREVO_API_KEY='xkeysib-your-brevo-api-key'
ADMIN_EMAIL='admin@yourdomain.com'
ADMIN_NAME='Trello Support'

# Cloud Storage (Cloudinary)
CLOUDINARY_API_NAME='your_cloud_name'
CLOUDINARY_API_KEY='your_api_key'
CLOUDINARY_API_SECRET='your_api_secret'

# Client Domain (CORS)
WEBSITE_DOMAIN_DEVELOPMENT='http://localhost:5173'
WEBSITE_DOMAIN_PRODUCTION='https://your-frontend-domain.com'
```

### 4. Khởi chạy ứng dụng

```bash
# Chế độ phát triển (Development với Nodemon & Babel)
yarn dev

# Chạy kiểm tra chất lượng mã nguồn (ESLint)
yarn lint

# Build mã nguồn sang production (Babel)
yarn build

# Chạy server môi trường Production
yarn production
```

Server sẽ khởi chạy tại: `http://localhost:3000`

---

## 🧪 Kiểm Thử Tự Động (Testing)

Dự án sở hữu bộ test coverage cao (**>92% Statements**) chạy với Jest:

```bash
# Chạy toàn bộ test suites
yarn test

# Chạy test và tạo báo cáo chi tiết độ bao phủ (Coverage Report)
yarn test -- --coverage

# Chạy test trong môi trường CI
yarn test:ci
```

Báo cáo chi tiết HTML sẽ được sinh tại thư mục `coverage/index.html`.

---

## 📡 Danh Sách API Chính (API Endpoints Overview)

### 🔐 Authentication & Users (`/v1/users`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/users/register` | Public (Rate Limit) | Đăng ký tài khoản mới |
| `PUT` | `/v1/users/verify` | Public | Kích hoạt tài khoản qua Token Email |
| `POST` | `/v1/users/login` | Public (Rate Limit) | Đăng nhập hệ thống |
| `DELETE`| `/v1/users/logout` | Authorized | Đăng xuất & xóa Cookie |
| `POST` | `/v1/users/refresh_token` | Public (Cookie) | Cấp lại Access Token mới |
| `PUT` | `/v1/users/update` | Authorized | Cập nhật thông tin cá nhân/đổi mật khẩu |
| `PUT` | `/v1/users/forgotPassword` | Public (Rate Limit) | Cấp lại mật khẩu ngẫu nhiên qua Email |

### 📌 Boards (`/v1/boards`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/boards` | Authorized | Lấy danh sách Boards phân trang |
| `POST` | `/v1/boards` | Authorized | Tạo mới một Board |
| `GET` | `/v1/boards/:id` | Member/Owner | Lấy chi tiết Board kèm Columns & Cards |
| `GET` | `/v1/boards/:id/filter` | Member/Owner | Lọc Cards theo nhãn, hạn chót, checklist |
| `PUT` | `/v1/boards/:id` | Owner | Cập nhật thông tin/Ảnh bìa Board |
| `PUT` | `/v1/boards/supports/moving_cards` | Member/Owner | Di chuyển Card giữa các Column |
| `DELETE`| `/v1/boards/:id` | Owner | Xóa vĩnh viễn Board |
| `PUT` | `/v1/boards/:id/archive` | Owner | Đưa Board vào thùng rác |
| `PUT` | `/v1/boards/:id/undo` | Owner | Khôi phục Board từ thùng rác |

### 📊 Columns (`/v1/columns`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/columns` | Member/Owner | Tạo mới một Column |
| `GET` | `/v1/columns/:id` | Member/Owner | Lấy chi tiết Column |
| `PUT` | `/v1/columns/:id` | Member/Owner | Cập nhật tiêu đề / danh sách cardOrderIds |
| `DELETE`| `/v1/columns/:id` | Member/Owner | Xóa Column |

### 📝 Cards (`/v1/cards`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/cards` | Member/Owner | Tạo Card mới |
| `GET` | `/v1/cards/:id` | Member/Card Member | Lấy chi tiết Card kèm Attachments & Checklist |
| `PUT` | `/v1/cards/:id` | Member/Card Member | Cập nhật Card (ảnh bìa, comment, thành viên) |
| `POST` | `/v1/cards/:id/attachments` | Member/Card Member | Tải lên file đính kèm mới |
| `DELETE`| `/v1/cards/:cardId/attachments/:publicId` | Member/Card Member | Xóa file đính kèm |
| `POST` | `/v1/cards/:id/labels` | Member/Card Member | Tạo nhãn dán mới cho Thẻ |
| `PUT` | `/v1/cards/:id/labels/:labelId` | Member/Card Member | Cập nhật trạng thái/màu nhãn dán |
| `POST` | `/v1/cards/:id/checklists` | Member/Card Member | Tạo mới danh sách kiểm tra (Checklist) |
| `POST` | `/v1/cards/:id/checklists/:checklistId/items` | Member/Card Member | Thêm công việc vào Checklist |

### ✉️ Invitations (`/v1/invitations`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/invitations/board` | Owner/Member | Mời thành viên mới tham gia Board |
| `GET` | `/v1/invitations` | Authorized | Lấy danh sách lời mời gửi tới người dùng |
| `PUT` | `/v1/invitations/board/:id` | Invitee | Chấp nhận (ACCEPTED) hoặc từ chối (REJECTED) lời mời |

---

## 🛡️ License

Dự án được phân phối dưới giấy phép **MIT License**.
Phát triển bởi [Vũ Mạnh Quỳnh](https://github.com/manhquynh0).
