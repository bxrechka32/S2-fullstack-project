export default function Header({ user, page, setPage, onLogout }) {
  return (
    <header style={{
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.02)",
      padding: "0 24px",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 56,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>🛒 TechShop</span>
          <nav style={{ display: "flex", gap: 4 }}>
            <button
              className={`btn btn--sm ${page === "shop" ? "btn--primary" : ""}`}
              onClick={() => setPage("shop")}
            >Магазин</button>
            {(user.role === "admin" || user.role === "moderator") && (
              <button
                className={`btn btn--sm ${page === "admin" ? "btn--primary" : ""}`}
                onClick={() => setPage("admin")}
              >Панель управления</button>
            )}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, opacity: 0.7 }}>
            {user.first_name} {user.last_name}
          </span>
          <span className={`badge badge--${user.role}`}>{user.role}</span>
          <button className="btn btn--sm btn--danger" onClick={onLogout}>Выйти</button>
        </div>
      </div>
    </header>
  );
}
