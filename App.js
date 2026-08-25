import React, { useEffect, useState, useRef } from 'react';
import { View, Image, Text, TextInput, StyleSheet, StatusBar as RNStatusBar, Platform, Animated, Easing } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
} from '@expo-google-fonts/montserrat';
import { StatusBar } from 'expo-status-bar';

// Keep the splash screen visible while loading resources
SplashScreen.preventAutoHideAsync().catch(() => {});

// Helper to map weight to loaded Montserrat font
const getMontserratFont = (fontWeight, fontFamily) => {
  if (fontFamily && typeof fontFamily === 'string' && fontFamily.startsWith('Montserrat')) {
    return fontFamily;
  }
  const weightStr = String(fontWeight || '').toLowerCase();
  switch (weightStr) {
    case '100':
    case '200':
    case '300':
    case 'light':
      return 'Montserrat_300Light';
    case '500':
    case 'medium':
      return 'Montserrat_500Medium';
    case '600':
    case 'semibold':
      return 'Montserrat_600SemiBold';
    case '700':
    case 'bold':
      return 'Montserrat_700Bold';
    case '800':
    case 'extrabold':
      return 'Montserrat_800ExtraBold';
    case '900':
    case 'black':
      return 'Montserrat_900Black';
    case '400':
    case 'normal':
    default:
      return 'Montserrat_400Regular';
  }
};

// Global interceptor for Text component
if (Text.render) {
  const originalTextRender = Text.render;
  Text.render = function (props, ref) {
    const flattened = StyleSheet.flatten(props && props.style) || {};
    const targetFont = getMontserratFont(flattened.fontWeight, flattened.fontFamily);
    const newProps = {
      ...props,
      style: [props && props.style, { fontFamily: targetFont, fontWeight: undefined }],
    };
    return originalTextRender.call(this, newProps, ref);
  };
}

// Global interceptor for TextInput component
if (TextInput.render) {
  const originalTextInputRender = TextInput.render;
  TextInput.render = function (props, ref) {
    const flattened = StyleSheet.flatten(props && props.style) || {};
    const targetFont = getMontserratFont(flattened.fontWeight, flattened.fontFamily);
    const newProps = {
      ...props,
      style: [props && props.style, { fontFamily: targetFont, fontWeight: undefined }],
    };
    return originalTextInputRender.call(this, newProps, ref);
  };
}

// Fallback for defaultProps
if (Text.defaultProps == null) {
  Text.defaultProps = {};
}
Text.defaultProps.style = { fontFamily: 'Montserrat_400Regular' };

if (TextInput.defaultProps == null) {
  TextInput.defaultProps = {};
}
TextInput.defaultProps.style = { fontFamily: 'Montserrat_400Regular' };

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { OfflineBanner } from './src/components/common';
import { AppNavigator } from './src/navigation/AppNavigator';

function AppContent({ fontsLoaded }) {
  const { loading: authLoading } = useAuth();
  const [minTimerDone, setMinTimerDone] = useState(false);

  // Zoom-out animation
  const scaleAnim = useRef(new Animated.Value(3.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 2.2,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Minimum animation time so the zoom-out animation plays gracefully
    const timer = setTimeout(() => {
      setMinTimerDone(true);
    }, 1400);

    return () => clearTimeout(timer);
  }, [scaleAnim, opacityAnim]);

  const isAppReady = fontsLoaded && !authLoading && minTimerDone;

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
        {Platform.OS === 'android' && (
          <RNStatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
        )}
        <Animated.View
          style={[
            styles.animatedLogoBox,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Image
            source={require('./assets/images/railone-splash-logo.png')}
            style={styles.splashLogoImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <>
      <OfflineBanner />
      <AppNavigator />
    </>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
  });

  // FIX H9: if fonts fail to load due to asset error, proceed with system font fallback rather than freezing splash
  const readyFonts = fontsLoaded || Boolean(fontError);

  return (
    <GestureHandlerRootView style={styles.rootGestureView}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
        {Platform.OS === 'android' && (
          <RNStatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
        )}
        <NetworkProvider>
          <AuthProvider>
            <AppContent fontsLoaded={readyFonts} />
          </AuthProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootGestureView: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  animatedLogoBox: {
    width: '90%',
    maxWidth: 380,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogoImage: {
    width: '100%',
    height: '100%',
  },
});
