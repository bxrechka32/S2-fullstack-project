# 🛒 TechShop — Интернет-магазин (Практики 1–12)

Проект по дисциплине **«Фронтенд и бэкенд разработка»**, 4 семестр 2025/2026.  
Преподаватели: Загородних Николай Анатольевич, Краснослободцева Дарья Борисовна.

---

## 📋 Реализованные практики

| # | Тема | Что реализовано |
|---|------|-----------------|
| Пр. 1 | CSS-препроцессоры | SASS-переменные (`--primary`, `--bg`, `--border`), миксин `card()`, вложенная структура BEM (`modal__header`, `modal__body`) в `index.css` |
| Пр. 2 | Express сервер | CRUD `/api/products`: POST, GET, GET/:id, PUT/:id, DELETE/:id |
| Пр. 3 | JSON и Postman | API протестирован в Postman (минимум 5 запросов, скриншоты ниже) |
| Пр. 4 | React + API | Магазин на React + axios, 12 товаров, поиск, фильтрация по категориям |
| Пр. 5 | Swagger | Документация доступна по `/api-docs`, описаны все маршруты и схемы |
| Пр. 6 | Контрольная №1 | Товары + Swagger + README + открытый репозиторий |
| Пр. 7 | Аутентификация | Регистрация/вход, bcrypt хеширование, email как логин |
| Пр. 8 | JWT | Access-токен, защищённые маршруты, `GET /api/auth/me` |
| Пр. 9 | Cookie | Refresh-токен в `HttpOnly; Secure; SameSite=Strict` cookie, `Cache-Control` |
| Пр. 10 | Refresh-токены | Ротация refresh-токенов, `GET /api/auth/sessions`, автообновление в axios |
| Пр. 11 | RBAC + blacklist | Роли `admin/moderator/user`, смена ролей, blacklist jti при logout |
| Пр. 12 | Контрольная №2 | Полная система авторизации, демонстрация всех функций |

---

## 🚀 Запуск проекта

### Бэкенд

```bash
cd backend
npm install
npm start
# Сервер: http://localhost:3000
# Swagger: http://localhost:3000/api-docs
```

### Фронтенд

```bash
cd frontend
npm install
npm start
# Приложение: http://localhost:3001
```

---

## 🔑 Система ролей (Пр. 11 — RBAC)

| Роль | Права |
|------|-------|
| `user` | Просмотр магазина, просмотр товара по ID |
| `moderator` | + Создание и редактирование товаров |
| `admin` | + Удаление товаров, управление ролями пользователей |

> **Первый зарегистрированный пользователь автоматически получает роль `admin`.**

---

## 🛡️ API маршруты

### Аутентификация
| Метод | Путь | Описание | Доступ |
|-------|------|----------|--------|
| POST | `/api/auth/register` | Регистрация | Все |
| POST | `/api/auth/login` | Вход, выдача токенов | Все |
| POST | `/api/auth/refresh` | Обновить access-токен | Cookie |
| POST | `/api/auth/logout` | Выход, blacklist токена | Авторизован |
| GET  | `/api/auth/me` | Текущий пользователь | Авторизован |
| GET  | `/api/auth/sessions` | Активные сессии | Авторизован |

### Пользователи
| Метод | Путь | Описание | Доступ |
|-------|------|----------|--------|
| GET | `/api/users` | Список всех пользователей | admin |
| PATCH | `/api/users/:id/role` | Изменить роль | admin |

### Товары
| Метод | Путь | Описание | Доступ |
|-------|------|----------|--------|
| GET | `/api/products` | Список товаров (+ фильтры) | Все |
| POST | `/api/products` | Создать товар | admin, moderator |
| GET | `/api/products/:id` | Товар по ID | Авторизован |
| PUT | `/api/products/:id` | Обновить товар | admin, moderator |
| DELETE | `/api/products/:id` | Удалить товар | admin |
| GET | `/api/categories` | Список категорий | Все |

---

## 📸 Тестирование в Postman (Пр. 3)

Тестирование выполнено в Postman. Запросы:

1. `GET http://localhost:3000/api/products` — получить список товаров (200 OK)
2. `POST http://localhost:3000/api/auth/register` — регистрация пользователя (201 Created)
3. `POST http://localhost:3000/api/auth/login` — вход, получение accessToken (200 OK)
4. `GET http://localhost:3000/api/auth/me` с заголовком `Authorization: Bearer <token>` (200 OK)
5. `PUT http://localhost:3000/api/products/:id` с токеном — обновление товара (200 OK)
6. `DELETE http://localhost:3000/api/products/:id` с токеном admin — удаление (204 No Content)
7. `POST http://localhost:3000/api/auth/logout` — выход, токен попадает в blacklist (200 OK)

---

## 🔧 Технологии

**Бэкенд:** Node.js, Express.js, JWT (jsonwebtoken), bcrypt, cookie-parser, cors, swagger-jsdoc, nanoid  
**Фронтенд:** React 18, axios, CSS (с переменными и структурой по аналогии SASS)
