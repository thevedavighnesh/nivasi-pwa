import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from "react-native";
import {
  Building2,
  Plus,
  MapPin,
  Users,
  CreditCard,
  MoreVertical,
  X,
  Trash2,
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

export default function PropertiesScreen() {
  const { colors } = useTheme();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: '',
    address: '',
    property_type: 'Apartment',
    rent_amount: '',
    deposit_amount: '',
    total_units: '1',
    description: ''
  });

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Mock owner ID - in production this would come from auth
  const ownerId = 1;

  const fetchProperties = async () => {
    try {
      const response = await fetch(`/api/properties?owner_id=${ownerId}`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      setProperties(data.properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  const handleAddProperty = async () => {
    try {
      if (!newProperty.name || !newProperty.address || !newProperty.rent_amount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProperty,
          owner_id: ownerId,
          rent_amount: parseFloat(newProperty.rent_amount),
          deposit_amount: parseFloat(newProperty.deposit_amount || 0),
          total_units: parseInt(newProperty.total_units || 1),
        }),
      });

      if (!response.ok) throw new Error('Failed to add property');

      setShowAddModal(false);
      setNewProperty({
        name: '',
        address: '',
        property_type: 'Apartment',
        rent_amount: '',
        deposit_amount: '',
        total_units: '1',
        description: ''
      });
      fetchProperties();
    } catch (error) {
      console.error('Error adding property:', error);
      Alert.alert('Error', 'Failed to add property');
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
        title="Properties" 
        rightIcon={Plus} 
        onRightPress={() => setShowAddModal(true)}
      />

      {/* Properties List */}
      <View style={{ paddingHorizontal: 20 }}>
        {properties.length > 0 ? (
          properties.map((property) => (
            <TouchableOpacity
              key={property.id}
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              {/* Property Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: "Inter_600SemiBold",
                      color: colors.text,
                      marginBottom: 4,
                    }}
                  >
                    {property.name}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <MapPin size={14} color={colors.secondaryText} strokeWidth={1.5} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Inter_400Regular",
                        color: colors.secondaryText,
                        marginLeft: 6,
                        flex: 1,
                      }}
                      numberOfLines={2}
                    >
                      {property.address}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "#3B82F615",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Inter_500Medium",
                        color: "#3B82F6",
                      }}
                    >
                      {property.property_type}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    padding: 8,
                  }}
                >
                  <MoreVertical size={20} color={colors.secondaryText} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>

              {/* Property Stats */}
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
                    {formatCurrency(property.rent_amount)}
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
                    <Users size={16} color="#8B5CF6" strokeWidth={1.5} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        color: colors.secondaryText,
                        marginLeft: 4,
                      }}
                    >
                      Tenants
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: colors.text,
                    }}
                  >
                    {property.tenant_count || 0}
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
                    <Building2 size={16} color="#F59E0B" strokeWidth={1.5} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        color: colors.secondaryText,
                        marginLeft: 4,
                      }}
                    >
                      Units
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: colors.text,
                    }}
                  >
                    {property.total_units}
                  </Text>
                </View>
              </View>

              {/* Monthly Income */}
              {property.monthly_income > 0 && (
                <View
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: colors.secondaryText,
                    }}
                  >
                    Monthly Income
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: "#10B981",
                    }}
                  >
                    {formatCurrency(property.monthly_income)}
                  </Text>
                </View>
              )}
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
            <Building2 size={48} color={colors.secondaryText} strokeWidth={1} />
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                color: colors.text,
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              No Properties Yet
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
              Add your first property to start managing tenants and rent collections
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
                Add Property
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Add Property Modal */}
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
                Add Property
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
                    Property Name *
                  </Text>
                  <TextInput
                    value={newProperty.name}
                    onChangeText={(text) => setNewProperty({...newProperty, name: text})}
                    placeholder="Enter property name"
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
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: colors.text,
                      marginBottom: 8,
                    }}
                  >
                    Address *
                  </Text>
                  <TextInput
                    value={newProperty.address}
                    onChangeText={(text) => setNewProperty({...newProperty, address: text})}
                    placeholder="Enter full address"
                    placeholderTextColor={colors.placeholderText}
                    multiline
                    numberOfLines={3}
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

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: colors.text,
                      marginBottom: 8,
                    }}
                  >
                    Property Type
                  </Text>
                  <TextInput
                    value={newProperty.property_type}
                    onChangeText={(text) => setNewProperty({...newProperty, property_type: text})}
                    placeholder="Apartment, Villa, etc."
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
                      Rent Amount (₹) *
                    </Text>
                    <TextInput
                      value={newProperty.rent_amount}
                      onChangeText={(text) => setNewProperty({...newProperty, rent_amount: text})}
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

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Inter_500Medium",
                        color: colors.text,
                        marginBottom: 8,
                      }}
                    >
                      Deposit (₹)
                    </Text>
                    <TextInput
                      value={newProperty.deposit_amount}
                      onChangeText={(text) => setNewProperty({...newProperty, deposit_amount: text})}
                      placeholder="50000"
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

                <View style={{ marginBottom: 24 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: colors.text,
                      marginBottom: 8,
                    }}
                  >
                    Total Units
                  </Text>
                  <TextInput
                    value={newProperty.total_units}
                    onChangeText={(text) => setNewProperty({...newProperty, total_units: text})}
                    placeholder="1"
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

                <TouchableOpacity
                  onPress={handleAddProperty}
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
                    Add Property
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