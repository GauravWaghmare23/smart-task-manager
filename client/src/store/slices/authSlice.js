import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      ((state.user = user),
        (state.token = token),
        (state.isAuthenticated = true),
        (state.loading = false));
    },

    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },

    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
  },
});


export const {setCredentials, setUser, setAuthLoading, logout} = authSlice.actions;

export default authSlice.reducer;