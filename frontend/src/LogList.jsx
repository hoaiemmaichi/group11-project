import React, { useEffect, useState } from 'react';
import axios from './api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function LogList({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchLogs(page); }, [page]);
  // SSE: subscribe to new logs
  useEffect(() => {
    if (!token) return;
    const url = `${API_BASE}/logs/stream?token=${encodeURIComponent(token)}`;
    let es;
    try {
      es = new EventSource(url);
    } catch (err) {
      console.warn('EventSource not available', err);
      return;
    }
    es.onmessage = (e) => {
      try {
        const obj = JSON.parse(e.data);
        // prepend new log and expand it
        setLogs(prev => [obj, ...prev]);
        setExpanded(obj._id);
      } catch (err) {}
    };
    es.onerror = (err) => {
      // console.warn('SSE error', err);
    };
    return () => { try { es.close(); } catch(_) {} };
  }, [token]);

  async function fetchLogs(p = 1) {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/logs?limit=200&page=${p}`);
      setLogs(res.data.items || []);
    } catch (err) {
      console.error('Fetch logs error', err);
      setLogs([]);
    } finally { setLoading(false); }
  }

  return (
    <div style={{minWidth:700}}>
      <h3>Activity logs</h3>
      {loading ? <div>Đang tải...</div> : (
        <div style={{maxHeight:600, overflow:'auto'}}>
          <table className="table">
            <thead>
              <tr>
                <th style={{width:180}}>Thời gian</th>
                <th style={{width:140}}>Người dùng (id)</th>
                <th style={{width:140}}>Hành động</th>
                <th style={{width:140}}>IP</th>
                <th>Meta / Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <React.Fragment key={l._id}>
                  <tr onClick={() => setExpanded(expanded === l._id ? null : l._id)} style={{cursor:'pointer'}}>
                    <td style={{whiteSpace:'nowrap'}}>{new Date(l.timestamp).toLocaleString()}</td>
                    <td>{l.userId || '-'}</td>
                    <td>{l.action}</td>
                    <td>{l.ip || '-'}</td>
                    <td>{l.meta ? (typeof l.meta === 'string' ? l.meta : JSON.stringify(l.meta)) : ''}</td>
                  </tr>
                  {expanded === l._id && (
                    <tr>
                      <td colSpan={5} style={{padding:12}}>
                        <pre>{JSON.stringify(l, null, 2)}</pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
        <button className="btn small" onClick={() => setPage(p => Math.max(1, p-1))}>Previous</button>
        <button className="btn small" onClick={() => setPage(p => p+1)}>Next</button>
      </div>
    </div>
  );
}
