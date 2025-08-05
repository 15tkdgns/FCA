/**
 * Theme Manager Module
 * ====================
 * 
 * Handles theme switching and persistence for the FCA Dashboard
 */

export class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.themeChangeCallbacks = [];
        
        this.init();
    }

    init() {
        // Apply initial theme
        this.applyTheme(this.currentTheme);
        
        // Setup theme toggle event listeners
        this.setupThemeToggle();
        
        // Listen for system theme changes
        this.setupSystemThemeListener();
        
        console.log(`🎨 Theme Manager initialized with ${this.currentTheme} theme`);
    }

    /**
     * Setup theme toggle functionality
     */
    setupThemeToggle() {
        // Find theme toggle buttons
        const themeToggles = document.querySelectorAll('[data-action="toggle-theme"]');
        
        themeToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        });

        // Keyboard shortcut (Ctrl/Cmd + Shift + T)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    /**
     * Listen for system theme changes
     */
    setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                if (!this.getStoredTheme()) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.setTheme(newTheme, false); // Don't store system preference
                }
            });
        }
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        
        // Show notification
        this.showThemeChangeNotification(newTheme);
    }

    /**
     * Set specific theme
     * @param {string} theme - Theme name ('light' or 'dark')
     * @param {boolean} store - Whether to store the preference
     */
    setTheme(theme, store = true) {
        if (!['light', 'dark'].includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return;
        }

        const oldTheme = this.currentTheme;
        this.currentTheme = theme;

        // Apply theme to DOM
        this.applyTheme(theme);

        // Store preference
        if (store) {
            this.storeTheme(theme);
        }

        // Update UI elements
        this.updateThemeUI(theme);

        // Trigger callbacks
        this.triggerThemeChangeCallbacks(theme, oldTheme);

        console.log(`🎨 Theme changed from ${oldTheme} to ${theme}`);
    }

    /**
     * Apply theme to DOM
     */
    applyTheme(theme) {
        const root = document.documentElement;
        
        // Remove old theme classes
        root.classList.remove('theme-light', 'theme-dark');
        
        // Add new theme class
        root.classList.add(`theme-${theme}`);
        
        // Set data attribute for CSS targeting
        root.setAttribute('data-theme', theme);

        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
    }

    /**
     * Update meta theme-color for mobile browsers
     */
    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        const colors = {
            light: '#4e73df',
            dark: '#1a1a1a'
        };

        metaThemeColor.content = colors[theme] || colors.light;
    }

    /**
     * Update theme-related UI elements
     */
    updateThemeUI(theme) {
        // Update theme toggle button text/icons
        const themeToggles = document.querySelectorAll('[data-action="toggle-theme"]');
        
        themeToggles.forEach(toggle => {
            const icon = toggle.querySelector('i');
            const text = toggle.querySelector('.theme-text');
            
            if (icon) {
                icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
            
            if (text) {
                text.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
            }
        });

        // Update any theme indicators
        const indicators = document.querySelectorAll('[data-theme-indicator]');
        indicators.forEach(indicator => {
            indicator.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
        });
    }

    /**
     * Store theme preference in localStorage
     */
    storeTheme(theme) {
        try {
            localStorage.setItem('dashboard-theme', theme);
        } catch (error) {
            console.warn('Failed to store theme preference:', error);
        }
    }

    /**
     * Get stored theme preference
     */
    getStoredTheme() {
        try {
            return localStorage.getItem('dashboard-theme');
        } catch (error) {
            console.warn('Failed to get stored theme:', error);
            return null;
        }
    }

    /**
     * Get system preferred theme
     */
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Show theme change notification
     */
    showThemeChangeNotification(theme) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <i class="fas fa-${theme === 'light' ? 'sun' : 'moon'}"></i>
            <span>Switched to ${theme} mode</span>
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    /**
     * Register callback for theme changes
     */
    onThemeChange(callback) {
        if (typeof callback === 'function') {
            this.themeChangeCallbacks.push(callback);
        }
    }

    /**
     * Trigger theme change callbacks
     */
    triggerThemeChangeCallbacks(newTheme, oldTheme) {
        this.themeChangeCallbacks.forEach(callback => {
            try {
                callback(newTheme, oldTheme);
            } catch (error) {
                console.error('Theme change callback error:', error);
            }
        });
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Check if theme is dark
     */
    isDark() {
        return this.currentTheme === 'dark';
    }

    /**
     * Check if theme is light
     */
    isLight() {
        return this.currentTheme === 'light';
    }

    /**
     * Reset to system theme
     */
    resetToSystemTheme() {
        // Clear stored preference
        try {
            localStorage.removeItem('dashboard-theme');
        } catch (error) {
            console.warn('Failed to clear theme preference:', error);
        }

        // Apply system theme
        const systemTheme = this.getSystemTheme();
        this.setTheme(systemTheme, false);
    }

    /**
     * Get theme configuration for charts/components
     */
    getThemeConfig() {
        const configs = {
            light: {
                background: '#ffffff',
                surface: '#f8f9fc',
                text: '#5a5c69',
                primary: '#4e73df',
                secondary: '#858796',
                accent: '#1cc88a',
                border: '#e3e6f0'
            },
            dark: {
                background: '#1a1a1a',
                surface: '#2d2d2d',
                text: '#e0e0e0',
                primary: '#6c85ff',
                secondary: '#9ca3af',
                accent: '#22d3a3',
                border: '#404040'
            }
        };

        return configs[this.currentTheme];
    }
}