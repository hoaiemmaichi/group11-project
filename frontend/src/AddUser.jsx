// import React, { useState } from "react";
// import axios from "axios";

// function AddUser() {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.post("http://localhost:3000/users", { name, email });
//       alert("Thêm user thành công!");
//       setName("");
//       setEmail("");
//     } catch (error) {
//       console.error("Lỗi khi thêm user:", error);
//     }
//   };

//   return (
//     <div>
//       <h2>Thêm người dùng</h2>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           placeholder="Tên"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           required
//         />
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />
//         <button type="submit">Thêm</button>
//       </form>
//     </div>
//   );
// }

// export default AddUser;

import React, { useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:3000";

export default function AddUser({ onAdded }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Sending request to:', `${API}/users`);
      const response = await axios.post(`${API}/users`, { name, email });
      console.log('Response:', response.data);
      setName(""); 
      setEmail("");
      if (onAdded) onAdded(); // báo parent refresh
      alert("Thêm user thành công!");
    } catch (err) {
      console.error("Add user error:", err);
      alert(`Thêm thất bại: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Tên" required />
      </div>
      <div className="form-group">
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" required />
      </div>
      <button className="btn" type="submit">Thêm người dùng</button>
    </form>
  );
}
