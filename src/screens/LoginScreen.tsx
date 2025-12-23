/**
 * LoginScreen Component
 * 
 * Initial screen for user authentication.
 * Provides options to:
 * - Sign in as guest (anonymous authentication)
 * - Sign in with email/password
 * - Sign up with email/password
 * - Create/update user handle after authentication
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginScreenNavigationProp } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { DesignSystem } from '../theme';

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { signInAnonymously, signInWithEmail, signUpWithEmail, setHandle, user, resetPassword, signOut } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandleLocal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsHandle, setNeedsHandle] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    if (user) {
      if (!user.handle) {
        setNeedsHandle(true);
      } else {
        setNeedsHandle(false);
        navigation.replace('Home');
      }
    } else {
      setNeedsHandle(false);
    }
  }, [user, navigation]);

  const handleGuestMode = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously();
      setNeedsHandle(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in as guest';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${isSignUp ? 'sign up' : 'sign in'}`;
      setError(errorMessage);
      setLoading(false);
    }
    // Don't set loading to false here - let the auth state change handle it
    // This ensures the handle creation screen shows properly
  };

  const handleSetHandle = async () => {
    const trimmedHandle = handle.trim();
    if (!trimmedHandle) {
      setError('Please enter a handle');
      return;
    }

    if (trimmedHandle.length < 2) {
      setError('Handle must be at least 2 characters long');
      return;
    }

    if (trimmedHandle.length > 20) {
      setError('Handle must be 20 characters or less');
      return;
    }

    // Validation: alphanumeric, underscores, and hyphens only (no spaces or special chars)
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedHandle)) {
      setError('Handle can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await setHandle(trimmedHandle);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set handle';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || email.trim() === '') {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPassword(email.trim());
      setResetEmailSent(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackFromHandleCreation = async () => {
    try {
      await signOut();
      setNeedsHandle(false);
      setHandleLocal('');
      setError(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleBackToSignIn = () => {
    setIsSignUp(false);
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setError(null);
  };

  const handleBackFromForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setError(null);
  };

  if (needsHandle && user) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top', 'bottom']}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.screenHeader}>
              <IconButton
                icon="arrow-left"
                size={DesignSystem.dimensions.iconSize}
                iconColor={theme.colors.onSurface}
                onPress={handleBackFromHandleCreation}
                style={styles.backButton}
              />
              <View style={styles.headerSpacer} />
            </View>
            <View style={styles.header}>
              <Image
                source={require('../../assets/images/RedCup_Logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text variant="headlineSmall" style={{ color: theme.colors.onBackground }}>
                Create Your Handle
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
              >
                {user?.isGuest
                  ? 'Define your handle'
                  : 'Create your handle to track your record'}
              </Text>
            </View>

            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <TextInput
                  mode="outlined"
                  label="Handle"
                  placeholder="Enter your handle..."
                  value={handle}
                  onChangeText={setHandleLocal}
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  autoCapitalize="none"
                  autoCorrect={false}
                  disabled={loading}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                />

                {error && (
                  <View style={styles.errorContainer}>
                    <Text
                      variant="bodySmall"
                      style={[styles.errorText, { color: theme.colors.error }]}
                    >
                      {error}
                    </Text>
                  </View>
                )}

                <Button
                  mode="contained"
                  onPress={handleSetHandle}
                  disabled={loading || !handle.trim()}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  buttonColor={theme.colors.primary}
                >
                  {loading ? <ActivityIndicator color={theme.colors.onPrimary} /> : 'Continue'}
                </Button>
              </Card.Content>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {(isSignUp || showForgotPassword) && (
            <View style={styles.screenHeader}>
              <IconButton
                icon="arrow-left"
                size={DesignSystem.dimensions.iconSize}
                iconColor={theme.colors.onSurface}
                onPress={showForgotPassword ? handleBackFromForgotPassword : handleBackToSignIn}
                style={styles.backButton}
              />
              <View style={styles.headerSpacer} />
            </View>
          )}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/RedCup_Logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text 
              variant="headlineLarge" 
              style={{ 
                color: theme.colors.onBackground,
                fontWeight: '800',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              SINK
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              {isSignUp ? 'Create your account' : 'Sign in'}
            </Text>
          </View>

          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              {!isSignUp && (
                <>
                  <Button
                    mode="contained"
                    onPress={handleGuestMode}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    buttonColor={theme.colors.surfaceVariant}
                    textColor={theme.colors.onSurface}
                  >
                    {loading ? (
                      <ActivityIndicator color={theme.colors.onSurface} />
                    ) : (
                      'Continue as Guest'
                    )}
                  </Button>

                  <View style={styles.divider}>
                    <View style={[styles.dividerLine, { backgroundColor: theme.colors.outline }]} />
                    <Text
                      variant="bodySmall"
                      style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}
                    >
                      OR
                    </Text>
                    <View style={[styles.dividerLine, { backgroundColor: theme.colors.outline }]} />
                  </View>
                </>
              )}

              <TextInput
                mode="outlined"
                label="Email"
                placeholder="Enter your email..."
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                contentStyle={styles.inputContent}
                disabled={loading}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />

              {!showForgotPassword && (
                <TextInput
                  mode="outlined"
                  label="Password"
                  placeholder="Enter your password..."
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  disabled={loading}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                />
              )}

              {error && (
                <View style={styles.errorContainer}>
                  <Text
                    variant="bodySmall"
                    style={[styles.errorText, { color: theme.colors.error }]}
                  >
                    {error}
                  </Text>
                </View>
              )}

              {showForgotPassword && !resetEmailSent && (
                <>
                  <Text
                    variant="bodySmall"
                    style={[styles.forgotPasswordText, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Enter your email address and we'll send you a link to reset your password.
                  </Text>
                  <Button
                    mode="contained"
                    onPress={handleForgotPassword}
                    disabled={loading || !email.trim()}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    buttonColor={theme.colors.primary}
                  >
                    {loading ? (
                      <ActivityIndicator color={theme.colors.onPrimary} />
                    ) : (
                      'Send Reset Email'
                    )}
                  </Button>
                </>
              )}

              {resetEmailSent && (
                <View style={styles.successContainer}>
                  <Text
                    variant="bodyMedium"
                    style={[styles.successText, { color: theme.colors.primary }]}
                  >
                    Password reset email sent! Check your inbox.
                  </Text>
                </View>
              )}

              {!showForgotPassword && !resetEmailSent && (
                <>
                  <Button
                    mode="contained"
                    onPress={handleEmailAuth}
                    disabled={loading || !email || !password}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    buttonColor={theme.colors.primary}
                  >
                    {loading ? (
                      <ActivityIndicator color={theme.colors.onPrimary} />
                    ) : isSignUp ? (
                      'Sign Up'
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <View style={styles.footerActions}>
                    <Button
                      mode="text"
                      onPress={() => {
                        setIsSignUp(!isSignUp);
                        setError(null);
                      }}
                      style={styles.switchButton}
                      textColor={theme.colors.primary}
                    >
                      {isSignUp
                        ? 'Already have an account? Sign In'
                        : "Don't have an account? Sign Up"}
                    </Button>
                    {!isSignUp && (
                      <Button
                        mode="text"
                        onPress={() => {
                          setShowForgotPassword(true);
                          setError(null);
                        }}
                        style={styles.forgotPasswordButton}
                        textColor={theme.colors.primary}
                        compact
                      >
                        Forgot your password?
                      </Button>
                    )}
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.xl,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
    width: '100%',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: DesignSystem.dimensions.iconSize + DesignSystem.spacing.xs * 2,
  },
  backButton: {
    margin: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: DesignSystem.spacing.md, // Spacing per branding.md: 1C between logo and text (vertical stack)
  },
  subtitle: {
    marginTop: DesignSystem.spacing.sm,
    textAlign: 'center',
  },
  card: {
    elevation: DesignSystem.elevation.level1,
  },
  input: {
    marginBottom: DesignSystem.spacing.md,
  },
  inputContent: {
    minHeight: 48,
  },
  button: {
    marginTop: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.lg,
  },
  buttonContent: {
    paddingVertical: DesignSystem.spacing.sm,
    minHeight: 48,
  },
  footerActions: {
    marginTop: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.xs,
  },
  switchButton: {
    marginTop: 0,
  },
  forgotPasswordButton: {
    marginTop: 0,
  },
  forgotPasswordText: {
    marginTop: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
    textAlign: 'center',
  },
  successContainer: {
    marginTop: DesignSystem.spacing.md,
    alignItems: 'center',
  },
  successText: {
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  errorContainer: {
    marginTop: DesignSystem.spacing.xs,
    marginBottom: DesignSystem.spacing.xs,
  },
  errorText: {
    textAlign: 'left',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: DesignSystem.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: DesignSystem.spacing.md,
  },
});

export default LoginScreen;

