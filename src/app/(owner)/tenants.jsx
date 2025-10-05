import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from "react-native";
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  CreditCard,
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

export default function TenantsScreen() {
  const { colors } = useTheme();
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: '',
    email: '',
    phone: '',
    property_id: '',
    unit_number: '',
    rent_amount: '',
    deposit_amount: '',
    lease_start_date: '',
    lease_end_date: ''
  });

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Mock owner ID - in production this would come from auth
  const ownerId = 1;

  const fetchTenants = async () => {
    try {
      const response = await fetch(`/api/tenants?owner_id=${ownerId}`);
      if (!response.ok) throw new Error('Failed to fetch tenants');
      const data = await response.json();
      setTenants(data.tenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch(`/api/properties?owner_id=${ownerId}`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      setProperties(data.properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchTenants(), fetchProperties()]).finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchTenants(), fetchProperties()]).finally(() => {
      setRefreshing(false);
    });
  };

  const handleAddTenant = async () => {
    try {
      if (!newTenant.name || !newTenant.email || !newTenant.phone || !newTenant.property_id || !newTenant.rent_amount || !newTenant.lease_start_date) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTenant,
          rent_amount: parseFloat(newTenant.rent_amount),
          deposit_amount: parseFloat(newTenant.deposit_amount || 0),
          property_id: parseInt(newTenant.property_id),
        }),
      });

      if (!response.ok) throw new Error('Failed to add tenant');

      setShowAddModal(false);
      setNewTenant({
        name: '',
        email: '',
        phone: '',
        property_id: '',
        unit_number: '',
        rent_amount: '',
        deposit_amount: '',
        lease_start_date: '',
        lease_end_date: ''
      });
      fetchTenants();
    } catch (error) {
      console.error('Error adding tenant:', error);
      Alert.alert('Error', 'Failed to add tenant');
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

  return (
    <ScreenContainer 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader 
        title="Tenants" 
        rightIcon={Plus} 
        onRightPress={() => setShowAddModal(true)}
      />

      {/* Tenants List */}
      <View style={{ paddingHorizontal: 20 }}>
        {tenants.length > 0 ? (
          tenants.map((tenant) => (
            <TouchableOpacity
              key={tenant.id}
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              {/* Tenant Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
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
                  <Users size={24} color="#3B82F6" strokeWidth={1.5} />
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
                    {tenant.tenant_name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_400Regular",
                      color: colors.secondaryText,
                    }}
                  >
                    {tenant.property_name} {tenant.unit_number && `• ${tenant.unit_number}`}
                  </Text>
                </View>

                {/* Status Badge */}
                <View
                  style={{
                    backgroundColor: tenant.status === 'active' ? "#10B98115" : "#F59E0B15",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Inter_500Medium",
                      color: tenant.status === 'active' ? "#10B981" : "#F59E0B",
                    }}
                  >
                    {tenant.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Contact Info */}
              <View style={{ marginBottom: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Phone size={14} color={colors.secondaryText} strokeWidth={1.5} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_400Regular",
                      color: colors.secondaryText,
                      marginLeft: 8,
                    }}
                  >
                    {tenant.tenant_phone}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Mail size={14} color={colors.secondaryText} strokeWidth={1.5} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_400Regular",
                      color: colors.secondaryText,
                      marginLeft: 8,
                    }}
                  >
                    {tenant.tenant_email}
                  </Text>
                </View>
              </View>

              {/* Payment Info */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <CreditCard size={16} color="#10B981" strokeWidth={1.5} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        color: colors.secondaryText,
                        marginLeft: 4,
                      }}
                    >
                      Rent
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: colors.text,
                    }}
                  >
                    {formatCurrency(tenant.rent_amount)}
                  </Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <AlertCircle size={16} color="#F59E0B" strokeWidth={1.5} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        color: colors.secondaryText,
                        marginLeft: 4,
                      }}
                    >
                      Pending
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: colors.text,
                    }}
                  >
                    {tenant.pending_payments || 0}
                  </Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Calendar size={16} color="#EF4444" strokeWidth={1.5} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        color: colors.secondaryText,
                        marginLeft: 4,
                      }}
                    >
                      Overdue
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: colors.text,
                    }}
                  >
                    {tenant.overdue_payments || 0}
                  </Text>
                </View>
              </View>

              {/* Quick Actions */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#10B981",
                    borderRadius: 8,
                    padding: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Inter_500Medium",
                      color: "#FFFFFF",
                    }}
                  >
                    Call
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#3B82F6",
                    borderRadius: 8,
                    padding: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Inter_500Medium",
                      color: "#FFFFFF",
                    }}
                  >
                    Message
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#F59E0B",
                    borderRadius: 8,
                    padding: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Inter_500Medium",
                      color: "#FFFFFF",
                    }}
                  >
                    Reminder
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
            }}
          >
            <Users size={48} color={colors.secondaryText} strokeWidth={1} />
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                color: colors.text,
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              No Tenants Yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                color: colors.secondaryText,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Add tenants to your properties to start collecting rent
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
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_500Medium",
                  color: "#FFFFFF",
                  marginLeft: 8,
                }}
              >
                Add Tenant
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Add Tenant Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: "Inter_600SemiBold",
                  color: colors.text,
                }}
              >
                Add Tenant
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.text} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScreenContainer style={{ backgroundColor: "transparent" }}>
              <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: colors.text,
                      marginBottom: 8,
                    }}
                  >
                    Tenant Name *
                  </Text>
                  <TextInput
                    value={newTenant.name}
                    onChangeText={(text) => setNewTenant({...newTenant, name: text})}
                    placeholder="Enter tenant name"
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

                <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Inter_500Medium",
                        color: colors.text,
                        marginBottom: 8,
                      }}
                    >
                      Email *
                    </Text>
                    <TextInput
                      value={newTenant.email}
                      onChangeText={(text) => setNewTenant({...newTenant, email: text})}
                      placeholder="email@example.com"
                      placeholderTextColor={colors.placeholderText}
                      keyboardType="email-address"
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

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Inter_500Medium",
                        color: colors.text,
                        marginBottom: 8,
                      }}
                    >
                      Phone *
                    </Text>
                    <TextInput
                      value={newTenant.phone}
                      onChangeText={(text) => setNewTenant({...newTenant, phone: text})}
                      placeholder="+91-9876543210"
                      placeholderTextColor={colors.placeholderText}
                      keyboardType="phone-pad"
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
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: colors.text,
                      marginBottom: 8,
                    }}
                  >
                    Property *
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Inter_400Regular",
                      color: colors.secondaryText,
                      marginBottom: 8,
                    }}
                  >
                    Select property ID: {properties.map(p => `${p.id} - ${p.name}`).join(', ')}
                  </Text>
                  <TextInput
                    value={newTenant.property_id}
                    onChangeText={(text) => setNewTenant({...newTenant, property_id: text})}
                    placeholder="Enter property ID"
                    placeholderTextColor={colors.placeholderText}
                    keyboardType="numeric"
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

                <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Inter_500Medium",
                        color: colors.text,
                        marginBottom: 8,
                      }}
                    >
                      Unit Number
                    </Text>
                    <TextInput
                      value={newTenant.unit_number}
                      onChangeText={(text) => setNewTenant({...newTenant, unit_number: text})}
                      placeholder="A-101"
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

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Inter_500Medium",
                        color: colors.text,
                        marginBottom: 8,
                      }}
                    >
                      Rent Amount (₹) *
                    </Text>
                    <TextInput
                      value={newTenant.rent_amount}
                      onChangeText={(text) => setNewTenant({...newTenant, rent_amount: text})}
                      placeholder="25000"
                      placeholderTextColor={colors.placeholderText}
                      keyboardType="numeric"
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
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: colors.text,
                      marginBottom: 8,
                    }}
                  >
                    Lease Start Date *
                  </Text>
                  <TextInput
                    value={newTenant.lease_start_date}
                    onChangeText={(text) => setNewTenant({...newTenant, lease_start_date: text})}
                    placeholder="YYYY-MM-DD (e.g. 2024-01-01)"
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

                <TouchableOpacity
                  onPress={handleAddTenant}
                  style={{
                    backgroundColor: "#3B82F6",
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: "#FFFFFF",
                    }}
                  >
                    Add Tenant
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