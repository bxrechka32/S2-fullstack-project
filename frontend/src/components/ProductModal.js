import { useState, useEffect } from "react";

const EMPTY = { title: "", category: "", description: "", price: "", stock: "", rating: "" };

export default function ProductModal({ open, mode, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({ ...initial, price: String(initial.price), stock: String(initial.stock), rating: String(initial.rating) });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [open, initial]);

  if (!open) return null;

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.title || !form.category || !form.description || !form.price || !form.stock) {
      setError("Заполните все обязательные поля");
      return;
    }
    onSubmit({
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      rating: Number(form.rating) || 0,
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">
            {mode === "edit" ? "✏️ Редактировать товар" : "➕ Новый товар"}
          </span>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          {[
            { key: "title", label: "Название *", placeholder: "Ноутбук ASUS" },
            { key: "category", label: "Категория *", placeholder: "Электроника" },
            { key: "description", label: "Описание *", placeholder: "Описание товара" },
            { key: "price", label: "Цена (₽) *", placeholder: "65000", type: "number" },
            { key: "stock", label: "На складе *", placeholder: "10", type: "number" },
            { key: "rating", label: "Рейтинг (0-5)", placeholder: "4.5", type: "number" },
          ].map(({ key, label, placeholder, type = "text" }) => (
            <label key={key} className="label">
              {label}
              <input className="input" type={type} placeholder={placeholder}
                value={form[key]} onChange={e => update(key, e.target.value)} />
            </label>
          ))}
          {error && <div className="error">{error}</div>}
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={onClose}>Отмена</button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            {mode === "edit" ? "Сохранить" : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}
