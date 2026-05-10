import { useLiveQuery } from 'dexie-react-hooks';
import db, { type StoreProfile } from '@/lib/db';

export function useStoreProfile() {
  const profile = useLiveQuery(() => db.storeProfile.get(1));
  const isLoading = profile === undefined;

  const saveProfile = async (data: Partial<StoreProfile>) => {
    const existing = await db.storeProfile.get(1);
    if (existing) {
      await db.storeProfile.update(1, data);
    } else {
      await db.storeProfile.put({
        id: 1,
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        theme: data.theme || 'default',
        isOnboarded: data.isOnboarded ?? false,
        businessType: data.businessType || 'GENERAL',
        useTable: data.useTable ?? false,
        usePhoneNumber: data.usePhoneNumber ?? true,
        logo: data.logo || null,
      });
    }
  };

  return {
    profile,
    isLoading,
    saveProfile,
  };
}
