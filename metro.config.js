// Sentry's Metro config adds debug IDs so crash reports map back to your
// TypeScript source (source maps). Otherwise identical to Expo's default.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
