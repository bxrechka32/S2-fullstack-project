// Пр. 4: API-клиент на axios для связи с бэкендом
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
    "accept": "application/json",
  },
  withCredentials: true, // Пр. 9: передаём cookie (refresh token)
});

// Автоматически добавляем Authorization заголовок из localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Пр. 10: автоматическое обновление access-токена через refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(
          "http://localhost:3000/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        const newToken = res.data.accessToken;
        localStorage.setItem("accessToken", newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        localStorage.removeItem("accessToken");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

// Товары
export const productsApi = {
  getAll: (params) => apiClient.get("/products", { params }).then(r => r.data),
  getById: (id) => apiClient.get(`/products/${id}`).then(r => r.data),
  create: (data) => apiClient.post("/products", data).then(r => r.data),
  update: (id, data) => apiClient.put(`/products/${id}`, data).then(r => r.data),
  delete: (id) => apiClient.delete(`/products/${id}`),
  getCategories: () => apiClient.get("/categories").then(r => r.data),
};

// Аутентификация
export const authApi = {
  register: (data) => apiClient.post("/auth/register", data).then(r => r.data),
  login: (data) => apiClient.post("/auth/login", data).then(r => r.data),
  logout: () => apiClient.post("/auth/logout").then(r => r.data),
  me: () => apiClient.get("/auth/me").then(r => r.data),
  refresh: () => apiClient.post("/auth/refresh").then(r => r.data),
  getSessions: () => apiClient.get("/auth/sessions").then(r => r.data),
};

// Пользователи (только для admin)
export const usersApi = {
  getAll: () => apiClient.get("/users").then(r => r.data),
  changeRole: (id, role) => apiClient.patch(`/users/${id}/role`, { role }).then(r => r.data),
};

export default apiClient;
