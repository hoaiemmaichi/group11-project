import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Theo dõi trạng thái refresh token để tránh gọi nhiều lần
let isRefreshing = false;
let refreshSubscribers = [];

// Thêm subscriber vào hàng đợi
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

// Thực thi tất cả callback trong hàng đợi với token mới
function onRefreshed(token) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

// Hàm refresh token
async function refreshAuthToken() {
  try {
    console.log('🔄 Bắt đầu refresh token...');
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.log('❌ Không tìm thấy refresh token trong localStorage');
      throw new Error('No refresh token available');
    }
    console.log(`📤 Gửi refresh token cũ: ${refreshToken.substring(0, 10)}...`);

    const response = await axios.post(`${API}/auth/refresh`, { refreshToken });
    const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;
    console.log('✅ Nhận token mới từ server');

    // Lưu tokens mới
    localStorage.setItem('token', newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
      console.log(`📥 Đã lưu refresh token mới: ${newRefreshToken.substring(0, 10)}...`);
    }
    console.log('✅ Hoàn tất refresh token');

    return newAccessToken;
  } catch (error) {
    // Xóa hết tokens nếu refresh thất bại
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    throw error;
  }
}

// Request interceptor: thêm Authorization header từ localStorage
axios.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: xử lý 401 và refresh token
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Nếu không phải lỗi 401 hoặc đã thử refresh rồi, reject luôn
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Nếu đang refresh token rồi thì đợi kết quả
    if (isRefreshing) {
      try {
        const token = await new Promise((resolve, reject) => {
          subscribeTokenRefresh(token => {
            if (token) resolve(token);
            else reject(new Error('Failed to refresh token'));
          });
        });
        
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return axios(originalRequest);
      } catch (err) {
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    // Bắt đầu refresh token
    isRefreshing = true;

    try {
      const newToken = await refreshAuthToken();
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      onRefreshed(newToken);
      isRefreshing = false;
      return axios(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      onRefreshed(null);
      // Chuyển về trang login nếu refresh thất bại
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

export default axios;
