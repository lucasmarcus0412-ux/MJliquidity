import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, getApiUrl } from './query-client';
import { Platform } from 'react-native';

const apiFetch: typeof globalThis.fetch = (() => {
  if (Platform.OS === "web") {
    return globalThis.fetch.bind(globalThis);
  }
  try {
    return require("expo/fetch").fetch;
  } catch {
    return globalThis.fetch.bind(globalThis);
  }
})();

const KEYS = {
  ADMIN_LOGGED_IN: 'mjl_admin_logged_in',
  USER_NAME: 'mjl_user_name',
  SUBSCRIPTION_URL: 'mjl_subscription_url',
  HAS_SEEN_WELCOME: 'mjl_has_seen_welcome',
  SUBSCRIPTION_TIER: 'mjl_subscription_tier',
  NOTIF_ANALYSIS: 'mjl_notif_analysis',
  NOTIF_CHAT: 'mjl_notif_chat',
};

export type SubscriptionTier = 'none' | 'gold_vip' | 'pro' | 'all_access';

export type FeedChannel = 'free' | 'gold_vip' | 'four_markets';
export type ChatChannel = 'gold_vip' | 'four_markets';

export interface AnalysisPost {
  id: string;
  title: string;
  content: string;
  category: 'forex' | 'indices' | 'crypto' | 'commodities' | 'general' | 'xauusd' | 'nq' | 'es' | 'btc';
  timestamp: number;
  channel: FeedChannel;
  imageUri?: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  isAdmin: boolean;
  isModerator?: boolean;
}

export interface Moderator {
  id: string;
  username: string;
  addedAt: number;
}

export interface EducationPost {
  id: string;
  title: string;
  content: string;
  contentType: string;
  imageUri: string | null;
  linkUrl: string | null;
  timestamp: number;
}

export async function getAdminStatus(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ADMIN_LOGGED_IN);
  return val === 'true';
}

export async function setAdminStatus(loggedIn: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.ADMIN_LOGGED_IN, loggedIn ? 'true' : 'false');
}

export async function getAnalysisPosts(channel: FeedChannel = 'free'): Promise<AnalysisPost[]> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}/api/posts/${channel}`;
  const res = await apiFetch(url, {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to load posts (${res.status})`);
  const text = await res.text();
  if (!text || text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
    throw new Error("Server returned HTML instead of data.");
  }
  const data = JSON.parse(text);
  return data.map((p: any) => ({
    ...p,
    imageUri: p.imageUri || p.image_uri || undefined,
  }));
}

export async function uploadImage(base64Data: string, mimeType: string = 'image/jpeg'): Promise<string> {
  const res = await apiRequest('POST', '/api/upload', {
    imageData: base64Data,
    mimeType,
  });
  const data = await res.json();
  return data.url;
}

export async function addAnalysisPost(post: Omit<AnalysisPost, 'id' | 'timestamp'>, channel: FeedChannel = 'free'): Promise<AnalysisPost> {
  const res = await apiRequest('POST', '/api/posts', {
    title: post.title,
    content: post.content,
    category: post.category,
    channel,
    imageUri: post.imageUri || null,
  });
  return await res.json();
}

export async function deleteAnalysisPost(id: string, _channel: FeedChannel = 'free'): Promise<void> {
  await apiRequest('DELETE', `/api/posts/${id}`);
}

export async function getChatMessages(channel?: ChatChannel): Promise<ChatMessage[]> {
  const ch = channel || 'gold_vip';
  const baseUrl = getApiUrl();
  const url = `${baseUrl}/api/chat/${ch}`;
  const res = await apiFetch(url, {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to load chat (${res.status})`);
  const text = await res.text();
  return JSON.parse(text);
}

export async function addChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>, channel?: ChatChannel): Promise<ChatMessage> {
  const res = await apiRequest('POST', '/api/chat', {
    username: msg.username,
    text: msg.text,
    channel: channel || 'gold_vip',
    isAdmin: msg.isAdmin,
    isModerator: msg.isModerator || false,
  });
  return await res.json();
}

export async function deleteChatMessage(id: string, _channel?: ChatChannel): Promise<void> {
  await apiRequest('DELETE', `/api/chat/${id}`);
}

export async function getEducationPosts(): Promise<EducationPost[]> {
  try {
    const baseUrl = getApiUrl();
    const url = `${baseUrl}/api/education`;
    const res = await apiFetch(url, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return [];
    const text = await res.text();
    return JSON.parse(text);
  } catch (err) {
    console.error('Error fetching education:', err);
    return [];
  }
}

export async function addEducationPost(post: { title: string; content: string; contentType?: string; imageData?: string | null; linkUrl?: string | null }): Promise<EducationPost> {
  const res = await apiRequest('POST', '/api/education', {
    title: post.title,
    content: post.content,
    contentType: post.contentType || 'article',
    imageData: post.imageData || null,
    linkUrl: post.linkUrl || null,
  });
  return await res.json();
}

export async function deleteEducationPost(id: string): Promise<void> {
  await apiRequest('DELETE', `/api/education/${id}`);
}

export async function getModerators(): Promise<Moderator[]> {
  try {
    const baseUrl = getApiUrl();
    const url = `${baseUrl}/api/moderators`;
    const res = await apiFetch(url, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return [];
    const text = await res.text();
    return JSON.parse(text);
  } catch (err) {
    console.error('Error fetching moderators:', err);
    return [];
  }
}

export async function addModerator(username: string): Promise<Moderator> {
  const res = await apiRequest('POST', '/api/moderators', { username });
  return await res.json();
}

export async function removeModerator(id: string): Promise<void> {
  await apiRequest('DELETE', `/api/moderators/${id}`);
}

export async function isUserModerator(username: string): Promise<boolean> {
  const mods = await getModerators();
  return mods.some(m => m.username.toLowerCase() === username.toLowerCase());
}

export interface BannedUser {
  id: string;
  username: string;
  reason: string | null;
  bannedBy: string;
  bannedAt: number;
}

export async function getBannedUsers(): Promise<BannedUser[]> {
  try {
    const baseUrl = getApiUrl();
    const url = new URL('/api/banned', baseUrl);
    const res = await apiFetch(url.toString(), {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error fetching banned users:', err);
    return [];
  }
}

export async function checkUserBanned(username: string): Promise<boolean> {
  try {
    const baseUrl = getApiUrl();
    const url = new URL(`/api/banned/check/${encodeURIComponent(username)}`, baseUrl);
    const res = await apiFetch(url.toString(), {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.banned === true;
  } catch (err) {
    console.error('Error checking ban status:', err);
    return false;
  }
}

export async function banUser(username: string, bannedBy: string, reason?: string): Promise<BannedUser> {
  const res = await apiRequest('POST', '/api/banned', {
    username,
    bannedBy,
    reason: reason || null,
  });
  return await res.json();
}

export async function unbanUser(id: string): Promise<void> {
  await apiRequest('DELETE', `/api/banned/${id}`);
}

export async function getUserName(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.USER_NAME);
}

export async function setUserName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_NAME, name);
}

const DEFAULT_SUBSCRIPTION_URL = '';

export async function getSubscriptionUrl(): Promise<string> {
  const url = await AsyncStorage.getItem(KEYS.SUBSCRIPTION_URL);
  return url || DEFAULT_SUBSCRIPTION_URL;
}

export async function setSubscriptionUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.SUBSCRIPTION_URL, url);
}

export async function getHasSeenWelcome(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.HAS_SEEN_WELCOME);
  return val === 'true';
}

export async function setHasSeenWelcome(): Promise<void> {
  await AsyncStorage.setItem(KEYS.HAS_SEEN_WELCOME, 'true');
}

export async function resetHasSeenWelcome(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.HAS_SEEN_WELCOME);
}

export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  const tier = await AsyncStorage.getItem(KEYS.SUBSCRIPTION_TIER);
  return (tier as SubscriptionTier) || 'none';
}

export async function setSubscriptionTier(tier: SubscriptionTier): Promise<void> {
  await AsyncStorage.setItem(KEYS.SUBSCRIPTION_TIER, tier);
}

export function hasGoldAccess(tier: SubscriptionTier): boolean {
  return tier === 'gold_vip' || tier === 'all_access';
}

export function hasProAccess(tier: SubscriptionTier): boolean {
  return tier === 'pro' || tier === 'all_access';
}

export function hasAnySubscription(tier: SubscriptionTier): boolean {
  return tier !== 'none';
}

export interface NotificationPreferences {
  analysis: boolean;
  chat: boolean;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const analysis = await AsyncStorage.getItem(KEYS.NOTIF_ANALYSIS);
  const chat = await AsyncStorage.getItem(KEYS.NOTIF_CHAT);
  return {
    analysis: analysis === 'true',
    chat: chat === 'true',
  };
}

export async function setNotificationPreference(key: 'analysis' | 'chat', enabled: boolean): Promise<void> {
  const storageKey = key === 'analysis' ? KEYS.NOTIF_ANALYSIS : KEYS.NOTIF_CHAT;
  await AsyncStorage.setItem(storageKey, enabled ? 'true' : 'false');
}
