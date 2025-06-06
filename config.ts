// config.ts
interface Config {
  GOOGLE_DRIVE_FILE_ID: string;
  GOOGLE_CLIENT_ID: string; // Obtain this from Google Cloud Console for OAuth 2.0
  DEFAULT_THEME: 'light' | 'dark';
}

const AppConfig: Config = {
    GOOGLE_DRIVE_FILE_ID: '1g24O5xWlZEuxTXcBI_XRlBMdLiOPZ7XJ', // The file ID you provided
    GOOGLE_CLIENT_ID: '646728266270-tmlq2qc1camj2sudsk6v74fala3m9gu7.apps.googleusercontent.com', // Replace with your actual Google Cloud Client ID
    DEFAULT_THEME: 'dark'
};

// Define placeholder constants for comparison in App.tsx
export const PLACEHOLDER_GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';

export default AppConfig;