
// config.ts

// Reference placeholder strings for configuration checks.
// The actual URLs used by the app are set in the AppConfig object below.

// For GITHUB_DATA_URL:
// This URL points to your main data.json file (containing subjects, quizzes, questions).
// It can be a GitHub raw content URL (raw.githubusercontent.com) or a GitHub API URL for contents.
// If using a 'github.com/user/repo/blob/branch/path/to/data.json' URL, the app will attempt to convert it.
// If this is a placeholder or empty, the app will try to load './data.json' locally.
export const PLACEHOLDER_GITHUB_DATA_URL = 'YOUR_GITHUB_RAW_DATA_JSON_URL_HERE_OR_LEAVE_EMPTY_TO_ALWAYS_USE_LOCAL_FALLBACK';

// For PAT Fetcher:
// GOOGLE_APPS_SCRIPT_PAT_FETCHER_URL is the endpoint for fetching the PAT.
// APPS_SCRIPT_SHARED_SECRET is a secret key to authenticate the request to the Apps Script.
export const PLACEHOLDER_APPS_SCRIPT_PAT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_FOR_PAT_HERE_IF_NOT_USING_DEFAULT'; // Kept for clarity, though AppConfig uses a direct URL
export const PLACEHOLDER_APPS_SCRIPT_SECRET = 'YOUR_APPS_SCRIPT_SHARED_SECRET_HERE';


interface Config {
  GITHUB_DATA_URL: string;
  DEFAULT_THEME: 'light' | 'dark';
  GOOGLE_APPS_SCRIPT_PAT_FETCHER_URL: string;
  APPS_SCRIPT_SHARED_SECRET?: string; // Optional: if not set, PAT fetching from script is disabled
}

const AppConfig: Config = {
    GITHUB_DATA_URL: 'https://github.com/Rustova/Q/blob/main/data.json',
    DEFAULT_THEME: 'dark',
    GOOGLE_APPS_SCRIPT_PAT_FETCHER_URL: 'https://script.google.com/macros/s/AKfycbz-AFYjxhI7KH_IfXAfm1dr5C5XM3D1YKw8AkyljTvDS-dPbKDnYPYMlWnloQTvifDzdw/exec',
    APPS_SCRIPT_SHARED_SECRET: PLACEHOLDER_APPS_SCRIPT_SECRET, // Replace placeholder or leave to disable feature
};

export default AppConfig;
