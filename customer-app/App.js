import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
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
  const [currentScreen, setCurrentScreen] = useState('home');
  const [screenParams, setScreenParams] = useState({});

  if (!user) {
    return <AuthScreen />;
  }

  const navigateTo = (screen, params = {}) => {
    setScreenParams(params);
    setCurrentScreen(screen);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.screenContainer}>
        {currentScreen === 'home' && <HomeScreen onNavigate={navigateTo} />}
        {currentScreen === 'book' && <BookShipmentScreen onNavigate={navigateTo} />}
        {currentScreen === 'track' && (
          <TrackingScreen
            initialTrackingNumber={screenParams.trackingNumber}
            onNavigate={navigateTo}
          />
        )}
        {currentScreen === 'shipments' && <ShipmentsScreen onNavigate={navigateTo} />}
        {currentScreen === 'profile' && <ProfileScreen onNavigate={navigateTo} />}
      </View>
      <BottomNav currentScreen={currentScreen} onNavigate={navigateTo} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
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
