import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from './components/Modal';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Profile({ token, onUpdated, currentUser, setCurrentUser }) {
  // Cờ tính năng: hiển thị các phần theo yêu cầu. Đặt true để BẬT.
  const SHOW_AVATAR_FEATURE = true; // Bật lại upload/hiển thị avatar
  const SHOW_DELETE_ACCOUNT = true; // Bật lại nút "Xóa tài khoản"
  // Cờ hiển thị email ngay dưới tên trong phần tiêu đề hồ sơ
  const SHOW_EMAIL_UNDER_NAME = false; // Ẩn theo yêu cầu; có thể bật lại bằng cách đặt true
  // Saved profile data shown in the view
  const [profileData, setProfileData] = useState({ name: currentUser?.name || '', email: currentUser?.email || '' });
  // Draft data for the edit modal (so Cancel/X discards changes)
  const [draft, setDraft] = useState({ name: '', email: '' });
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [openEdit, setOpenEdit] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setMessage('');
        const res = await axios.get(`${API}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const { name, email, avatarUrl: aurl } = res.data || {};
        setProfileData({ name: name || '', email: email || '' });
        if (aurl) setAvatarUrl(aurl);
      } catch (err) {
        const serverMsg = err.response?.data?.message || err.message;
        setMessage(serverMsg || 'Không thể tải hồ sơ');
      }
    }
    if (token) fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDraft(prev => ({ ...prev, [name]: value }));
  };

  const openEditModal = () => {
    setMessage('');
    setDraft({ name: profileData.name || '', email: profileData.email || '' });
    setOpenEdit(true);
  };

  const closeEditModal = () => {
    setOpenEdit(false);
    setDraft({ name: '', email: '' }); // discard edits
    setMessage('');
  };

  // Thực hiện lưu thông tin (được gọi sau khi xác nhận)
  const doSave = async () => {
    const trimmedName = (draft.name || '').trim();
    const trimmedEmail = (draft.email || '').trim();
    if (!trimmedName) { setMessage('Tên không được để trống'); return; }
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.put(`${API}/profile`, { name: trimmedName, email: trimmedEmail }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updated = res.data;
      setProfileData({ name: updated.name || trimmedName, email: updated.email || trimmedEmail });
      if (setCurrentUser) {
        const mergedUser = { ...(currentUser || {}), ...updated };
        setCurrentUser(mergedUser);
        try { localStorage.setItem('currentUser', JSON.stringify(mergedUser)); } catch (_) {}
      }
      if (onUpdated) onUpdated(updated);
      setMessage('Cập nhật thành công');
      setShowSaveConfirm(false);
      closeEditModal();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      setMessage(serverMsg || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Khi submit form, chỉ mở hộp xác nhận (không lưu ngay)
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = (draft.name || '').trim();
    if (!trimmedName) { setMessage('Tên không được để trống'); return; }
    setShowSaveConfirm(true);
  };

  return (
    <div style={{padding:18}}>
      <div className="profile-card">
        <div className="profile-header">
          {SHOW_AVATAR_FEATURE && (
            <div className="profile-avatar" style={{width:56,height:56,borderRadius:'50%',overflow:'hidden',marginRight:10}}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}} />
              ) : (
                <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#e3f2fd',color:'#1565c0',fontWeight:700}}>
                  {profileData.name ? profileData.name[0].toUpperCase() : 'U'}
                </div>
              )}
            </div>
          )}
          <div className="profile-summary">
            <div className="profile-name">{profileData.name}</div>
            {SHOW_EMAIL_UNDER_NAME && (
              <div className="profile-email">{profileData.email}</div>
            )}
          </div>
          <div className="profile-actions">
            <button className="btn small" onClick={openEditModal}>Sửa</button>
            <button className="btn small" onClick={() => setShowTokenModal(true)}>Xem Token</button>
            {SHOW_DELETE_ACCOUNT && (
              <button className="btn small danger" onClick={() => setShowDeleteConfirm(true)}>Xóa tài khoản</button>
            )}
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-field">
            <div className="profile-label">Họ và tên</div>
            <div className="profile-value">{profileData.name}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Email</div>
            <div className="profile-value">{profileData.email}</div>
          </div>
        </div>
      </div>

      <Modal open={openEdit} title="Cập nhật thông tin" onClose={closeEditModal}>
        <form className="user-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input className="input" name="name" placeholder="Tên" value={draft.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <input className="input" name="email" type="email" placeholder="Email" value={draft.email} onChange={handleChange} required />
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button type="button" className="btn small" onClick={closeEditModal}>Hủy</button>
            <button className="btn small" type="submit" disabled={loading}>{loading ? 'Đang...' : 'Lưu'}</button>
          </div>
        </form>
        {SHOW_AVATAR_FEATURE && (
          <div style={{marginTop:12}}>
            <div style={{fontWeight:600, marginBottom:6}}>Ảnh đại diện</div>
            <input type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              setMessage('');
              try {
                const formData = new FormData();
                formData.append('avatar', file);
                const res = await fetch(`${API}/upload-avatar`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` },
                  body: formData
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || 'Upload thất bại');
                setAvatarUrl(data.avatarUrl);
                if (setCurrentUser) {
                  const merged = { ...(currentUser||{}), avatarUrl: data.avatarUrl };
                  setCurrentUser(merged);
                  try { localStorage.setItem('currentUser', JSON.stringify(merged)); } catch(_){}
                }
                setMessage('Tải ảnh thành công');
              } catch (err) {
                setMessage(err.message);
              } finally { setUploading(false); }
            }} />
            {uploading && <div style={{marginTop:6}}>Đang tải ảnh...</div>}
          </div>
        )}
        {message && <div style={{marginTop:8,color: message.includes('thành công') ? '#2e7d32' : '#c62828'}}>{message}</div>}
      </Modal>

        {/* Hộp xác nhận lưu thay đổi */}
        <Modal open={showSaveConfirm} title="Xác nhận" onClose={() => setShowSaveConfirm(false)}>
          <div style={{marginBottom:12}}>Bạn có chắc chắn muốn lưu thay đổi thông tin?</div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button className="btn small" onClick={() => setShowSaveConfirm(false)}>Hủy</button>
            <button className="btn small" onClick={doSave} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </Modal>

      {/* Hộp hiển thị token truy cập */}
      <Modal open={showTokenModal} title="Token truy cập" onClose={() => { setShowTokenModal(false); setCopied(false); }}>
        <div style={{marginBottom:12, wordBreak:'break-all'}}>
          {token ? token : 'Không tìm thấy token. Vui lòng đăng nhập để xem token.'}
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end', alignItems:'center'}}>
          {copied && <div style={{color:'#2e7d32'}}>Đã sao chép</div>}
          <button className="btn small" onClick={() => { setShowTokenModal(false); setCopied(false); }}>Đóng</button>
          <button className="btn small" onClick={async () => {
            if (!token) return;
            try {
              if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(token);
              } else {
                const ta = document.createElement('textarea');
                ta.value = token;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
              }
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch (e) {
              alert('Không thể sao chép token');
            }
          }}>Sao chép</button>
        </div>
      </Modal>

        {/* Hộp xác nhận xóa tài khoản */}
        <Modal open={showDeleteConfirm} title="Xác nhận" onClose={() => setShowDeleteConfirm(false)}>
          <div style={{marginBottom:12}}>Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.</div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button className="btn small" onClick={() => setShowDeleteConfirm(false)}>Hủy</button>
            <button
              className="btn small danger"
              onClick={async () => {
                try {
                  await axios.delete(`${API}/users/${currentUser?.id || currentUser?._id}`, { headers: { Authorization: `Bearer ${token}` }});
                  setShowDeleteConfirm(false);
                  // Đăng xuất sau khi xóa chính mình
                  localStorage.removeItem('token');
                  localStorage.removeItem('currentUser');
                  window.location.reload();
                } catch (err) {
                  setShowDeleteConfirm(false);
                  alert(err.response?.data?.message || 'Xóa tài khoản thất bại');
                }
              }}
            >
              Xóa
            </button>
          </div>
        </Modal>
    </div>
  );
}


