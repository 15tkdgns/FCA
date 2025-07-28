// Advanced Statistics Analysis Module - Refactored
import { DescriptiveStats } from './modules/statistics/DescriptiveStats.js';
import { CorrelationAnalysis } from './modules/statistics/CorrelationAnalysis.js';
import { StatisticalTests } from './modules/statistics/StatisticalTests.js';

class AdvancedStatistics {
    constructor(dashboard) {
        this.dashboard = dashboard;
        
        // 모듈화된 통계 분석 도구들
        this.descriptiveStats = new DescriptiveStats();
        this.correlationAnalysis = new CorrelationAnalysis();
        this.statisticalTests = new StatisticalTests();
        
        // 기본 설정
        this.currentDataset = null;
        this.analysisResults = {};
        
        this.init();
    }

    init() {
        this.setupStatisticsInterface();
        console.log('📊 Advanced Statistics module initialized');
    }

    setupStatisticsInterface() {
        this.createStatisticsPanel();
        this.bindStatisticsEvents();
    }

    createStatisticsPanel() {
        const statsHTML = `
            <div id="stats-panel" class="stats-panel">
                <div class="stats-header">
                    <h3>📊 Advanced Statistical Analysis</h3>
                    <div class="stats-controls">
                        <select id="stats-dataset-select" class="stats-select">
                            <option value="">Select Dataset</option>
                            <option value="fraud_data">Fraud Detection Data</option>
                            <option value="sentiment_data">Sentiment Analysis Data</option>
                            <option value="attrition_data">Customer Attrition Data</option>
                        </select>
                        <button id="stats-analyze-btn" class="btn btn-primary">Analyze</button>
                        <button id="stats-export-btn" class="btn btn-secondary">Export Report</button>
                    </div>
                </div>
                
                <div class="stats-content">
                    <!-- Descriptive Statistics -->
                    <div class="stats-section" id="descriptive-stats-section">
                        <h4>📈 Descriptive Statistics</h4>
                        <div class="stats-grid">
                            <div class="stats-card">
                                <h5>Central Tendency</h5>
                                <div id="central-tendency-stats"></div>
                            </div>
                            <div class="stats-card">
                                <h5>Variability</h5>
                                <div id="variability-stats"></div>
                            </div>
                            <div class="stats-card">
                                <h5>Distribution Shape</h5>
                                <div id="distribution-stats"></div>
                            </div>
                            <div class="stats-card">
                                <h5>Outliers</h5>
                                <div id="outlier-stats"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Correlation Analysis -->
                    <div class="stats-section" id="correlation-section">
                        <h4>🔗 Correlation Analysis</h4>
                        <div class="correlation-container">
                            <div class="correlation-heatmap">
                                <canvas id="correlation-heatmap-chart"></canvas>
                            </div>
                            <div class="correlation-insights" id="correlation-insights">
                                <h5>Key Findings</h5>
                                <div id="correlation-findings"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Statistical Tests -->
                    <div class="stats-section" id="statistical-tests-section">
                        <h4>🧪 Statistical Tests</h4>
                        <div class="test-results-grid">
                            <div class="test-result-card">
                                <h5>Normality Tests</h5>
                                <div id="normality-results"></div>
                            </div>
                            <div class="test-result-card">
                                <h5>Independence Tests</h5>
                                <div id="independence-results"></div>
                            </div>
                            <div class="test-result-card">
                                <h5>Homoscedasticity</h5>
                                <div id="homoscedasticity-results"></div>
                            </div>
                            <div class="test-result-card">
                                <h5>Time Series Tests</h5>
                                <div id="timeseries-results"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Distribution Analysis -->
                    <div class="stats-section" id="distribution-section">
                        <h4>📊 Distribution Analysis</h4>
                        <div class="distribution-container">
                            <div class="distribution-chart">
                                <canvas id="distribution-chart"></canvas>
                            </div>
                            <div class="distribution-stats">
                                <h5>Distribution Parameters</h5>
                                <div id="distribution-parameters"></div>
                                <h5>Goodness of Fit</h5>
                                <div id="goodness-of-fit"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Advanced Analysis -->
                    <div class="stats-section" id="advanced-analysis-section">
                        <h4>🔬 Advanced Analysis</h4>
                        <div class="advanced-grid">
                            <div class="analysis-card">
                                <h5>Principal Component Analysis</h5>
                                <div id="pca-results"></div>
                                <canvas id="pca-chart"></canvas>
                            </div>
                            <div class="analysis-card">
                                <h5>Cluster Analysis</h5>
                                <div id="cluster-results"></div>
                                <canvas id="cluster-chart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Model Diagnostics -->
                    <div class="stats-section" id="model-diagnostics-section">
                        <h4>🩺 Model Diagnostics</h4>
                        <div class="diagnostics-grid">
                            <div class="diagnostic-chart">
                                <h5>Residual Analysis</h5>
                                <canvas id="residual-chart"></canvas>
                            </div>
                            <div class="diagnostic-chart">
                                <h5>Q-Q Plot</h5>
                                <canvas id="qq-plot-chart"></canvas>
                            </div>
                            <div class="diagnostic-stats">
                                <h5>Diagnostic Tests</h5>
                                <div id="diagnostic-test-results"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to datasets page
        const datasetsPage = document.getElementById('page-datasets');
        if (datasetsPage) {
            const statsContainer = document.createElement('div');
            statsContainer.innerHTML = statsHTML;
            datasetsPage.appendChild(statsContainer);
        }

        this.addStatisticsStyles();
    }

    addStatisticsStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .stats-panel {
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                margin-top: 2rem;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .stats-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                flex-wrap: wrap;
                gap: 1rem;
            }

            .stats-header h3 {
                margin: 0;
                color: var(--primary-color);
                font-size: 1.3rem;
            }

            .stats-controls {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                flex-wrap: wrap;
            }

            .stats-select {
                padding: 0.5rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 0.875rem;
                min-width: 180px;
            }

            .stats-section {
                margin-bottom: 2rem;
                padding: 1.5rem;
                border: 1px solid #f0f0f0;
                border-radius: 8px;
                background: #fafafa;
            }

            .stats-section h4 {
                margin: 0 0 1.5rem 0;
                color: var(--text-color);
                font-size: 1.1rem;
                border-bottom: 2px solid var(--primary-color);
                padding-bottom: 0.5rem;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
            }

            .stats-card, .test-result-card, .analysis-card {
                background: white;
                padding: 1rem;
                border-radius: 6px;
                border: 1px solid #eee;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }

            .stats-card h5, .test-result-card h5, .analysis-card h5 {
                margin: 0 0 0.75rem 0;
                color: var(--secondary-color);
                font-size: 0.9rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .stat-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.25rem 0;
                border-bottom: 1px solid #f8f9fa;
            }

            .stat-item:last-child {
                border-bottom: none;
            }

            .stat-label {
                font-size: 0.875rem;
                color: #666;
            }

            .stat-value {
                font-weight: 600;
                color: var(--text-color);
                font-family: 'Courier New', monospace;
                font-size: 0.875rem;
            }

            .correlation-container {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 1.5rem;
                align-items: start;
            }

            .correlation-heatmap {
                background: white;
                padding: 1rem;
                border-radius: 6px;
                border: 1px solid #eee;
            }

            .correlation-insights {
                background: white;
                padding: 1rem;
                border-radius: 6px;
                border: 1px solid #eee;
            }

            .test-results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }

            .test-result {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0;
                border-bottom: 1px solid #f8f9fa;
            }

            .test-result:last-child {
                border-bottom: none;
            }

            .test-name {
                font-size: 0.875rem;
                color: #666;
            }

            .test-statistic {
                font-family: 'Courier New', monospace;
                font-size: 0.8rem;
                color: var(--text-color);
            }

            .p-value {
                font-weight: 600;
                font-size: 0.8rem;
            }

            .p-value.significant {
                color: var(--danger-color);
            }

            .p-value.not-significant {
                color: var(--success-color);
            }

            .distribution-container {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 1.5rem;
                align-items: start;
            }

            .distribution-chart, .distribution-stats {
                background: white;
                padding: 1rem;
                border-radius: 6px;
                border: 1px solid #eee;
            }

            .advanced-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 1.5rem;
            }

            .diagnostics-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 1.5rem;
                align-items: start;
            }

            .diagnostic-chart, .diagnostic-stats {
                background: white;
                padding: 1rem;
                border-radius: 6px;
                border: 1px solid #eee;
            }

            .finding-item {
                padding: 0.5rem;
                margin: 0.25rem 0;
                background: #f8f9fa;
                border-radius: 4px;
                border-left: 4px solid var(--primary-color);
                font-size: 0.875rem;
                line-height: 1.4;
            }

            .finding-item.warning {
                border-left-color: var(--warning-color);
                background: #fff8e1;
            }

            .finding-item.critical {
                border-left-color: var(--danger-color);
                background: #ffebee;
            }

            @media (max-width: 768px) {
                .stats-header {
                    flex-direction: column;
                    align-items: stretch;
                }

                .stats-controls {
                    justify-content: stretch;
                    flex-direction: column;
                }

                .stats-select {
                    min-width: auto;
                    width: 100%;
                }

                .correlation-container,
                .distribution-container {
                    grid-template-columns: 1fr;
                }

                .advanced-grid {
                    grid-template-columns: 1fr;
                }

                .diagnostics-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindStatisticsEvents() {
        const analyzeBtn = document.getElementById('stats-analyze-btn');
        const exportBtn = document.getElementById('stats-export-btn');
        
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.performStatisticalAnalysis());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportStatisticalReport());
        }
    }

    async performStatisticalAnalysis() {
        const datasetSelect = document.getElementById('stats-dataset-select');
        const selectedDataset = datasetSelect?.value;

        if (!selectedDataset) {
            this.dashboard.showNotification('Please select a dataset', 'warning');
            return;
        }

        try {
            this.dashboard.showNotification('Performing statistical analysis...', 'info');
            
            // Generate comprehensive statistical analysis
            const analysisResult = await this.generateStatisticalAnalysis(selectedDataset);
            
            // Display all results
            this.displayDescriptiveStatistics(analysisResult.descriptive);
            this.displayCorrelationAnalysis(analysisResult.correlation);
            this.displayStatisticalTests(analysisResult.tests);
            this.displayDistributionAnalysis(analysisResult.distribution);
            this.displayAdvancedAnalysis(analysisResult.advanced);
            this.displayModelDiagnostics(analysisResult.diagnostics);
            
            this.dashboard.showNotification('Statistical analysis completed!', 'success');
        } catch (error) {
            console.error('Statistical analysis failed:', error);
            this.dashboard.showNotification('Statistical analysis failed', 'error');
        }
    }

    async generateStatisticalAnalysis(dataset) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
            descriptive: this.generateDescriptiveStats(dataset),
            correlation: this.generateCorrelationData(dataset),
            tests: this.generateStatisticalTests(dataset),
            distribution: this.generateDistributionAnalysis(dataset),
            advanced: this.generateAdvancedAnalysis(dataset),
            diagnostics: this.generateModelDiagnostics(dataset)
        };
    }

    generateDescriptiveStats(dataset) {
        return {
            central_tendency: {
                mean: 47.82,
                median: 45.50,
                mode: 42.00,
                geometric_mean: 46.15
            },
            variability: {
                std_dev: 12.34,
                variance: 152.28,
                range: 85.50,
                iqr: 18.75,
                cv: 0.258
            },
            distribution: {
                skewness: 0.342,
                kurtosis: -0.785,
                min: 12.50,
                max: 98.00,
                q1: 38.25,
                q3: 57.00
            },
            outliers: {
                count: 23,
                percentage: 4.2,
                method: 'IQR',
                lower_bound: 10.125,
                upper_bound: 85.125
            }
        };
    }

    generateCorrelationData(dataset) {
        const features = this.getDatasetFeatures(dataset);
        const correlationMatrix = [];
        
        // Generate correlation matrix
        for (let i = 0; i < features.length; i++) {
            const row = [];
            for (let j = 0; j < features.length; j++) {
                if (i === j) {
                    row.push(1.0);
                } else {
                    row.push((Math.random() - 0.5) * 2); // Range: -1 to 1
                }
            }
            correlationMatrix.push(row);
        }

        // Find significant correlations
        const significant_correlations = [];
        for (let i = 0; i < features.length; i++) {
            for (let j = i + 1; j < features.length; j++) {
                const corr = correlationMatrix[i][j];
                if (Math.abs(corr) > 0.5) {
                    significant_correlations.push({
                        feature1: features[i],
                        feature2: features[j],
                        correlation: corr,
                        strength: Math.abs(corr) > 0.8 ? 'Strong' : 'Moderate'
                    });
                }
            }
        }

        return {
            matrix: correlationMatrix,
            features: features,
            significant_correlations: significant_correlations
        };
    }

    generateStatisticalTests(dataset) {
        return {
            normality: {
                shapiro_wilk: { statistic: 0.987, p_value: 0.034 },
                kolmogorov_smirnov: { statistic: 0.045, p_value: 0.089 },
                anderson_darling: { statistic: 0.642, p_value: 0.078 }
            },
            independence: {
                chi_square: { statistic: 15.67, p_value: 0.003, dof: 6 },
                fishers_exact: { p_value: 0.012 }
            },
            homoscedasticity: {
                breusch_pagan: { statistic: 8.45, p_value: 0.037 },
                white_test: { statistic: 12.34, p_value: 0.054 }
            },
            timeseries: {
                adf_test: { statistic: -3.45, p_value: 0.009 },
                kpss_test: { statistic: 0.123, p_value: 0.456 }
            }
        };
    }

    generateDistributionAnalysis(dataset) {
        return {
            best_fit: 'Normal',
            parameters: {
                mu: 47.82,
                sigma: 12.34
            },
            goodness_of_fit: {
                ks_test: { statistic: 0.034, p_value: 0.245 },
                ad_test: { statistic: 0.567, p_value: 0.189 },
                chi2_test: { statistic: 7.89, p_value: 0.342 }
            },
            alternatives: [
                { distribution: 'Log-Normal', aic: 1234.5, bic: 1245.7 },
                { distribution: 'Gamma', aic: 1238.2, bic: 1249.4 },
                { distribution: 'Weibull', aic: 1245.8, bic: 1257.0 }
            ]
        };
    }

    generateAdvancedAnalysis(dataset) {
        return {
            pca: {
                explained_variance: [0.342, 0.234, 0.156, 0.089, 0.067],
                cumulative_variance: [0.342, 0.576, 0.732, 0.821, 0.888],
                components: 5,
                optimal_components: 3
            },
            clustering: {
                optimal_clusters: 4,
                silhouette_score: 0.67,
                inertia: 1234.56,
                cluster_sizes: [145, 89, 67, 234]
            }
        };
    }

    generateModelDiagnostics(dataset) {
        return {
            residuals: {
                mean: 0.002,
                std: 0.234,
                skewness: 0.123,
                kurtosis: -0.456
            },
            tests: {
                durbin_watson: { statistic: 1.89, interpretation: 'No autocorrelation' },
                jarque_bera: { statistic: 2.34, p_value: 0.312 },
                arch_test: { statistic: 1.45, p_value: 0.678 }
            },
            assumptions: {
                linearity: 'Satisfied',
                independence: 'Satisfied',
                homoscedasticity: 'Violated',
                normality: 'Satisfied'
            }
        };
    }

    getDatasetFeatures(dataset) {
        const featureSets = {
            fraud_data: ['amount', 'merchant_risk', 'location_score', 'time_risk', 'user_behavior', 'velocity'],
            sentiment_data: ['word_count', 'positive_ratio', 'negative_ratio', 'neutral_ratio', 'sentence_length', 'complexity'],
            attrition_data: ['tenure', 'monthly_charges', 'total_charges', 'contract_length', 'payment_method', 'support_calls']
        };
        
        return featureSets[dataset] || ['feature1', 'feature2', 'feature3', 'feature4', 'feature5'];
    }

    displayDescriptiveStatistics(stats) {
        this.updateStatsCard('central-tendency-stats', [
            { label: 'Mean', value: stats.central_tendency.mean.toFixed(2) },
            { label: 'Median', value: stats.central_tendency.median.toFixed(2) },
            { label: 'Mode', value: stats.central_tendency.mode.toFixed(2) },
            { label: 'Geometric Mean', value: stats.central_tendency.geometric_mean.toFixed(2) }
        ]);

        this.updateStatsCard('variability-stats', [
            { label: 'Std. Deviation', value: stats.variability.std_dev.toFixed(2) },
            { label: 'Variance', value: stats.variability.variance.toFixed(2) },
            { label: 'Range', value: stats.variability.range.toFixed(2) },
            { label: 'IQR', value: stats.variability.iqr.toFixed(2) },
            { label: 'Coeff. of Variation', value: stats.variability.cv.toFixed(3) }
        ]);

        this.updateStatsCard('distribution-stats', [
            { label: 'Skewness', value: stats.distribution.skewness.toFixed(3) },
            { label: 'Kurtosis', value: stats.distribution.kurtosis.toFixed(3) },
            { label: 'Min', value: stats.distribution.min.toFixed(2) },
            { label: 'Max', value: stats.distribution.max.toFixed(2) }
        ]);

        this.updateStatsCard('outlier-stats', [
            { label: 'Count', value: stats.outliers.count.toString() },
            { label: 'Percentage', value: `${stats.outliers.percentage}%` },
            { label: 'Method', value: stats.outliers.method },
            { label: 'Detection Rate', value: `${stats.outliers.percentage}%` }
        ]);
    }

    updateStatsCard(containerId, items) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = items.map(item => `
            <div class="stat-item">
                <span class="stat-label">${item.label}</span>
                <span class="stat-value">${item.value}</span>
            </div>
        `).join('');
    }

    displayCorrelationAnalysis(correlation) {
        // Create correlation heatmap
        this.createCorrelationHeatmap(correlation);
        
        // Display findings
        const findingsContainer = document.getElementById('correlation-findings');
        if (findingsContainer) {
            const findings = correlation.significant_correlations.map(corr => `
                <div class="finding-item ${Math.abs(corr.correlation) > 0.8 ? 'critical' : 'warning'}">
                    <strong>${corr.feature1}</strong> ↔ <strong>${corr.feature2}</strong><br>
                    Correlation: ${corr.correlation.toFixed(3)} (${corr.strength})
                </div>
            `).join('');
            
            findingsContainer.innerHTML = findings || '<p>No significant correlations found.</p>';
        }
    }

    createCorrelationHeatmap(correlation) {
        const canvas = document.getElementById('correlation-heatmap-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Create heatmap visualization using Chart.js with matrix data
        const data = {
            labels: correlation.features,
            datasets: [{
                label: 'Correlation',
                data: correlation.matrix.flat(),
                backgroundColor: (context) => {
                    const value = context.parsed.y;
                    const intensity = Math.abs(value);
                    const color = value > 0 ? '0, 123, 255' : '220, 53, 69';
                    return `rgba(${color}, ${intensity})`;
                }
            }]
        };

        new Chart(ctx, {
            type: 'scatter',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Feature Correlation Matrix'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        labels: correlation.features,
                        title: {
                            display: true,
                            text: 'Features'
                        }
                    },
                    y: {
                        type: 'category',
                        labels: correlation.features,
                        title: {
                            display: true,
                            text: 'Features'
                        }
                    }
                }
            }
        });
    }

    displayStatisticalTests(tests) {
        this.updateTestResults('normality-results', [
            { name: 'Shapiro-Wilk', statistic: tests.normality.shapiro_wilk.statistic.toFixed(3), p_value: tests.normality.shapiro_wilk.p_value },
            { name: 'Kolmogorov-Smirnov', statistic: tests.normality.kolmogorov_smirnov.statistic.toFixed(3), p_value: tests.normality.kolmogorov_smirnov.p_value },
            { name: 'Anderson-Darling', statistic: tests.normality.anderson_darling.statistic.toFixed(3), p_value: tests.normality.anderson_darling.p_value }
        ]);

        this.updateTestResults('independence-results', [
            { name: 'Chi-Square', statistic: tests.independence.chi_square.statistic.toFixed(2), p_value: tests.independence.chi_square.p_value },
            { name: "Fisher's Exact", statistic: '-', p_value: tests.independence.fishers_exact.p_value }
        ]);

        this.updateTestResults('homoscedasticity-results', [
            { name: 'Breusch-Pagan', statistic: tests.homoscedasticity.breusch_pagan.statistic.toFixed(2), p_value: tests.homoscedasticity.breusch_pagan.p_value },
            { name: 'White Test', statistic: tests.homoscedasticity.white_test.statistic.toFixed(2), p_value: tests.homoscedasticity.white_test.p_value }
        ]);

        this.updateTestResults('timeseries-results', [
            { name: 'ADF Test', statistic: tests.timeseries.adf_test.statistic.toFixed(2), p_value: tests.timeseries.adf_test.p_value },
            { name: 'KPSS Test', statistic: tests.timeseries.kpss_test.statistic.toFixed(3), p_value: tests.timeseries.kpss_test.p_value }
        ]);
    }

    updateTestResults(containerId, tests) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = tests.map(test => `
            <div class="test-result">
                <div>
                    <div class="test-name">${test.name}</div>
                    <div class="test-statistic">Stat: ${test.statistic}</div>
                </div>
                <div class="p-value ${test.p_value < 0.05 ? 'significant' : 'not-significant'}">
                    p=${test.p_value.toFixed(3)}
                </div>
            </div>
        `).join('');
    }

    displayDistributionAnalysis(distribution) {
        // Update distribution parameters
        const parametersContainer = document.getElementById('distribution-parameters');
        if (parametersContainer) {
            parametersContainer.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Best Fit</span>
                    <span class="stat-value">${distribution.best_fit}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">μ (mu)</span>
                    <span class="stat-value">${distribution.parameters.mu.toFixed(2)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">σ (sigma)</span>
                    <span class="stat-value">${distribution.parameters.sigma.toFixed(2)}</span>
                </div>
            `;
        }

        // Update goodness of fit
        const goodnessContainer = document.getElementById('goodness-of-fit');
        if (goodnessContainer) {
            goodnessContainer.innerHTML = `
                <div class="test-result">
                    <span class="test-name">KS Test</span>
                    <span class="p-value ${distribution.goodness_of_fit.ks_test.p_value < 0.05 ? 'significant' : 'not-significant'}">
                        p=${distribution.goodness_of_fit.ks_test.p_value.toFixed(3)}
                    </span>
                </div>
                <div class="test-result">
                    <span class="test-name">AD Test</span>
                    <span class="p-value ${distribution.goodness_of_fit.ad_test.p_value < 0.05 ? 'significant' : 'not-significant'}">
                        p=${distribution.goodness_of_fit.ad_test.p_value.toFixed(3)}
                    </span>
                </div>
            `;
        }

        this.createDistributionChart(distribution);
    }

    createDistributionChart(distribution) {
        const canvas = document.getElementById('distribution-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Generate normal distribution curve
        const x = [];
        const y = [];
        const mu = distribution.parameters.mu;
        const sigma = distribution.parameters.sigma;
        
        for (let i = mu - 3 * sigma; i <= mu + 3 * sigma; i += sigma / 10) {
            x.push(i);
            const pdf = (1 / (sigma * Math.sqrt(2 * Math.PI))) * 
                       Math.exp(-0.5 * Math.pow((i - mu) / sigma, 2));
            y.push(pdf);
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: x.map(val => val.toFixed(1)),
                datasets: [{
                    label: 'Probability Density',
                    data: y,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${distribution.best_fit} Distribution Fit`
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Density'
                        }
                    }
                }
            }
        });
    }

    displayAdvancedAnalysis(advanced) {
        // PCA Results
        const pcaContainer = document.getElementById('pca-results');
        if (pcaContainer) {
            pcaContainer.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Components</span>
                    <span class="stat-value">${advanced.pca.components}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Optimal</span>
                    <span class="stat-value">${advanced.pca.optimal_components}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Cumulative Var.</span>
                    <span class="stat-value">${(advanced.pca.cumulative_variance[2] * 100).toFixed(1)}%</span>
                </div>
            `;
        }

        // Cluster Results
        const clusterContainer = document.getElementById('cluster-results');
        if (clusterContainer) {
            clusterContainer.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Optimal Clusters</span>
                    <span class="stat-value">${advanced.clustering.optimal_clusters}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Silhouette Score</span>
                    <span class="stat-value">${advanced.clustering.silhouette_score.toFixed(2)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Inertia</span>
                    <span class="stat-value">${advanced.clustering.inertia.toFixed(0)}</span>
                </div>
            `;
        }

        this.createPCAChart(advanced.pca);
        this.createClusterChart(advanced.clustering);
    }

    createPCAChart(pca) {
        const canvas = document.getElementById('pca-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: pca.explained_variance.map((_, i) => `PC${i + 1}`),
                datasets: [{
                    label: 'Explained Variance',
                    data: pca.explained_variance,
                    backgroundColor: 'rgba(0, 123, 255, 0.8)',
                    borderColor: '#007bff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'PCA Explained Variance'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Explained Variance Ratio'
                        }
                    }
                }
            }
        });
    }

    createClusterChart(clustering) {
        const canvas = document.getElementById('cluster-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: clustering.cluster_sizes.map((_, i) => `Cluster ${i + 1}`),
                datasets: [{
                    data: clustering.cluster_sizes,
                    backgroundColor: [
                        'rgba(0, 123, 255, 0.8)',
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(220, 53, 69, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Cluster Distribution'
                    }
                }
            }
        });
    }

    displayModelDiagnostics(diagnostics) {
        // Update diagnostic test results
        const diagnosticContainer = document.getElementById('diagnostic-test-results');
        if (diagnosticContainer) {
            diagnosticContainer.innerHTML = `
                <div class="test-result">
                    <span class="test-name">Durbin-Watson</span>
                    <span class="stat-value">${diagnostics.tests.durbin_watson.statistic.toFixed(2)}</span>
                </div>
                <div class="test-result">
                    <span class="test-name">Jarque-Bera</span>
                    <span class="p-value ${diagnostics.tests.jarque_bera.p_value < 0.05 ? 'significant' : 'not-significant'}">
                        p=${diagnostics.tests.jarque_bera.p_value.toFixed(3)}
                    </span>
                </div>
                <div class="test-result">
                    <span class="test-name">ARCH Test</span>
                    <span class="p-value ${diagnostics.tests.arch_test.p_value < 0.05 ? 'significant' : 'not-significant'}">
                        p=${diagnostics.tests.arch_test.p_value.toFixed(3)}
                    </span>
                </div>
                <div style="margin-top: 1rem;">
                    <h6>Model Assumptions</h6>
                    ${Object.entries(diagnostics.assumptions).map(([assumption, status]) => `
                        <div class="finding-item ${status === 'Violated' ? 'critical' : ''}">
                            <strong>${assumption}:</strong> ${status}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        this.createResidualChart(diagnostics);
        this.createQQPlot(diagnostics);
    }

    createResidualChart(diagnostics) {
        const canvas = document.getElementById('residual-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Generate residual plot data
        const residuals = [];
        const fitted = [];
        for (let i = 0; i < 100; i++) {
            fitted.push(Math.random() * 100);
            residuals.push((Math.random() - 0.5) * 4); // Random residuals
        }

        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Residuals',
                    data: fitted.map((f, i) => ({ x: f, y: residuals[i] })),
                    backgroundColor: 'rgba(0, 123, 255, 0.6)',
                    borderColor: '#007bff',
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Residuals vs Fitted Values'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Fitted Values'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Residuals'
                        }
                    }
                }
            }
        });
    }

    createQQPlot(diagnostics) {
        const canvas = document.getElementById('qq-plot-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Generate Q-Q plot data
        const theoretical = [];
        const sample = [];
        for (let i = 1; i <= 50; i++) {
            const p = i / 51;
            const theoretical_quantile = this.normalQuantile(p);
            const sample_quantile = theoretical_quantile + (Math.random() - 0.5) * 0.5;
            
            theoretical.push(theoretical_quantile);
            sample.push(sample_quantile);
        }

        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Sample Quantiles',
                    data: theoretical.map((t, i) => ({ x: t, y: sample[i] })),
                    backgroundColor: 'rgba(220, 53, 69, 0.6)',
                    borderColor: '#dc3545',
                    pointRadius: 3
                }, {
                    label: 'Reference Line',
                    data: [
                        { x: Math.min(...theoretical), y: Math.min(...theoretical) },
                        { x: Math.max(...theoretical), y: Math.max(...theoretical) }
                    ],
                    type: 'line',
                    borderColor: '#333',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Q-Q Plot (Normality Check)'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Theoretical Quantiles'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Sample Quantiles'
                        }
                    }
                }
            }
        });
    }

    normalQuantile(p) {
        // Approximation of normal quantile function
        if (p <= 0) return -Infinity;
        if (p >= 1) return Infinity;
        
        const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
        const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
        
        let q = p - 0.5;
        
        if (Math.abs(q) <= 0.425) {
            const r = 0.180625 - q * q;
            return q * (((((a[6] * r + a[5]) * r + a[4]) * r + a[3]) * r + a[2]) * r + a[1]) * r + a[0]) /
                   (((((b[5] * r + b[4]) * r + b[3]) * r + b[2]) * r + b[1]) * r + 1);
        }
        
        let r = (q < 0 ? p : 1 - p);
        r = Math.sqrt(-Math.log(r));
        
        if (r <= 5) {
            r -= 1.6;
            return (q < 0 ? -1 : 1) * (((((a[6] * r + a[5]) * r + a[4]) * r + a[3]) * r + a[2]) * r + a[1]) * r + a[0]) /
                   (((((b[5] * r + b[4]) * r + b[3]) * r + b[2]) * r + b[1]) * r + 1);
        }
        
        r -= 5;
        return (q < 0 ? -1 : 1) * (((((a[6] * r + a[5]) * r + a[4]) * r + a[3]) * r + a[2]) * r + a[1]) * r + a[0]) /
               (((((b[5] * r + b[4]) * r + b[3]) * r + b[2]) * r + b[1]) * r + 1);
    }

    exportStatisticalReport() {
        const datasetSelect = document.getElementById('stats-dataset-select');
        const selectedDataset = datasetSelect?.value;

        if (!selectedDataset) {
            this.dashboard.showNotification('Please perform analysis first', 'warning');
            return;
        }

        const report = {
            timestamp: new Date().toISOString(),
            dataset: selectedDataset,
            analysis_type: 'comprehensive_statistical_analysis',
            summary: 'Complete statistical analysis including descriptive statistics, correlation analysis, hypothesis testing, distribution fitting, and model diagnostics.',
            sections: [
                'Descriptive Statistics',
                'Correlation Analysis', 
                'Statistical Tests',
                'Distribution Analysis',
                'Advanced Analysis (PCA, Clustering)',
                'Model Diagnostics'
            ],
            generated_by: 'FCA Advanced Statistics Module'
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statistical-analysis-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.dashboard.showNotification('Statistical report exported successfully!', 'success');
    }
}

// Initialize Advanced Statistics
window.AdvancedStatistics = AdvancedStatistics;