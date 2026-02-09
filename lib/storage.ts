import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ADMIN_LOGGED_IN: 'mjl_admin_logged_in',
  ANALYSIS_POSTS: 'mjl_analysis_posts',
  CHAT_MESSAGES: 'mjl_chat_messages',
  USER_NAME: 'mjl_user_name',
  SUBSCRIPTION_URL: 'mjl_subscription_url',
  HAS_SEEN_WELCOME: 'mjl_has_seen_welcome',
  GOLD_VIP_POSTS: 'mjl_gold_vip_posts',
  FOUR_MARKETS_POSTS: 'mjl_four_markets_posts',
  GOLD_VIP_CHAT: 'mjl_gold_vip_chat',
  FOUR_MARKETS_CHAT: 'mjl_four_markets_chat',
  EDUCATION_POSTS: 'mjl_education_posts',
  MODERATORS: 'mjl_moderators',
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
  timestamp: number;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getPostsKey(channel: FeedChannel): string {
  switch (channel) {
    case 'free': return KEYS.ANALYSIS_POSTS;
    case 'gold_vip': return KEYS.GOLD_VIP_POSTS;
    case 'four_markets': return KEYS.FOUR_MARKETS_POSTS;
  }
}

function getChatKey(channel: ChatChannel): string {
  switch (channel) {
    case 'gold_vip': return KEYS.GOLD_VIP_CHAT;
    case 'four_markets': return KEYS.FOUR_MARKETS_CHAT;
  }
}

export async function getAdminStatus(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ADMIN_LOGGED_IN);
  return val === 'true';
}

export async function setAdminStatus(loggedIn: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.ADMIN_LOGGED_IN, loggedIn ? 'true' : 'false');
}

export async function getAnalysisPosts(channel: FeedChannel = 'free'): Promise<AnalysisPost[]> {
  const key = getPostsKey(channel);
  const val = await AsyncStorage.getItem(key);
  if (!val) return [];
  return JSON.parse(val);
}

export async function addAnalysisPost(post: Omit<AnalysisPost, 'id' | 'timestamp'>, channel: FeedChannel = 'free'): Promise<AnalysisPost> {
  const posts = await getAnalysisPosts(channel);
  const newPost: AnalysisPost = {
    ...post,
    id: generateId(),
    timestamp: Date.now(),
    channel,
  };
  posts.unshift(newPost);
  const key = getPostsKey(channel);
  await AsyncStorage.setItem(key, JSON.stringify(posts));
  return newPost;
}

export async function deleteAnalysisPost(id: string, channel: FeedChannel = 'free'): Promise<void> {
  const posts = await getAnalysisPosts(channel);
  const filtered = posts.filter(p => p.id !== id);
  const key = getPostsKey(channel);
  await AsyncStorage.setItem(key, JSON.stringify(filtered));
}

export async function getChatMessages(channel?: ChatChannel): Promise<ChatMessage[]> {
  const key = channel ? getChatKey(channel) : KEYS.CHAT_MESSAGES;
  const val = await AsyncStorage.getItem(key);
  if (!val) return [];
  return JSON.parse(val);
}

export async function addChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>, channel?: ChatChannel): Promise<ChatMessage> {
  const messages = await getChatMessages(channel);
  const newMsg: ChatMessage = {
    ...msg,
    id: generateId(),
    timestamp: Date.now(),
  };
  messages.push(newMsg);
  const key = channel ? getChatKey(channel) : KEYS.CHAT_MESSAGES;
  await AsyncStorage.setItem(key, JSON.stringify(messages));
  return newMsg;
}

export async function getEducationPosts(): Promise<EducationPost[]> {
  const val = await AsyncStorage.getItem(KEYS.EDUCATION_POSTS);
  if (!val) return [];
  return JSON.parse(val);
}

export async function addEducationPost(post: Omit<EducationPost, 'id' | 'timestamp'>): Promise<EducationPost> {
  const posts = await getEducationPosts();
  const newPost: EducationPost = {
    ...post,
    id: generateId(),
    timestamp: Date.now(),
  };
  posts.unshift(newPost);
  await AsyncStorage.setItem(KEYS.EDUCATION_POSTS, JSON.stringify(posts));
  return newPost;
}

export async function deleteEducationPost(id: string): Promise<void> {
  const posts = await getEducationPosts();
  const filtered = posts.filter(p => p.id !== id);
  await AsyncStorage.setItem(KEYS.EDUCATION_POSTS, JSON.stringify(filtered));
}

export async function deleteChatMessage(id: string, channel?: ChatChannel): Promise<void> {
  const messages = await getChatMessages(channel);
  const filtered = messages.filter(m => m.id !== id);
  const key = channel ? getChatKey(channel) : KEYS.CHAT_MESSAGES;
  await AsyncStorage.setItem(key, JSON.stringify(filtered));
}

export async function getModerators(): Promise<Moderator[]> {
  const val = await AsyncStorage.getItem(KEYS.MODERATORS);
  if (!val) return [];
  return JSON.parse(val);
}

export async function addModerator(username: string): Promise<Moderator> {
  const mods = await getModerators();
  const existing = mods.find(m => m.username.toLowerCase() === username.toLowerCase());
  if (existing) return existing;
  const newMod: Moderator = {
    id: generateId(),
    username: username.trim(),
    addedAt: Date.now(),
  };
  mods.push(newMod);
  await AsyncStorage.setItem(KEYS.MODERATORS, JSON.stringify(mods));
  return newMod;
}

export async function removeModerator(id: string): Promise<void> {
  const mods = await getModerators();
  const filtered = mods.filter(m => m.id !== id);
  await AsyncStorage.setItem(KEYS.MODERATORS, JSON.stringify(filtered));
}

export async function isUserModerator(username: string): Promise<boolean> {
  const mods = await getModerators();
  return mods.some(m => m.username.toLowerCase() === username.toLowerCase());
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
