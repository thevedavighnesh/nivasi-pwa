import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, RefreshControl } from "react-native";
import {
  Home,
  CreditCard,
  Calendar,
  AlertCircle,
  FileText,
  Phone,
  Mail,
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

export default function TenantDashboard() {
  const { colors } = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Get tenant ID from auth
  const { tenantId, isLoading: tenantLoading, error: tenantError } = useTenantInfo();

  const fetchDashboard = async () => {
    if (!tenantId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await fetch(`/api/dashboard?tenant_id=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      const data = await response.json();
      setDashboardData(data.dashboard);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchDashboard();
    }
  }, [tenantId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (!fontsLoaded || loading || tenantLoading) {
    return null;
  }

  if (tenantError || !tenantId) {
    return (
      <ScreenContainer>
        <ScreenHeader title="My Home" />
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: colors.secondaryText }}>
            {tenantError || 'No active tenancy found'}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const tenant = dashboardData?.tenant || {};
  const nextPayment = dashboardData?.nextPayment;
  const paymentHistory = dashboardData?.paymentHistory || [];

  return (
    <ScreenContainer 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader title="My Home" />

      {/* Welcome Section */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 24,
            fontFamily: "Inter_600SemiBold",
            color: colors.text,
            marginBottom: 8,
          }}
        >
          नमस्ते, {tenant.name?.split(' ')[0] || 'Tenant'}! 👋
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontFamily: "Inter_400Regular",
            color: colors.secondaryText,
          }}
        >
          Welcome to your rental dashboard
        </Text>
      </View>

      {/* Property Info Card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#3B82F615",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Home size={24} color="#3B82F6" strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Inter_600SemiBold",
                  color: colors.text,
                  marginBottom: 2,
                }}
              >
                {tenant.property_name}
              </Text>
              {tenant.unit_number && (
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_400Regular",
                    color: colors.secondaryText,
                  }}
                >
                  Unit: {tenant.unit_number}
                </Text>
              )}
            </View>
          </View>

          <View
            style={{
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                color: colors.secondaryText,
                marginBottom: 4,
              }}
            >
              {tenant.property_address}
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Inter_400Regular",
                    color: colors.secondaryText,
                    marginBottom: 2,
                  }}
                >
                  Monthly Rent
                </Text>
                <Text
                  style={{
                    fontSize: 18,
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
                    marginBottom: 2,
                  }}
                >
                  Lease End
                </Text>
                <Text
                  style={{
                    fontSize: 14,
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
      </View>

      {/* Next Payment Card */}
      {nextPayment && (
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Next Payment
          </Text>
          <View
            style={{
              backgroundColor: nextPayment.status === 'overdue' ? "#FEF2F2" : "#F0F9FF",
              borderWidth: 1,
              borderColor: nextPayment.status === 'overdue' ? "#FEE2E2" : "#DBEAFE",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  {nextPayment.status === 'overdue' ? (
                    <AlertCircle size={20} color="#EF4444" strokeWidth={1.5} />
                  ) : (
                    <Calendar size={20} color="#3B82F6" strokeWidth={1.5} />
                  )}
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: nextPayment.status === 'overdue' ? "#EF4444" : "#3B82F6",
                      marginLeft: 8,
                    }}
                  >
                    {nextPayment.status === 'overdue' ? 'Overdue' : 'Due'}: {formatDate(nextPayment.due_date)}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 28,
                    fontFamily: "Inter_600SemiBold",
                    color: colors.text,
                  }}
                >
                  {formatCurrency(nextPayment.amount)}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: nextPayment.status === 'overdue' ? "#EF4444" : "#3B82F6",
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_600SemiBold",
                    color: "#FFFFFF",
                  }}
                >
                  Pay Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Inter_600SemiBold",
            color: colors.text,
            marginBottom: 12,
          }}
        >
          Quick Actions
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
          >
            <CreditCard size={24} color="#3B82F6" strokeWidth={1.5} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_500Medium",
                color: colors.text,
                marginTop: 8,
              }}
            >
              Pay Rent
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
          >
            <AlertCircle size={24} color="#F59E0B" strokeWidth={1.5} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_500Medium",
                color: colors.text,
                marginTop: 8,
              }}
            >
              Maintenance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
          >
            <Phone size={24} color="#10B981" strokeWidth={1.5} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_500Medium",
                color: colors.text,
                marginTop: 8,
              }}
            >
              Contact
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment History */}
      <View style={{ paddingHorizontal: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              color: colors.text,
            }}
          >
            Payment History
          </Text>
          <TouchableOpacity>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_500Medium",
                color: "#3B82F6",
              }}
            >
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {paymentHistory.slice(0, 3).map((payment) => (
          <View
            key={payment.id}
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                {formatCurrency(payment.amount)}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Inter_400Regular",
                  color: colors.secondaryText,
                }}
              >
                {formatDate(payment.due_date)}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: 
                  payment.status === 'paid' ? "#10B98115" :
                  payment.status === 'overdue' ? "#EF444415" : "#F59E0B15",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Inter_500Medium",
                  color: 
                    payment.status === 'paid' ? "#10B981" :
                    payment.status === 'overdue' ? "#EF4444" : "#F59E0B",
                }}
              >
                {payment.status.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
