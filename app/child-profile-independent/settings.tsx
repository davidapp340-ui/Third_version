import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useState } from 'react';
import { Bell, Eye, Lock, Globe } from 'lucide-react-native';

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateMode, setPrivateMode] = useState(false);

  const settingSections = [
    {
      title: 'Notifications',
      items: [
        {
          label: 'Enable Notifications',
          description: 'Receive updates and reminders',
          icon: Bell,
          type: 'toggle',
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
      ],
    },
    {
      title: 'Privacy',
      items: [
        {
          label: 'Private Mode',
          description: 'Hide your profile from others',
          icon: Eye,
          type: 'toggle',
          value: privateMode,
          onToggle: setPrivateMode,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Change Password',
          description: 'Update your security credentials',
          icon: Lock,
          type: 'navigation',
        },
        {
          label: 'Language',
          description: 'English (US)',
          icon: Globe,
          type: 'navigation',
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Settings</Text>
          <Text style={styles.pageDescription}>
            Customize your experience and preferences
          </Text>
        </View>

        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => {
              const IconComponent = item.icon;
              return (
                <View key={itemIndex} style={styles.settingItem}>
                  <View style={styles.settingIconContainer}>
                    <IconComponent size={20} color="#4A90E2" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                  {item.type === 'toggle' && item.onToggle && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#D1D5DB', true: '#4A90E2' }}
                      thumbColor={item.value ? '#fff' : '#f4f3f4'}
                    />
                  )}
                  {item.type === 'navigation' && (
                    <Text style={styles.arrow}>›</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.placeholderSection}>
          <Text style={styles.placeholderText}>
            Additional settings will be implemented in the next phase
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
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#CCC',
    marginLeft: 8,
  },
  placeholderSection: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
    marginTop: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
