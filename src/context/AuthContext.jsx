import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  subscribeToAuth,
  loginWithEmail,
  registerAdmin,
  resetAdminPassword,
  logoutUser,
  isFirebaseConfigured,
  getFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig
} from '../lib/firebase';

const AuthContext = createContext();
const DEMO_USER_STORAGE_KEY = 'demo_admin_user_v1';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedDemo = sessionStorage.getItem(DEMO_USER_STORAGE_KEY);
        if (storedDemo) return JSON.parse(storedDemo);
      } catch {
        // Ignore corrupt storage
      }
    }
    return null;
  });

  const [isConfigured, setIsConfigured] = useState(isFirebaseConfigured);
  const [loading, setLoading] = useState(() => isFirebaseConfigured());

  const refreshConfig = useCallback(() => {
    const configured = isFirebaseConfigured();
    setIsConfigured(configured);
    setLoading(configured);
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const unsubscribe = subscribeToAuth((user) => {
      // If user is real Firebase user, clear demo session
      if (user) {
        sessionStorage.removeItem(DEMO_USER_STORAGE_KEY);
        setCurrentUser(user);
      } else {
        // Keep demo user if set, otherwise null
        try {
          const storedDemo = sessionStorage.getItem(DEMO_USER_STORAGE_KEY);
          if (storedDemo) {
            setCurrentUser(JSON.parse(storedDemo));
          } else {
            setCurrentUser(null);
          }
        } catch {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isConfigured]);

  const login = async (email, password) => {
    sessionStorage.removeItem(DEMO_USER_STORAGE_KEY);
    const result = await loginWithEmail(email, password);
    setCurrentUser(result.user);
    return result.user;
  };

  const register = async (email, password) => {
    sessionStorage.removeItem(DEMO_USER_STORAGE_KEY);
    const result = await registerAdmin(email, password);
    setCurrentUser(result.user);
    return result.user;
  };

  const resetPassword = async (email) => {
    return await resetAdminPassword(email);
  };

  const loginAsDemo = () => {
    const demoUser = {
      email: 'admin@govexam.portal',
      uid: 'demo-admin-local',
      displayName: 'Portal Admin (Local/Demo)',
      isDemo: true
    };
    sessionStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
    setCurrentUser(demoUser);
    return demoUser;
  };

  const logout = async () => {
    sessionStorage.removeItem(DEMO_USER_STORAGE_KEY);
    try {
      await logoutUser();
    } catch {
      // Ignore if not logged into Firebase
    }
    setCurrentUser(null);
  };

  const setCustomConfig = (config) => {
    saveCustomFirebaseConfig(config);
    refreshConfig();
  };

  const removeCustomConfig = () => {
    clearCustomFirebaseConfig();
    refreshConfig();
  };

  const value = {
    currentUser,
    loading,
    isConfigured,
    login,
    register,
    resetPassword,
    loginAsDemo,
    logout,
    refreshConfig,
    firebaseConfig: getFirebaseConfig(),
    setCustomConfig,
    removeCustomConfig
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react/only-export-components
export const useAuth = () => useContext(AuthContext);
