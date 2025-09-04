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
  Linking
} from 'react-native';

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('https://06480408-c2d8-4ed1-9930-a2a5ef556988-00-12b1yngnrq34l.worf.replit.dev/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Account created! Please sign in.');
        setEmail('');
        setPassword('');
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
    Alert.alert('Logged Out', 'You have been logged out successfully.');
  };

  const openWebApp = () => {
    Linking.openURL('https://06480408-c2d8-4ed1-9930-a2a5ef556988-00-12b1yngnrq34l.worf.replit.dev');
  };

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.header}>
          <Text style={styles.logo}>MyTrainPro</Text>
          <Text style={styles.subtitle}>AI-Powered Fitness Coaching</Text>
        </View>

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

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>📱 Mobile App Status</Text>
            <Text style={styles.infoText}>
              This is the TestFlight preview of MyTrainPro. The full-featured web application 
              contains all training templates, nutrition tracking, AI recommendations, 
              and detailed analytics.
            </Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.header}>
        <Text style={styles.logo}>MyTrainPro</Text>
        <Text style={styles.subtitle}>AI-Powered Fitness Coaching</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Welcome to MyTrainPro</Text>
          <Text style={styles.authSubtitle}>
            Sign in to access your personalized fitness journey
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.buttonSecondary, loading && styles.buttonDisabled]} 
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonSecondaryText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.webButton} onPress={openWebApp}>
          <Text style={styles.webButtonText}>
            🌐 Try Web App (No Login Required)
          </Text>
          <Text style={styles.webButtonSubtext}>
            Experience the full MyTrainPro platform
          </Text>
        </TouchableOpacity>

        <View style={styles.featuresCard}>
          <Text style={styles.cardTitle}>✨ What's Inside</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>🤖 AI Nutrition Analysis</Text>
            <Text style={styles.featureItem}>🏋️ Smart Workout Planning</Text>
            <Text style={styles.featureItem}>📊 Scientific Periodization</Text>
            <Text style={styles.featureItem}>📈 Progress Analytics</Text>
            <Text style={styles.featureItem}>🍎 Food Image Recognition</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  authCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 25,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  buttonSecondaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  welcomeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ccc',
  },
  featuresCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  featureList: {
    marginTop: 10,
  },
  featureItem: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 22,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  webButton: {
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#555',
  },
  webButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  webButtonSubtext: {
    color: '#ccc',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4444',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});