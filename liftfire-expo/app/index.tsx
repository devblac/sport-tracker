import { useEffect } from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to tabs by default
  // In the future, this can check auth state and redirect to login if needed
  return <Redirect href="/(tabs)" />;
}
