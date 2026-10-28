import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, StatusBar, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import BookShipmentScreen from './src/screens/BookShipmentScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import ShipmentsScreen from './src/screens/ShipmentsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BottomNav from './src/components/BottomNav';
import { colors } from './src/theme/colors';

function MainApp() {
  const { user } = useAuth();
  const [history, setHistory] = useState(['home']);
  const [screenParams, setScreenParams] = useState({});

  const currentScreen = history[history.length - 1] || 'home';

  const navigateTo = useCallback((screen, params = {}) => {
    setScreenParams(params);
    setHistory((prev) => {
      // If clicking the current screen, do nothing
      if (prev[prev.length - 1] === screen) return prev;
      // If navigating to home, reset history to just home
      if (screen === 'home') return ['home'];
      // Otherwise push to navigation history
      return [...prev, screen];
    });
  }, []);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, []);

  // Listen to Android hardware back button and edge swipe gestures
  useEffect(() => {
    const onBackPress = () => {
      if (history.length > 1) {
        goBack();
        return true; // handled, do not exit app
      }
      return false; // at home screen, allow default OS exit
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [history, goBack]);

  if (!user) {
    return <AuthScreen />;
  }

  const screenProps = {
    onNavigate: navigateTo,
    goBack: goBack,
    canGoBack: history.length > 1,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent={false} />
      <View style={styles.screenContainer}>
        {currentScreen === 'home' && <HomeScreen {...screenProps} />}
        {currentScreen === 'book' && <BookShipmentScreen {...screenProps} />}
        {currentScreen === 'track' && (
          <TrackingScreen
            {...screenProps}
            initialTrackingNumber={screenParams.trackingNumber}
          />
        )}
        {currentScreen === 'shipments' && <ShipmentsScreen {...screenProps} />}
        {currentScreen === 'profile' && <ProfileScreen {...screenProps} />}
      </View>
      <BottomNav currentScreen={currentScreen} onNavigate={navigateTo} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  screenContainer: {
    flex: 1
  }
});
