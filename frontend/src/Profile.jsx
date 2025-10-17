import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from './components/Modal';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Profile({ token, onUpdated, currentUser, setCurrentUser }) {
  const [form, setForm] = useState({ name: currentUser?.name || '', email: currentUser?.email || '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [openEdit, setOpenEdit] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setMessage('');
        const res = await axios.get(`${API}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const { name, email } = res.data || {};
        setForm({ name: name || '', email: email || '' });
      } catch (err) {
        const serverMsg = err.response?.data?.message || err.message;
        setMessage(serverMsg || 'Không thể tải hồ sơ');
      }
    }
    if (token) fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm('Bạn có chắc chắn muốn cập nhật thông tin?')) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.put(`${API}/profile`, { name: form.name, email: form.email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updated = res.data;
      if (setCurrentUser) {
        setCurrentUser(updated);
        try { localStorage.setItem('currentUser', JSON.stringify(updated)); } catch (_) {}
      }
      if (onUpdated) onUpdated(updated);
      setMessage('Cập nhật thành công');
      setOpenEdit(false);
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      setMessage(serverMsg || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{padding:18}}>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-summary">
            <div className="profile-name">{form.name}</div>
            <div className="profile-email">{form.email}</div>
          </div>
          <div className="profile-actions">
            <button className="btn small" onClick={() => { setOpenEdit(true); setMessage(''); }}>Sửa</button>
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-field">
            <div className="profile-label">Họ và tên</div>
            <div className="profile-value">{form.name}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Email</div>
            <div className="profile-value">{form.email}</div>
          </div>
        </div>
      </div>

      <Modal open={openEdit} title="Cập nhật thông tin" onClose={() => setOpenEdit(false)}>
        <form className="user-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input className="input" name="name" placeholder="Tên" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <input className="input" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button type="button" className="btn small" onClick={() => setOpenEdit(false)}>Hủy</button>
            <button className="btn small" type="submit" disabled={loading}>{loading ? 'Đang...' : 'Lưu'}</button>
          </div>
        </form>
        {message && <div style={{marginTop:8,color: message.includes('thành công') ? '#2e7d32' : '#c62828'}}>{message}</div>}
      </Modal>
    </div>
  );
}


