import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getMyGoalsAPI, getTeamGoalsAPI, createGoalAPI, updateGoalAPI, deleteGoalAPI, submitGoalsAPI, approveGoalAPI, returnGoalAPI } from '../../api/goalAPI';

export const fetchMyGoals = createAsyncThunk('goals/fetchMy', async (params, { rejectWithValue }) => {
  try { const { data } = await getMyGoalsAPI(params); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch goals'); }
});

export const fetchTeamGoals = createAsyncThunk('goals/fetchTeam', async (params, { rejectWithValue }) => {
  try { const { data } = await getTeamGoalsAPI(params); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch team goals'); }
});

export const createGoal = createAsyncThunk('goals/create', async (goalData, { rejectWithValue }) => {
  try { const { data } = await createGoalAPI(goalData); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create goal'); }
});

export const updateGoal = createAsyncThunk('goals/update', async ({ id, data: goalData }, { rejectWithValue }) => {
  try { const { data } = await updateGoalAPI(id, goalData); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update goal'); }
});

export const deleteGoal = createAsyncThunk('goals/delete', async (id, { rejectWithValue }) => {
  try { await deleteGoalAPI(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete goal'); }
});

export const submitGoals = createAsyncThunk('goals/submit', async (data, { rejectWithValue }) => {
  try { const res = await submitGoalsAPI(data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to submit goals'); }
});

const goalSlice = createSlice({
  name: 'goals',
  initialState: { myGoals: [], teamGoals: [], loading: false, error: null, submitting: false },
  reducers: {
    clearGoalError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyGoals.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyGoals.fulfilled, (state, action) => { state.loading = false; state.myGoals = action.payload; })
      .addCase(fetchMyGoals.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchTeamGoals.pending, (state) => { state.loading = true; })
      .addCase(fetchTeamGoals.fulfilled, (state, action) => { state.loading = false; state.teamGoals = action.payload; })
      .addCase(fetchTeamGoals.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createGoal.fulfilled, (state, action) => { state.myGoals.unshift(action.payload); })
      .addCase(updateGoal.fulfilled, (state, action) => {
        const idx = state.myGoals.findIndex((g) => g._id === action.payload._id || g.id === action.payload.id);
        if (idx !== -1) state.myGoals[idx] = action.payload;
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.myGoals = state.myGoals.filter((g) => (g._id || g.id) !== action.payload);
      })
      .addCase(submitGoals.pending, (state) => { state.submitting = true; })
      .addCase(submitGoals.fulfilled, (state) => {
        state.submitting = false;
        state.myGoals = state.myGoals.map((g) =>
          ['draft', 'returned'].includes(g.status) ? { ...g, status: 'submitted' } : g
        );
      })
      .addCase(submitGoals.rejected, (state, action) => { state.submitting = false; state.error = action.payload; });
  },
});

export const { clearGoalError } = goalSlice.actions;
export default goalSlice.reducer;
