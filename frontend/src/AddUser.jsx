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

export default function AddUser({ onAdded, token }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false); // modal tạo user
  const [noticeOpen, setNoticeOpen] = useState(false); // modal thông báo
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
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.post(`${API}/users`, { name: trimmedName, email: trimmedEmail }, config);
      console.log('Response:', response.data);
      setName("");
      setEmail("");
      if (onAdded) onAdded(); // báo parent refresh danh sách
      setModalMsg('Thêm user thành công!');
      setNoticeOpen(true);
    } catch (err) {
      console.error('Add user error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      // Bắt lỗi trùng email (MongoDB E11000)
      if (typeof msg === 'string' && msg.toLowerCase().includes('duplicate')) {
        setModalMsg('Email đã tồn tại, vui lòng dùng email khác.');
        setNoticeOpen(true);
      } else {
        setModalMsg(`Thêm thất bại: ${msg}`);
        setNoticeOpen(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button className="btn small" type="button" onClick={() => setModalOpen(true)}>Thêm người dùng</button>

      <Modal open={modalOpen} title="Thêm người dùng" onClose={() => setModalOpen(false)}>
        <form className="user-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Họ và tên" required />
          </div>
          <div className="form-group">
            <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Gmail" type="email" required />
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <button type="button" className="btn small" onClick={() => setModalOpen(false)}>Hủy</button>
            <button className="btn small" type="submit" disabled={submitting}>{submitting ? 'Đang thêm...' : 'Thêm'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={noticeOpen} title="Thông báo" message={modalMsg} onClose={() => setNoticeOpen(false)} />
    </>
  );
}
