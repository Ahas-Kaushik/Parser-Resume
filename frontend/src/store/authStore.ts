import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import type { User, LoginCredentials, RegisterData } from '../types';

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          console.log('🔐 Attempting login...');
          
          const response = await api.post<AuthResponse>('/auth/login', credentials);
          const { access_token, user } = response.data;
          
          console.log('✅ Login response received:', { user, token: access_token.substring(0, 20) + '...' });
          
          // Save to localStorage IMMEDIATELY
          localStorage.setItem('token', access_token);
          localStorage.setItem('user', JSON.stringify(user));
          
          console.log('💾 Token saved to localStorage');
          console.log('👤 User saved to localStorage');
          
          // Update state
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          console.log('✅ Auth state updated:', { isAuthenticated: true, role: user.role });
          
        } catch (error: any) {
          console.error('❌ Login failed:', error.response?.data || error.message);
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          console.log('📝 Attempting registration...');
          await api.post('/auth/register', data);
          set({ isLoading: false });
          console.log('✅ Registration successful');
        } catch (error: any) {
          console.error('❌ Registration failed:', error.response?.data || error.message);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        console.log('🚪 Logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        console.log('✅ Logged out successfully');
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        console.log('🔍 Checking auth state...');
        console.log('  - Token in localStorage:', !!token);
        console.log('  - User in localStorage:', !!userStr);
        
        if (!token || !userStr) {
          console.log('⚠️ No token or user found - user not authenticated');
          set({ isAuthenticated: false, user: null, token: null });
          return;
        }

        try {
          const user = JSON.parse(userStr);
          
          // Set state first (optimistic)
          set({
            user,
            token,
            isAuthenticated: true,
          });
          
          console.log('✅ Auth restored from localStorage:', { email: user.email, role: user.role });
          
          // Verify token is still valid
          const response = await api.get<User>('/auth/me');
          
          console.log('✅ Token verified with backend');
          
          // Update with fresh data from backend
          set({
            user: response.data,
            token,
            isAuthenticated: true,
          });
          
        } catch (error) {
          console.error('❌ Auth verification failed - clearing state');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);