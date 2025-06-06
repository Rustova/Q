// config.ts

export const PLACEHOLDER_GITHUB_DATA_URL = 'YOUR_GITHUB_RAW_DATA_JSON_URL_HERE_OR_LEAVE_EMPTY_TO_ALWAYS_USE_LOCAL_FALLBACK';

interface Config {
  GITHUB_DATA_URL: string; // The raw URL or blob URL to the data.json file on GitHub
  DEFAULT_THEME: 'light' | 'dark';
}

const AppConfig: Config = {
    GITHUB_DATA_URL: 'https://github.com/Rustova/Q/blob/main/data.json', // Corrected to be an actual URL
    DEFAULT_THEME: 'dark'
};

export default AppConfig;