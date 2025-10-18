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

  const handleUserAdded = () => {
    setRefreshFlag(prev => prev + 1);
  };

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  });

  const handleLogin = (newToken, user) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    setShowLogin(false);
    setShowSignUp(false);
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  };

  return (
    <div className="app-container">
      <div className={`main-card${currentUser?.role === 'admin' ? ' admin' : ''}`}>
        <h1 className="main-title">Quản lý người dùng</h1>
        {/* auth buttons centered in card when not logged in */}
        {!currentUser && (
          <div className="auth-actions">
            <button className="btn small" onClick={() => { setShowLogin(true); setShowSignUp(false); }}>Đăng nhập</button>
            <button className="btn small" onClick={() => { setShowSignUp(true); setShowLogin(false); }}>Đăng ký</button>
          </div>
        )}
        {/* If not logged in: show intro + prompt to login/signup */}
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
            {/* Removed top user line for cleaner look */}
            <Profile token={token} currentUser={currentUser} setCurrentUser={setCurrentUser} />
            <div style={{marginTop:8, padding:18, paddingTop:0, display:'flex', justifyContent:'center'}}>
              <button className="btn small" onClick={() => setShowLogoutConfirm(true)}>Đăng xuất</button>
            </div>
          </>
        )}

        <Modal open={showLogin} title="Đăng nhập" onClose={() => setShowLogin(false)}>
          <Login
            onLogin={handleLogin}
            onForgot={() => { setShowLogin(false); setShowForgot(true); }}
            onReset={() => { setShowLogin(false); setShowReset(true); }}
          />
        </Modal>

        <Modal open={showSignUp} title="Đăng ký" onClose={() => setShowSignUp(false)}>
          <SignUp onSignedUp={() => { setShowSignUp(false); setShowLogin(true); }} />
        </Modal>

        <Modal open={showForgot} title="Quên mật khẩu" onClose={() => setShowForgot(false)}>
          <ForgotPassword />
        </Modal>

        <Modal open={showReset} title="Đổi mật khẩu bằng token" onClose={() => setShowReset(false)}>
          <ResetPassword />
        </Modal>

        {/* Xác nhận đăng xuất */}
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
