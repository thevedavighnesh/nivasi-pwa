import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from "react-native";
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
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
import { useTenantInfo } from "../../utils/auth/useTenantInfo";

export default function TenantMaintenanceScreen() {
  const { colors } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Get tenant ID from auth
  const { tenantId, isLoading: tenantLoading } = useTenantInfo();

  const fetchRequests = async () => {
    if (!tenantId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await fetch(`/api/maintenance?tenant_id=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch maintenance requests');
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchRequests();
    }
  }, [tenantId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleSubmitRequest = async () => {
    try {
      if (!newRequest.title || !newRequest.description) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRequest,
          tenant_id: tenantId,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit request');

      setShowAddModal(false);
      setNewRequest({ title: '', description: '', priority: 'medium' });
      fetchRequests();
      Alert.alert('Success', 'Maintenance request submitted successfully');
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit maintenance request');
    }
  };

  if (!fontsLoaded || loading || tenantLoading) {
    return null;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'pending': return AlertCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <ScreenContainer 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader 
        title="Maintenance" 
        rightIcon={Plus} 
        onRightPress={() => setShowAddModal(true)}
      />

      {/* Maintenance Requests List */}
      <View style={{ paddingHorizontal: 20 }}>
        {requests.length > 0 ? (
          requests.map((request) => {
            const StatusIcon = getStatusIcon(request.status);
            return (
              <View
                key={request.id}
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
                      {request.title}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      fontFamily: "Inter_400Regular",
                      color: colors.secondaryText,
                      marginBottom: 8,
                    }}>
                      {request.description}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      fontFamily: "Inter_400Regular",
                      color: colors.secondaryText,
                    }}>
                      Submitted: {formatDate(request.created_at)}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <View style={{
                      backgroundColor: `${getPriorityColor(request.priority)}15`,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      marginBottom: 8,
                    }}>
                      <Text style={{
                        fontSize: 10,
                        fontFamily: "Inter_500Medium",
                        color: getPriorityColor(request.priority),
                        textTransform: "uppercase",
                      }}>
                        {request.priority}
                      </Text>
                    </View>
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: `${getStatusColor(request.status)}15`,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}>
                      <StatusIcon size={12} color={getStatusColor(request.status)} strokeWidth={2} />
                      <Text style={{
                        fontSize: 10,
                        fontFamily: "Inter_500Medium",
                        color: getStatusColor(request.status),
                        marginLeft: 4,
                        textTransform: "uppercase",
                      }}>
                        {request.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </View>

                {request.resolved_at && (
                  <View style={{
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontFamily: "Inter_400Regular",
                      color: "#10B981",
                    }}>
                      ✓ Resolved on {formatDate(request.resolved_at)}
                    </Text>
                  </View>
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
            <Wrench size={48} color={colors.secondaryText} strokeWidth={1} />
            <Text style={{
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              color: colors.text,
              marginTop: 16,
              marginBottom: 8,
            }}>
              No Maintenance Requests
            </Text>
            <Text style={{
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              color: colors.secondaryText,
              textAlign: "center",
              marginBottom: 16,
            }}>
              Submit a request if you need any repairs or maintenance
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={{
                backgroundColor: "#3B82F6",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={1.5} />
              <Text style={{
                fontSize: 14,
                fontFamily: "Inter_500Medium",
                color: "#FFFFFF",
                marginLeft: 8,
              }}>
                New Request
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Add Request Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Modal Header */}
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}>
              <Text style={{
                fontSize: 20,
                fontFamily: "Inter_600SemiBold",
                color: colors.text,
              }}>
                New Maintenance Request
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.text} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScreenContainer style={{ backgroundColor: "transparent" }}>
              <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                    color: colors.text,
                    marginBottom: 8,
                  }}>
                    Title *
                  </Text>
                  <TextInput
                    value={newRequest.title}
                    onChangeText={(text) => setNewRequest({...newRequest, title: text})}
                    placeholder="e.g., Leaking faucet in kitchen"
                    placeholderTextColor={colors.placeholderText}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      fontFamily: "Inter_400Regular",
                      color: colors.text,
                      backgroundColor: colors.cardBackground,
                    }}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                    color: colors.text,
                    marginBottom: 8,
                  }}>
                    Description *
                  </Text>
                  <TextInput
                    value={newRequest.description}
                    onChangeText={(text) => setNewRequest({...newRequest, description: text})}
                    placeholder="Describe the issue in detail..."
                    placeholderTextColor={colors.placeholderText}
                    multiline
                    numberOfLines={5}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      fontFamily: "Inter_400Regular",
                      color: colors.text,
                      backgroundColor: colors.cardBackground,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>

                <View style={{ marginBottom: 24 }}>
                  <Text style={{
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                    color: colors.text,
                    marginBottom: 8,
                  }}>
                    Priority
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {['low', 'medium', 'high', 'urgent'].map((priority) => (
                      <TouchableOpacity
                        key={priority}
                        onPress={() => setNewRequest({...newRequest, priority})}
                        style={{
                          flex: 1,
                          padding: 12,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: newRequest.priority === priority ? getPriorityColor(priority) : colors.border,
                          backgroundColor: newRequest.priority === priority ? `${getPriorityColor(priority)}15` : colors.cardBackground,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{
                          fontSize: 12,
                          fontFamily: "Inter_500Medium",
                          color: newRequest.priority === priority ? getPriorityColor(priority) : colors.text,
                          textTransform: "capitalize",
                        }}>
                          {priority}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSubmitRequest}
                  style={{
                    backgroundColor: "#3B82F6",
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Text style={{
                    fontSize: 16,
                    fontFamily: "Inter_600SemiBold",
                    color: "#FFFFFF",
                  }}>
                    Submit Request
                  </Text>
                </TouchableOpacity>
              </View>
            </ScreenContainer>
          </View>
        </KeyboardAvoidingAnimatedView>
      </Modal>
    </ScreenContainer>
  );
}
