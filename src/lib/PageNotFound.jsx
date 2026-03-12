import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoadingPublicSettings(true);
        setIsLoadingAuth(true);

        const isAuthenticated = await base44.auth.isAuthenticated();

        if (isAuthenticated) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
          setIsAuthenticated(true);
          setAuthError(null);
        } else {
          setIsAuthenticated(false);
          setAuthError({ type: 'auth_required' });
        }
      } catch (error) {
        console.error('Auth error:', error);
        if (error.message?.includes('not registered')) {
          setAuthError({ type: 'user_not_registered' });
        } else {
          setAuthError({ type: 'auth_required' });
        }
      } finally {
        setIsLoadingAuth(false);
        setIsLoadingPublicSettings(false);
      }
    };

    initAuth();
  }, []);

  const navigateToLogin = () => {
    base44.auth.redirectToLogin();
  };

  const logout = async () => {
    await base44.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        isAuthenticated,
        navigateToLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-slate-900">404</h1>
        <p className="text-xl text-slate-600">Página não encontrada</p>
        <a href="/" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Voltar para Home
        </a>
      </div>
    </div>
  );
}