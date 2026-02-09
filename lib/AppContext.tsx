import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  getAdminStatus,
  setAdminStatus as storeAdminStatus,
  getUserName,
  setUserName as storeUserName,
  getSubscriptionUrl,
  setSubscriptionUrl as storeSubscriptionUrl,
  getHasSeenWelcome,
  setHasSeenWelcome as storeHasSeenWelcome,
} from './storage';

interface AppContextValue {
  isAdmin: boolean;
  userName: string;
  subscriptionUrl: string;
  isLoading: boolean;
  hasSeenWelcome: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  setUserNameValue: (name: string) => Promise<void>;
  setSubscriptionUrlValue: (url: string) => Promise<void>;
  completeWelcome: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const ADMIN_PASSWORD = 'mjliquid2024';

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    const [admin, name, subUrl, seenWelcome] = await Promise.all([
      getAdminStatus(),
      getUserName(),
      getSubscriptionUrl(),
      getHasSeenWelcome(),
    ]);
    setIsAdmin(admin);
    setUserName(name || '');
    setSubscriptionUrl(subUrl);
    setHasSeenWelcome(seenWelcome);
    setIsLoading(false);
  }

  function completeWelcome() {
    setHasSeenWelcome(true);
    storeHasSeenWelcome();
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
    hasSeenWelcome,
    loginAdmin,
    logoutAdmin,
    setUserNameValue,
    setSubscriptionUrlValue,
    completeWelcome,
  }), [isAdmin, userName, subscriptionUrl, isLoading, hasSeenWelcome]);

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
