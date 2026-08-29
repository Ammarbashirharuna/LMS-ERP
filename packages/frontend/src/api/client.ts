import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : "/api/v1",
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const refreshBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : "/api/v1";
        const res = await axios.post(`${refreshBase}/auth/refresh`, { refreshToken });
          const newToken = res.data.accessToken;
          localStorage.setItem("accessToken", newToken);
          apiClient.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
      }
    }

    // Extract meaningful error message from backend
    const message = error.response?.data?.error
      || error.response?.data?.message
      || (error.response?.status === 401 ? "Session expired. Please log in again."
      : error.response?.status === 403 ? "You don't have permission to do this."
      : error.response?.status === 404 ? "The requested resource was not found."
      : error.response?.status === 429 ? "Too many requests. Please wait a moment and try again."
      : error.response?.status >= 500 ? "Server error. Please try again later."
      : error.message || "An unexpected error occurred.");
    const enhancedError = new Error(message);
    (enhancedError as any).status = error.response?.status;
    return Promise.reject(enhancedError);
  },
);

export { apiClient };
