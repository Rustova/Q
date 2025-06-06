// config.ts

export const PLACEHOLDER_GITHUB_DATA_URL = 'YOUR_GITHUB_RAW_DATA_JSON_URL_HERE_OR_LEAVE_EMPTY_TO_ALWAYS_USE_LOCAL_FALLBACK';

interface Config {
  GITHUB_DATA_URL: string; // The raw URL to the data.json file on GitHub
  DEFAULT_THEME: 'light' | 'dark';
}

const AppConfig: Config = {
    GITHUB_DATA_URL: 'https://raw.githubusercontent.com/Rustova/Q/main/data.json',
    DEFAULT_THEME: 'dark'
};

export default AppConfig;