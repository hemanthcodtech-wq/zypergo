import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
  const [authHistory, setAuthHistory] = useState(['welcome']); // welcome, login, signup
  const [tabHistory, setTabHistory] = useState(['dashboard']); // dashboard, jobs, active, earnings, profile
  const [currentActiveJob, setCurrentActiveJob] = useState(null);

  const authScreen = authHistory[authHistory.length - 1] || 'welcome';
  const activeTab = tabHistory[tabHistory.length - 1] || 'dashboard';

  const navigateAuth = useCallback((screen) => {
    setAuthHistory((prev) => {
      if (prev[prev.length - 1] === screen) return prev;
      if (screen === 'welcome') return ['welcome'];
      return [...prev, screen];
    });
  }, []);

  const navigateTab = useCallback((tab) => {
    setTabHistory((prev) => {
      if (prev[prev.length - 1] === tab) return prev;
      if (tab === 'dashboard') return ['dashboard'];
      return [...prev, tab];
    });
  }, []);

  const goBack = useCallback(() => {
    if (!token) {
      setAuthHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    } else {
      setTabHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }
  }, [token]);

  // Support Android gesture back swipes and physical Back button
  useEffect(() => {
    const onBackPress = () => {
      if (!token) {
        if (authHistory.length > 1) {
          goBack();
          return true;
        }
        return false;
      }

      if (tabHistory.length > 1) {
        goBack();
        return true; // prevent app close
      }
      return false; // let system exit on dashboard
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, [token, authHistory, tabHistory, goBack]);

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
      return <RiderLoginScreen onNavigate={navigateAuth} goBack={goBack} />;
    }
    if (authScreen === 'signup') {
      return <RiderSignupScreen onNavigate={navigateAuth} goBack={goBack} />;
    }
    return <RiderWelcomeScreen onNavigate={navigateAuth} />;
  }

  // Authenticated Rider
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <RiderDashboardScreen onNavigateTab={navigateTab} />;
      case 'jobs':
        return (
          <AvailableJobsScreen 
            onNavigateTab={navigateTab}
            goBack={goBack}
            onJobAccepted={(job) => {
              setCurrentActiveJob(job);
              navigateTab('active');
            }} 
          />
        );
      case 'active':
        return (
          <ActiveTaskScreen 
            activeJob={currentActiveJob}
            onNavigateTab={navigateTab}
            goBack={goBack}
            onTaskCompleted={() => {
              setCurrentActiveJob(null);
              navigateTab('dashboard');
            }}
          />
        );
      case 'earnings':
        return <RiderEarningsScreen onNavigateTab={navigateTab} goBack={goBack} />;
      case 'profile':
        return <RiderProfileScreen onNavigateTab={navigateTab} goBack={goBack} />;
      default:
        return <RiderDashboardScreen onNavigateTab={navigateTab} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} translucent={false} />
      <View style={styles.container}>
        <View style={styles.content}>
          {renderScreen()}
        </View>
        <RiderBottomNav activeTab={activeTab} onSelectTab={navigateTab} />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RiderNavigator />
      </AuthProvider>
    </SafeAreaProvider>
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
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
