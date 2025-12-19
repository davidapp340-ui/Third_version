import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { Mail, MessageCircle, Phone, Send } from 'lucide-react-native';

export default function ContactPage() {
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const contactMethods = [
    {
      id: 'email',
      title: 'Email Support',
      description: 'Send us an email',
      icon: Mail,
      color: '#4A90E2',
    },
    {
      id: 'chat',
      title: 'Live Chat',
      description: 'Chat with support',
      icon: MessageCircle,
      color: '#50C878',
    },
    {
      id: 'phone',
      title: 'Phone Support',
      description: 'Call us directly',
      icon: Phone,
      color: '#FFA500',
    },
  ];

  const categories = [
    'Technical Issue',
    'Account Help',
    'General Question',
    'Feedback',
    'Other',
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Contact Us</Text>
          <Text style={styles.pageDescription}>
            We're here to help. Choose how you'd like to reach out
          </Text>
        </View>

        <View style={styles.methodsSection}>
          <Text style={styles.sectionTitle}>Contact Methods</Text>
          {contactMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <TouchableOpacity
                key={method.id}
                style={styles.methodCard}
                activeOpacity={0.7}>
                <View style={[styles.methodIcon, { backgroundColor: method.color }]}>
                  <IconComponent size={24} color="#fff" />
                </View>
                <View style={styles.methodTextContainer}>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Quick Message</Text>
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Category</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(category)}>
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.categoryChipTextSelected,
                    ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Your Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here..."
              multiline
              numberOfLines={6}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.sendButton} activeOpacity={0.8}>
              <Send size={20} color="#fff" />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.placeholderSection}>
          <Text style={styles.placeholderText}>
            Full contact functionality will be implemented in the next phase
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
  methodsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#CCC',
    marginLeft: 8,
  },
  formSection: {
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#666',
  },
  categoryChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    marginBottom: 16,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
