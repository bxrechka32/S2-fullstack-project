// Пр. 1: компонент карточки товара — использует классы из CSS-препроцессора
// .card (миксин), .card__title, .card__category (вложенная структура BEM)
export default function ProductCard({ product, canEdit, onEdit, onDelete }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Пр. 1: вложенная структура .card__category — аналог &__category в SASS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{
          fontSize: 11, padding: "2px 8px", borderRadius: 20,
          background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
          color: "#a5b4fc",
        }}>
          {product.category}
        </span>
        {product.rating > 0 && (
          <span style={{ fontSize: 13, color: "#fde68a" }}>
            ★ {product.rating}
          </span>
        )}
      </div>

      <div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
          {product.title}
        </div>
        <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>
          {product.description}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
        <span style={{ fontWeight: 700, fontSize: 17, color: "#a5b4fc" }}>
          {product.price.toLocaleString("ru-RU")} ₽
        </span>
        <span style={{ fontSize: 12, opacity: 0.6 }}>
          На складе: {product.stock}
        </span>
      </div>

      {canEdit && (
        <div style={{ display: "flex", gap: 6, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10 }}>
          <button className="btn btn--sm" style={{ flex: 1, justifyContent: "center" }}
            onClick={() => onEdit(product)}>
            Редактировать
          </button>
          <button className="btn btn--sm btn--danger"
            onClick={() => onDelete(product.id)}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
