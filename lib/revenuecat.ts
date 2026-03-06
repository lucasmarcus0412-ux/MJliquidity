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

export const ANDROID_PRODUCT_IDS = {
  GOLD_VIP: 'mjliquidity.vip.monthly:gold-vip-monthly',
  FOUR_MARKETS: 'mjliquidity.analysis.monthly:analysis-monthly',
  FULL_ACCESS: 'mjliquidity.bundle.monthly:bundle-monthly',
} as const;

export function getPackagePriceString(packages: PurchasesPackage[], productId: string): string | null {
  const pkg = findPackageByProductId(packages, productId);
  if (pkg) {
    return pkg.product.priceString;
  }
  return null;
}

export function findPackageByProductId(packages: PurchasesPackage[], productId: string): PurchasesPackage | undefined {
  let pkg = packages.find((p) => p.product.identifier === productId);
  if (pkg) return pkg;

  pkg = packages.find((p) => p.product.identifier.startsWith(productId));
  if (pkg) return pkg;

  const androidId = Object.entries(PRODUCT_IDS).find(([, v]) => v === productId);
  if (androidId) {
    const androidProductId = ANDROID_PRODUCT_IDS[androidId[0] as keyof typeof ANDROID_PRODUCT_IDS];
    if (androidProductId) {
      pkg = packages.find((p) => p.product.identifier === androidProductId);
      if (pkg) return pkg;
    }
  }

  return undefined;
}

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
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.INFO);

    console.log('RevenueCat: Configuring for', Platform.OS, 'with key:', apiKey.substring(0, 8) + '...');
    Purchases.configure({ apiKey });
    isConfigured = true;
    console.log('RevenueCat: Configured successfully for', Platform.OS);
    return true;
  } catch (error: any) {
    const msg = error?.message || '';
    console.log('RevenueCat init error for', Platform.OS, ':', msg);
    if (msg.includes('already configured') || msg.includes('has been configured')) {
      isConfigured = true;
      return true;
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
  if (!isConfigured) {
    console.log('RevenueCat getOfferings: Not configured, attempting init...');
    const ok = await initRevenueCat();
    if (!ok) {
      console.log('RevenueCat getOfferings: Init failed, cannot fetch offerings');
      return [];
    }
  }

  try {
    console.log('RevenueCat getOfferings: Fetching offerings for', Platform.OS);
    const offerings = await Purchases.getOfferings();
    console.log('RevenueCat getOfferings: Raw response -', 
      'current:', offerings.current ? 'exists' : 'null',
      'all keys:', Object.keys(offerings.all || {}));

    if (offerings.current && offerings.current.availablePackages.length > 0) {
      console.log('RevenueCat getOfferings: Found', offerings.current.availablePackages.length, 'packages:',
        offerings.current.availablePackages.map(p => p.product.identifier));
      return offerings.current.availablePackages;
    }

    const allOfferingKeys = Object.keys(offerings.all || {});
    if (allOfferingKeys.length > 0) {
      console.log('RevenueCat getOfferings: No current offering, checking all:', allOfferingKeys);
      for (const key of allOfferingKeys) {
        const offering = offerings.all[key];
        if (offering.availablePackages.length > 0) {
          console.log('RevenueCat getOfferings: Using offering', key, 'with', offering.availablePackages.length, 'packages');
          return offering.availablePackages;
        }
      }
    }

    console.log('RevenueCat getOfferings: No packages found in any offering');
    return [];
  } catch (error: any) {
    console.log('RevenueCat getOfferings error:', error?.message || error);
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
  const pkg = findPackageByProductId(offerings, productId);
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
