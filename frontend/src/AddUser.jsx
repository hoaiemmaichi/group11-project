import React, { useState } from "react";
import axios from "axios";

function AddUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/users", { name, email });
      alert("Thêm user thành công!");
      setName("");
      setEmail("");
    } catch (error) {
      console.error("Lỗi khi thêm user:", error);
    }
  };

  return (
    <div>
      <h2>Thêm người dùng</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Thêm</button>
      </form>
    </div>
  );
}

export default AddUser;
