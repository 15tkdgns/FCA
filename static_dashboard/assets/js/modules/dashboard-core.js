/**
 * Dashboard Core Module
 * =====================
 * 
 * Main dashboard class that orchestrates all modules
 */

import { DataLoader } from './data-loader.js';
import { Navigation } from './navigation.js';
import { ThemeManager } from './theme-manager.js';
import { UIUtils } from '../utils/ui-utils.js';
import { BaseChart } from './base-chart.js';
import { PerformanceCharts } from './performance-charts.js';
import { BusinessCharts } from './business-charts.js';

export class FCADashboard {
    constructor() {
        this.data = {};
        this.charts = {};
        this.initialized = false;
        
        // Initialize core modules
        this.dataLoader = new DataLoader();
        this.themeManager = new ThemeManager();
        this.navigation = new Navigation(this);
        
        console.log('🚀 FCA Dashboard core initializing...');
        this.init();
    }

    async init() {
        try {
            // Show initial loading
            UIUtils.showLoading('#dashboard-content', 'Initializing dashboard...');

            // Load all data
            await this.loadAllData();

            // Initialize chart instances
            this.initializeCharts();

            // Setup event listeners
            this.setupEventListeners();

            // Show initial page content
            await this.showInitialPage();

            // Hide loading
            UIUtils.hideLoading('#dashboard-content');

            this.initialized = true;
            console.log('✅ FCA Dashboard initialized successfully');

        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            UIUtils.hideLoading('#dashboard-content');
            UIUtils.showError('Failed to initialize dashboard: ' + error.message);
        }
    }

    /**
     * Load all dashboard data
     */
    async loadAllData() {
        try {
            this.data = await this.dataLoader.loadAllData();
            this.updateSummaryCards();
            
        } catch (error) {
            console.error('Data loading failed:', error);
            throw error;
        }
    }

    /**
     * Initialize chart instances
     */
    initializeCharts() {
        // Performance charts
        this.charts.modelPerformance = new PerformanceCharts(
            'model-performance-chart', 
            this.themeManager
        );
        this.charts.rocCurve = new PerformanceCharts(
            'roc-curve-chart', 
            this.themeManager
        );
        this.charts.featureImportance = new PerformanceCharts(
            'feature-importance-chart', 
            this.themeManager
        );

        // Business charts
        this.charts.fraudRisk = new BusinessCharts(
            'fraud-risk-chart', 
            this.themeManager
        );
        this.charts.sentimentDistribution = new BusinessCharts(
            'sentiment-distribution-chart', 
            this.themeManager
        );
        this.charts.customerSegments = new BusinessCharts(
            'customer-segments-chart', 
            this.themeManager
        );

        console.log('📊 Chart instances initialized');
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Refresh data button
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAllData());
        }

        // Settings dropdown
        this.setupSettingsDropdown();

        // Window resize handler
        const resizeHandler = UIUtils.debounce(() => {
            this.handleWindowResize();
        }, 250);
        window.addEventListener('resize', resizeHandler);

        // Theme change handler
        this.themeManager.onThemeChange((newTheme, oldTheme) => {
            this.handleThemeChange(newTheme, oldTheme);
        });

        console.log('🎛️ Event listeners setup complete');
    }

    /**
     * Setup settings dropdown functionality
     */
    setupSettingsDropdown() {
        const settingsToggle = document.querySelector('[data-bs-toggle="dropdown"]');
        const downloadBtn = document.querySelector('[data-action="download-data"]');
        const clearCacheBtn = document.querySelector('[data-action="clear-cache"]');

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadDashboardData());
        }

        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => this.clearDataCache());
        }
    }

    /**
     * Show initial page content
     */
    async showInitialPage() {
        // Default to dashboard overview
        await this.showDashboard();
    }

    /**
     * Show dashboard overview page
     */
    async showDashboard() {
        try {
            UIUtils.showLoading('#dashboard-page', 'Loading overview...');

            // Update summary cards
            this.updateSummaryCards();

            // Render overview charts
            await this.renderOverviewCharts();

            UIUtils.hideLoading('#dashboard-page');
            console.log('📄 Dashboard overview loaded');

        } catch (error) {
            console.error('Dashboard page load failed:', error);
            UIUtils.hideLoading('#dashboard-page');
            UIUtils.showError('Failed to load dashboard overview');
        }
    }

    /**
     * Show fraud analysis page
     */
    async showFraudPage() {
        try {
            UIUtils.showLoading('#fraud-page', 'Loading fraud analysis...');

            // Render fraud-specific charts
            if (this.data.fraud_data) {
                await this.charts.fraudRisk.renderFraudRiskDistribution(this.data.fraud_data);
                await this.charts.modelPerformance.renderFeatureImportance(this.data.fraud_data);
                
                if (this.data.fraud_data.roc_data) {
                    await this.charts.rocCurve.renderROCCurve(this.data.fraud_data);
                }
            }

            UIUtils.hideLoading('#fraud-page');
            console.log('📄 Fraud analysis page loaded');

        } catch (error) {
            console.error('Fraud page load failed:', error);
            UIUtils.hideLoading('#fraud-page');
            UIUtils.showError('Failed to load fraud analysis');
        }
    }

    /**
     * Show sentiment analysis page
     */
    async showSentimentPage() {
        try {
            UIUtils.showLoading('#sentiment-page', 'Loading sentiment analysis...');

            // Render sentiment-specific charts
            if (this.data.sentiment_data) {
                await this.charts.sentimentDistribution.renderSentimentDistribution(this.data.sentiment_data);
                
                if (this.data.sentiment_data.time_series) {
                    await this.charts.sentimentDistribution.renderTimeSeriesTrend(this.data.sentiment_data);
                }
            }

            UIUtils.hideLoading('#sentiment-page');
            console.log('📄 Sentiment analysis page loaded');

        } catch (error) {
            console.error('Sentiment page load failed:', error);
            UIUtils.hideLoading('#sentiment-page');
            UIUtils.showError('Failed to load sentiment analysis');
        }
    }

    /**
     * Show customer attrition page
     */
    async showAttritionPage() {
        try {
            UIUtils.showLoading('#attrition-page', 'Loading customer analysis...');

            // Render attrition-specific charts
            if (this.data.attrition_data) {
                await this.charts.customerSegments.renderCustomerSegments(this.data.attrition_data);
                
                if (this.data.attrition_data.metrics) {
                    await this.charts.customerSegments.renderPerformanceRadar(this.data.attrition_data);
                }
            }

            UIUtils.hideLoading('#attrition-page');
            console.log('📄 Customer attrition page loaded');

        } catch (error) {
            console.error('Attrition page load failed:', error);
            UIUtils.hideLoading('#attrition-page');
            UIUtils.showError('Failed to load customer analysis');
        }
    }

    /**
     * Show datasets page
     */
    async showDatasetsPage() {
        try {
            UIUtils.showLoading('#datasets-page', 'Loading dataset information...');

            // Update dataset statistics
            this.updateDatasetInfo();

            UIUtils.hideLoading('#datasets-page');
            console.log('📄 Datasets page loaded');

        } catch (error) {
            console.error('Datasets page load failed:', error);
            UIUtils.hideLoading('#datasets-page');
            UIUtils.showError('Failed to load dataset information');
        }
    }

    /**
     * Render overview charts
     */
    async renderOverviewCharts() {
        const promises = [];

        // Model comparison chart
        if (this.data.charts?.model_comparison) {
            promises.push(
                this.charts.modelPerformance.renderModelComparison(this.data.charts.model_comparison)
            );
        }

        // Fraud risk distribution
        if (this.data.fraud_data?.risk_distribution) {
            promises.push(
                this.charts.fraudRisk.renderFraudRiskDistribution(this.data.fraud_data)
            );
        }

        // Sentiment distribution
        if (this.data.sentiment_data?.sentiment_distribution) {
            promises.push(
                this.charts.sentimentDistribution.renderSentimentDistribution(this.data.sentiment_data)
            );
        }

        // Customer segments
        if (this.data.attrition_data?.customer_segments) {
            promises.push(
                this.charts.customerSegments.renderCustomerSegments(this.data.attrition_data)
            );
        }

        await Promise.allSettled(promises);
    }

    /**
     * Update summary cards with current data
     */
    updateSummaryCards() {
        const cards = {
            'total-datasets': () => {
                const count = this.data.summary?.total_datasets || 0;
                return { value: UIUtils.formatNumber(count), label: 'Total Datasets' };
            },
            'models-trained': () => {
                const count = this.data.summary?.models_trained || 0;
                return { value: UIUtils.formatNumber(count), label: 'Models Trained' };
            },
            'fraud-detection-rate': () => {
                const rate = this.data.fraud_data?.performance_metrics?.accuracy || 0;
                return { value: UIUtils.formatPercentage(rate), label: 'Fraud Detection Rate' };
            },
            'system-status': () => {
                const status = this.data.summary?.system_status || 'Unknown';
                return { value: status, label: 'System Status' };
            }
        };

        Object.entries(cards).forEach(([cardId, dataFn]) => {
            const cardElement = document.getElementById(cardId);
            if (cardElement) {
                try {
                    const { value, label } = dataFn();
                    const valueEl = cardElement.querySelector('.summary-card-value') || cardElement;
                    valueEl.textContent = value;
                } catch (error) {
                    console.warn(`Failed to update card ${cardId}:`, error);
                    const valueEl = cardElement.querySelector('.summary-card-value') || cardElement;
                    valueEl.textContent = 'N/A';
                }
            }
        });

        console.log('📋 Summary cards updated');
    }

    /**
     * Update dataset information
     */
    updateDatasetInfo() {
        if (!this.data.datasets) return;

        const datasetsContainer = document.getElementById('datasets-list');
        if (!datasetsContainer) return;

        const datasets = this.data.datasets.available_datasets || [];
        
        datasetsContainer.innerHTML = datasets.map(dataset => `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">${dataset.name}</h6>
                        <p class="card-text text-muted">${dataset.description || 'No description'}</p>
                        <div class="row text-center">
                            <div class="col">
                                <div class="text-primary font-weight-bold">${UIUtils.formatNumber(dataset.records || 0)}</div>
                                <div class="text-muted small">Records</div>
                            </div>
                            <div class="col">
                                <div class="text-info font-weight-bold">${dataset.features || 0}</div>
                                <div class="text-muted small">Features</div>
                            </div>
                            <div class="col">
                                <div class="text-success font-weight-bold">${UIUtils.formatFileSize(dataset.size || 0)}</div>
                                <div class="text-muted small">Size</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }

    /**
     * Handle theme change
     */
    handleThemeChange(newTheme, oldTheme) {
        console.log(`🎨 Dashboard theme changed: ${oldTheme} → ${newTheme}`);
        // Charts will auto-update via their theme listeners
    }

    /**
     * Refresh all data
     */
    async refreshAllData() {
        try {
            UIUtils.showNotification('Refreshing data...', 'info', 2000);
            
            // Clear cache and reload
            this.dataLoader.clearCache();
            await this.loadAllData();
            
            // Refresh current page
            await this.navigation.refreshCurrentPage();
            
            UIUtils.showNotification('Data refreshed successfully', 'success');
            
        } catch (error) {
            console.error('Data refresh failed:', error);
            UIUtils.showNotification('Failed to refresh data', 'error');
        }
    }

    /**
     * Download dashboard data
     */
    downloadDashboardData() {
        try {
            const dataStr = JSON.stringify(this.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `fca_dashboard_data_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            UIUtils.showNotification('Data download started', 'success');
            
        } catch (error) {
            console.error('Data download failed:', error);
            UIUtils.showNotification('Failed to download data', 'error');
        }
    }

    /**
     * Clear data cache
     */
    clearDataCache() {
        try {
            this.dataLoader.clearCache();
            UIUtils.showNotification('Cache cleared successfully', 'success');
            
        } catch (error) {
            console.error('Cache clear failed:', error);
            UIUtils.showNotification('Failed to clear cache', 'error');
        }
    }

    /**
     * Get dashboard state
     */
    getState() {
        return {
            initialized: this.initialized,
            currentPage: this.navigation?.currentPage || 'dashboard',
            theme: this.themeManager?.getCurrentTheme() || 'light',
            dataLoaded: Object.keys(this.data).length > 0,
            cacheStats: this.dataLoader?.getCacheStats() || {}
        };
    }

    /**
     * Destroy dashboard instance
     */
    destroy() {
        // Clear all charts
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });

        // Clear data
        this.data = {};
        this.charts = {};
        this.initialized = false;

        console.log('🧹 Dashboard destroyed');
    }
}