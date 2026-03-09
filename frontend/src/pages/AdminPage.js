import { useState, useEffect } from "react";
import { usersApi, authApi } from "../../api";

export default function AdminPage({ user }) {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (user.role !== "admin") { setLoading(false); return; }
    Promise.all([
      usersApi.getAll(),
      authApi.getSessions(),
    ]).then(([u, s]) => {
      setUsers(u);
      setSessions(s);
    }).catch(e => setMsg(e.response?.data?.error || "Ошибка"))
      .finally(() => setLoading(false));
  }, [user.role]);

  // Пр. 11: RBAC — изменение роли
  const changeRole = async (id, role) => {
    try {
      const updated = await usersApi.changeRole(id, role);
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, role: updated.role } : u));
      setMsg(`✅ Роль изменена на ${role}`);
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setMsg(e.response?.data?.error || "Ошибка");
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <main style={{ flex: 1, padding: "24px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>🛡️ Панель управления</h1>

      {msg && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", fontSize: 14 }}>{msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Активные сессии — Пр. 10 */}
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 14 }}>🔄 Мои активные сессии (Пр. 10)</h2>
          {sessions ? (
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#a5b4fc" }}>{sessions.count}</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>активных сессий</div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                {sessions.sessions.map((s, i) => (
                  <div key={i} style={{ fontSize: 12, opacity: 0.7, padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
                    Сессия {i+1}: {new Date(s.createdAt).toLocaleString("ru-RU")}
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ opacity: 0.5, fontSize: 13 }}>Нет данных</div>}
        </div>

        {/* Информация о текущем пользователе */}
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 14 }}>👤 Ваши данные</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
            {[
              ["ID", user.id],
              ["Email", user.email],
              ["Имя", `${user.first_name} ${user.last_name}`],
              ["Роль", user.role],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ opacity: 0.6 }}>{k}</span>
                <span style={{ fontWeight: 600 }}>
                  {k === "Роль" ? <span className={`badge badge--${v}`}>{v}</span> : v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Управление пользователями — Пр. 11 RBAC */}
      {user.role === "admin" && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>👥 Пользователи и роли (Пр. 11 — RBAC)</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  {["ID", "Email", "Имя", "Роль", "Действие"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", opacity: 0.6, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "10px 12px", opacity: 0.5, fontSize: 12 }}>{u.id}</td>
                    <td style={{ padding: "10px 12px" }}>{u.email}</td>
                    <td style={{ padding: "10px 12px" }}>{u.first_name} {u.last_name}</td>
                    <td style={{ padding: "10px 12px" }}><span className={`badge badge--${u.role}`}>{u.role}</span></td>
                    <td style={{ padding: "10px 12px" }}>
                      {u.id !== user.id && (
                        <select
                          className="input"
                          value={u.role}
                          style={{ width: "auto", padding: "4px 8px", fontSize: 12 }}
                          onChange={e => changeRole(u.id, e.target.value)}
                        >
                          <option value="user">user</option>
                          <option value="moderator">moderator</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Легенда практик */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 14 }}>📋 Реализованные практики</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 8, fontSize: 13 }}>
          {[
            ["Пр. 1", "CSS-препроцессор (SASS: переменные, миксин, вложенность)"],
            ["Пр. 2", "Express сервер, CRUD товаров (/api/products)"],
            ["Пр. 3", "JSON формат, Postman тестирование (см. README)"],
            ["Пр. 4", "React + axios, интернет-магазин 12+ товаров"],
            ["Пр. 5", "Swagger/OpenAPI документация (/api-docs)"],
            ["Пр. 6", "Контрольная №1: товары + Swagger + тестирование"],
            ["Пр. 7", "Регистрация, bcrypt хеширование, email-логин"],
            ["Пр. 8", "JWT access-токен, защищённые маршруты, GET /me"],
            ["Пр. 9", "Cookie HttpOnly/Secure/SameSite, Cache-Control"],
            ["Пр. 10", "Refresh-токены, ротация сессий, GET /sessions"],
            ["Пр. 11", "RBAC (admin/moderator/user), blacklist токенов"],
            ["Пр. 12", "Полная система авторизации (КР №2)"],
          ].map(([num, desc]) => (
            <div key={num} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ color: "#a5b4fc", fontWeight: 600 }}>{num}: </span>
              <span style={{ opacity: 0.8 }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
