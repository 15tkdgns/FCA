/**
 * FCA Application Module
 * 애플리케이션의 주요 진입점과 모듈 관리
 */
import { moduleManager } from './core/ModuleManager.js';
import { APIClient } from './api/APIClient.js';
import { FCADashboard } from './dashboard/FCADashboard.js';
import { errorHandler, ErrorTypes, ErrorSeverity } from './utils/ErrorHandler.js';
import { Validator } from './utils/Validator.js';
import { TypeGuards } from './utils/TypeSafety.js';

class FCAApp {
    constructor() {
        this.initialized = false;
        this.modules = new Map();
        this.logger = this.createLogger();
    }

    async initialize() {
        if (this.initialized) {
            this.logger.warn('Application already initialized');
            return;
        }

        try {
            this.logger.info('🚀 FCA Application initializing...');
            
            // Initialize error handling first
            this.setupErrorHandling();
            
            // Validate environment
            this.validateEnvironment();
            
            // Register core modules
            await this.registerModules();
            
            // Initialize application
            await this.initializeApp();
            
            // Set up global error handlers
            this.setupErrorHandlers();
            
            // Set up keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Final validation
            this.validateApplication();
            
            this.initialized = true;
            this.logger.info('🎉 FCA Application ready!');
            
        } catch (error) {
            errorHandler.handleError(error, { 
                context: 'application_initialization',
                phase: 'initialize'
            });
            throw error;
        }
    }

    setupErrorHandling() {
        // Set up application-specific error listeners
        errorHandler.addErrorListener(ErrorTypes.MODULE_ERROR, (error) => {
            this.logger.error('Module error occurred:', error);
            this.handleModuleError(error);
        });

        errorHandler.addErrorListener(ErrorTypes.API_ERROR, (error) => {
            this.logger.error('API error occurred:', error);
            this.handleAPIError(error);
        });

        errorHandler.addErrorListener(ErrorTypes.DEPENDENCY_ERROR, (error) => {
            this.logger.error('Dependency error occurred:', error);
            this.handleDependencyError(error);
        });

        this.logger.info('Error handling configured');
    }

    validateEnvironment() {
        this.logger.info('Validating environment...');
        
        const validation = Validator.validateConfig({
            browser: navigator.userAgent,
            features: {
                es6Modules: typeof Symbol !== 'undefined',
                fetch: typeof fetch !== 'undefined',
                promises: typeof Promise !== 'undefined',
                localStorage: typeof localStorage !== 'undefined'
            }
        }, {
            browser: { type: 'string', required: true },
            features: {
                type: 'object',
                required: true,
                validate: (features) => {
                    const required = ['es6Modules', 'fetch', 'promises', 'localStorage'];
                    const missing = required.filter(feature => !features[feature]);
                    return missing.length === 0 || `Missing features: ${missing.join(', ')}`;
                }
            }
        });

        if (!validation.valid) {
            throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
        }

        if (validation.warnings.length > 0) {
            this.logger.warn('Environment warnings:', validation.warnings);
        }

        this.logger.info('Environment validation passed');
    }

    async registerModules() {
        this.logger.info('Registering modules...');
        
        try {
            // Validate module classes before registration
            if (!TypeGuards.isFunction(APIClient)) {
                throw new Error('APIClient is not a valid constructor');
            }
            
            if (!TypeGuards.isFunction(FCADashboard)) {
                throw new Error('FCADashboard is not a valid constructor');
            }

            // Register core modules with dependencies
            moduleManager.register('APIClient', APIClient, {
                dependencies: []
            });
            
            moduleManager.register('FCADashboard', FCADashboard, {
                dependencies: ['APIClient']
            });
            
            // Check for circular dependencies
            const cycles = moduleManager.detectCircularDependencies();
            if (cycles.length > 0) {
                this.logger.warn('Circular dependencies detected:', cycles);
            }
            
            this.logger.info('Core modules registered');
            
        } catch (error) {
            errorHandler.handleError(error, {
                context: 'module_registration',
                modules: ['APIClient', 'FCADashboard']
            });
            throw error;
        }
    }

    async initializeApp() {
        try {
            // Create and initialize API client first
            const apiClient = await moduleManager.create('APIClient');
            this.modules.set('apiClient', apiClient);
            
            // Create and initialize dashboard
            const dashboard = await moduleManager.create('FCADashboard');
            this.modules.set('dashboard', dashboard);
            
            // Make dashboard globally available for legacy compatibility
            window.dashboard = dashboard;
            window.apiClient = apiClient;
            
            // Initialize performance monitoring if available
            if (window.moduleLoader) {
                this.initializePerformanceIntegration();
            }
            
            this.logger.info('Core application modules initialized');
            
        } catch (error) {
            this.logger.error('Failed to initialize application modules:', error);
            throw error;
        }
    }

    initializePerformanceIntegration() {
        // Register lazy loading for chart containers
        const chartContainers = document.querySelectorAll('[id$="-chart"]');
        chartContainers.forEach(container => {
            if (window.moduleLoader) {
                window.moduleLoader.registerLazyElement(container, 'advanced-charts');
            }
        });
        
        // Register lazy loading for real-time elements
        const realTimeElements = document.querySelectorAll('[data-realtime]');
        realTimeElements.forEach(element => {
            if (window.moduleLoader) {
                window.moduleLoader.registerLazyElement(element, 'real-time-monitor');
            }
        });
        
        this.logger.info('Performance integration configured');
    }

    setupErrorHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.logger.error('Global error:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.logger.error('Unhandled promise rejection:', event.reason);
            event.preventDefault(); // Prevent console spam
        });

        this.logger.info('Global error handlers configured');
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+D: Toggle debug mode
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                this.toggleDebugMode();
                e.preventDefault();
            }
            
            // Ctrl+Shift+M: Show module status
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                this.showModuleStatus();
                e.preventDefault();
            }
            
            // Ctrl+Shift+R: Restart application
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                this.restart();
                e.preventDefault();
            }
        });

        this.logger.info('Keyboard shortcuts configured (Ctrl+Shift+D/M/R)');
    }

    toggleDebugMode() {
        const isDebug = document.body.classList.toggle('debug-mode');
        this.logger.info(`Debug mode ${isDebug ? 'enabled' : 'disabled'}`);
        
        if (isDebug) {
            moduleManager.debug();
        }
    }

    showModuleStatus() {
        console.group('📋 Module Status Report');
        
        const status = moduleManager.getModuleStatus();
        console.table(status);
        
        const performance = moduleManager.getPerformanceStats();
        console.log('Performance:', performance);
        
        const graph = moduleManager.getDependencyGraph();
        console.log('Dependency Graph:', graph);
        
        const cycles = moduleManager.detectCircularDependencies();
        if (cycles.length > 0) {
            console.warn('Circular Dependencies:', cycles);
        }
        
        console.groupEnd();
    }

    async restart() {
        this.logger.info('🔄 Restarting application...');
        
        try {
            await this.destroy();
            await this.initialize();
            this.logger.info('✅ Application restarted successfully');
        } catch (error) {
            this.logger.error('❌ Application restart failed:', error);
        }
    }

    async destroy() {
        this.logger.info('🧹 Destroying application...');
        
        try {
            // Destroy all modules
            await moduleManager.destroyAll();
            
            // Clear global references
            delete window.dashboard;
            delete window.apiClient;
            
            this.modules.clear();
            this.initialized = false;
            
            this.logger.info('Application destroyed');
            
        } catch (error) {
            this.logger.error('Error during application destruction:', error);
            throw error;
        }
    }

    // Utility methods
    getModule(name) {
        return this.modules.get(name) || moduleManager.get(name);
    }

    getModuleStatus() {
        return {
            initialized: this.initialized,
            moduleCount: this.modules.size,
            registeredModules: Array.from(moduleManager.moduleRegistry.keys()),
            activeModules: Array.from(moduleManager.modules.keys())
        };
    }

    validateApplication() {
        this.logger.info('Performing final application validation...');
        
        try {
            // Validate module manager state
            const moduleStatus = moduleManager.getModuleStatus();
            const moduleValidation = Validator.validateConfig(moduleStatus, {
                APIClient: { 
                    type: 'object', 
                    required: true,
                    validate: (module) => Validator.validateModuleState(module).valid || 'Invalid module state'
                },
                FCADashboard: { 
                    type: 'object', 
                    required: true,
                    validate: (module) => Validator.validateModuleState(module).valid || 'Invalid module state'
                }
            });

            if (!moduleValidation.valid) {
                this.logger.warn('Module validation warnings:', moduleValidation.errors);
            }

            // Validate global objects
            if (!window.dashboard || !window.apiClient) {
                this.logger.warn('Global objects not properly initialized');
            }

            // Check performance metrics
            const performanceStats = moduleManager.getPerformanceStats();
            const perfValidation = Validator.validatePerformanceMetrics(performanceStats);
            
            if (perfValidation.warnings.length > 0) {
                this.logger.warn('Performance warnings:', perfValidation.warnings);
            }

            this.logger.info('Application validation completed');
            
        } catch (error) {
            this.logger.error('Application validation failed:', error);
            // Don't throw here as it's a final check
        }
    }

    // Error handling methods
    handleModuleError(error) {
        const moduleName = error.context?.moduleName;
        if (moduleName && moduleManager.has(moduleName)) {
            this.logger.info(`Attempting to restart module: ${moduleName}`);
            moduleManager.restart(moduleName).catch(restartError => {
                this.logger.error(`Failed to restart module ${moduleName}:`, restartError);
            });
        }
    }

    handleAPIError(error) {
        const endpoint = error.context?.endpoint;
        const statusCode = error.context?.statusCode;
        
        if (statusCode >= 500) {
            // Server error - might be temporary
            this.logger.info('Server error detected, will retry API calls');
        } else if (statusCode >= 400 && statusCode < 500) {
            // Client error - probably won't resolve with retry
            this.logger.warn('Client error detected, check API configuration');
        }
    }

    handleDependencyError(error) {
        const dependency = error.context?.dependency;
        this.logger.error(`Dependency missing: ${dependency}`);
        
        // Check if we can provide fallback
        if (dependency === 'chart.js' && !window.Chart) {
            this.logger.info('Attempting to load Chart.js fallback');
            this.loadChartJSFallback();
        }
    }

    loadChartJSFallback() {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            this.logger.info('Chart.js fallback loaded successfully');
        };
        script.onerror = () => {
            this.logger.error('Chart.js fallback failed to load');
        };
        document.head.appendChild(script);
    }

    createLogger() {
        return {
            debug: (message, ...args) => console.debug(`[FCAApp] ${message}`, ...args),
            info: (message, ...args) => console.info(`[FCAApp] ${message}`, ...args),
            warn: (message, ...args) => console.warn(`[FCAApp] ${message}`, ...args),
            error: (message, ...args) => console.error(`[FCAApp] ${message}`, ...args)
        };
    }
}

// Create and export app instance
export const app = new FCAApp();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌟 FCA Application starting...');
    
    // Wait for other scripts to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
        await app.initialize();
    } catch (error) {
        console.error('Failed to start FCA Application:', error);
        
        // Show error notification to user
        document.body.innerHTML += `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #dc3545;
                color: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                text-align: center;
                max-width: 400px;
            ">
                <h3>⚠️ Application Error</h3>
                <p>Failed to initialize FCA Dashboard. Please refresh the page or contact support.</p>
                <button onclick="location.reload()" style="
                    background: white;
                    color: #dc3545;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 1rem;
                ">Reload Page</button>
            </div>
        `;
    }
});

// Global error recovery
window.addEventListener('error', () => {
    if (!app.initialized) {
        console.warn('Attempting error recovery...');
        setTimeout(() => {
            app.initialize().catch(console.error);
        }, 2000);
    }
});

export default app;