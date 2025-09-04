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
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [trainingData, setTrainingData] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const serverUrl = 'https://06480408-c2d8-4ed1-9930-a2a5ef556988-00-12b1yngnrq34l.worf.replit.dev';

  // Fetch user data after login
  const fetchUserData = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/auth/user`, {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      const [dietGoalsRes, nutritionSummaryRes, trainingStatsRes, bodyMetricsRes] = await Promise.all([
        fetch(`${serverUrl}/api/diet-goals`, { credentials: 'include' }),
        fetch(`${serverUrl}/api/nutrition/summary`, { credentials: 'include' }),
        fetch(`${serverUrl}/api/training/stats`, { credentials: 'include' }),
        fetch(`${serverUrl}/api/body-metrics`, { credentials: 'include' })
      ]);

      const [dietGoals, nutritionSummary, trainingStats, bodyMetrics] = await Promise.all([
        dietGoalsRes.ok ? dietGoalsRes.json() : null,
        nutritionSummaryRes.ok ? nutritionSummaryRes.json() : null,
        trainingStatsRes.ok ? trainingStatsRes.json() : null,
        bodyMetricsRes.ok ? bodyMetricsRes.json() : null
      ]);

      setDashboardData({ dietGoals, nutritionSummary, trainingStats, bodyMetrics });
      setNutritionData(nutritionSummary);
      setTrainingData(trainingStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${serverUrl}/api/auth/signin`, {
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
        await loadDashboardData();
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
      const response = await fetch(`${serverUrl}/api/auth/signup`, {
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
    setCurrentPage('dashboard');
    setDashboardData(null);
    setNutritionData(null);
    setTrainingData(null);
    setProfileData(null);
    Alert.alert('Logged Out', 'You have been logged out successfully.');
  };

  const handleReplitAuth = () => {
    const authUrl = `${serverUrl}/api/login`;
    Linking.openURL(authUrl);
  };

  const openWebApp = () => {
    Linking.openURL(serverUrl);
  };

  // Navigation handler
  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  // Render Dashboard
  const renderDashboard = () => (
    <ScrollView 
      style={styles.pageContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome back!</Text>
        <Text style={styles.welcomeSubtitle}>Hello {user?.name || user?.email}</Text>
      </View>

      {dashboardData && (
        <>
          {/* Nutrition Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>📊 Today's Nutrition</Text>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{dashboardData.nutritionSummary?.totalCalories || 0}</Text>
                <Text style={styles.macroLabel}>Calories</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{dashboardData.nutritionSummary?.totalProtein || 0}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{dashboardData.nutritionSummary?.totalCarbs || 0}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{dashboardData.nutritionSummary?.totalFat || 0}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </View>

          {/* Training Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>🏋️ Training Stats</Text>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dashboardData.trainingStats?.totalSessions || 0}</Text>
                <Text style={styles.statLabel}>Total Sessions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dashboardData.trainingStats?.totalVolume || 0}</Text>
                <Text style={styles.statLabel}>Total Volume</Text>
              </View>
            </View>
          </View>

          {/* Body Metrics */}
          {dashboardData.bodyMetrics && dashboardData.bodyMetrics.length > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>⚖️ Latest Weight</Text>
              <Text style={styles.weightValue}>
                {dashboardData.bodyMetrics[0]?.weight || 'No data'} kg
              </Text>
              <Text style={styles.weightDate}>
                {dashboardData.bodyMetrics[0]?.date ? 
                  new Date(dashboardData.bodyMetrics[0].date).toLocaleDateString() : 
                  'No recent data'
                }
              </Text>
            </View>
          )}
        </>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.cardTitle}>⚡ Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigateTo('nutrition')}>
            <Text style={styles.actionButtonText}>🍎 Log Food</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigateTo('training')}>
            <Text style={styles.actionButtonText}>🏋️ Start Workout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // Render Nutrition
  const renderNutrition = () => (
    <ScrollView 
      style={styles.pageContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.pageTitle}>🍎 Nutrition Tracking</Text>
      
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Today's Progress</Text>
        {nutritionData ? (
          <>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{nutritionData.totalCalories || 0}</Text>
                <Text style={styles.macroLabel}>Calories</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{nutritionData.totalProtein || 0}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{nutritionData.totalCarbs || 0}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{nutritionData.totalFat || 0}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>No nutrition data for today</Text>
        )}
      </View>

      <View style={styles.featureCard}>
        <Text style={styles.cardTitle}>🚀 Nutrition Features</Text>
        <Text style={styles.featureItem}>• AI-powered food analysis</Text>
        <Text style={styles.featureItem}>• Barcode scanning</Text>
        <Text style={styles.featureItem}>• Macro tracking</Text>
        <Text style={styles.featureItem}>• Goal setting</Text>
        <Text style={styles.featureItem}>• Progress analytics</Text>
        
        <TouchableOpacity style={styles.webFeatureButton} onPress={openWebApp}>
          <Text style={styles.webFeatureButtonText}>📱 Use Full Features in Web App</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render Training
  const renderTraining = () => (
    <ScrollView 
      style={styles.pageContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.pageTitle}>🏋️ Training</Text>
      
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Training Overview</Text>
        {trainingData ? (
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{trainingData.totalSessions || 0}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{trainingData.totalVolume || 0}</Text>
              <Text style={styles.statLabel}>Total Volume</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>No training data available</Text>
        )}
      </View>

      <View style={styles.featureCard}>
        <Text style={styles.cardTitle}>🚀 Training Features</Text>
        <Text style={styles.featureItem}>• Scientific periodization</Text>
        <Text style={styles.featureItem}>• Custom workout templates</Text>
        <Text style={styles.featureItem}>• Exercise library</Text>
        <Text style={styles.featureItem}>• Progress tracking</Text>
        <Text style={styles.featureItem}>• Auto-regulation</Text>
        
        <TouchableOpacity style={styles.webFeatureButton} onPress={openWebApp}>
          <Text style={styles.webFeatureButtonText}>📱 Use Full Features in Web App</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render Profile
  const renderProfile = () => (
    <ScrollView style={styles.pageContainer}>
      <Text style={styles.pageTitle}>👤 Profile</Text>
      
      <View style={styles.profileCard}>
        <Text style={styles.cardTitle}>Account Information</Text>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Email:</Text>
          <Text style={styles.profileValue}>{user?.email}</Text>
        </View>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Name:</Text>
          <Text style={styles.profileValue}>{user?.name || 'Not set'}</Text>
        </View>
      </View>

      <View style={styles.featureCard}>
        <Text style={styles.cardTitle}>⚙️ Profile Features</Text>
        <Text style={styles.featureItem}>• Personal information</Text>
        <Text style={styles.featureItem}>• Body metrics tracking</Text>
        <Text style={styles.featureItem}>• Goal management</Text>
        <Text style={styles.featureItem}>• Preference settings</Text>
        <Text style={styles.featureItem}>• Progress analytics</Text>
        
        <TouchableOpacity style={styles.webFeatureButton} onPress={openWebApp}>
          <Text style={styles.webFeatureButtonText}>📱 Manage Full Profile in Web App</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Render current page content
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return renderDashboard();
      case 'nutrition':
        return renderNutrition();
      case 'training':
        return renderTraining();
      case 'profile':
        return renderProfile();
      default:
        return renderDashboard();
    }
  };

  // If user is logged in, show the main app
  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>MyTrainPro</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {renderPageContent()}
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={[styles.navItem, currentPage === 'dashboard' && styles.activeNavItem]}
            onPress={() => navigateTo('dashboard')}
          >
            <Text style={[styles.navText, currentPage === 'dashboard' && styles.activeNavText]}>
              📊 Dashboard
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, currentPage === 'nutrition' && styles.activeNavItem]}
            onPress={() => navigateTo('nutrition')}
          >
            <Text style={[styles.navText, currentPage === 'nutrition' && styles.activeNavText]}>
              🍎 Nutrition
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, currentPage === 'training' && styles.activeNavItem]}
            onPress={() => navigateTo('training')}
          >
            <Text style={[styles.navText, currentPage === 'training' && styles.activeNavText]}>
              🏋️ Training
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, currentPage === 'profile' && styles.activeNavItem]}
            onPress={() => navigateTo('profile')}
          >
            <Text style={[styles.navText, currentPage === 'profile' && styles.activeNavText]}>
              👤 Profile
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Login screen (existing code)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Header matching web version */}
        <View style={styles.authHeader}>
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
  
  // Header for logged in state
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  
  // Main content area
  mainContent: {
    flex: 1,
  },
  
  // Page containers
  pageContainer: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
  },
  
  // Welcome section
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  
  // Summary cards
  summaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  
  // Macro display
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  
  // Stats display
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  
  // Weight display
  weightValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  weightDate: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  
  // Quick actions
  quickActions: {
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Feature cards
  featureCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  featureItem: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  
  // Profile specific
  profileCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  profileValue: {
    fontSize: 16,
    color: '#666666',
  },
  
  // Web feature buttons
  webFeatureButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  webFeatureButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // No data state
  noDataText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Bottom navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeNavItem: {
    backgroundColor: '#f3f4f6',
  },
  navText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  activeNavText: {
    color: '#000000',
    fontWeight: '600',
  },
  
  // Auth header (login screen)
  authHeader: {
    alignItems: 'center',
    marginBottom: 32,
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
  
  // Logout button
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});