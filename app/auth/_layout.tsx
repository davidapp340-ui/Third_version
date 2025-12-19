import { Stack } from 'expo-router/stack';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="parent-login" />
      <Stack.Screen name="child-login" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
