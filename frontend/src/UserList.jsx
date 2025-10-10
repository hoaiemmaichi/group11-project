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

export default function UserList({ refreshFlag }) {
  const [users, setUsers] = useState([]);
  useEffect(() => { fetchUsers(); }, [refreshFlag]);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users from:', `${API}/users`);
      const res = await axios.get(`${API}/users`);
      console.log('Users fetched:', res.data);
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch users error:", err);
      alert(`Lỗi khi lấy danh sách: ${err.response?.data?.error || err.message}`);
      setUsers([]);
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
              <div className="user-name">{u.name}</div>
              <div className="user-email">{u.email}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
