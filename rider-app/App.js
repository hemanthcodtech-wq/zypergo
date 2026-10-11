import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS } from './src/theme';

// Screens
import RiderWelcomeScreen from './src/screens/RiderWelcomeScreen';
import RiderLoginScreen from './src/screens/RiderLoginScreen';
import RiderSignupScreen from './src/screens/RiderSignupScreen';
import RiderDashboardScreen from './src/screens/RiderDashboardScreen';
import AvailableJobsScreen from './src/screens/AvailableJobsScreen';
import ActiveTaskScreen from './src/screens/ActiveTaskScreen';
import RiderEarningsScreen from './src/screens/RiderEarningsScreen';
import RiderProfileScreen from './src/screens/RiderProfileScreen';

// Components
import RiderBottomNav from './src/components/RiderBottomNav';

function RiderNavigator() {
  const { user, token, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState('welcome'); // welcome, login, signup
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, jobs, active, earnings, profile
  const [currentActiveJob, setCurrentActiveJob] = useState(null);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Not authenticated
  if (!token) {
    if (authScreen === 'login') {
      return <RiderLoginScreen onNavigate={setAuthScreen} />;
    }
    if (authScreen === 'signup') {
      return <RiderSignupScreen onNavigate={setAuthScreen} />;
    }
    return <RiderWelcomeScreen onNavigate={setAuthScreen} />;
  }

  // Authenticated Rider
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <RiderDashboardScreen onNavigateTab={setActiveTab} />;
      case 'jobs':
        return (
          <AvailableJobsScreen 
            onJobAccepted={(job) => {
              setCurrentActiveJob(job);
              setActiveTab('active');
            }} 
          />
        );
      case 'active':
        return (
          <ActiveTaskScreen 
            activeJob={currentActiveJob}
            onTaskCompleted={() => {
              setCurrentActiveJob(null);
              setActiveTab('dashboard');
            }}
          />
        );
      case 'earnings':
        return <RiderEarningsScreen />;
      case 'profile':
        return <RiderProfileScreen />;
      default:
        return <RiderDashboardScreen onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.container}>
        {renderScreen()}
        <RiderBottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RiderNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
