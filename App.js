import React, { useEffect, useState, useRef } from 'react';
import { View, Image, Text, TextInput, StyleSheet, StatusBar as RNStatusBar, Platform, Animated, Easing } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
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
    case '900':
    case 'extrabold':
    case 'black':
      return 'Montserrat_800ExtraBold';
    case '400':
    case 'normal':
    case '100':
    case '200':
    case '300':
    case 'light':
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
import { AlertProvider } from './src/context/AlertContext';
import { OfflineBanner } from './src/components/common';
import { AppNavigator } from './src/navigation/AppNavigator';

function AppContent({ fontsLoaded }) {
  const { loading: authLoading } = useAuth();
  const [minAnimationDone, setMinAnimationDone] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  // Zoom-out animation: starts zoomed in at 2.8x, smoothly glides out to 1.0x
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const appOpacity = useRef(new Animated.Value(0)).current;
  const appScale = useRef(new Animated.Value(0.97)).current;
  const hasStartedRef = useRef(false);
  const hasTransitionedRef = useRef(false);

  useEffect(() => {
    // Dismiss native splash immediately so our JS animated splash is displayed
    SplashScreen.hideAsync().catch(() => {});

    // Pre-warm critical home images in memory during splash animation for zero flickering
    try {
      const criticalAssets = [
        require('./assets/images/railone-logo.webp'),
        require('./assets/images/journey-reserved.webp'),
        require('./assets/images/journey-unreserved.webp'),
        require('./assets/images/journey-platform.webp'),
        require('./assets/images/railone-social-banner.jpg'),
      ];
      criticalAssets.forEach((asset) => {
        const resolved = Image.resolveAssetSource(asset);
        if (resolved?.uri) {
          Image.prefetch(resolved.uri).catch(() => {});
        }
      });
    } catch {}

    // Run zoom-out animation only once per app launch
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      Animated.timing(scaleAnim, {
        toValue: 0.6,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setMinAnimationDone(true);
      });
    }

    // Failsafe timer (max 3.5 seconds) to prevent infinite loading on network stall
    const failsafe = setTimeout(() => {
      setMinAnimationDone(true);
    }, 3500);

    return () => clearTimeout(failsafe);
  }, [scaleAnim]);

  // Smooth crossfade transition once resources and initial animation are ready
  useEffect(() => {
    const isResourcesReady = fontsLoaded && !authLoading;

    if (isResourcesReady && minAnimationDone && !hasTransitionedRef.current) {
      hasTransitionedRef.current = true;
      
      Animated.parallel([
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(appOpacity, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(appScale, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSplashVisible(false);
      });
    }
  }, [fontsLoaded, authLoading, minAnimationDone, splashOpacity, appOpacity, appScale]);

  return (
    <View style={styles.rootContainer}>
      <Animated.View
        style={[
          styles.mainAppWrapper,
          {
            opacity: appOpacity,
            transform: [{ scale: appScale }],
          },
        ]}
      >
        <OfflineBanner />
        <AppNavigator />
      </Animated.View>

      {splashVisible && (
        <Animated.View
          pointerEvents={hasTransitionedRef.current ? 'none' : 'auto'}
          style={[
            StyleSheet.absoluteFill,
            styles.splashContainer,
            { opacity: splashOpacity },
          ]}
        >
          <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
          {Platform.OS === 'android' && (
            <RNStatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
          )}
          <Animated.View
            style={[
              styles.animatedLogoBox,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Image
              source={require('./assets/images/railone-splash-animation.webp')}
              style={styles.splashLogoImage}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
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
        <AlertProvider>
          <NetworkProvider>
            <AuthProvider>
              <AppContent fontsLoaded={readyFonts} />
            </AuthProvider>
          </NetworkProvider>
        </AlertProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootGestureView: {
    flex: 1,
  },
  rootContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainAppWrapper: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    zIndex: 999,
  },
  animatedLogoBox: {
    width: '90%',
    maxWidth: 380,
    height: 380,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogoImage: {
    width: '100%',
    height: '100%',
  },
});
