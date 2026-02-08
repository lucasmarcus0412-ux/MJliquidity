import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  getAdminStatus,
  setAdminStatus as storeAdminStatus,
  getUserName,
  setUserName as storeUserName,
  getSubscriptionUrl,
  setSubscriptionUrl as storeSubscriptionUrl,
} from './storage';

interface AppContextValue {
  isAdmin: boolean;
  userName: string;
  subscriptionUrl: string;
  isLoading: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  setUserNameValue: (name: string) => Promise<void>;
  setSubscriptionUrlValue: (url: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const ADMIN_PASSWORD = 'mjliquid2024';

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    const [admin, name, subUrl] = await Promise.all([
      getAdminStatus(),
      getUserName(),
      getSubscriptionUrl(),
    ]);
    setIsAdmin(admin);
    setUserName(name || '');
    setSubscriptionUrl(subUrl);
    setIsLoading(false);
  }

  function loginAdmin(password: string): boolean {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      storeAdminStatus(true);
      return true;
    }
    return false;
  }

  function logoutAdmin() {
    setIsAdmin(false);
    storeAdminStatus(false);
  }

  async function setUserNameValue(name: string) {
    setUserName(name);
    await storeUserName(name);
  }

  async function setSubscriptionUrlValue(url: string) {
    setSubscriptionUrl(url);
    await storeSubscriptionUrl(url);
  }

  const value = useMemo(() => ({
    isAdmin,
    userName,
    subscriptionUrl,
    isLoading,
    loginAdmin,
    logoutAdmin,
    setUserNameValue,
    setSubscriptionUrlValue,
  }), [isAdmin, userName, subscriptionUrl, isLoading]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
