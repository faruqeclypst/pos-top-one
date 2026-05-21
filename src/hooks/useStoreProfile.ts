import { useLiveQuery } from 'dexie-react-hooks';
import db, { type StoreProfile } from '@/lib/db';

export function useStoreProfile() {
  const profiles = useLiveQuery(() => db.storeProfile.toArray());
  const profile = profiles ? profiles[0] : undefined;
  const isLoading = profiles === undefined;

  const saveProfile = async (data: Partial<StoreProfile>) => {
    console.log("saveProfile called with:", data);
    const existing = await db.storeProfile.get(1);
    console.log("Existing profile:", existing);
    if (existing) {
      await db.storeProfile.update(1, data);
      console.log("Profile updated");
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
        isGoogleConnected: data.isGoogleConnected ?? false,
        spreadsheetId: data.spreadsheetId,
        lastCloudSync: data.lastCloudSync,
        email: data.email,
      });
      console.log("Profile created");
    }
    
    // Verify save
    const saved = await db.storeProfile.get(1);
    console.log("Profile after save:", saved);
  };

  return {
    profile,
    isLoading,
    saveProfile,
  };
}
