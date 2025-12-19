import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react-native';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function QAPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      id: '1',
      category: 'Account',
      question: 'How do I update my profile information?',
      answer:
        'Navigate to the Personal Information page from your profile hub. Click on any field you want to update and save your changes.',
    },
    {
      id: '2',
      category: 'Account',
      question: 'How do I change my password?',
      answer:
        'Go to Settings, then select "Change Password" under the Account section. Follow the prompts to update your security credentials.',
    },
    {
      id: '3',
      category: 'Privacy',
      question: 'Who can see my profile?',
      answer:
        'Your profile visibility depends on your privacy settings. You can enable Private Mode in Settings to hide your profile from others.',
    },
    {
      id: '4',
      category: 'Support',
      question: 'How can I get help?',
      answer:
        'Visit the Contact page to reach out to our support team via email, live chat, or phone. We\'re here to help!',
    },
    {
      id: '5',
      category: 'General',
      question: 'How do I navigate between pages?',
      answer:
        'Use the profile hub as your central navigation point. Each section has a back button to return to the main menu.',
    },
  ];

  const categories = ['All', ...Array.from(new Set(faqData.map((item) => item.category)))];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredFAQs =
    selectedCategory === 'All'
      ? faqData
      : faqData.filter((item) => item.category === selectedCategory);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Questions & Answers</Text>
          <Text style={styles.pageDescription}>
            Find answers to frequently asked questions
          </Text>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchIconContainer}>
            <Search size={20} color="#666" />
          </View>
          <Text style={styles.searchPlaceholder}>Search questions...</Text>
        </View>

        <View style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}>
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === category && styles.categoryButtonTextActive,
                    ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.faqSection}>
          {filteredFAQs.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.faqCard}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.7}>
                <View style={styles.faqHeader}>
                  <View style={styles.faqIconContainer}>
                    <HelpCircle size={20} color="#4A90E2" />
                  </View>
                  <View style={styles.faqQuestionContainer}>
                    <Text style={styles.faqCategory}>{item.category}</Text>
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                  </View>
                  <View style={styles.expandIcon}>
                    {isExpanded ? (
                      <ChevronUp size={20} color="#666" />
                    ) : (
                      <ChevronDown size={20} color="#666" />
                    )}
                  </View>
                </View>
                {isExpanded && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Still need help?</Text>
          <Text style={styles.helpText}>
            Can't find what you're looking for? Contact our support team for personalized
            assistance.
          </Text>
          <TouchableOpacity style={styles.contactButton} activeOpacity={0.8}>
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.placeholderSection}>
          <Text style={styles.placeholderText}>
            Search functionality and additional Q&A features will be implemented in the next
            phase
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
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchIconContainer: {
    marginRight: 12,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  categoriesSection: {
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  faqSection: {
    marginBottom: 16,
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  faqIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqQuestionContainer: {
    flex: 1,
  },
  faqCategory: {
    fontSize: 11,
    color: '#4A90E2',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  faqQuestion: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  expandIcon: {
    marginLeft: 8,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 64,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  helpSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 15,
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
