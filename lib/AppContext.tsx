import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
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
import {
  initRevenueCat,
  getCustomerInfo,
  checkEntitlements,
  restorePurchases as rcRestorePurchases,
  addCustomerInfoListener,
} from './revenuecat';

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
  refreshSubscriptionStatus: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
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
  const [rcHasGold, setRcHasGold] = useState(false);
  const [rcHasPro, setRcHasPro] = useState(false);
  const [rcIsSubscribed, setRcIsSubscribed] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({ analysis: false, chat: false });
  const listenerCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    loadState();
    return () => {
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (userName) {
      isUserModerator(userName).then(setIsModerator);
    } else {
      setIsModerator(false);
    }
  }, [userName, moderators]);

  const refreshSubscriptionStatus = useCallback(async () => {
    try {
      const customerInfo = await getCustomerInfo();
      const entitlements = checkEntitlements(customerInfo);
      setRcHasGold(entitlements.hasGold);
      setRcHasPro(entitlements.hasFourMarkets);
      setRcIsSubscribed(entitlements.isSubscribed);
    } catch (error) {
      console.log('Could not refresh subscription status:', error);
    }
  }, []);

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

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        const configured = await initRevenueCat();
        if (configured) {
          const customerInfo = await getCustomerInfo();
          const entitlements = checkEntitlements(customerInfo);
          setRcHasGold(entitlements.hasGold);
          setRcHasPro(entitlements.hasFourMarkets);
          setRcIsSubscribed(entitlements.isSubscribed);
          console.log('RevenueCat initial entitlements:', entitlements);

          const removeListener = addCustomerInfoListener((updatedInfo) => {
            const updated = checkEntitlements(updatedInfo);
            setRcHasGold(updated.hasGold);
            setRcHasPro(updated.hasFourMarkets);
            setRcIsSubscribed(updated.isSubscribed);
            console.log('RevenueCat entitlements updated:', updated);
          });
          listenerCleanupRef.current = removeListener;
        }
      } catch (error) {
        console.log('RevenueCat init (Expo Go preview mode):', error);
      }
    }

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
    if (!isAdmin && /mj/i.test(name)) {
      Alert.alert('Username Not Allowed', 'Usernames containing "MJ" are reserved. Please choose a different name.');
      return;
    }
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

  async function restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await rcRestorePurchases();
      if (customerInfo) {
        const entitlements = checkEntitlements(customerInfo);
        setRcHasGold(entitlements.hasGold);
        setRcHasPro(entitlements.hasFourMarkets);
        setRcIsSubscribed(entitlements.isSubscribed);
        return entitlements.isSubscribed;
      }
      return false;
    } catch (error) {
      console.log('Restore purchases error:', error);
      return false;
    }
  }

  const canAccessGold = isAdmin || rcHasGold || hasGoldAccess(subscriptionTier);
  const canAccessPro = isAdmin || rcHasPro || hasProAccess(subscriptionTier);
  const isSubscribed = isAdmin || rcIsSubscribed || hasAnySubscription(subscriptionTier);

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
    refreshSubscriptionStatus,
    restorePurchases,
    notificationPrefs,
    setNotificationPref,
  }), [isAdmin, isModerator, userName, subscriptionUrl, isLoading, hasSeenWelcome, moderators, subscriptionTier, canAccessGold, canAccessPro, isSubscribed, rcHasGold, rcHasPro, rcIsSubscribed, notificationPrefs, refreshSubscriptionStatus]);

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
