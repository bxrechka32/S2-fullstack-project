import { useState, useEffect, useCallback } from "react";
import { productsApi } from "../../api";
import ProductCard from "../../components/ProductCard";
import ProductModal from "../../components/ProductModal";

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  if (!msg) return null;
  return <div className={`toast toast--${type}`}>{msg}</div>;
}

export default function ShopPage({ user }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingProduct, setEditingProduct] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const canEdit = user.role === "admin" || user.role === "moderator";
  const canDelete = user.role === "admin";

  const showToast = (msg, type = "success") => setToast({ msg, type });
  const hideToast = useCallback(() => setToast({ msg: "", type: "success" }), []);

  // Пр. 4: загрузка через API
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterCat) params.category = filterCat;
      if (search) params.search = search;
      const data = await productsApi.getAll(params);
      setProducts(data);
    } catch (e) {
      showToast(e.response?.data?.error || "Ошибка загрузки товаров", "error");
    } finally {
      setLoading(false);
    }
  }, [filterCat, search]);

  useEffect(() => {
    productsApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(loadProducts, 300);
    return () => clearTimeout(t);
  }, [loadProducts]);

  const openCreate = () => { setModalMode("create"); setEditingProduct(null); setModalOpen(true); };
  const openEdit = (p) => { setModalMode("edit"); setEditingProduct(p); setModalOpen(true); };

  const handleSubmit = async (payload) => {
    try {
      if (modalMode === "create") {
        const p = await productsApi.create(payload);
        setProducts(prev => [p, ...prev]);
        showToast("✅ Товар создан");
      } else {
        const p = await productsApi.update(editingProduct.id, payload);
        setProducts(prev => prev.map(x => x.id === p.id ? p : x));
        showToast("✅ Товар обновлён");
      }
      setModalOpen(false);
    } catch (e) {
      showToast(e.response?.data?.error || "Ошибка сохранения", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить товар?")) return;
    try {
      await productsApi.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast("✅ Товар удалён");
    } catch (e) {
      showToast(e.response?.data?.error || "Ошибка удаления", "error");
    }
  };

  return (
    <main style={{ flex: 1, padding: "24px 24px 40px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Панель управления */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, alignItems: "center" }}>
          <h1 style={{ fontSize: 22, flex: "0 0 auto" }}>Товары</h1>
          <input className="input" placeholder="🔍 Поиск..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 220, flex: "0 0 auto" }} />
          <select className="input" value={filterCat} onChange={e => setFilterCat(e.target.value)}
            style={{ width: 180, flex: "0 0 auto" }}>
            <option value="">Все категории</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {canEdit && (
            <button className="btn btn--primary" onClick={openCreate} style={{ marginLeft: "auto" }}>
              + Добавить товар
            </button>
          )}
        </div>

        {/* Сетка товаров — Пр. 4 */}
        {loading ? (
          <div className="loading">Загрузка товаров...</div>
        ) : products.length === 0 ? (
          <div className="empty">Товары не найдены</div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                canEdit={canEdit}
                onEdit={openEdit}
                onDelete={canDelete ? handleDelete : null}
              />
            ))}
          </div>
        )}
      </div>

      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initial={editingProduct}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      <Toast msg={toast.msg} type={toast.type} onClose={hideToast} />
    </main>
  );
}
