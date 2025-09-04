import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  StatusBar,
  Alert,
  Linking,
  Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('https://06480408-c2d8-4ed1-9930-a2a5ef556988-00-12b1yngnrq34l.worf.replit.dev/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        Alert.alert('Success', 'Welcome to MyTrainPro!');
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('https://06480408-c2d8-4ed1-9930-a2a5ef556988-00-12b1yngnrq34l.worf.replit.dev/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Account created! Please sign in.');
        setActiveTab('signin');
        setEmail('');
        setPassword('');
        setName('');
      } else {
        Alert.alert('Signup Failed', data.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEmail('');
    setPassword('');
    setName('');
    Alert.alert('Logged Out', 'You have been logged out successfully.');
  };

  const openWebApp = () => {
    Linking.openURL('https://06480408-c2d8-4ed1-9930-a2a5ef556988-00-12b1yngnrq34l.worf.replit.dev');
  };

  const handleReplitAuth = () => {
    const authUrl = 'https://06480408-c2d8-4ed1-9930-a2a5ef556988-00-12b1yngnrq34l.worf.replit.dev/api/login';
    Linking.openURL(authUrl);
  };

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        <ScrollView style={styles.content}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Welcome back!</Text>
            <Text style={styles.welcomeText}>
              Hello {user.email}
            </Text>
          </View>

          <View style={styles.featuresCard}>
            <Text style={styles.cardTitle}>🚀 Core Features</Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>• AI-powered nutrition analysis</Text>
              <Text style={styles.featureItem}>• Scientific periodization training</Text>
              <Text style={styles.featureItem}>• Personalized workout plans</Text>
              <Text style={styles.featureItem}>• Progress tracking & analytics</Text>
              <Text style={styles.featureItem}>• Food image recognition</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.webButton} onPress={openWebApp}>
            <Text style={styles.webButtonText}>
              🌐 Open Full Web App
            </Text>
            <Text style={styles.webButtonSubtext}>
              Access all features in your browser
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Header matching web version */}
        <View style={styles.header}>
          <Text style={styles.logo}>TrainPro</Text>
          <Text style={styles.subtitle}>AI-Powered Fitness Platform</Text>
        </View>

        {/* Card Container - matching web version */}
        <View style={styles.authCard}>
          {/* Tabs - matching web version */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'signin' && styles.activeTab]}
              onPress={() => setActiveTab('signin')}
            >
              <Text style={[styles.tabText, activeTab === 'signin' && styles.activeTabText]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
              onPress={() => setActiveTab('signup')}
            >
              <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'signin' ? (
              // Sign In Form
              <View style={styles.formContainer}>
                {/* Replit Auth Button - matching web version */}
                <TouchableOpacity style={styles.replitButton} onPress={handleReplitAuth}>
                  <Text style={styles.replitButtonIcon}>📱</Text>
                  <Text style={styles.replitButtonText}>Sign in with Google • Apple • Email</Text>
                </TouchableOpacity>
                <Text style={styles.replitSubtext}>Choose from multiple secure login options</Text>
                
                {/* Separator */}
                <View style={styles.separator}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>Or use existing account</Text>
                  <View style={styles.separatorLine} />
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <Text style={styles.inputLabel}>Email</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <Text style={styles.inputLabel}>Password</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Sign In Button */}
                <TouchableOpacity 
                  style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Sign Up Form
              <View style={styles.formContainer}>
                {/* Replit Auth Button */}
                <TouchableOpacity style={styles.replitButton} onPress={handleReplitAuth}>
                  <Text style={styles.replitButtonIcon}>📱</Text>
                  <Text style={styles.replitButtonText}>Sign up with Google • Apple • Email</Text>
                </TouchableOpacity>
                <Text style={styles.replitSubtext}>Quick setup with your preferred account</Text>
                
                {/* Separator */}
                <View style={styles.separator}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>Or use enhanced manual registration</Text>
                  <View style={styles.separatorLine} />
                </View>

                {/* Name Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <Text style={styles.inputLabel}>Name</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Your full name"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <Text style={styles.inputLabel}>Email</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <Text style={styles.inputLabel}>Password</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a strong password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity 
                  style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                  onPress={handleSignup}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Web App Button */}
        <TouchableOpacity style={styles.webAppButton} onPress={openWebApp}>
          <Text style={styles.webAppButtonText}>🌐 Try Web App (No Login Required)</Text>
          <Text style={styles.webAppButtonSubtext}>Experience the full MyTrainPro platform</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  
  // Card Styles - matching web version
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
    padding: 24,
  },
  
  // Tabs - matching web version
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '600',
  },
  
  // Form Content
  tabContent: {
    flex: 1,
  },
  formContainer: {
    gap: 16,
  },
  
  // Replit Auth Button - matching web version
  replitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  replitButtonIcon: {
    fontSize: 16,
  },
  replitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  replitSubtext: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: -8,
  },
  
  // Separator - matching web version
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e5e5',
  },
  separatorText: {
    fontSize: 12,
    color: '#666666',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    textTransform: 'uppercase',
  },
  
  // Input Styles - matching web version
  inputContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inputIcon: {
    fontSize: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
  },
  
  // Primary Button - matching web version
  primaryButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  // Web App Button
  webAppButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  webAppButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  webAppButtonSubtext: {
    color: '#666666',
    fontSize: 14,
  },
  
  // Welcome/Logged in styles
  welcomeCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666666',
  },
  featuresCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  webButton: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  webButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  webButtonSubtext: {
    color: '#d1d5db',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});