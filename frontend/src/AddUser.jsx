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
import Modal from "./components/Modal";

const API = process.env.REACT_APP_API_URL || "http://localhost:3000";

export default function AddUser({ onAdded }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation cơ bản
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const emailRegex = /^\S+@\S+\.[\S]+$/;

    if (!trimmedName) {
      alert('Name không được để trống');
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      alert('Email không hợp lệ');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(`${API}/users`, { name: trimmedName, email: trimmedEmail });
      console.log('Response:', response.data);
      setName("");
      setEmail("");
      if (onAdded) onAdded(); // báo parent refresh danh sách
      setModalMsg('Thêm user thành công!');
      setModalOpen(true);
    } catch (err) {
      console.error('Add user error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      // Bắt lỗi trùng email (MongoDB E11000)
      if (typeof msg === 'string' && msg.toLowerCase().includes('duplicate')) {
        setModalMsg('Email đã tồn tại, vui lòng dùng email khác.');
        setModalOpen(true);
      } else {
        setModalMsg(`Thêm thất bại: ${msg}`);
        setModalOpen(true);
      }
    } finally {
      setSubmitting(false);
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
      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? 'Đang thêm...' : 'Thêm người dùng'}
      </button>
      <Modal open={modalOpen} title="Thông báo" message={modalMsg} onClose={() => setModalOpen(false)} />
    </form>
  );
}
