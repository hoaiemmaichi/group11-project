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

  useEffect(() => { fetchUsers(); }, [refreshFlag]);

  const fetchUsers = async () => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API}/users`, config);
      setUsers(res.data || []);
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
      await fetchUsers();
    } catch (err) {
      if (err.response && err.response.status === 404) {
        alert('Người dùng này đã bị xóa hoặc không tồn tại!');
        await fetchUsers();
      } else if (err.response && err.response.status === 400) {
        alert(err.response.data?.message || 'Không thể xóa người dùng');
      } else if (err.response && err.response.status === 403) {
        alert('Bạn không có quyền xóa người dùng này');
      } else {
        alert('Xóa thất bại!');
      }
    }
  };

  // Role is view-only now per requirements

  return (
    <div className="user-list-section">
      <h2 className="section-title">Danh sách người dùng</h2>
      {users.length === 0 ? (
        <div className="empty">Chưa có người dùng nào.</div>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table className="user-table" style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{textAlign:'left', padding:'8px'}}>STT</th>
                <th style={{textAlign:'left', padding:'8px'}}>Họ và tên</th>
                <th style={{textAlign:'left', padding:'8px'}}>Gmail</th>
                <th style={{textAlign:'left', padding:'8px'}}>Phân quyền</th>
                <th style={{textAlign:'left', padding:'8px'}}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u._id} style={{borderTop:'1px solid #eee'}}>
                  <td style={{padding:'8px'}}>{idx + 1}</td>
                  <td style={{padding:'8px'}}>{u.name}</td>
                  <td style={{padding:'8px'}}>{u.email}</td>
                  <td style={{padding:'8px'}}>{(u.role || 'user') === 'admin' ? 'Admin' : 'User'}</td>
                  <td style={{padding:'8px'}}>
                    <button className="btn delete" onClick={() => handleDelete(u._id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
