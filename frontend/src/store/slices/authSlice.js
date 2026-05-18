import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginAPI, getMeAPI } from '../../api/authAPI';

const normalizeUser = (user) => {
  if (!user) return null;
  return { ...user, id: user._id || user.id };
};

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await loginAPI(credentials);
    const user = normalizeUser(data.data.user);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token: data.data.token, user };
  } catch (err) {
    // Network error (backend unreachable)
    if (!err.response) {
      return rejectWithValue('Cannot connect to server. Make sure the backend is running.');
    }
    return rejectWithValue(err.response?.data?.message || 'Login failed. Please try again.');
  }
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await getMeAPI();
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired. Please login again.');
  }
});

const storedUser = (() => {
  try {
    const u = JSON.parse(localStorage.getItem('user'));
    return u ? { ...u, id: u._id || u.id } : null;
  } catch { return null; }
})();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled,  (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected,   (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        const user = normalizeUser(action.payload);
        state.user = user;
        localStorage.setItem('user', JSON.stringify(user));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        // Token invalid/expired — clear session
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
  },
});

export const { logout, updateUser, clearError } = authSlice.actions;
export default authSlice.reducer;
