import axios from 'axios';

// Base API config
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Will override in prod
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Auto logout if 401 Unauthorized
      localStorage.removeItem('token');
      // Redirect handled by router or context
    }
    return Promise.reject(error);
  }
);

export default api;
