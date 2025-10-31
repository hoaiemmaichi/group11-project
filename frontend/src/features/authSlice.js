import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../api';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Thunk: login user (example usage)
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      return res.data; // expected { token, refreshToken, user }
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null,
  user: (() => { try { const r = localStorage.getItem('currentUser'); return r ? JSON.parse(r) : null; } catch(e) { return null; } })(),
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { token, refreshToken, user } = action.payload || {};
      state.token = token || null;
      state.refreshToken = refreshToken || null;
      state.user = user || null;
      try { if (token) localStorage.setItem('token', token); else localStorage.removeItem('token'); } catch(_) {}
      try { if (refreshToken) localStorage.setItem('refreshToken', refreshToken); else localStorage.removeItem('refreshToken'); } catch(_) {}
      try { if (user) localStorage.setItem('currentUser', JSON.stringify(user)); else localStorage.removeItem('currentUser'); } catch(_) {}
    },
    clearAuth(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
      try { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); localStorage.removeItem('currentUser'); } catch(_) {}
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { token, refreshToken, user } = action.payload || {};
        state.token = token || null;
        state.refreshToken = refreshToken || null;
        state.user = user || null;
        try { if (token) localStorage.setItem('token', token); } catch(_) {}
        try { if (refreshToken) localStorage.setItem('refreshToken', refreshToken); } catch(_) {}
        try { if (user) localStorage.setItem('currentUser', JSON.stringify(user)); } catch(_) {}
      })
      .addCase(loginUser.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload || action.error.message; });
  }
});

export const { setCredentials, clearAuth } = authSlice.actions;
export default authSlice.reducer;
