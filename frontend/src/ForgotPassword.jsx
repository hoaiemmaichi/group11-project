import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  // No longer showing token; users must check their email

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
  // no-op
    try {
      const res = await axios.post(`${API}/auth/forgot-password`, { email });
      setMessage(res.data?.message || 'Đã gửi yêu cầu');
  // do not show token
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setMessage(msg);
    } finally { setLoading(false); }
  };

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <input className="input" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
      </div>
      <button className="btn" type="submit" disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>
      {message && <div style={{marginTop:8}}>{message}</div>}
      {/* Token is not shown; check your email for instructions */}
    </form>
  );
}
