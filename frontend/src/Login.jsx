import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';


export default function Login({ onLogin, onForgot, onReset, notice }) {
  // Cờ để ẩn/hiện khu vực "Quên mật khẩu?" và "Đổi mật khẩu bằng token" trong form đăng nhập.
  // Đặt về true nếu muốn hiển thị lại sau này. Hiện tại để false để ẩn theo yêu cầu.
  const SHOW_RECOVERY_LINKS = true; // hiện tại hiển thị lại theo yêu cầu

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      console.log('Login: sending to', `${API}/auth/login`, { email });
      const res = await axios.post(`${API}/auth/login`, { email, password });
      const token = res.data.token;

      const refreshToken = res.data.refreshToken;
      const user = res.data.user;
      if (token) {
        try { localStorage.setItem('token', token); } catch(_){}
        if (refreshToken) { try { localStorage.setItem('refreshToken', refreshToken); } catch(_){} }
        if (user) {
          try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch (_) {}
        }
        if (onLogin) onLogin(token, user, refreshToken);

        setMessage('Đăng nhập thành công');
      } else {
        setMessage('Không nhận được token');
      }
    } catch (err) {
      console.error('Login error', err);
      const serverMsg = err.response?.data?.message || err.response?.data || null;
      setMessage(serverMsg || err.message || 'Lỗi đăng nhập');
    } finally { setLoading(false); }
  };

  return (
    <form className="user-form" onSubmit={handleSubmit}>

      {notice && (
        <div style={{
          marginBottom: 8,
          padding: '8px 10px',
          background: '#e8f5e9',
          color: '#2e7d32',
          border: '1px solid #c8e6c9',
          borderRadius: 8
        }}>
          {notice}
        </div>
      )}

      <div className="form-group">
        <input className="input" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <input className="input" placeholder="Mật khẩu" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      </div>
      <button className="btn" type="submit" disabled={loading}>{loading ? 'Đang...' : 'Đăng nhập'}</button>

      {SHOW_RECOVERY_LINKS && (
        <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
          {/* Giữ nguyên code; kiểm soát hiển thị bằng cờ SHOW_RECOVERY_LINKS */}
          <button type="button" className="btn link" onClick={onForgot}>Quên mật khẩu?</button>
          <button type="button" className="btn link" onClick={onReset}>Đổi mật khẩu bằng token</button>
        </div>
      )}

      {message && <div style={{marginTop:8,color:'#c62828'}}>{message}</div>}
    </form>
  );
}
