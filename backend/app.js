"use strict";

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { nanoid } = require("nanoid");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = 3000;

// ─── Секреты и настройки токенов (Пр. 8, 10) ───────────────────────────────
const JWT_ACCESS_SECRET = "access_secret_key_shop_2025";
const JWT_REFRESH_SECRET = "refresh_secret_key_shop_2025";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// ─── In-memory хранилища ─────────────────────────────────────────────────────
// { id, email, first_name, last_name, passwordHash, role }
const users = [];

// { id, title, category, description, price, stock, rating }
const products = [
  { id: nanoid(6), title: "Ноутбук ASUS VivoBook", category: "Электроника", description: "Мощный ноутбук для работы и учёбы", price: 65000, stock: 12, rating: 4.5 },
  { id: nanoid(6), title: "Смартфон Samsung Galaxy A54", category: "Электроника", description: "Флагманский смартфон с отличной камерой", price: 32000, stock: 25, rating: 4.7 },
  { id: nanoid(6), title: "Наушники Sony WH-1000XM5", category: "Аудио", description: "Беспроводные наушники с шумоподавлением", price: 28000, stock: 8, rating: 4.9 },
  { id: nanoid(6), title: "Клавиатура Logitech MX Keys", category: "Периферия", description: "Механическая клавиатура для профессионалов", price: 12000, stock: 30, rating: 4.6 },
  { id: nanoid(6), title: "Монитор LG 27UP85R", category: "Мониторы", description: "4K монитор с поддержкой HDR", price: 45000, stock: 5, rating: 4.4 },
  { id: nanoid(6), title: "Мышь Logitech MX Master 3", category: "Периферия", description: "Эргономичная беспроводная мышь", price: 8500, stock: 40, rating: 4.8 },
  { id: nanoid(6), title: "SSD Samsung 970 EVO 1TB", category: "Накопители", description: "Высокоскоростной NVMe накопитель", price: 9500, stock: 15, rating: 4.7 },
  { id: nanoid(6), title: "Веб-камера Logitech C920", category: "Периферия", description: "Full HD веб-камера для стриминга", price: 7000, stock: 20, rating: 4.3 },
  { id: nanoid(6), title: "Планшет iPad 10", category: "Электроника", description: "Планшет Apple для творчества и работы", price: 55000, stock: 7, rating: 4.6 },
  { id: nanoid(6), title: "Роутер TP-Link AX3000", category: "Сеть", description: "Wi-Fi 6 роутер для высокоскоростного интернета", price: 6500, stock: 18, rating: 4.5 },
  { id: nanoid(6), title: "Принтер HP LaserJet Pro", category: "Оргтехника", description: "Лазерный принтер для офиса", price: 18000, stock: 10, rating: 4.2 },
  { id: nanoid(6), title: "Колонка JBL Charge 5", category: "Аудио", description: "Портативная Bluetooth колонка с защитой IP67", price: 11000, stock: 22, rating: 4.8 },
];

// Refresh токены: { userId, token, createdAt } (Пр. 10)
const refreshTokens = [];

// Blacklist токенов: Set of jti strings (Пр. 11)
const tokenBlacklist = new Set();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser()); // Пр. 9

// CORS (Пр. 4)
app.use(cors({
  origin: "http://localhost:3001",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // для cookie (Пр. 9)
}));

// Логирование запросов
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
  });
  next();
});

// ─── Swagger (Пр. 5) ──────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API интернет-магазина",
      version: "1.0.0",
      description: "Полный API магазина: товары, авторизация, JWT, RBAC (Практики 1-12)",
    },
    servers: [{ url: `http://localhost:${PORT}`, description: "Локальный сервер" }],
    components: {
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Product: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            category: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            stock: { type: "integer" },
            rating: { type: "number" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            first_name: { type: "string" },
            last_name: { type: "string" },
            role: { type: "string", enum: ["user", "moderator", "admin"] },
          },
        },
      },
    },
  },
  apis: ["./app.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Вспомогательные функции ──────────────────────────────────────────────────

function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return null;
  }
  return product;
}

// Создать access-токен (Пр. 8)
function createAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, jti: nanoid(16) },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

// Создать refresh-токен (Пр. 10)
function createRefreshToken(user) {
  const token = jwt.sign(
    { sub: user.id, jti: nanoid(16) },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
  refreshTokens.push({ userId: user.id, token, createdAt: new Date() });
  return token;
}

// Middleware: проверка JWT (Пр. 8)
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    // Проверка blacklist (Пр. 11)
    if (tokenBlacklist.has(payload.jti)) {
      return res.status(401).json({ error: "Token has been revoked" });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Middleware: проверка роли (Пр. 11 - RBAC)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(" or ")}` });
    }
    next();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// МАРШРУТЫ АУТЕНТИФИКАЦИИ (Пр. 7, 8, 9, 10, 11)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя (Пр. 7)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, first_name, last_name, password]
 *             properties:
 *               email: { type: string, example: "ivan@example.com" }
 *               first_name: { type: string, example: "Иван" }
 *               last_name: { type: string, example: "Иванов" }
 *               password: { type: string, example: "qwerty123" }
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       400:
 *         description: Некорректные данные
 *       409:
 *         description: Email уже занят
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;
  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: "email, first_name, last_name and password are required" });
  }
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: "Email already taken" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: nanoid(6),
    email,
    first_name,
    last_name,
    passwordHash,
    role: users.length === 0 ? "admin" : "user", // первый пользователь — admin
  };
  users.push(user);
  res.status(201).json({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему (Пр. 7, 8, 9, 10)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Успешный вход, возвращает accessToken
 *       401:
 *         description: Неверные данные
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  // Пр. 9: HttpOnly cookie для refresh-токена
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,   // недоступен из JS
    secure: false,    // в prod: true (только HTTPS)
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
  });

  res.json({ accessToken, user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role } });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить access-токен через refresh-токен (Пр. 10)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Новый accessToken
 *       401:
 *         description: Refresh-токен недействителен
 */
app.post("/api/auth/refresh", (req, res) => {
  // Читаем из cookie (Пр. 9) или из тела
  const token = req.cookies.refreshToken || req.body.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET);
    const stored = refreshTokens.find(rt => rt.token === token);
    if (!stored) return res.status(401).json({ error: "Refresh token not found or revoked" });

    const user = users.find(u => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });

    // Ротация refresh-токенов (удаляем старый, выдаём новый)
    const idx = refreshTokens.indexOf(stored);
    refreshTokens.splice(idx, 1);

    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: newAccessToken });
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Выход из системы, отзыв токенов (Пр. 11)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Выход выполнен
 */
app.post("/api/auth/logout", authMiddleware, (req, res) => {
  // Добавляем jti в blacklist (Пр. 11)
  tokenBlacklist.add(req.user.jti);

  // Удаляем refresh-токен из cookie
  const token = req.cookies.refreshToken;
  if (token) {
    const idx = refreshTokens.findIndex(rt => rt.token === token);
    if (idx !== -1) refreshTokens.splice(idx, 1);
  }
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить текущего пользователя (Пр. 8)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Данные текущего пользователя
 *       401:
 *         description: Не авторизован
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role });
});

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: Активные сессии пользователя (Пр. 10)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Список активных сессий
 */
app.get("/api/auth/sessions", authMiddleware, (req, res) => {
  const sessions = refreshTokens
    .filter(rt => rt.userId === req.user.sub)
    .map(rt => ({ createdAt: rt.createdAt }));
  res.json({ sessions, count: sessions.length });
});

// ─────────────────────────────────────────────────────────────────────────────
// МАРШРУТЫ ПОЛЬЗОВАТЕЛЕЙ — только admin (Пр. 11 - RBAC)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Список всех пользователей — только admin (Пр. 11)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *       403:
 *         description: Доступ запрещён
 */
app.get("/api/users", authMiddleware, requireRole("admin"), (req, res) => {
  const list = users.map(u => ({ id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name, role: u.role }));
  res.json(list);
});

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Изменить роль пользователя — только admin (Пр. 11 RBAC)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [user, moderator, admin] }
 *     responses:
 *       200:
 *         description: Роль изменена
 *       403:
 *         description: Доступ запрещён
 *       404:
 *         description: Пользователь не найден
 */
app.patch("/api/users/:id/role", authMiddleware, requireRole("admin"), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { role } = req.body;
  if (!["user", "moderator", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be: user, moderator, admin" });
  }
  user.role = role;
  res.json({ id: user.id, email: user.email, role: user.role });
});

// ─────────────────────────────────────────────────────────────────────────────
// МАРШРУТЫ ТОВАРОВ (Пр. 2, 4, 5, 7, 8)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар — admin или moderator (Пр. 2, 11)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, description, price, stock]
 *             properties:
 *               title: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               stock: { type: integer }
 *               rating: { type: number }
 *     responses:
 *       201:
 *         description: Товар создан
 *       400:
 *         description: Ошибка валидации
 *       403:
 *         description: Доступ запрещён
 */
app.post("/api/products", authMiddleware, requireRole("admin", "moderator"), (req, res) => {
  const { title, category, description, price, stock, rating } = req.body;
  if (!title || !category || !description || price === undefined || stock === undefined) {
    return res.status(400).json({ error: "title, category, description, price and stock are required" });
  }
  const product = {
    id: nanoid(6),
    title: title.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock),
    rating: Number(rating) || 0,
  };
  products.push(product);
  res.status(201).json(product);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров (Пр. 2, 3, 5)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Фильтр по категории
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Поиск по названию
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
  let result = [...products];
  if (req.query.category) {
    result = result.filter(p => p.category.toLowerCase() === req.query.category.toLowerCase());
  }
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    result = result.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  // Заголовки кэширования (Пр. 9)
  res.set("Cache-Control", "public, max-age=60");
  res.json(result);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID — требует авторизации (Пр. 8)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", authMiddleware, (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар полностью — admin или moderator (Пр. 8, 11)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Товар обновлён
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Доступ запрещён
 *       404:
 *         description: Товар не найден
 */
app.put("/api/products/:id", authMiddleware, requireRole("admin", "moderator"), (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  const { title, category, description, price, stock, rating } = req.body;
  if (title !== undefined) product.title = title.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (rating !== undefined) product.rating = Number(rating);
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар — только admin (Пр. 8, 11)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Товар удалён
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Доступ запрещён
 *       404:
 *         description: Товар не найден
 */
app.delete("/api/products/:id", authMiddleware, requireRole("admin"), (req, res) => {
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: "Product not found" });
  const idx = products.findIndex(p => p.id === req.params.id);
  products.splice(idx, 1);
  res.status(204).send();
});

// ─── Категории товаров ────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Получить все категории товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список категорий
 */
app.get("/api/categories", (req, res) => {
  const categories = [...new Set(products.map(p => p.category))];
  res.json(categories);
});

// ─── 404 и обработчик ошибок ──────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
  console.log(`📚 Swagger UI доступен по адресу http://localhost:${PORT}/api-docs`);
  console.log(`\n📋 Роли: первый зарегистрированный пользователь получает роль admin`);
});
