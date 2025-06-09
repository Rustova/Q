
// config.ts

// Reference placeholder strings for configuration checks.
// The actual URLs used by the app are set in the AppConfig object below.

// For GITHUB_DATA_URL:
// This URL points to your main data.json file (containing subjects, quizzes, questions).
// It can be a GitHub raw content URL (raw.githubusercontent.com) or a GitHub API URL for contents.
// If using a 'github.com/user/repo/blob/branch/path/to/data.json' URL, the app will attempt to convert it.
// If this is a placeholder or empty, the app will try to load './data.json' locally.
export const PLACEHOLDER_GITHUB_DATA_URL = 'YOUR_GITHUB_RAW_DATA_JSON_URL_HERE_OR_LEAVE_EMPTY_TO_ALWAYS_USE_LOCAL_FALLBACK';

// Removed PLACEHOLDER_APPS_SCRIPT_PAT_URL
// Removed PLACEHOLDER_APPS_SCRIPT_SECRET


interface Config {
  GITHUB_DATA_URL: string;
  DEFAULT_THEME: 'light' | 'dark';
  // Removed GOOGLE_APPS_SCRIPT_PAT_FETCHER_URL
  // Removed APPS_SCRIPT_SHARED_SECRET
}

const AppConfig: Config = {
    GITHUB_DATA_URL: 'https://github.com/Rustova/Q/blob/main/data.json',
    DEFAULT_THEME: 'dark',
    // Removed GOOGLE_APPS_SCRIPT_PAT_FETCHER_URL
    // Removed APPS_SCRIPT_SHARED_SECRET
};

export default AppConfig;
