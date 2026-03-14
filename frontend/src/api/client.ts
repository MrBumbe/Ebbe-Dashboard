import axios from 'axios';

// Parent-facing API client — attaches JWT and handles token refresh.
const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('ebbe_access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try refreshing the access token once
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as typeof err.config & { _retry?: boolean };
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('ebbe_refresh');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
          const newToken: string = res.data.data.accessToken;
          localStorage.setItem('ebbe_access', newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return client(original);
        } catch {
          localStorage.removeItem('ebbe_access');
          localStorage.removeItem('ebbe_refresh');
          window.location.href = '/parent/login';
        }
      } else {
        window.location.href = '/parent/login';
      }
    }
    return Promise.reject(err);
  },
);

export default client;
