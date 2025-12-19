import { Stack } from 'expo-router';

export default function ChildProfileIndependentLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4A90E2',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'My Profile',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="contact"
        options={{
          title: 'Contact',
        }}
      />
      <Stack.Screen
        name="personal-info"
        options={{
          title: 'Personal Information',
        }}
      />
      <Stack.Screen
        name="qa"
        options={{
          title: 'Questions & Answers',
        }}
      />
    </Stack>
  );
}
