import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, RefreshControl, Alert } from "react-native";
import {
  FileText,
  Plus,
  Download,
  Eye,
  Trash2,
  File,
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

export default function DocumentsScreen() {
  const { colors } = useTheme();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Mock owner ID - in production this would come from auth
  const ownerId = 1;

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?owner_id=${ownerId}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const handleUpload = () => {
    Alert.alert('Upload Document', 'Document upload feature coming soon!');
  };

  if (!fontsLoaded || loading) {
    return null;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getDocumentIcon = (type) => {
    return FileText;
  };

  return (
    <ScreenContainer 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader 
        title="Documents" 
        rightIcon={Plus} 
        onRightPress={handleUpload}
      />

      {/* Documents List */}
      <View style={{ paddingHorizontal: 20 }}>
        {documents.length > 0 ? (
          documents.map((doc) => {
            const DocIcon = getDocumentIcon(doc.document_type);
            return (
              <View
                key={doc.id}
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
                  alignItems: "flex-start",
                }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "#3B82F615",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}>
                    <DocIcon size={24} color="#3B82F6" strokeWidth={1.5} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: colors.text,
                      marginBottom: 4,
                    }}>
                      {doc.document_name}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      fontFamily: "Inter_400Regular",
                      color: colors.secondaryText,
                      marginBottom: 4,
                    }}>
                      {doc.document_type}
                    </Text>
                    {doc.property_name && (
                      <Text style={{
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        color: colors.secondaryText,
                        marginBottom: 4,
                      }}>
                        Property: {doc.property_name}
                      </Text>
                    )}
                    {doc.tenant_name && (
                      <Text style={{
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        color: colors.secondaryText,
                        marginBottom: 4,
                      }}>
                        Tenant: {doc.tenant_name}
                      </Text>
                    )}
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 4,
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        color: colors.secondaryText,
                      }}>
                        {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={{
                  flexDirection: "row",
                  gap: 8,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#3B82F6",
                      borderRadius: 8,
                      padding: 10,
                    }}
                  >
                    <Eye size={16} color="#FFFFFF" strokeWidth={1.5} />
                    <Text style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: "#FFFFFF",
                      marginLeft: 6,
                    }}>
                      View
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#10B981",
                      borderRadius: 8,
                      padding: 10,
                    }}
                  >
                    <Download size={16} color="#FFFFFF" strokeWidth={1.5} />
                    <Text style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: "#FFFFFF",
                      marginLeft: 6,
                    }}>
                      Download
                    </Text>
                  </TouchableOpacity>
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
            <File size={48} color={colors.secondaryText} strokeWidth={1} />
            <Text style={{
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              color: colors.text,
              marginTop: 16,
              marginBottom: 8,
            }}>
              No Documents Yet
            </Text>
            <Text style={{
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              color: colors.secondaryText,
              textAlign: "center",
              marginBottom: 16,
            }}>
              Upload lease agreements, ID proofs, and other important documents
            </Text>
            <TouchableOpacity
              onPress={handleUpload}
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
                Upload Document
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
