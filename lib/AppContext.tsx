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
  resetHasSeenWelcome as storeResetHasSeenWelcome,
  getModerators,
  addModerator as storeAddModerator,
  removeModerator as storeRemoveModerator,
  isUserModerator,
  Moderator,
  SubscriptionTier,
  getSubscriptionTier,
  setSubscriptionTier as storeSubscriptionTier,
  hasGoldAccess,
  hasProAccess,
  hasAnySubscription,
  NotificationPreferences,
  getNotificationPreferences,
  setNotificationPreference as storeNotificationPreference,
} from './storage';

interface AppContextValue {
  isAdmin: boolean;
  isModerator: boolean;
  userName: string;
  subscriptionUrl: string;
  isLoading: boolean;
  hasSeenWelcome: boolean;
  moderators: Moderator[];
  subscriptionTier: SubscriptionTier;
  canAccessGold: boolean;
  canAccessPro: boolean;
  isSubscribed: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  setUserNameValue: (name: string) => Promise<void>;
  setSubscriptionUrlValue: (url: string) => Promise<void>;
  completeWelcome: () => void;
  showWelcomeAgain: () => void;
  addModeratorByName: (username: string) => Promise<void>;
  removeModeratorById: (id: string) => Promise<void>;
  refreshModerators: () => Promise<void>;
  notificationPrefs: NotificationPreferences;
  setNotificationPref: (key: 'analysis' | 'chat', enabled: boolean) => Promise<void>;
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
  const [subscriptionTier, setSubscriptionTierState] = useState<SubscriptionTier>('none');
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({ analysis: false, chat: false });

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
    const [admin, name, subUrl, seenWelcome, mods, subTier, notifPrefs] = await Promise.all([
      getAdminStatus(),
      getUserName(),
      getSubscriptionUrl(),
      getHasSeenWelcome(),
      getModerators(),
      getSubscriptionTier(),
      getNotificationPreferences(),
    ]);
    setIsAdmin(admin);
    setUserName(name || '');
    setSubscriptionUrl(subUrl);
    setHasSeenWelcome(seenWelcome);
    setModerators(mods);
    setSubscriptionTierState(subTier);
    setNotificationPrefs(notifPrefs);
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

  function showWelcomeAgain() {
    setHasSeenWelcome(false);
    storeResetHasSeenWelcome();
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

  async function setNotificationPref(key: 'analysis' | 'chat', enabled: boolean) {
    setNotificationPrefs(prev => ({ ...prev, [key]: enabled }));
    await storeNotificationPreference(key, enabled);
  }

  const canAccessGold = isAdmin || hasGoldAccess(subscriptionTier);
  const canAccessPro = isAdmin || hasProAccess(subscriptionTier);
  const isSubscribed = isAdmin || hasAnySubscription(subscriptionTier);

  const value = useMemo(() => ({
    isAdmin,
    isModerator,
    userName,
    subscriptionUrl,
    isLoading,
    hasSeenWelcome,
    moderators,
    subscriptionTier,
    canAccessGold,
    canAccessPro,
    isSubscribed,
    loginAdmin,
    logoutAdmin,
    setUserNameValue,
    setSubscriptionUrlValue,
    completeWelcome,
    showWelcomeAgain,
    addModeratorByName,
    removeModeratorById,
    refreshModerators,
    notificationPrefs,
    setNotificationPref,
  }), [isAdmin, isModerator, userName, subscriptionUrl, isLoading, hasSeenWelcome, moderators, subscriptionTier, canAccessGold, canAccessPro, isSubscribed, notificationPrefs]);

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
