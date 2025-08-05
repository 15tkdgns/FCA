// FCA Theme Manager Module - Centralized theme and styling management

export class ThemeManager {
    constructor() {
        this.themes = new Map();
        this.currentTheme = 'default';
        this.customProperties = new Map();
        this.styleSheet = null;
        this.mediaQueries = new Map();
    }

    // Initialize theme manager
    init() {
        this.createStyleSheet();
        this.registerDefaultThemes();
        this.loadSavedTheme();
        this.setupMediaQueryListeners();
    }

    // Create dynamic stylesheet
    createStyleSheet() {
        this.styleSheet = document.createElement('style');
        this.styleSheet.id = 'fca-dynamic-styles';
        document.head.appendChild(this.styleSheet);
    }

    // Register a theme
    registerTheme(themeId, themeConfig) {
        this.themes.set(themeId, {
            id: themeId,
            name: themeConfig.name || themeId,
            colors: themeConfig.colors || {},
            typography: themeConfig.typography || {},
            spacing: themeConfig.spacing || {},
            shadows: themeConfig.shadows || {},
            borderRadius: themeConfig.borderRadius || {},
            chartStyles: themeConfig.chartStyles || {},
            customCSS: themeConfig.customCSS || ''
        });
    }

    // Apply theme
    applyTheme(themeId) {
        const theme = this.themes.get(themeId);
        if (!theme) {
            console.warn(`Theme not found: ${themeId}`);
            return;
        }

        this.currentTheme = themeId;

        // Update CSS custom properties
        this.updateCSSProperties(theme);

        // Update dynamic styles
        this.updateDynamicStyles(theme);

        // Save theme preference
        localStorage.setItem('fca-theme', themeId);

        // Emit theme change event
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { themeId, theme }
        }));
    }

    // Update CSS custom properties
    updateCSSProperties(theme) {
        const root = document.documentElement;

        // Colors
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });

        // Typography
        Object.entries(theme.typography).forEach(([key, value]) => {
            root.style.setProperty(`--font-${key}`, value);
        });

        // Spacing
        Object.entries(theme.spacing).forEach(([key, value]) => {
            root.style.setProperty(`--spacing-${key}`, value);
        });

        // Shadows
        Object.entries(theme.shadows).forEach(([key, value]) => {
            root.style.setProperty(`--shadow-${key}`, value);
        });

        // Border radius
        Object.entries(theme.borderRadius).forEach(([key, value]) => {
            root.style.setProperty(`--radius-${key}`, value);
        });
    }

    // Update dynamic styles
    updateDynamicStyles(theme) {
        let css = theme.customCSS || '';

        // Add responsive styles
        css += this.generateResponsiveStyles(theme);

        // Add chart-specific styles
        css += this.generateChartStyles(theme);

        // Update stylesheet
        this.styleSheet.textContent = css;
    }

    // Generate responsive styles
    generateResponsiveStyles(theme) {
        let css = '';

        // Mobile styles
        css += `
            @media (max-width: 768px) {
                .metric-card {
                    margin-bottom: ${theme.spacing.mobile || '1rem'};
                }
                .chart-container {
                    padding: ${theme.spacing.mobile || '1rem'};
                }
                .page-title {
                    font-size: ${theme.typography.mobileTitleSize || '1.5rem'};
                }
            }
        `;

        // Tablet styles
        css += `
            @media (min-width: 769px) and (max-width: 1024px) {
                .main-content {
                    padding: ${theme.spacing.tablet || '1.5rem'};
                }
            }
        `;

        return css;
    }

    // Generate chart-specific styles
    generateChartStyles(theme) {
        const chartStyles = theme.chartStyles;
        let css = '';

        if (chartStyles.plotly) {
            css += `
                .plotly .gtitle {
                    font-family: ${chartStyles.plotly.titleFont || 'inherit'} !important;
                    color: ${chartStyles.plotly.titleColor || theme.colors.primary} !important;
                }
            `;
        }

        return css;
    }

    // Apply theme to chart configuration
    applyThemeToChart(chartConfig, themeOverride = null) {
        const theme = this.themes.get(themeOverride || this.currentTheme);
        if (!theme) return chartConfig;

        const themedConfig = { ...chartConfig };

        // Apply color scheme
        if (theme.chartStyles.colors) {
            themedConfig.colors = theme.chartStyles.colors;
        }

        // Apply layout styling
        if (themedConfig.layout) {
            themedConfig.layout = {
                ...themedConfig.layout,
                font: { 
                    family: theme.typography.fontFamily || 'Inter, sans-serif',
                    color: theme.colors.text || '#1e293b'
                },
                paper_bgcolor: theme.colors.background || 'white',
                plot_bgcolor: theme.colors.plotBackground || 'white'
            };
        }

        return themedConfig;
    }

    // Register default themes
    registerDefaultThemes() {
        // Light theme (default)
        this.registerTheme('light', {
            name: 'Light Theme',
            colors: {
                primary: '#3b82f6',
                secondary: '#64748b',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                background: '#ffffff',
                surface: '#f8fafc',
                text: '#1e293b',
                textSecondary: '#64748b',
                border: '#e2e8f0'
            },
            typography: {
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                titleSize: '1.875rem',
                mobileTitleSize: '1.5rem'
            },
            spacing: {
                small: '0.5rem',
                medium: '1rem',
                large: '1.5rem',
                mobile: '1rem',
                tablet: '1.5rem'
            },
            shadows: {
                small: '0 1px 3px rgba(0, 0, 0, 0.05)',
                medium: '0 4px 12px rgba(0, 0, 0, 0.1)',
                large: '0 8px 25px rgba(0, 0, 0, 0.15)'
            },
            borderRadius: {
                small: '4px',
                medium: '8px',
                large: '12px'
            },
            chartStyles: {
                colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
                plotly: {
                    titleFont: 'Inter, sans-serif',
                    titleColor: '#1e293b'
                }
            }
        });

        // Dark theme
        this.registerTheme('dark', {
            name: 'Dark Theme',
            colors: {
                primary: '#60a5fa',
                secondary: '#94a3b8',
                success: '#34d399',
                warning: '#fbbf24',
                danger: '#f87171',
                background: '#0f172a',
                surface: '#1e293b',
                text: '#f8fafc',
                textSecondary: '#cbd5e1',
                border: '#334155'
            },
            typography: {
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                titleSize: '1.875rem',
                mobileTitleSize: '1.5rem'
            },
            spacing: {
                small: '0.5rem',
                medium: '1rem',
                large: '1.5rem',
                mobile: '1rem',
                tablet: '1.5rem'
            },
            shadows: {
                small: '0 1px 3px rgba(0, 0, 0, 0.3)',
                medium: '0 4px 12px rgba(0, 0, 0, 0.4)',
                large: '0 8px 25px rgba(0, 0, 0, 0.5)'
            },
            borderRadius: {
                small: '4px',
                medium: '8px',
                large: '12px'
            },
            chartStyles: {
                colors: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee'],
                plotly: {
                    titleFont: 'Inter, sans-serif',
                    titleColor: '#f8fafc'
                }
            },
            customCSS: `
                body { background-color: var(--color-background); color: var(--color-text); }
                .card { background-color: var(--color-surface); border-color: var(--color-border); }
                .sidebar { background-color: var(--color-surface); border-color: var(--color-border); }
            `
        });

        // Academic theme (for research papers)
        this.registerTheme('academic', {
            name: 'Academic Theme',
            colors: {
                primary: '#2563eb',
                secondary: '#475569',
                success: '#059669',
                warning: '#d97706',
                danger: '#dc2626',
                background: '#ffffff',
                surface: '#ffffff',
                text: '#000000',
                textSecondary: '#374151',
                border: '#d1d5db'
            },
            typography: {
                fontFamily: 'Times New Roman, Times, serif',
                titleSize: '1.75rem',
                mobileTitleSize: '1.5rem'
            },
            spacing: {
                small: '0.5rem',
                medium: '1rem',
                large: '1.5rem',
                mobile: '1rem',
                tablet: '1.5rem'
            },
            shadows: {
                small: '0 1px 2px rgba(0, 0, 0, 0.1)',
                medium: '0 2px 4px rgba(0, 0, 0, 0.1)',
                large: '0 4px 8px rgba(0, 0, 0, 0.1)'
            },
            borderRadius: {
                small: '2px',
                medium: '4px',
                large: '6px'
            },
            chartStyles: {
                colors: ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'],
                plotly: {
                    titleFont: 'Times New Roman, serif',
                    titleColor: '#000000'
                }
            },
            customCSS: `
                .chart-container { border: 1px solid var(--color-border); }
                .metric-card { box-shadow: var(--shadow-small); }
                h1, h2, h3, h4, h5, h6 { font-family: var(--font-fontFamily); }
            `
        });
    }

    // Setup media query listeners for responsive themes
    setupMediaQueryListeners() {
        // Dark mode preference
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.mediaQueries.set('darkMode', darkModeQuery);

        darkModeQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('fca-theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });

        // High contrast preference
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        this.mediaQueries.set('highContrast', highContrastQuery);

        // Reduced motion preference
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.mediaQueries.set('reducedMotion', reducedMotionQuery);

        reducedMotionQuery.addEventListener('change', (e) => {
            document.documentElement.style.setProperty(
                '--animation-duration', 
                e.matches ? '0s' : '0.3s'
            );
        });
    }

    // Load saved theme
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('fca-theme');
        if (savedTheme && this.themes.has(savedTheme)) {
            this.applyTheme(savedTheme);
        } else {
            // Apply default based on system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light');
        }
    }

    // Get current theme
    getCurrentTheme() {
        return this.themes.get(this.currentTheme);
    }

    // Get all themes
    getAllThemes() {
        return Array.from(this.themes.values());
    }

    // Toggle between light and dark themes
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    // Add custom CSS property
    setCustomProperty(property, value) {
        this.customProperties.set(property, value);
        document.documentElement.style.setProperty(`--${property}`, value);
    }

    // Get custom CSS property
    getCustomProperty(property) {
        return this.customProperties.get(property);
    }

    // Cleanup
    destroy() {
        if (this.styleSheet && this.styleSheet.parentNode) {
            this.styleSheet.parentNode.removeChild(this.styleSheet);
        }
        
        this.mediaQueries.forEach(query => {
            query.removeEventListener('change', () => {});
        });
    }
}