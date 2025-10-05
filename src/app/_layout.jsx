import { Stack } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../utils/auth/store";
import * as SecureStore from "expo-secure-store";
import { authKey } from "../utils/auth/store";

export default function RootLayout() {
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // Load auth state from secure storage on app start
    const loadAuth = async () => {
      try {
        const authData = await SecureStore.getItemAsync(authKey);
        if (authData) {
          const auth = JSON.parse(authData);
          setAuth(auth);
        }
      } catch (error) {
        console.error("Error loading auth:", error);
      } finally {
        // Mark auth as ready
        useAuthStore.setState({ isReady: true });
      }
    };

    loadAuth();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(owner)" />
      <Stack.Screen name="(tenant)" />
    </Stack>
  );
}