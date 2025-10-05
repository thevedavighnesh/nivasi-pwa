import { useEffect, useState } from 'react';
import { useAuthStore } from './store';
import * as SecureStore from 'expo-secure-store';

const TENANT_INFO_KEY = `${process.env.EXPO_PUBLIC_PROJECT_GROUP_ID}-tenant-info`;

/**
 * Hook to fetch and manage tenant information for authenticated tenant users
 */
export const useTenantInfo = () => {
  const { auth, isReady } = useAuthStore();
  const [tenantInfo, setTenantInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTenantInfo = async () => {
      if (!isReady || !auth) {
        setIsLoading(false);
        return;
      }

      // Check if user is a tenant
      if (auth.user?.user_type !== 'tenant') {
        setIsLoading(false);
        return;
      }

      try {
        // Try to get cached tenant info first
        const cachedInfo = await SecureStore.getItemAsync(TENANT_INFO_KEY);
        if (cachedInfo) {
          setTenantInfo(JSON.parse(cachedInfo));
        }

        // Fetch fresh tenant info from API
        const baseURL = process.env.EXPO_PUBLIC_BASE_URL;
        const response = await fetch(`${baseURL}/api/auth/tenant-info`, {
          headers: {
            'Authorization': `Bearer ${auth.jwt}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('No active tenancy found for this user');
          }
          throw new Error('Failed to fetch tenant info');
        }

        const data = await response.json();
        
        // Store in secure storage
        await SecureStore.setItemAsync(TENANT_INFO_KEY, JSON.stringify(data));
        setTenantInfo(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching tenant info:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantInfo();
  }, [auth, isReady]);

  const refreshTenantInfo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const baseURL = process.env.EXPO_PUBLIC_BASE_URL;
      const response = await fetch(`${baseURL}/api/auth/tenant-info`, {
        headers: {
          'Authorization': `Bearer ${auth.jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh tenant info');
      }

      const data = await response.json();
      await SecureStore.setItemAsync(TENANT_INFO_KEY, JSON.stringify(data));
      setTenantInfo(data);
    } catch (err) {
      console.error('Error refreshing tenant info:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTenantInfo = async () => {
    await SecureStore.deleteItemAsync(TENANT_INFO_KEY);
    setTenantInfo(null);
  };

  return {
    tenantInfo,
    tenantId: tenantInfo?.tenant_id || null,
    propertyId: tenantInfo?.property_id || null,
    isLoading,
    error,
    refreshTenantInfo,
    clearTenantInfo,
  };
};

export default useTenantInfo;
