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
          console.log('🔐 Login attempt...');
          
          const response = await api.post<AuthResponse>('/auth/login', credentials);
          const { access_token, user } = response.data;
          
          console.log('✅ Login successful:', user.email, user.role);
          console.log('🔑 Token received:', access_token.substring(0, 30) + '...');
          
          // Save to localStorage
          localStorage.setItem('token', access_token);
          localStorage.setItem('user', JSON.stringify(user));
          
          console.log('💾 Saved to localStorage');
          
          // Update Zustand state
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          console.log('✅ State updated - isAuthenticated: true');
          
        } catch (error: any) {
          console.error('❌ Login failed:', error.response?.data || error.message);
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          console.log('📝 Registration attempt...');
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
        console.log('✅ Logged out');
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        console.log('🔍 checkAuth called');
        console.log('   Token exists:', !!token);
        console.log('   User exists:', !!userStr);
        
        if (!token || !userStr) {
          console.log('⚠️ No auth data - setting unauthenticated');
          set({ isAuthenticated: false, user: null, token: null });
          return;
        }

        try {
          const user = JSON.parse(userStr);
          
          // Set state optimistically
          set({
            user,
            token,
            isAuthenticated: true,
          });
          
          console.log('✅ Auth state restored from localStorage');
          console.log('   User:', user.email, user.role);
          
          // Try to verify with backend (but don't fail if it errors)
          try {
            const response = await api.get<User>('/auth/me');
            console.log('✅ Token verified with backend');
            
            set({
              user: response.data,
              token,
              isAuthenticated: true,
            });
          } catch (verifyError) {
            console.warn('⚠️ Backend verification failed, but keeping local auth');
            // Don't clear auth here - let it stay authenticated
          }
          
        } catch (error) {
          console.error('❌ checkAuth failed - clearing auth');
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