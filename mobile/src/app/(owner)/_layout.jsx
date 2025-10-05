import { Tabs } from "expo-router";
import {
  BarChart3,
  Building2,
  Users,
  CreditCard,
  FileText,
} from "lucide-react-native";
import { useColorScheme } from "react-native";

export default function OwnerTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: isDark ? "#2A2A2A" : "#EAECF0",
          paddingBottom: 10,
          paddingTop: 10,
          height: 80,
        },
        tabBarActiveTintColor: isDark ? "#FFFFFF" : "#1F2233",
        tabBarInactiveTintColor: isDark ? "#A1A1AA" : "#6F7683",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <BarChart3 color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: "Properties",
          tabBarIcon: ({ color, size }) => (
            <Building2 color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="tenants"
        options={{
          title: "Tenants",
          tabBarIcon: ({ color, size }) => (
            <Users color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ color, size }) => (
            <CreditCard color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
    </Tabs>
  );
}