import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { achievementAPI } from '../../api/achievementAPI';

export const fetchMyAchievements = createAsyncThunk('achievements/fetchMy', async (params, { rejectWithValue }) => {
  try {
    const data = await achievementAPI.getMyAchievements(params);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch achievements');
  }
});

export const fetchGoalAchievements = createAsyncThunk('achievements/fetchForGoal', async (goalId, { rejectWithValue }) => {
  try {
    const data = await achievementAPI.getAchievements(goalId);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch achievements');
  }
});

export const updateAchievement = createAsyncThunk('achievements/update', async ({ id, data: achData }, { rejectWithValue }) => {
  try {
    const data = await achievementAPI.updateAchievement(id, achData);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update achievement');
  }
});

export const fetchTeamAchievements = createAsyncThunk('achievements/fetchTeam', async (params, { rejectWithValue }) => {
  try {
    const data = await achievementAPI.getTeamAchievements(params);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch team achievements');
  }
});

const achievementSlice = createSlice({
  name: 'achievements',
  initialState: {
    myAchievements: [],
    goalAchievements: [],
    teamAchievements: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAchievements.pending, (state) => { state.loading = true; })
      .addCase(fetchMyAchievements.fulfilled, (state, action) => { state.loading = false; state.myAchievements = action.payload; })
      .addCase(fetchMyAchievements.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchGoalAchievements.fulfilled, (state, action) => { state.goalAchievements = action.payload; })
      .addCase(updateAchievement.fulfilled, (state, action) => {
        const idx = state.myAchievements.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.myAchievements[idx] = action.payload;
        const gIdx = state.goalAchievements.findIndex((a) => a.id === action.payload.id);
        if (gIdx !== -1) state.goalAchievements[gIdx] = action.payload;
      })
      .addCase(fetchTeamAchievements.fulfilled, (state, action) => { state.teamAchievements = action.payload; });
  },
});

export const { clearError } = achievementSlice.actions;
export default achievementSlice.reducer;
