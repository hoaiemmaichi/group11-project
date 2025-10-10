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

function App() {
  const [refreshFlag, setRefreshFlag] = useState(0);

  const handleUserAdded = () => {
    setRefreshFlag(prev => prev + 1);
  };

  return (
    <div className="app-container">
      <div className="main-card">
        <h1 className="main-title">Quản lý người dùng</h1>
        <AddUser onAdded={handleUserAdded} />
        <UserList refreshFlag={refreshFlag} />
      </div>
    </div>
  );
}

export default App;
