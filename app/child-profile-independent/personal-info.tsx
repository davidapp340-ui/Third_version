import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { User, Calendar, MapPin } from 'lucide-react-native';

export default function PersonalInfoPage() {
  const infoItems = [
    {
      label: 'Full Name',
      value: 'Not set',
      icon: User,
    },
    {
      label: 'Date of Birth',
      value: 'Not set',
      icon: Calendar,
    },
    {
      label: 'Location',
      value: 'Not set',
      icon: MapPin,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Personal Information</Text>
          <Text style={styles.pageDescription}>
            Your personal details are stored securely
          </Text>
        </View>

        <View style={styles.infoSection}>
          {infoItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <View key={index} style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <IconComponent size={20} color="#4A90E2" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.placeholderSection}>
          <Text style={styles.placeholderText}>
            Full functionality will be implemented in the next phase
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  headerSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pageDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  placeholderSection: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
