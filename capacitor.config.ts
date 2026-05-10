import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tokokupos.app',
  appName: 'TokoKu',
  webDir: 'out',
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email", "openid"],
      serverClientId: "957204893367-j1ub6tif1rtoh7kiqig3m11s7q8aagiu.apps.googleusercontent.com",
      forceCodeForRefreshToken: false,
    },
  },
};

export default config;
