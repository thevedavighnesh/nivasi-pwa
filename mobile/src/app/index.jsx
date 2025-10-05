import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "../utils/auth/store";

export default function Index() {
  const { auth, isReady } = useAuthStore();
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserType = async () => {
      if (!isReady) return;

      if (!auth) {
        // Not authenticated, stay on this page or redirect to auth
        setLoading(false);
        return;
      }

      try {
        // Fetch user type from API
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${auth.jwt}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserType(data.user?.user_type || 'tenant');
        } else {
          // Default to tenant if fetch fails
          setUserType('tenant');
        }
      } catch (error) {
        console.error('Error fetching user type:', error);
        // Default to tenant if error
        setUserType('tenant');
      } finally {
        setLoading(false);
      }
    };

    checkUserType();
  }, [auth, isReady]);

  if (!isReady || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // If not authenticated, you could redirect to auth or show welcome screen
  // For now, default to owner interface for testing
  if (!auth) {
    return <Redirect href="/(owner)" />;
  }

  // Redirect based on user type
  if (userType === 'owner') {
    return <Redirect href="/(owner)" />;
  } else {
    return <Redirect href="/(tenant)" />;
  }
}
