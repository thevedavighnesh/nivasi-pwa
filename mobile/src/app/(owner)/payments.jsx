import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from "react-native";
import {
  CreditCard,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  X,
} from "lucide-react-native";
import ScreenContainer from "../../components/ScreenContainer";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme } from "../../components/hooks/useTheme";
import KeyboardAvoidingAnimatedView from "../../components/KeyboardAvoidingAnimatedView";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

export default function PaymentsScreen() {
  const { colors } = useTheme();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Mock owner ID - in production this would come from auth
  const ownerId = 1;

  const fetchPayments = async () => {
    try {
      const url = filterStatus === 'all' 
        ? `/api/payments?owner_id=${ownerId}`
        : `/api/payments?owner_id=${ownerId}&status=${filterStatus}`;
      
      const response = await fetch(url);
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
    fetchPayments();
  }, [filterStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const markAsPaid = async (paymentId) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: paymentId,
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
          payment_method: 'Cash'
        }),
      });

      if (!response.ok) throw new Error('Failed to update payment');
      fetchPayments();
      Alert.alert('Success', 'Payment marked as paid');
    } catch (error) {
      console.error('Error updating payment:', error);
      Alert.alert('Error', 'Failed to update payment');
    }
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
    total: payments.length,
    paid: payments.filter(p => p.status === 'paid').length,
    pending: payments.filter(p => p.status === 'pending').length,
    overdue: payments.filter(p => p.status === 'overdue').length,
    totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
    collectedAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0),
  };

  return (
    <ScreenContainer 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader 
        title="Payments" 
        rightIcon={Filter} 
        onRightPress={() => setShowFilterModal(true)}
      />

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
              Collected
            </Text>
            <Text style={{
              fontSize: 20,
              fontFamily: "Inter_600SemiBold",
              color: "#10B981",
            }}>
              {formatCurrency(stats.collectedAmount)}
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
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: colors.text,
                      marginBottom: 4,
                    }}>
                      {payment.tenant_name}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      fontFamily: "Inter_400Regular",
                      color: colors.secondaryText,
                      marginBottom: 4,
                    }}>
                      {payment.property_name} {payment.unit_number && `• ${payment.unit_number}`}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
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
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{
                      fontSize: 18,
                      fontFamily: "Inter_600SemiBold",
                      color: colors.text,
                      marginBottom: 4,
                    }}>
                      {formatCurrency(payment.amount)}
                    </Text>
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: `${getStatusColor(payment.status)}15`,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
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
                  </View>
                </View>

                {payment.status !== 'paid' && (
                  <TouchableOpacity
                    onPress={() => markAsPaid(payment.id)}
                    style={{
                      backgroundColor: "#10B981",
                      borderRadius: 8,
                      padding: 12,
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: "#FFFFFF",
                    }}>
                      Mark as Paid
                    </Text>
                  </TouchableOpacity>
                )}
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
              No Payments Found
            </Text>
            <Text style={{
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              color: colors.secondaryText,
              textAlign: "center",
            }}>
              Payment records will appear here
            </Text>
          </View>
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={true}
      >
        <View style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
          }}>
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}>
              <Text style={{
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                color: colors.text,
              }}>
                Filter Payments
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={colors.text} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            {['all', 'paid', 'pending', 'overdue'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => {
                  setFilterStatus(status);
                  setShowFilterModal(false);
                }}
                style={{
                  padding: 16,
                  backgroundColor: filterStatus === status ? "#3B82F615" : colors.cardBackground,
                  borderRadius: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: filterStatus === status ? "#3B82F6" : colors.border,
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontFamily: "Inter_500Medium",
                  color: filterStatus === status ? "#3B82F6" : colors.text,
                  textTransform: "capitalize",
                }}>
                  {status === 'all' ? 'All Payments' : status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
