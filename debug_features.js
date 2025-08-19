// Debug script to check localStorage and global features
console.log('=== Feature Flags Debug ===');
console.log('localStorage workout-settings:', localStorage.getItem('workout-settings'));

// Check if the global feature object exists
if (window.globalFeatures) {
  console.log('Global features:', window.globalFeatures);
} else {
  console.log('Global features not available');
}

// Listen for feature updates
window.addEventListener('featureFlagUpdated', (e) => {
  console.log('Feature flag updated:', e.detail);
});

window.addEventListener('featureFlagsUpdated', (e) => {
  console.log('Feature flags batch updated:', e.detail);
});