import { useLiveQuery } from 'dexie-react-hooks';
import db, { type StoreProfile } from '@/lib/db';
import { useState, useEffect } from 'react';

export function useStoreProfile() {
  const profileResult = useLiveQuery(() => db.storeProfile.get(1));
  const isLoading = profileResult === undefined;
  
  // Fallback: if still loading after 3 seconds, assume ready
  const [isTimeout, setIsTimeout] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsTimeout(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const isLoadingFinal = isLoading && !isTimeout;

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
    profile: profileResult,
    isLoading: isLoadingFinal,
    saveProfile,
  };
}
