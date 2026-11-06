import { t } from './i18n.js';

const root = document.documentElement;
const toggle = document.querySelector('#theme-toggle');
const themeColor = document.querySelector('meta[name="theme-color"]');
const colorPreference = window.matchMedia('(prefers-color-scheme: dark)');
const storageKey = 'monitari-theme';

function getSavedTheme() {
    try {
        return localStorage.getItem(storageKey);
    } catch {
        return null;
    }
}

function saveTheme(theme) {
    try {
        localStorage.setItem(storageKey, theme);
    } catch {
        // The selected theme still applies when storage is unavailable.
    }
}

function applyTheme(theme, persist = false) {
    const isDark = theme === 'dark';

    root.dataset.theme = isDark ? 'dark' : 'light';
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', t(isDark ? 'toLight' : 'toDark'));
    themeColor?.setAttribute('content', isDark ? '#101216' : '#f2f4f6');

    if (persist) {
        saveTheme(isDark ? 'dark' : 'light');
    }
}

const savedTheme = getSavedTheme();
applyTheme(savedTheme || (colorPreference.matches ? 'dark' : 'light'));

toggle.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
});

colorPreference.addEventListener('change', (event) => {
    if (!getSavedTheme()) {
        applyTheme(event.matches ? 'dark' : 'light');
    }
});

document.addEventListener('localechange', () => {
    applyTheme(root.dataset.theme);
});
