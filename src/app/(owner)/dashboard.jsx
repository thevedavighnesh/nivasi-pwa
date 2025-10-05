import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, RefreshControl } from "react-native";
import {
  Bell,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  CreditCard,
  AlertCircle,
  Calendar,
  Phone,
  MessageSquare,
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
import { useUser } from "../../utils/auth/useUser";

export default function OwnerDashboard() {
  const { colors } = useTheme();
  const { user, loading: userLoading } = useUser();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Get owner ID from authenticated user
  const ownerId = user?.id;

  const fetchDashboard = async () => {
    if (!ownerId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await fetch(`/api/dashboard?owner_id=${ownerId}`);
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
    if (!userLoading && ownerId) {
      fetchDashboard();
    }
  }, [ownerId, userLoading]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (!fontsLoaded || loading) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statsData = [
    {
      title: "Properties",
      value: dashboardData?.totalProperties || 0,
      icon: Building2,
      color: "#3B82F6",
      trend: null,
    },
    {
      title: "Active Tenants",
      value: dashboardData?.totalTenants || 0,
      icon: Users,
      color: "#10B981",
      trend: null,
    },
    {
      title: "Monthly Income",
      value: formatCurrency(dashboardData?.monthlyIncome || 0),
      icon: CreditCard,
      color: "#8B5CF6",
      trend: "up",
    },
    {
      title: "Pending Amount",
      value: formatCurrency(dashboardData?.pendingPayments?.amount || 0),
      icon: AlertCircle,
      color: "#F59E0B",
      trend: dashboardData?.pendingPayments?.count > 0 ? "down" : null,
    },
  ];

  return (
    <ScreenContainer 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader title="Nivasi Dashboard" rightIcon={Bell} showNotificationBadge={true} />

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
          नमस्ते, राजेश जी! 👋
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontFamily: "Inter_400Regular",
            color: colors.secondaryText,
          }}
        >
          आज {dashboardData?.pendingPayments?.count || 0} pending payments हैं
        </Text>
      </View>

      {/* Stats Cards */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          paddingHorizontal: 20,
          marginBottom: 24,
          gap: 12,
        }}
      >
        {statsData.map((stat, index) => (
          <View
            key={index}
            style={{
              width: "48%",
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: `${stat.color}15`,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <stat.icon size={18} color={stat.color} strokeWidth={1.5} />
              </View>
              {stat.trend && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp size={14} color="#10B981" strokeWidth={1.5} />
                  ) : (
                    <TrendingDown size={14} color="#EF4444" strokeWidth={1.5} />
                  )}
                </View>
              )}
            </View>

            <Text
              style={{
                fontSize: 20,
                fontFamily: "Inter_600SemiBold",
                color: colors.text,
                marginBottom: 4,
              }}
            >
              {stat.value}
            </Text>

            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                color: colors.secondaryText,
              }}
            >
              {stat.title}
            </Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Inter_600SemiBold",
            color: colors.text,
            marginBottom: 16,
          }}
        >
          Quick Actions
        </Text>
        
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#3B82F6",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
          >
            <Building2 size={24} color="#FFFFFF" strokeWidth={1.5} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_500Medium",
                color: "#FFFFFF",
                marginTop: 8,
              }}
            >
              Add Property
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#10B981",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
          >
            <Users size={24} color="#FFFFFF" strokeWidth={1.5} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_500Medium",
                color: "#FFFFFF",
                marginTop: 8,
              }}
            >
              Add Tenant
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#8B5CF6",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
          >
            <MessageSquare size={24} color="#FFFFFF" strokeWidth={1.5} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_500Medium",
                color: "#FFFFFF",
                marginTop: 8,
              }}
            >
              Send Reminder
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Payments */}
      <View style={{ paddingHorizontal: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              color: colors.text,
            }}
          >
            Recent Payments
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

        {dashboardData?.recentPayments?.length > 0 ? (
          dashboardData.recentPayments.slice(0, 3).map((payment, index) => (
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
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Inter_600SemiBold",
                    color: colors.text,
                    marginBottom: 4,
                  }}
                >
                  {payment.tenant_name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Inter_400Regular",
                    color: colors.secondaryText,
                    marginBottom: 4,
                  }}
                >
                  {payment.property_name} {payment.unit_number && `• ${payment.unit_number}`}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Calendar size={12} color={colors.secondaryText} strokeWidth={1.5} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Inter_400Regular",
                      color: colors.secondaryText,
                      marginLeft: 4,
                    }}
                  >
                    Due: {new Date(payment.due_date).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
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
                <View
                  style={{
                    backgroundColor: 
                      payment.status === 'paid' ? "#10B98115" :
                      payment.status === 'overdue' ? "#EF444415" : "#F59E0B15",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
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
            </View>
          ))
        ) : (
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 24,
              alignItems: "center",
            }}
          >
            <CreditCard size={48} color={colors.secondaryText} strokeWidth={1} />
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Inter_500Medium",
                color: colors.text,
                marginTop: 12,
                marginBottom: 4,
              }}
            >
              No recent payments
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                color: colors.secondaryText,
                textAlign: "center",
              }}
            >
              Payment records will appear here
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}