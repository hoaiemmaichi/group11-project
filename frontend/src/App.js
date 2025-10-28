// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

import React, { useState } from "react";
import "./App.css";
import UserList from "./UserList";
import AddUser from "./AddUser";
import Login from './Login';
import SignUp from './SignUp';
import Modal from './components/Modal';
import Profile from './Profile';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

function App() {
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [loginNotice, setLoginNotice] = useState('');


  const handleUserAdded = () => {
    setRefreshFlag(prev => prev + 1);
  };

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  });


  const handleLogin = (newToken, user, refreshToken) => {
    setToken(newToken);
    try { localStorage.setItem('token', newToken); } catch(_){}
    if (refreshToken) { try { localStorage.setItem('refreshToken', refreshToken); } catch(_){} }
    if (user) {
      setCurrentUser(user);
      try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch(_){}

    }
    setShowLogin(false);
    setShowSignUp(false);
  };

  const handleLogout = () => {

    // Optional: notify backend to revoke refresh token
    const rt = localStorage.getItem('refreshToken');
    if (rt) {
      try {
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt })
        }).catch(() => {});
      } catch (_) {}
    }
    setToken(null);
    setCurrentUser(null);
    try { localStorage.removeItem('token'); localStorage.removeItem('currentUser'); localStorage.removeItem('refreshToken'); } catch(_){}

  };

  return (
    <div className="app-container">
      <div className={`main-card${currentUser?.role === 'admin' ? ' admin' : ''}`}>
        <h1 className="main-title">Quản lý người dùng</h1>

  {/* Nút xác thực hiển thị ở giữa khi chưa đăng nhập */}

        {!currentUser && (
          <div className="auth-actions">
            <button className="btn small" onClick={() => { setShowLogin(true); setShowSignUp(false); }}>Đăng nhập</button>
            <button className="btn small" onClick={() => { setShowSignUp(true); setShowLogin(false); }}>Đăng ký</button>
          </div>
        )}

  {/* Khi chưa đăng nhập: hiển thị lời nhắc đăng nhập/đăng ký */}
n
        {!currentUser ? (
          <div style={{padding:18, textAlign:'center'}}>
            <p>Vui lòng đăng nhập để tiếp tục.</p>
          </div>
        ) : currentUser.role === 'admin' ? (
          <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{color:'#607d8b'}}> {currentUser.name} — <strong>Admin</strong></div>
              <div style={{display:'flex',gap:8}}>
                <AddUser onAdded={handleUserAdded} token={token} />
                <button className="btn small" onClick={() => setShowLogoutConfirm(true)}>Đăng xuất</button>
              </div>
            </div>
            <UserList refreshFlag={refreshFlag} token={token} />
          </>
        ) : (
          <>

            {/* Ẩn dòng thông tin trên cùng để gọn giao diện */}

            <Profile token={token} currentUser={currentUser} setCurrentUser={setCurrentUser} />
            <div style={{marginTop:8, padding:18, paddingTop:0, display:'flex', justifyContent:'center'}}>
              <button className="btn small" onClick={() => setShowLogoutConfirm(true)}>Đăng xuất</button>
            </div>
          </>
        )}


        <Modal open={showLogin} title="Đăng nhập" onClose={() => { setShowLogin(false); setLoginNotice(''); }}>

          <Login
            onLogin={handleLogin}
            onForgot={() => { setShowLogin(false); setShowForgot(true); }}
            onReset={() => { setShowLogin(false); setShowReset(true); }}

            notice={loginNotice}

          />
        </Modal>

        <Modal open={showSignUp} title="Đăng ký" onClose={() => setShowSignUp(false)}>

          <SignUp onSignedUp={() => { setShowSignUp(false); setLoginNotice('Đăng ký tài khoản thành công. Vui lòng đăng nhập.'); setShowLogin(true); }} />

        </Modal>

        <Modal open={showForgot} title="Quên mật khẩu" onClose={() => setShowForgot(false)}>
          <ForgotPassword />
        </Modal>

        <Modal open={showReset} title="Đổi mật khẩu bằng token" onClose={() => setShowReset(false)}>
          <ResetPassword />
        </Modal>


  {/* Hộp xác nhận đăng xuất */}

        <Modal open={showLogoutConfirm} title="Xác nhận" onClose={() => setShowLogoutConfirm(false)}>
          <div style={{marginBottom:12}}>Bạn có chắc chắn muốn đăng xuất?</div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button className="btn small" onClick={() => setShowLogoutConfirm(false)}>Hủy</button>
            <button className="btn small danger" onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}>Đăng xuất</button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default App;
