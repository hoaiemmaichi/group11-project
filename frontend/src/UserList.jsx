// import React, { useEffect, useState } from "react";
// import axios from "axios";

// function UserList() {
//   const [users, setUsers] = useState([]);

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const fetchUsers = async () => {
//     try {
//       const res = await axios.get("http://localhost:3000/users");
//       setUsers(res.data);
//     } catch (error) {
//       console.error("Lỗi khi lấy dữ liệu:", error);
//     }
//   };

//   return (
//     <div>
//       <h2>Danh sách người dùng</h2>
//       <ul>
//         {users.map((user, index) => (
//           <li key={index}>
//             <strong>{user.name}</strong> - {user.email}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default UserList;

import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from './components/Modal';

const API = process.env.REACT_APP_API_URL || "http://localhost:3000";

export default function UserList({ refreshFlag, token }) {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);

  useEffect(() => { fetchUsers(); }, [refreshFlag]);

  const fetchUsers = async () => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API}/users`, config);
      setUsers(res.data);
    } catch (err) {
      console.error('Fetch users error', err);
      setUsers([]);
    }
  };

  const performDelete = async (id) => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.delete(`${API}/users/${id}`, config);
      await fetchUsers();
    } catch (err) {
      if (err.response && err.response.status === 404) {
        alert('Người dùng này đã bị xóa hoặc không tồn tại!');
        await fetchUsers();
      } else {
        alert('Xóa thất bại!');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
  };

  const handleEditCancel = () => {
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
  };

  const handleEditSave = async () => {
    try {
  const id = editingUser._id;
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  await axios.put(`${API}/users/${id}`, { name: editName, email: editEmail }, config);
      await fetchUsers(); // Luôn lấy lại danh sách user mới nhất từ backend
      setEditingUser(null);
      setEditName("");
      setEditEmail("");
    } catch (err) {
      if (err.response && err.response.status === 404) {
        alert('Người dùng này đã bị xóa hoặc không tồn tại!');
        await fetchUsers();
        setEditingUser(null);
        setEditName("");
        setEditEmail("");
      } else {
        alert('Cập nhật thất bại!');
      }
    }
  };

  return (
    <div className="user-list-section">
      <h2 className="section-title">Danh sách người dùng</h2>
      {users.length === 0 ? (
        <div className="empty">Chưa có người dùng nào.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Phân quyền</th>
                <th style={{width:140, textAlign:'right'}}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                (
                  <tr key={u._id}>
                    <td>{idx + 1}</td>
                    <td className="cell-name">{u.name}</td>
                    <td className="cell-email">{u.email}</td>
                    <td>
                      <span className={`role-chip ${u.role === 'admin' ? 'admin' : 'user'}`}>{u.role || 'user'}</span>
                    </td>
                    <td className="cell-actions">
                      <button className="btn small" onClick={() => handleEdit(u)}>Sửa</button>
                      <button className="btn small" onClick={() => setConfirmDeleteUser(u)}>Xóa</button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal sửa người dùng */}
      <Modal open={!!editingUser} title="Chỉnh sửa người dùng" onClose={handleEditCancel}>
        <div className="user-form">
          <div className="form-group">
            <input className="input" placeholder="Tên" value={editName} onChange={e => setEditName(e.target.value)} />
          </div>
          <div className="form-group">
            <input className="input" placeholder="Email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button className="btn small" onClick={handleEditCancel}>Hủy</button>
            <button className="btn small" onClick={handleEditSave}>Lưu</button>
          </div>
        </div>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal open={!!confirmDeleteUser} title="Xác nhận" onClose={() => setConfirmDeleteUser(null)}>
        <div style={{marginBottom:12}}>Bạn có chắc chắn muốn xóa người dùng {confirmDeleteUser?.name}?</div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button className="btn small" onClick={() => setConfirmDeleteUser(null)}>Hủy</button>
          <button className="btn small danger" onClick={async () => { const id = confirmDeleteUser._id; setConfirmDeleteUser(null); await performDelete(id); }}>Có</button>
        </div>
      </Modal>
    </div>
  );
}
