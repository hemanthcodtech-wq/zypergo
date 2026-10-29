import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  BackHandler,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  Linking,
  Image,
  Animated
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_URL = 'https://zypergo.com/customer';
const STORAGE_KEY = '@zypergo_customer_url';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Instant native splash state
  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  // Dev URL modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // 1. Instant splash fade out
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // 2. Load saved custom URL if any
  useEffect(() => {
    (async () => {
      try {
        const savedUrl = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedUrl) {
          setCurrentUrl(savedUrl);
          setCustomUrlInput(savedUrl);
        } else {
          setCustomUrlInput(DEFAULT_URL);
        }
      } catch (e) {
        setCustomUrlInput(DEFAULT_URL);
      }
    })();
  }, []);

  // 3. Deep link handler for Google Sign-In redirect from browser
  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event?.url || event;
      if (!url) return;

      if (url.startsWith('zypergocustomer://')) {
        try {
          const fakeHttpUrl = url.replace('zypergocustomer://', 'https://zypergo.com/');
          const parsed = new URL(fakeHttpUrl);
          const token = parsed.searchParams.get('token');
          const userStr = parsed.searchParams.get('user');

          if (token && webViewRef.current) {
            const jsInject = `
              (function() {
                try {
                  localStorage.setItem('zypergo_token', ${JSON.stringify(token)});
                  ${userStr ? `localStorage.setItem('zypergo_user', ${JSON.stringify(decodeURIComponent(userStr))});` : ''}
                  sessionStorage.setItem('zypergo_portal', 'customer');
                  window.location.href = '/customer/dashboard';
                } catch(e) {
                  window.location.reload();
                }
              })();
              true;
            `;
            webViewRef.current.injectJavaScript(jsInject);
          }
        } catch (err) {
          console.warn('Deep link parse notice:', err.message);
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  // 4. Android hardware back button
  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [canGoBack]);

  const handleSaveCustomUrl = async () => {
    try {
      let trimmed = customUrlInput.trim();
      if (!trimmed) trimmed = DEFAULT_URL;
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        trimmed = 'http://' + trimmed;
      }
      await AsyncStorage.setItem(STORAGE_KEY, trimmed);
      setCurrentUrl(trimmed);
      setShowConfigModal(false);
      setHasError(false);
      if (webViewRef.current) {
        webViewRef.current.reload();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save URL');
    }
  };

  const handleResetDefaultUrl = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setCurrentUrl(DEFAULT_URL);
      setCustomUrlInput(DEFAULT_URL);
      setShowConfigModal(false);
      setHasError(false);
      if (webViewRef.current) {
        webViewRef.current.reload();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to reset URL');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webView}
          userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36 ZyperGoCustomer/1.0"
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          androidHardwareAccelerationDisabled={false}
          androidLayerType="hardware"
          cacheEnabled={true}
          setSupportMultipleWindows={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          overScrollMode="never"
          originWhitelist={['*']}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onShouldStartLoadWithRequest={(request) => {
            // When user clicks Google Sign In, open in default system browser so all Google accounts appear!
            if (
              request.url.includes('accounts.google.com') ||
              request.url.includes('oauth2/v2/auth')
            ) {
              Linking.openURL(request.url);
              return false; // Prevent loading inside WebView to avoid disallowed_useragent
            }
            return true;
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            if (nativeEvent.description && nativeEvent.description.includes('net::ERR_NAME_NOT_RESOLVED')) {
              setHasError(true);
              setErrorMessage('Cannot resolve server address. Check your internet connection.');
            } else if (nativeEvent.description && nativeEvent.description.includes('net::ERR_CONNECTION_REFUSED')) {
              setHasError(true);
              setErrorMessage('Connection refused. Verify server is online.');
            }
          }}
        />

        {/* Instant Native Splash Screen (Loads at 0ms, zero network lag) */}
        {showSplash && (
          <Animated.View style={[styles.splashOverlay, { opacity: splashOpacity }]} pointerEvents="none">
            <View style={styles.splashContent}>
              <Image 
                source={require('./assets/splash-logo.png')} 
                style={styles.splashLogo} 
                resizeMode="contain" 
              />
              <Text style={styles.splashBrand}>welcome to customer app</Text>
            </View>
          </Animated.View>
        )}

        {/* Friendly Error Screen */}
        {hasError && (
          <View style={styles.errorOverlay}>
            <View style={styles.errorCard}>
              <View style={styles.errorIconCircle}>
                <Text style={styles.errorIconText}>⚠️</Text>
              </View>
              <Text style={styles.errorTitle}>Connection Failed</Text>
              <Text style={styles.errorSubtitle}>
                {errorMessage || 'Unable to reach ZyperGo customer portal.'}
              </Text>
              <Text style={styles.errorUrl}>URL: {currentUrl}</Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  setHasError(false);
                  if (webViewRef.current) {
                    webViewRef.current.reload();
                  }
                }}
              >
                <Text style={styles.primaryButtonText}>Retry Connection</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowConfigModal(true)}
              >
                <Text style={styles.secondaryButtonText}>Configure Server URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Dev IP Config Modal */}
      <Modal visible={showConfigModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Server Configuration</Text>
            <Text style={styles.modalDesc}>
              Set the ZyperGo customer app endpoint. You can use production (https://zypergo.com/customer) or your local laptop IP (e.g. http://192.168.1.15:8081).
            </Text>

            <TextInput
              style={styles.modalInput}
              value={customUrlInput}
              onChangeText={setCustomUrlInput}
              placeholder="e.g. https://zypergo.com/customer"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.resetButton]}
                onPress={handleResetDefaultUrl}
              >
                <Text style={styles.resetButtonText}>Default</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfigModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveCustomUrl}
              >
                <Text style={styles.saveButtonText}>Save & Load</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 220,
    height: 140,
    marginBottom: 16,
  },
  splashBrand: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 20,
  },
  errorCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  errorIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIconText: {
    fontSize: 28,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorUrl: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#0052CC',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  resetButton: {
    backgroundColor: '#FEF3C7',
  },
  resetButtonText: {
    color: '#92400E',
    fontWeight: '600',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: '#0052CC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
