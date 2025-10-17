import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Login({ onLogin }) {
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
      const user = res.data.user;
      if (token) {
        localStorage.setItem('token', token);
        if (onLogin) onLogin(token, user);
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
      <div className="form-group">
        <input className="input" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <input className="input" placeholder="Mật khẩu" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      </div>
      <button className="btn" type="submit" disabled={loading}>{loading ? 'Đang...' : 'Đăng nhập'}</button>
      {message && <div style={{marginTop:8,color:'#c62828'}}>{message}</div>}
    </form>
  );
}
