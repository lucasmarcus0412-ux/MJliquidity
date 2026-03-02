import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesPackage } from 'react-native-purchases';

const APPLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || 'appl_UgHvSkYPHxFiJdVoRzQPxPxSCma';
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || 'goog_kXDrxehLZzMIkzSyXuvRgTphNGX';

function getApiKey(): string {
  if (Platform.OS === 'android') return GOOGLE_API_KEY;
  return APPLE_API_KEY;
}

export const ENTITLEMENT_IDS = {
  GOLD_VIP: 'gold_vip',
  FOUR_MARKETS: '4 Markets',
  FULL_ACCESS: 'Full Access',
} as const;

export const PRODUCT_IDS = {
  GOLD_VIP: 'mjliquidity.vip.monthly',
  FOUR_MARKETS: 'mjliquidity.analysis.monthly',
  FULL_ACCESS: 'mjliquidity.bundle.monthly',
} as const;

let isConfigured = false;

export function isRevenueCatConfigured(): boolean {
  return isConfigured;
}

export async function initRevenueCat(): Promise<boolean> {
  if (isConfigured) return true;

  if (Platform.OS === 'web') return false;

  const apiKey = getApiKey();
  if (!apiKey) {
    console.log('RevenueCat: No API key configured for', Platform.OS, '- skipping init');
    return false;
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    }

    Purchases.configure({ apiKey });
    isConfigured = true;
    console.log('RevenueCat: Configured successfully for', Platform.OS);
    return true;
  } catch (error: any) {
    const msg = error?.message || '';
    if (msg.includes('Expo Go') || msg.includes('Invalid API key') || msg.includes('native store')) {
      console.log('RevenueCat: Running in Expo Go preview mode — subscriptions disabled');
    } else {
      console.log('RevenueCat init error:', msg);
    }
    return false;
  }
}

export function addCustomerInfoListener(callback: (info: CustomerInfo) => void): () => void {
  if (Platform.OS === 'web' || !isConfigured) return () => {};
  try {
    const listener = Purchases.addCustomerInfoUpdateListener(callback);
    return () => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    };
  } catch (error) {
    console.log('RevenueCat listener error:', error);
    return () => {};
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isConfigured) {
    const ok = await initRevenueCat();
    if (!ok) return null;
  }
  try {
    const info = await Purchases.getCustomerInfo();
    console.log('RevenueCat entitlements:', Object.keys(info.entitlements.active));
    return info;
  } catch (error) {
    console.log('RevenueCat getCustomerInfo:', error);
    return null;
  }
}

export function checkEntitlements(customerInfo: CustomerInfo | null): {
  hasGold: boolean;
  hasFourMarkets: boolean;
  hasFullAccess: boolean;
  isSubscribed: boolean;
} {
  if (!customerInfo) {
    return { hasGold: false, hasFourMarkets: false, hasFullAccess: false, isSubscribed: false };
  }

  const active = customerInfo.entitlements.active;
  const hasFullAccess = ENTITLEMENT_IDS.FULL_ACCESS in active;
  const hasGold = ENTITLEMENT_IDS.GOLD_VIP in active || hasFullAccess;
  const hasFourMarkets = ENTITLEMENT_IDS.FOUR_MARKETS in active || hasFullAccess;
  const isSubscribed = hasGold || hasFourMarkets || hasFullAccess;

  return { hasGold, hasFourMarkets, hasFullAccess, isSubscribed };
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (error) {
    console.log('RevenueCat getOfferings:', error);
    return [];
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (error: any) {
    if (error.userCancelled) {
      return null;
    }
    throw error;
  }
}

export async function purchaseFromPaywall(productId: string): Promise<CustomerInfo | null> {
  const offerings = await getOfferings();
  const pkg = offerings.find((p) => p.product.identifier === productId);
  if (!pkg) {
    throw new Error('Subscription not available');
  }
  return purchasePackage(pkg);
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.log('RevenueCat restorePurchases:', error);
    return null;
  }
}
