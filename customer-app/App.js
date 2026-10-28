import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  BackHandler,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_URL = 'https://zypergo.com/customer';
const STORAGE_KEY = '@zypergo_customer_url';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Dev URL modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Load saved custom URL if any
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

  // Hardware back button support
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
      if (!trimmed) {
        trimmed = DEFAULT_URL;
      }
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        trimmed = 'http://' + trimmed;
      }
      await AsyncStorage.setItem(STORAGE_KEY, trimmed);
      setCurrentUrl(trimmed);
      setShowConfigModal(false);
      setHasError(false);
      setIsLoading(true);
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
      setIsLoading(true);
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
          cacheEnabled={true}
          setSupportMultipleWindows={false}
          originWhitelist={['*']}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onLoadStart={() => {
            setIsLoading(true);
            setHasError(false);
          }}
          onLoadEnd={() => {
            setIsLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setIsLoading(false);
            setHasError(true);
            setErrorMessage(nativeEvent.description || 'Failed to connect to server');
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            if (nativeEvent.statusCode >= 500) {
              setHasError(true);
              setErrorMessage(`Server error (${nativeEvent.statusCode})`);
            }
          }}
        />

        {/* Initial Loading Indicator */}
        {isLoading && !hasError && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0052CC" />
            <Text style={styles.loadingText}>Loading ZyperGo...</Text>
          </View>
        )}

        {/* Friendly Error / Offline Screen */}
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
                  setIsLoading(true);
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

      {/* Developer / IP Configuration Modal */}
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
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#0052CC',
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
