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

function App() {
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

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
      try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch (_) {}
    }
    setShowLogin(false);
    setShowSignUp(false);
}

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  };

  return (
    <div className="app-container">
      {currentUser && currentUser.role === 'admin' ? (
        <div className="admin-card">
          <div className="admin-header">
            <h1 className="main-title" style={{marginBottom:0, textAlign:'left'}}>Quản lý người dùng</h1>
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <div style={{color:'#455a64', fontWeight:600}}>
                {currentUser?.name || currentUser?.email} — {currentUser?.role === 'admin' ? 'Admin' : 'User'}
              </div>
              <div className="admin-actions">
              <button className="btn small" onClick={() => setShowAddUser(true)}>Thêm người dùng</button>
              <button className="btn small" onClick={handleLogout}>Đăng xuất</button>
              </div>
            </div>
          </div>
          <div className="admin-content">
            <UserList refreshFlag={refreshFlag} token={token} />
          </div>
        </div>
      ) : (
        <div className="main-card">
          <h1 className="main-title">Quản lý người dùng</h1>
          {!currentUser && (
            <div className="auth-actions">
              <button className="btn small" onClick={() => { setShowLogin(true); setShowSignUp(false); }}>
                Đăng nhập
              </button>
              <button className="btn small" onClick={() => { setShowSignUp(true); setShowLogin(false); }}>
                Đăng ký
              </button>
            </div>
          )}

          {!currentUser ? (
            <div style={{padding:18, textAlign:'center'}}>
              <p>Vui lòng đăng nhập để tiếp tục.</p>
            </div>
          ) : (
            <>
              <Profile token={token} currentUser={currentUser} setCurrentUser={setCurrentUser} onDeleted={handleLogout} />
              <div style={{marginTop:8, padding:18, paddingTop:0, display:'flex', justifyContent:'center'}}>
                <button className="btn small" onClick={handleLogout}>Đăng xuất</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal open={showLogin} title="Đăng nhập" onClose={() => setShowLogin(false)}>
        <Login onLogin={handleLogin} />
      </Modal>

      <Modal open={showSignUp} title="Đăng ký" onClose={() => setShowSignUp(false)}>
        <SignUp onSignedUp={() => { setShowSignUp(false); setShowLogin(true); }} />
      </Modal>

      <Modal open={showAddUser} title="Thêm người dùng" onClose={() => setShowAddUser(false)}>
        <AddUser onAdded={() => { setShowAddUser(false); handleUserAdded(); }} token={token} />
      </Modal>
    </div>
  );
}
export default App;
