import React from 'react';
import AddUser from './AddUser';
import UserList from './UserList';
import LogList from './LogList';

export default function AdminPage({ currentUser, token }) {
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{color:'#607d8b'}}>{currentUser?.name} — <strong>Admin</strong></div>
        <div style={{display:'flex',gap:8}}>
          <AddUser onAdded={() => {}} token={token} currentUser={currentUser} />
        </div>
      </div>
      <UserList token={token} currentUser={currentUser} />
      <div style={{marginTop:16}}>
        <h3>Activity logs</h3>
        <LogList token={token} />
      </div>
    </div>
  );
}
