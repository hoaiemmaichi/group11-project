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

const API = process.env.REACT_APP_API_URL || "http://localhost:3000";

export default function UserList({ refreshFlag, token }) {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

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

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa user này?')) return;
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.delete(`${API}/users/${id}`, config);
      await fetchUsers(); // Luôn lấy lại danh sách user mới nhất từ backend
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
      <div className="user-list">
        {users.length === 0 ? (
          <div className="empty">Chưa có người dùng nào.</div>
        ) : (
          users.map(u => (
            <div className="user-card" key={u._id}>
              {editingUser && u._id === editingUser._id ? (
                <>
                  <div className="user-info" style={{marginRight:16}}>
                    <input className="input" value={editName} onChange={e => setEditName(e.target.value)} style={{marginBottom:4}} />
                    <input className="input" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                  </div>
                  <div className="user-actions">
                    <button className="btn edit" onClick={handleEditSave}>Lưu</button>
                    <button className="btn cancel" onClick={handleEditCancel}>Hủy</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="user-info" style={{marginRight:16}}>
                    <div className="user-name">{u.name}</div>
                    <div className="user-email">{u.email}</div>
                  </div>
                  <div className="user-actions">
                    <button className="btn edit" onClick={() => handleEdit(u)}>Sửa</button>
                    <button className="btn delete" onClick={() => handleDelete(u._id)}>Xóa</button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
