// FCA Dashboard Translation System
// Simple and reliable translation implementation

class TranslationManager {
    constructor() {
        this.currentLanguage = 'en';
        this.isInitialized = false;
        this.languageCodes = {
            'en': { name: 'English', flag: '🇺🇸', code: 'EN' },
            'ko': { name: '한국어', flag: '🇰🇷', code: 'KO' },
            'ja': { name: '日本語', flag: '🇯🇵', code: 'JA' },
            'zh': { name: '中文', flag: '🇨🇳', code: 'ZH' },
            'es': { name: 'Español', flag: '🇪🇸', code: 'ES' },
            'fr': { name: 'Français', flag: '🇫🇷', code: 'FR' },
            'de': { name: 'Deutsch', flag: '🇩🇪', code: 'DE' },
            'pt': { name: 'Português', flag: '🇧🇷', code: 'PT' },
            'ru': { name: 'Русский', flag: '🇷🇺', code: 'RU' },
            'ar': { name: 'العربية', flag: '🇸🇦', code: 'AR' }
        };
        this.init();
    }

    init() {
        console.log('🌐 Translation Manager initializing...');
        this.createTranslateWidget();
        this.setupEventListeners();
        this.detectUserLanguage();
        this.isInitialized = true;
        console.log('✅ Translation Manager ready');
    }

    createTranslateWidget() {
        // Create hidden Google Translate element
        if (!document.getElementById('google_translate_element')) {
            const translateDiv = document.createElement('div');
            translateDiv.id = 'google_translate_element';
            translateDiv.style.display = 'none';
            document.body.appendChild(translateDiv);
        }

        // Add CSS to hide Google Translate interface
        if (!document.getElementById('translator-css')) {
            const style = document.createElement('style');
            style.id = 'translator-css';
            style.textContent = `
                .goog-te-banner-frame.skiptranslate { display: none !important; }
                .goog-te-gadget { display: none !important; }
                body { top: 0px !important; }
                .goog-te-combo { display: none !important; }
                .goog-logo-link { display: none !important; }
                .goog-te-gadget > span > a { display: none !important; }
                #google_translate_element { display: none !important; }
                .goog-te-balloon-frame { display: none !important; }
                .goog-te-menu-frame { max-width: 100% !important; }
            `;
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // No additional event listeners needed - handled by onclick in HTML
    }

    detectUserLanguage() {
        // Get user's preferred language
        const userLang = navigator.language || navigator.userLanguage;
        const langCode = userLang.split('-')[0];
        
        // Update display if user has different language preference
        if (this.languageCodes[langCode] && langCode !== 'en') {
            console.log(`🌍 User preferred language detected: ${this.languageCodes[langCode].name}`);
        }
    }

    translateToLanguage(targetLang) {
        if (!this.isInitialized) {
            console.warn('⚠️ Translation manager not ready yet');
            return;
        }

        if (targetLang === this.currentLanguage) {
            console.log(`Already in ${targetLang}`);
            return;
        }

        console.log(`🔄 Translating to ${targetLang}`);
        this.showTranslationLoader();

        try {
            // Wait for Google Translate to be available
            if (typeof google !== 'undefined' && google.translate) {
                this.performTranslation(targetLang);
            } else {
                // Initialize Google Translate Widget
                this.initializeGoogleTranslateWidget(targetLang);
            }
        } catch (error) {
            console.error('Translation error:', error);
            this.showTranslationError(error.message);
        }
    }

    initializeGoogleTranslateWidget(targetLang) {
        // Initialize Google Translate Widget with better error handling
        if (typeof google !== 'undefined' && google.translate && google.translate.TranslateElement) {
            try {
                // Clear any existing widget first
                const existingWidget = document.getElementById('google_translate_element');
                if (existingWidget) {
                    existingWidget.innerHTML = '';
                }

                new google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: Object.keys(this.languageCodes).join(','),
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false,
                    multilanguagePage: true,
                    gaTrack: false,
                    gaId: null
                }, 'google_translate_element');

                // Wait for widget to initialize, then translate
                this.waitForWidget(targetLang);
            } catch (error) {
                console.error('Error initializing Google Translate widget:', error);
                this.showTranslationError('Failed to initialize translation widget');
            }
        } else {
            console.error('Google Translate not available - retrying...');
            this.retryTranslation(targetLang);
        }
    }

    waitForWidget(targetLang, attempts = 0) {
        const maxAttempts = 10;
        const selectElement = document.querySelector('.goog-te-combo');
        
        if (selectElement) {
            console.log('✅ Google Translate widget ready');
            setTimeout(() => this.performTranslation(targetLang), 500);
        } else if (attempts < maxAttempts) {
            console.log(`⏳ Waiting for widget... (${attempts + 1}/${maxAttempts})`);
            setTimeout(() => this.waitForWidget(targetLang, attempts + 1), 500);
        } else {
            console.error('❌ Widget failed to load after maximum attempts');
            this.showTranslationError('Translation widget failed to load');
        }
    }

    retryTranslation(targetLang, attempts = 0) {
        const maxRetries = 3;
        
        if (attempts >= maxRetries) {
            this.showTranslationError('Translation service unavailable');
            return;
        }

        console.log(`🔄 Retrying translation initialization... (${attempts + 1}/${maxRetries})`);
        
        setTimeout(() => {
            if (typeof google !== 'undefined' && google.translate) {
                this.initializeGoogleTranslateWidget(targetLang);
            } else {
                this.retryTranslation(targetLang, attempts + 1);
            }
        }, 1000 * (attempts + 1)); // Exponential backoff
    }

    performTranslation(targetLang) {
        // Find Google Translate combo box
        const selectElement = document.querySelector('.goog-te-combo');
        
        if (selectElement) {
            console.log(`✅ Found translate combo box, switching to ${targetLang}`);
            
            // Set the language
            selectElement.value = targetLang;
            selectElement.dispatchEvent(new Event('change'));
            
            this.currentLanguage = targetLang;
            this.updateLanguageDisplay(targetLang);
            
            setTimeout(() => {
                this.hideTranslationLoader();
                this.showTranslationSuccess(targetLang);
            }, 1500);
        } else {
            console.log('⚠️ Translate combo box not found, trying fallback method');
            // Fallback: try direct approach
            this.performDirectTranslation(targetLang);
        }
    }

    performDirectTranslation(targetLang) {
        // Alternative translation method - retry the widget approach
        console.log(`🔄 Retrying translation to ${targetLang}`);
        
        // Wait a bit more for Google Translate to fully load
        setTimeout(() => {
            const selectElement = document.querySelector('.goog-te-combo');
            if (selectElement) {
                // Try again with the combo box
                selectElement.value = targetLang;
                selectElement.dispatchEvent(new Event('change'));
                
                this.currentLanguage = targetLang;
                this.updateLanguageDisplay(targetLang);
                
                setTimeout(() => {
                    this.hideTranslationLoader();
                    this.showTranslationSuccess(targetLang);
                }, 1500);
            } else {
                // If still no combo box, reinitialize the widget
                this.reinitializeWidget(targetLang);
            }
        }, 2000);
    }

    reloadGoogleTranslateScript(targetLang) {
        console.log('🔄 Reloading Google Translate script...');
        
        // Remove existing script
        const existingScripts = document.querySelectorAll('script[src*="translate.google.com"]');
        existingScripts.forEach(script => script.remove());
        
        // Load new script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.onerror = () => {
            console.error('Failed to reload Google Translate script');
            this.showTranslationError('Unable to load translation service');
        };
        document.head.appendChild(script);
        
        // Wait for script to load and try again
        setTimeout(() => {
            if (typeof google !== 'undefined' && google.translate) {
                this.initializeGoogleTranslateWidget(targetLang);
            } else {
                this.showTranslationError('Translation service unavailable');
            }
        }, 3000);
    }

    reinitializeWidget(targetLang) {
        console.log('🔄 Reinitializing Google Translate widget...');
        
        // Remove existing widget
        const existingWidget = document.getElementById('google_translate_element');
        if (existingWidget) {
            existingWidget.innerHTML = '';
        }
        
        // Reinitialize after a delay
        setTimeout(() => {
            if (typeof google !== 'undefined' && google.translate && google.translate.TranslateElement) {
                try {
                    new google.translate.TranslateElement({
                        pageLanguage: 'en',
                        includedLanguages: Object.keys(this.languageCodes).join(','),
                        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                        autoDisplay: false,
                        multilanguagePage: true
                    }, 'google_translate_element');
                    
                    // Wait for widget to initialize, then translate
                    setTimeout(() => {
                        const selectElement = document.querySelector('.goog-te-combo');
                        if (selectElement) {
                            selectElement.value = targetLang;
                            selectElement.dispatchEvent(new Event('change'));
                            
                            this.currentLanguage = targetLang;
                            this.updateLanguageDisplay(targetLang);
                            
                            setTimeout(() => {
                                this.hideTranslationLoader();
                                this.showTranslationSuccess(targetLang);
                            }, 1500);
                        } else {
                            this.showTranslationError('Unable to initialize translation widget');
                        }
                    }, 3000);
                } catch (error) {
                    console.error('Error reinitializing widget:', error);
                    this.showTranslationError('Translation widget error');
                }
            } else {
                this.showTranslationError('Google Translate API not available');
            }
        }, 1000);
    }

    updateLanguageDisplay(langCode) {
        const currentLangElement = document.getElementById('current-language');
        if (currentLangElement && this.languageCodes[langCode]) {
            currentLangElement.textContent = this.languageCodes[langCode].code;
        }
    }

    showTranslationLoader() {
        const button = document.getElementById('languageDropdown');
        if (button) {
            button.innerHTML = '🔄 <span id="current-language">Loading...</span>';
            button.disabled = true;
        }
    }

    hideTranslationLoader() {
        const button = document.getElementById('languageDropdown');
        if (button) {
            const langInfo = this.languageCodes[this.currentLanguage];
            button.innerHTML = `🌐 <span id="current-language">${langInfo ? langInfo.code : 'EN'}</span>`;
            button.disabled = false;
        }
    }

    showTranslationSuccess(langCode) {
        const langInfo = this.languageCodes[langCode];
        if (langInfo) {
            this.showNotification(`Translated to ${langInfo.name}`, 'success');
        }
    }

    showTranslationError(message) {
        this.hideTranslationLoader();
        this.showNotification(`Translation failed: ${message}`, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Public methods
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getAvailableLanguages() {
        return this.languageCodes;
    }

    resetToOriginal() {
        this.translateToLanguage('en');
    }
}

// Initialize Google Translate Element (called by Google Translate script)
function googleTranslateElementInit() {
    console.log('📡 Google Translate API loaded');
    if (!window.translationManager) {
        window.translationManager = new TranslationManager();
    }
}

// Global translation function for onclick handlers
function translatePage(targetLang) {
    console.log(`🌍 Translation requested: ${targetLang}`);
    
    if (window.translationManager) {
        window.translationManager.translateToLanguage(targetLang);
    } else {
        console.log('🔄 Initializing translation manager...');
        window.translationManager = new TranslationManager();
        setTimeout(() => {
            window.translationManager.translateToLanguage(targetLang);
        }, 1000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, setting up translation system...');
    
    // Initialize translation manager
    if (!window.translationManager) {
        window.translationManager = new TranslationManager();
    }
    
    // Wait for Google Translate script to load
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkGoogleTranslate = () => {
        attempts++;
        if (typeof google !== 'undefined' && google.translate) {
            console.log('✅ Google Translate loaded successfully');
            googleTranslateElementInit();
        } else if (attempts < maxAttempts) {
            setTimeout(checkGoogleTranslate, 100);
        } else {
            console.warn('⚠️ Google Translate failed to load after 5 seconds');
            // Still allow manual translation attempts
        }
    };
    
    checkGoogleTranslate();
});

// Export for global access
window.TranslationManager = TranslationManager;
window.translatePage = translatePage;
window.googleTranslateElementInit = googleTranslateElementInit;