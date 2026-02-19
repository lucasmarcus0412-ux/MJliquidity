import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesPackage } from 'react-native-purchases';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || '';

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

export async function initRevenueCat(): Promise<void> {
  if (isConfigured) return;

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    }

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      isConfigured = true;
    }
  } catch (error) {
    console.log('RevenueCat init (preview mode in Expo Go):', error);
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
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

export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.log('RevenueCat restorePurchases:', error);
    return null;
  }
}
