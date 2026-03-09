import { useState, useEffect } from "react";
import { authApi } from "./api";
import AuthPage from "./pages/AuthPage/AuthPage";
import ShopPage from "./pages/ShopPage/ShopPage";
import AdminPage from "./pages/AdminPage/AdminPage";
import Header from "./components/Header";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("shop"); // shop | admin

  // При запуске проверяем токен
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then(u => setUser(u))
      .catch(() => localStorage.removeItem("accessToken"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (data) => {
    localStorage.setItem("accessToken", data.accessToken);
    setUser(data.user);
    setPage("shop");
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem("accessToken");
    setUser(null);
    setPage("shop");
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!user)   return <AuthPage onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header user={user} page={page} setPage={setPage} onLogout={handleLogout} />
      {page === "shop"  && <ShopPage user={user} />}
      {page === "admin" && (user.role === "admin" || user.role === "moderator")
        ? <AdminPage user={user} />
        : page === "admin" && <div className="empty" style={{margin:"40px auto",maxWidth:400}}>Доступ запрещён</div>
      }
    </div>
  );
}
