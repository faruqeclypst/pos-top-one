import { useLiveQuery } from 'dexie-react-hooks';
import db, { type StoreProfile } from '@/lib/db';

export function useStoreProfile() {
  const profiles = useLiveQuery(() => db.storeProfile.toArray());
  const profile = profiles ? profiles[0] : undefined;
  const isLoading = profiles === undefined;

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
