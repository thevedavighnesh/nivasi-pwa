import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, RefreshControl } from "react-native";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Download,
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

export default function TenantPaymentsScreen() {
  const { colors } = useTheme();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Get tenant ID from auth
  const { tenantId, isLoading: tenantLoading } = useTenantInfo();

  const fetchPayments = async () => {
    if (!tenantId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await fetch(`/api/payments?tenant_id=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      const data = await response.json();
      setPayments(data.payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchPayments();
    }
  }, [tenantId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  if (!fontsLoaded || loading || tenantLoading) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'overdue': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'overdue': return XCircle;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  const stats = {
    totalPaid: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0),
    pending: payments.filter(p => p.status === 'pending').length,
    overdue: payments.filter(p => p.status === 'overdue').length,
  };

  return (
    <ScreenContainer 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader title="My Payments" />

      {/* Stats Cards */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{
            flex: 1,
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
          }}>
            <Text style={{
              fontSize: 12,
              fontFamily: "Inter_400Regular",
              color: colors.secondaryText,
              marginBottom: 4,
            }}>
              Total Paid
            </Text>
            <Text style={{
              fontSize: 20,
              fontFamily: "Inter_600SemiBold",
              color: "#10B981",
            }}>
              {formatCurrency(stats.totalPaid)}
            </Text>
          </View>

          <View style={{
            flex: 1,
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
          }}>
            <Text style={{
              fontSize: 12,
              fontFamily: "Inter_400Regular",
              color: colors.secondaryText,
              marginBottom: 4,
            }}>
              Pending
            </Text>
            <Text style={{
              fontSize: 20,
              fontFamily: "Inter_600SemiBold",
              color: "#F59E0B",
            }}>
              {stats.pending}
            </Text>
          </View>
        </View>
      </View>

      {/* Payments List */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Inter_600SemiBold",
            color: colors.text,
            marginBottom: 12,
          }}
        >
          All Payments
        </Text>

        {payments.length > 0 ? (
          payments.map((payment) => {
            const StatusIcon = getStatusIcon(payment.status);
            return (
              <View
                key={payment.id}
                style={{
                  backgroundColor: colors.cardBackground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 18,
                      fontFamily: "Inter_600SemiBold",
                      color: colors.text,
                      marginBottom: 4,
                    }}>
                      {formatCurrency(payment.amount)}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                      <Calendar size={12} color={colors.secondaryText} strokeWidth={1.5} />
                      <Text style={{
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        color: colors.secondaryText,
                        marginLeft: 4,
                      }}>
                        Due: {formatDate(payment.due_date)}
                      </Text>
                    </View>
                    {payment.paid_date && (
                      <Text style={{
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        color: colors.secondaryText,
                      }}>
                        Paid: {formatDate(payment.paid_date)}
                      </Text>
                    )}
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: `${getStatusColor(payment.status)}15`,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      marginBottom: 8,
                    }}>
                      <StatusIcon size={12} color={getStatusColor(payment.status)} strokeWidth={2} />
                      <Text style={{
                        fontSize: 10,
                        fontFamily: "Inter_500Medium",
                        color: getStatusColor(payment.status),
                        marginLeft: 4,
                      }}>
                        {payment.status.toUpperCase()}
                      </Text>
                    </View>
                    {payment.payment_method && (
                      <Text style={{
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        color: colors.secondaryText,
                      }}>
                        {payment.payment_method}
                      </Text>
                    )}
                  </View>
                </View>

                {payment.notes && (
                  <Text style={{
                    fontSize: 12,
                    fontFamily: "Inter_400Regular",
                    color: colors.secondaryText,
                    marginBottom: 12,
                  }}>
                    {payment.notes}
                  </Text>
                )}

                <View style={{
                  flexDirection: "row",
                  gap: 8,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}>
                  {payment.status === 'pending' || payment.status === 'overdue' ? (
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: payment.status === 'overdue' ? "#EF4444" : "#3B82F6",
                        borderRadius: 8,
                        padding: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontFamily: "Inter_500Medium",
                        color: "#FFFFFF",
                      }}>
                        Pay Now
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        padding: 12,
                      }}
                    >
                      <Download size={16} color={colors.text} strokeWidth={1.5} />
                      <Text style={{
                        fontSize: 14,
                        fontFamily: "Inter_500Medium",
                        color: colors.text,
                        marginLeft: 6,
                      }}>
                        Download Receipt
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 24,
            alignItems: "center",
          }}>
            <CreditCard size={48} color={colors.secondaryText} strokeWidth={1} />
            <Text style={{
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              color: colors.text,
              marginTop: 16,
              marginBottom: 8,
            }}>
              No Payments Yet
            </Text>
            <Text style={{
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              color: colors.secondaryText,
              textAlign: "center",
            }}>
              Your payment history will appear here
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
