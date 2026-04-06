import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  // TODO: Add auth token from storage
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    // TODO: Handle global errors (401, 500, etc.)
    return Promise.reject(error);
  },
);

export default apiClient;
