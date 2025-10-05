import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import {
  User,
  Mail,
  Phone,
  Home,
  Calendar,
  LogOut,
  Bell,
  Shield,
  HelpCircle,
} from "lucide-react-native";
import ScreenContainer from "../../components/ScreenContainer";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme } from "../../components/hooks/useTheme";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useTenantInfo } from "../../utils/auth/useTenantInfo";

export default function TenantProfileScreen() {
  const { colors } = useTheme();
  const [tenantData, setTenantData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Get tenant ID from auth
  const { tenantId, isLoading: tenantLoading } = useTenantInfo();

  const fetchTenantData = async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/dashboard?tenant_id=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch tenant data');
      const data = await response.json();
      setTenantData(data.dashboard?.tenant);
    } catch (error) {
      console.error('Error fetching tenant data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchTenantData();
    }
  }, [tenantId]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          // Handle logout logic here
          Alert.alert('Success', 'Logged out successfully');
        }}
      ]
    );
  };

  if (!fontsLoaded || loading || tenantLoading) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const tenant = tenantData || {};

  const menuItems = [
    { icon: Bell, label: 'Notifications', onPress: () => Alert.alert('Coming Soon', 'Notifications feature coming soon!') },
    { icon: Shield, label: 'Privacy & Security', onPress: () => Alert.alert('Coming Soon', 'Privacy settings coming soon!') },
    { icon: HelpCircle, label: 'Help & Support', onPress: () => Alert.alert('Help', 'Contact support at support@nivasi.com') },
  ];

  return (
    <ScreenContainer>
      <ScreenHeader title="Profile" />

      {/* Profile Card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 20,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#3B82F615",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <User size={40} color="#3B82F6" strokeWidth={1.5} />
          </View>

          <Text
            style={{
              fontSize: 22,
              fontFamily: "Inter_600SemiBold",
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {tenant.name || 'Tenant Name'}
          </Text>

          <View
            style={{
              backgroundColor: "#10B98115",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_500Medium",
                color: "#10B981",
              }}
            >
              ACTIVE TENANT
            </Text>
          </View>

          <View style={{ width: "100%", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Mail size={16} color={colors.secondaryText} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  color: colors.text,
                  marginLeft: 8,
                }}
              >
                {tenant.email || 'email@example.com'}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Phone size={16} color={colors.secondaryText} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  color: colors.text,
                  marginLeft: 8,
                }}
              >
                {tenant.phone || '+91-9876543210'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Lease Information */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Inter_600SemiBold",
            color: colors.text,
            marginBottom: 12,
          }}
        >
          Lease Information
        </Text>

        <View
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Home size={16} color={colors.secondaryText} strokeWidth={1.5} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_500Medium",
                color: colors.text,
                marginLeft: 8,
              }}
            >
              {tenant.property_name || 'Property Name'}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Inter_400Regular",
                  color: colors.secondaryText,
                  marginBottom: 4,
                }}
              >
                Monthly Rent
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  color: colors.text,
                }}
              >
                {formatCurrency(tenant.rent_amount || 0)}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Inter_400Regular",
                  color: colors.secondaryText,
                  marginBottom: 4,
                }}
              >
                Lease End Date
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  color: colors.text,
                }}
              >
                {formatDate(tenant.lease_end_date)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Inter_600SemiBold",
            color: colors.text,
            marginBottom: 12,
          }}
        >
          Settings
        </Text>

        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <item.icon size={20} color={colors.text} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_500Medium",
                  color: colors.text,
                  marginLeft: 12,
                }}
              >
                {item.label}
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: colors.secondaryText }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: "#FEE2E2",
            borderWidth: 1,
            borderColor: "#FECACA",
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LogOut size={20} color="#EF4444" strokeWidth={1.5} />
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_600SemiBold",
              color: "#EF4444",
              marginLeft: 8,
            }}
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
