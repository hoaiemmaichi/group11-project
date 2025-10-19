import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function ResetPassword() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API}/auth/reset-password`, { token, newPassword, confirmNewPassword });
      setMessage(res.data?.message || 'Thành công');
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setMessage(msg);
    } finally { setLoading(false); }
  };

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <input className="input" placeholder="Token" value={token} onChange={e=>setToken(e.target.value)} required />
      </div>
      <div className="form-group">
        <input className="input" type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
      </div>
      <div className="form-group">
        <input className="input" type="password" placeholder="Xác nhận mật khẩu" value={confirmNewPassword} onChange={e=>setConfirmNewPassword(e.target.value)} required />
      </div>
      <button className="btn" type="submit" disabled={loading}>{loading ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
      {message && <div style={{marginTop:8}}>{message}</div>}
    </form>
  );
}
