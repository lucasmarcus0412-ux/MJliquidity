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
  getModerators,
  addModerator as storeAddModerator,
  removeModerator as storeRemoveModerator,
  isUserModerator,
  Moderator,
} from './storage';

interface AppContextValue {
  isAdmin: boolean;
  isModerator: boolean;
  userName: string;
  subscriptionUrl: string;
  isLoading: boolean;
  hasSeenWelcome: boolean;
  moderators: Moderator[];
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  setUserNameValue: (name: string) => Promise<void>;
  setSubscriptionUrlValue: (url: string) => Promise<void>;
  completeWelcome: () => void;
  addModeratorByName: (username: string) => Promise<void>;
  removeModeratorById: (id: string) => Promise<void>;
  refreshModerators: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const ADMIN_PASSWORD = 'mjliquid2024';

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [userName, setUserName] = useState('');
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true);
  const [moderators, setModerators] = useState<Moderator[]>([]);

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    if (userName) {
      isUserModerator(userName).then(setIsModerator);
    } else {
      setIsModerator(false);
    }
  }, [userName, moderators]);

  async function loadState() {
    const [admin, name, subUrl, seenWelcome, mods] = await Promise.all([
      getAdminStatus(),
      getUserName(),
      getSubscriptionUrl(),
      getHasSeenWelcome(),
      getModerators(),
    ]);
    setIsAdmin(admin);
    setUserName(name || '');
    setSubscriptionUrl(subUrl);
    setHasSeenWelcome(seenWelcome);
    setModerators(mods);
    setIsLoading(false);
  }

  async function refreshModerators() {
    const mods = await getModerators();
    setModerators(mods);
  }

  async function addModeratorByName(username: string) {
    await storeAddModerator(username);
    await refreshModerators();
  }

  async function removeModeratorById(id: string) {
    await storeRemoveModerator(id);
    await refreshModerators();
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
    isModerator,
    userName,
    subscriptionUrl,
    isLoading,
    hasSeenWelcome,
    moderators,
    loginAdmin,
    logoutAdmin,
    setUserNameValue,
    setSubscriptionUrlValue,
    completeWelcome,
    addModeratorByName,
    removeModeratorById,
    refreshModerators,
  }), [isAdmin, isModerator, userName, subscriptionUrl, isLoading, hasSeenWelcome, moderators]);

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
