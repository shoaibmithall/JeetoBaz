const appJson = require('./app.json');

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  experiments: {
    ...appJson.expo.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
  plugins: [
    ...(appJson.expo.plugins || []),
    [
      'expo-image-picker',
      {
        photosPermission: 'JeetoBaz needs photo access so you can upload your payment receipt screenshot.',
        cameraPermission: 'JeetoBaz needs camera access so you can take a payment receipt photo.',
        microphonePermission: false,
      },
    ],
  ],
});
