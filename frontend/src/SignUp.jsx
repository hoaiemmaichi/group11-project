import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function SignUp({ onSignedUp }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    // client-side validation: match passwords
    if (password !== confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      // send only name/email/password; backend will ignore confirmPassword
      console.log('Signup: sending to', `${API}/auth/signup`, { name, email });
      const res = await axios.post(`${API}/auth/signup`, { name, email, password });
      setMessage('Đăng ký thành công. Vui lòng đăng nhập.');
      setName(''); setEmail(''); setPassword(''); setConfirmPassword('');
      if (onSignedUp) onSignedUp();
    } catch (err) {
      console.error('Signup error', err);
      const serverMsg = err.response?.data?.message || err.response?.data || null;
      setMessage(serverMsg || err.message || 'Lỗi đăng ký');
    } finally { setLoading(false); }
  };

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <input className="input" placeholder="Tên" value={name} onChange={e=>setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <input className="input" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <input className="input" placeholder="Mật khẩu" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      </div>
      <div className="form-group">
        <input className="input" placeholder="Xác nhận mật khẩu" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
      </div>
      <button className="btn" type="submit" disabled={loading}>{loading? 'Đang...' : 'Đăng ký'}</button>
      {message && <div style={{marginTop:8,color:'#c62828'}}>{message}</div>}
    </form>
  );
}
