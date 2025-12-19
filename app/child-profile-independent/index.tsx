import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings, Mail, User, HelpCircle } from 'lucide-react-native';

export default function ChildProfileIndependentHub() {
  const router = useRouter();

  const navigationItems = [
    {
      id: 'personal-info',
      title: 'Personal Information',
      description: 'View and manage your personal details',
      icon: User,
      route: '/child-profile-independent/personal-info',
      color: '#4A90E2',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Customize your preferences',
      icon: Settings,
      route: '/child-profile-independent/settings',
      color: '#50C878',
    },
    {
      id: 'contact',
      title: 'Contact',
      description: 'Reach out for support or feedback',
      icon: Mail,
      route: '/child-profile-independent/contact',
      color: '#FFA500',
    },
    {
      id: 'qa',
      title: 'Questions & Answers',
      description: 'Find answers to common questions',
      icon: HelpCircle,
      route: '/child-profile-independent/qa',
      color: '#E74C3C',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <User size={48} color="#fff" />
        </View>
        <Text style={styles.welcomeText}>Welcome to Your Profile</Text>
        <Text style={styles.subtitle}>Manage your information and settings</Text>
      </View>

      <View style={styles.menuContainer}>
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}>
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <IconComponent size={24} color="#fff" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#CCC',
    marginLeft: 8,
  },
});
