import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'

import { useColorScheme } from '@/hooks/useColorScheme'
import { AuthProvider } from '@/context/auth'
import { CmsProvider } from '@/context/cms'
import { CartProvider } from '@/context/cart'
import { FavoritesProvider } from '@/context/favorites'
import { OutletProvider } from '@/context/outlet'
import { AddressProvider } from '@/context/address'

// Prevent native splash from auto-hiding; app/index.tsx will dismiss it
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <AuthProvider>
      <CmsProvider>
      <CartProvider>
      <AddressProvider>
      <FavoritesProvider>
      <OutletProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index"           options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)"          options={{ headerShown: false }} />
          <Stack.Screen name="login"           options={{ headerShown: false }} />
          <Stack.Screen name="register"        options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]"    options={{ headerShown: false }} />
          <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="favorites"       options={{ headerShown: false }} />
          <Stack.Screen name="checkout"        options={{ headerShown: false }} />
          <Stack.Screen name="search"           options={{ headerShown: false }} />
          <Stack.Screen name="account"           options={{ headerShown: false }} />
          <Stack.Screen name="edit-profile"      options={{ headerShown: false }} />
          <Stack.Screen name="change-password"   options={{ headerShown: false }} />
          <Stack.Screen name="addresses"         options={{ headerShown: false }} />
          <Stack.Screen name="payments"          options={{ headerShown: false }} />
          <Stack.Screen name="add-address"     options={{ headerShown: false }} />
          <Stack.Screen name="order-success"   options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="order/[id]"      options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
      </OutletProvider>
      </FavoritesProvider>
      </AddressProvider>
      </CartProvider>
      </CmsProvider>
    </AuthProvider>
  )
}
