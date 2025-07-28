// Explainable AI (XAI) Analysis Module
class XAIAnalyzer {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.interpretationCache = new Map();
        this.explanationMethods = {
            shap: 'SHAP Values',
            lime: 'LIME Analysis', 
            permutation: 'Permutation Importance',
            partial_dependence: 'Partial Dependence Plots'
        };
        
        this.init();
    }

    init() {
        this.setupXAIInterface();
        console.log('🤖 XAI Analyzer initialized');
    }

    // Setup XAI user interface
    setupXAIInterface() {
        this.createXAIPanel();
        this.bindXAIEvents();
    }

    createXAIPanel() {
        // Create XAI analysis panel HTML
        const xaiPanelHTML = `
            <div id="xai-panel" class="xai-panel">
                <div class="xai-header">
                    <h3>🤖 Explainable AI Analysis</h3>
                    <div class="xai-controls">
                        <select id="xai-model-select" class="xai-select">
                            <option value="">Select Model</option>
                            <option value="fraud_rf">Fraud Detection - Random Forest</option>
                            <option value="fraud_xgb">Fraud Detection - XGBoost</option>
                            <option value="sentiment_bert">Sentiment Analysis - BERT</option>
                            <option value="attrition_lr">Customer Attrition - Logistic Regression</option>
                        </select>
                        <select id="xai-method-select" class="xai-select">
                            <option value="">Select Method</option>
                            <option value="shap">SHAP Values</option>
                            <option value="lime">LIME Analysis</option>
                            <option value="permutation">Permutation Importance</option>
                            <option value="partial_dependence">Partial Dependence</option>
                        </select>
                        <button id="xai-analyze-btn" class="btn btn-primary">Analyze</button>
                    </div>
                </div>
                
                <div class="xai-content">
                    <!-- Feature Importance Section -->
                    <div class="xai-section" id="feature-importance-section">
                        <h4>📊 Feature Importance</h4>
                        <div class="chart-container">
                            <canvas id="feature-importance-chart"></canvas>
                        </div>
                        <div class="feature-insights" id="feature-insights">
                            <p>Select a model and analysis method to see feature importance insights.</p>
                        </div>
                    </div>

                    <!-- SHAP Analysis Section -->
                    <div class="xai-section" id="shap-analysis-section" style="display: none;">
                        <h4>🎯 SHAP Value Analysis</h4>
                        <div class="shap-controls">
                            <button class="btn btn-small" onclick="window.dashboard?.xaiAnalyzer?.generateSHAPSummary()">Summary Plot</button>
                            <button class="btn btn-small" onclick="window.dashboard?.xaiAnalyzer?.generateSHAPWaterfall()">Waterfall Plot</button>
                            <button class="btn btn-small" onclick="window.dashboard?.xaiAnalyzer?.generateSHAPForce()">Force Plot</button>
                        </div>
                        <div class="chart-container">
                            <canvas id="shap-chart"></canvas>
                        </div>
                        <div class="shap-interpretation" id="shap-interpretation"></div>
                    </div>

                    <!-- LIME Analysis Section -->
                    <div class="xai-section" id="lime-analysis-section" style="display: none;">
                        <h4>🔍 LIME Local Interpretation</h4>
                        <div class="lime-controls">
                            <input type="number" id="lime-instance" placeholder="Instance ID" class="xai-input">
                            <button class="btn btn-small" onclick="window.dashboard?.xaiAnalyzer?.generateLIMEExplanation()">Explain Instance</button>
                        </div>
                        <div class="chart-container">
                            <canvas id="lime-chart"></canvas>
                        </div>
                        <div class="lime-interpretation" id="lime-interpretation"></div>
                    </div>

                    <!-- Partial Dependence Section -->
                    <div class="xai-section" id="pd-analysis-section" style="display: none;">
                        <h4>📈 Partial Dependence Analysis</h4>
                        <div class="pd-controls">
                            <select id="pd-feature-select" class="xai-select">
                                <option value="">Select Feature</option>
                            </select>
                            <button class="btn btn-small" onclick="window.dashboard?.xaiAnalyzer?.generatePartialDependence()">Generate Plot</button>
                        </div>
                        <div class="chart-container">
                            <canvas id="pd-chart"></canvas>
                        </div>
                        <div class="pd-interpretation" id="pd-interpretation"></div>
                    </div>

                    <!-- Model Comparison Section -->
                    <div class="xai-section" id="model-comparison-section">
                        <h4>⚖️ Model Comparison</h4>
                        <div class="comparison-grid">
                            <div class="comparison-metric">
                                <span class="metric-label">Accuracy</span>
                                <div class="metric-bars" id="accuracy-bars"></div>
                            </div>
                            <div class="comparison-metric">
                                <span class="metric-label">Interpretability</span>
                                <div class="metric-bars" id="interpretability-bars"></div>
                            </div>
                            <div class="comparison-metric">
                                <span class="metric-label">Fairness</span>
                                <div class="metric-bars" id="fairness-bars"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to dashboard if models page exists
        const modelsPage = document.getElementById('page-models');
        if (modelsPage) {
            const xaiContainer = document.createElement('div');
            xaiContainer.innerHTML = xaiPanelHTML;
            modelsPage.appendChild(xaiContainer);
        }

        this.addXAIStyles();
    }

    addXAIStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .xai-panel {
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                margin-top: 2rem;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .xai-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                flex-wrap: wrap;
                gap: 1rem;
            }

            .xai-header h3 {
                margin: 0;
                color: var(--primary-color);
                font-size: 1.3rem;
            }

            .xai-controls {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                flex-wrap: wrap;
            }

            .xai-select, .xai-input {
                padding: 0.5rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 0.875rem;
                min-width: 150px;
            }

            .xai-section {
                margin-bottom: 2rem;
                padding: 1rem;
                border: 1px solid #f0f0f0;
                border-radius: 8px;
                background: #fafafa;
            }

            .xai-section h4 {
                margin: 0 0 1rem 0;
                color: var(--text-color);
                font-size: 1.1rem;
            }

            .shap-controls, .lime-controls, .pd-controls {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1rem;
                flex-wrap: wrap;
            }

            .feature-insights, .shap-interpretation, .lime-interpretation, .pd-interpretation {
                margin-top: 1rem;
                padding: 1rem;
                background: white;
                border-radius: 6px;
                font-size: 0.875rem;
                line-height: 1.5;
            }

            .comparison-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }

            .comparison-metric {
                background: white;
                padding: 1rem;
                border-radius: 6px;
                border: 1px solid #eee;
            }

            .metric-label {
                display: block;
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: var(--text-color);
            }

            .metric-bars {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            .metric-bar {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.75rem;
            }

            .metric-bar-name {
                min-width: 60px;
                font-size: 0.7rem;
                color: #666;
            }

            .metric-bar-fill {
                flex: 1;
                height: 8px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
            }

            .metric-bar-value {
                height: 100%;
                background: linear-gradient(90deg, #007bff, #28a745);
                border-radius: 4px;
                transition: width 0.3s ease;
            }

            .metric-bar-score {
                min-width: 30px;
                text-align: right;
                font-weight: 600;
                color: var(--text-color);
            }

            @media (max-width: 768px) {
                .xai-header {
                    flex-direction: column;
                    align-items: stretch;
                }

                .xai-controls {
                    justify-content: stretch;
                    flex-direction: column;
                }

                .xai-select, .xai-input {
                    min-width: auto;
                    width: 100%;
                }

                .shap-controls, .lime-controls, .pd-controls {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindXAIEvents() {
        const analyzeBtn = document.getElementById('xai-analyze-btn');
        const methodSelect = document.getElementById('xai-method-select');
        
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.performXAIAnalysis());
        }

        if (methodSelect) {
            methodSelect.addEventListener('change', (e) => this.toggleAnalysisSection(e.target.value));
        }
    }

    toggleAnalysisSection(method) {
        // Hide all analysis sections
        const sections = ['shap-analysis-section', 'lime-analysis-section', 'pd-analysis-section'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) section.style.display = 'none';
        });

        // Show relevant section
        const targetSection = document.getElementById(`${method}-analysis-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Populate feature select for partial dependence
        if (method === 'partial_dependence') {
            this.populateFeatureSelect();
        }
    }

    async performXAIAnalysis() {
        const modelSelect = document.getElementById('xai-model-select');
        const methodSelect = document.getElementById('xai-method-select');
        
        const selectedModel = modelSelect?.value;
        const selectedMethod = methodSelect?.value;

        if (!selectedModel || !selectedMethod) {
            this.dashboard.showNotification('Please select both model and analysis method', 'warning');
            return;
        }

        try {
            this.dashboard.showNotification('Starting XAI analysis...', 'info');
            
            // Generate demo analysis or call real API
            const analysisResult = await this.generateXAIAnalysis(selectedModel, selectedMethod);
            
            // Display results
            this.displayAnalysisResults(selectedMethod, analysisResult);
            
            this.dashboard.showNotification('XAI analysis completed!', 'success');
        } catch (error) {
            console.error('XAI analysis failed:', error);
            this.dashboard.showNotification('XAI analysis failed', 'error');
        }
    }

    async generateXAIAnalysis(model, method) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate demo data based on model and method
        switch (method) {
            case 'shap':
                return this.generateSHAPData(model);
            case 'lime':
                return this.generateLIMEData(model);
            case 'permutation':
                return this.generatePermutationData(model);
            case 'partial_dependence':
                return this.generatePartialDependenceData(model);
            default:
                throw new Error(`Unknown XAI method: ${method}`);
        }
    }

    generateSHAPData(model) {
        const features = this.getModelFeatures(model);
        return {
            type: 'shap',
            features: features.map(feature => ({
                name: feature,
                shapValue: (Math.random() - 0.5) * 2, // Range: -1 to 1
                importance: Math.random(),
                direction: Math.random() > 0.5 ? 'positive' : 'negative'
            })).sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue)),
            baseValue: 0.5,
            prediction: 0.8
        };
    }

    generateLIMEData(model) {
        const features = this.getModelFeatures(model);
        return {
            type: 'lime',
            features: features.slice(0, 10).map(feature => ({
                name: feature,
                weight: (Math.random() - 0.5) * 0.8,
                confidence: 0.7 + Math.random() * 0.3
            })).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
            prediction: 0.75,
            confidence: 0.83
        };
    }

    generatePermutationData(model) {
        const features = this.getModelFeatures(model);
        return {
            type: 'permutation',
            features: features.map(feature => ({
                name: feature,
                importance: Math.random(),
                std: Math.random() * 0.1
            })).sort((a, b) => b.importance - a.importance)
        };
    }

    generatePartialDependenceData(model) {
        const selectedFeature = document.getElementById('pd-feature-select')?.value || 'amount';
        const points = [];
        
        for (let i = 0; i <= 20; i++) {
            points.push({
                x: i / 20,
                y: 0.3 + 0.4 * Math.sin(i / 3) + (Math.random() - 0.5) * 0.1
            });
        }

        return {
            type: 'partial_dependence',
            feature: selectedFeature,
            points: points,
            averageEffect: points.reduce((sum, p) => sum + p.y, 0) / points.length
        };
    }

    getModelFeatures(model) {
        const featureSets = {
            fraud_rf: ['transaction_amount', 'merchant_category', 'time_of_day', 'location_risk', 'user_history', 'card_type', 'velocity_1h', 'velocity_24h'],
            fraud_xgb: ['amount', 'merchant_risk', 'hour', 'location_score', 'user_behavior', 'card_age', 'frequency', 'anomaly_score'],
            sentiment_bert: ['word_count', 'positive_words', 'negative_words', 'sentence_length', 'complexity', 'emotion_score', 'context_relevance'],
            attrition_lr: ['account_age', 'transaction_frequency', 'balance_avg', 'product_count', 'support_tickets', 'login_frequency', 'mobile_usage']
        };
        
        return featureSets[model] || ['feature_1', 'feature_2', 'feature_3', 'feature_4', 'feature_5'];
    }

    displayAnalysisResults(method, result) {
        switch (method) {
            case 'shap':
                this.displaySHAPResults(result);
                break;
            case 'lime':
                this.displayLIMEResults(result);
                break;
            case 'permutation':
                this.displayPermutationResults(result);
                break;
            case 'partial_dependence':
                this.displayPartialDependenceResults(result);
                break;
        }

        // Update feature importance chart
        this.updateFeatureImportanceChart(result);
        this.updateFeatureInsights(result);
    }

    displaySHAPResults(result) {
        const interpretation = document.getElementById('shap-interpretation');
        if (!interpretation) return;

        const topFeatures = result.features.slice(0, 5);
        const interpretation_text = `
            <h5>SHAP Analysis Summary</h5>
            <p><strong>Prediction:</strong> ${(result.prediction * 100).toFixed(1)}% (Base: ${(result.baseValue * 100).toFixed(1)}%)</p>
            <p><strong>Top Contributing Features:</strong></p>
            <ul>
                ${topFeatures.map(f => `
                    <li><strong>${f.name}:</strong> ${f.shapValue > 0 ? '+' : ''}${f.shapValue.toFixed(3)} 
                        (${f.direction === 'positive' ? 'increases' : 'decreases'} prediction)</li>
                `).join('')}
            </ul>
            <p>SHAP values show how each feature contributes to moving the prediction away from the base value.</p>
        `;
        
        interpretation.innerHTML = interpretation_text;
        this.createSHAPChart(result);
    }

    displayLIMEResults(result) {
        const interpretation = document.getElementById('lime-interpretation');
        if (!interpretation) return;

        const interpretation_text = `
            <h5>LIME Local Explanation</h5>
            <p><strong>Prediction:</strong> ${(result.prediction * 100).toFixed(1)}% (Confidence: ${(result.confidence * 100).toFixed(1)}%)</p>
            <p><strong>Local Feature Weights:</strong></p>
            <ul>
                ${result.features.slice(0, 5).map(f => `
                    <li><strong>${f.name}:</strong> ${f.weight > 0 ? '+' : ''}${f.weight.toFixed(3)} 
                        (confidence: ${(f.confidence * 100).toFixed(1)}%)</li>
                `).join('')}
            </ul>
            <p>LIME explains individual predictions by learning locally around the instance.</p>
        `;
        
        interpretation.innerHTML = interpretation_text;
        this.createLIMEChart(result);
    }

    displayPermutationResults(result) {
        const insights = document.getElementById('feature-insights');
        if (!insights) return;

        const topFeatures = result.features.slice(0, 8);
        const insights_text = `
            <h5>Permutation Importance Analysis</h5>
            <p>Features ranked by their impact on model performance when randomly shuffled:</p>
            <div class="feature-ranking">
                ${topFeatures.map((f, i) => `
                    <div class="feature-rank-item">
                        <span class="rank">#${i + 1}</span>
                        <span class="feature-name">${f.name}</span>
                        <span class="importance-score">${f.importance.toFixed(3)} ±${f.std.toFixed(3)}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        insights.innerHTML = insights_text;
    }

    displayPartialDependenceResults(result) {
        const interpretation = document.getElementById('pd-interpretation');
        if (!interpretation) return;

        const minY = Math.min(...result.points.map(p => p.y));
        const maxY = Math.max(...result.points.map(p => p.y));
        const range = maxY - minY;

        const interpretation_text = `
            <h5>Partial Dependence Analysis: ${result.feature}</h5>
            <p><strong>Average Effect:</strong> ${result.averageEffect.toFixed(3)}</p>
            <p><strong>Effect Range:</strong> ${range.toFixed(3)} (${minY.toFixed(3)} to ${maxY.toFixed(3)})</p>
            <p>This plot shows how the model's predictions change as <strong>${result.feature}</strong> varies, 
               while keeping all other features at their average values.</p>
            <p><strong>Interpretation:</strong> ${this.interpretPartialDependence(result)}</p>
        `;
        
        interpretation.innerHTML = interpretation_text;
        this.createPartialDependenceChart(result);
    }

    interpretPartialDependence(result) {
        const points = result.points;
        const trend = points[points.length - 1].y - points[0].y;
        
        if (Math.abs(trend) < 0.05) {
            return "The feature shows minimal impact on predictions across its range.";
        } else if (trend > 0) {
            return "Higher values of this feature tend to increase the prediction.";
        } else {
            return "Higher values of this feature tend to decrease the prediction.";
        }
    }

    createSHAPChart(result) {
        const canvas = document.getElementById('shap-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const chartData = {
            labels: result.features.slice(0, 10).map(f => f.name),
            datasets: [{
                label: 'SHAP Values',
                data: result.features.slice(0, 10).map(f => f.shapValue),
                backgroundColor: result.features.slice(0, 10).map(f => 
                    f.shapValue > 0 ? 'rgba(40, 167, 69, 0.8)' : 'rgba(220, 53, 69, 0.8)'
                ),
                borderColor: result.features.slice(0, 10).map(f => 
                    f.shapValue > 0 ? '#28a745' : '#dc3545'
                ),
                borderWidth: 1
            }]
        };

        new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'SHAP Feature Contributions'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'SHAP Value'
                        }
                    }
                }
            }
        });
    }

    createLIMEChart(result) {
        const canvas = document.getElementById('lime-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const chartData = {
            labels: result.features.map(f => f.name),
            datasets: [{
                label: 'Feature Weights',
                data: result.features.map(f => f.weight),
                backgroundColor: result.features.map(f => 
                    f.weight > 0 ? 'rgba(0, 123, 255, 0.8)' : 'rgba(255, 193, 7, 0.8)'
                ),
                borderColor: result.features.map(f => 
                    f.weight > 0 ? '#007bff' : '#ffc107'
                ),
                borderWidth: 1
            }]
        };

        new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'LIME Local Feature Weights'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Weight'
                        }
                    }
                }
            }
        });
    }

    createPartialDependenceChart(result) {
        const canvas = document.getElementById('pd-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const chartData = {
            labels: result.points.map((_, i) => (i / (result.points.length - 1)).toFixed(2)),
            datasets: [{
                label: `Effect of ${result.feature}`,
                data: result.points.map(p => p.y),
                borderColor: '#17a2b8',
                backgroundColor: 'rgba(23, 162, 184, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        };

        new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Partial Dependence: ${result.feature}`
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: `${result.feature} (normalized)`
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Prediction'
                        }
                    }
                }
            }
        });
    }

    updateFeatureImportanceChart(result) {
        const canvas = document.getElementById('feature-importance-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Clear any existing chart
        Chart.getChart(canvas)?.destroy();
        
        const features = result.features.slice(0, 10);
        const chartData = {
            labels: features.map(f => f.name),
            datasets: [{
                label: 'Importance',
                data: features.map(f => Math.abs(f.shapValue || f.weight || f.importance || 0)),
                backgroundColor: 'rgba(0, 123, 255, 0.8)',
                borderColor: '#007bff',
                borderWidth: 1
            }]
        };

        new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Feature Importance Overview'
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    updateFeatureInsights(result) {
        const insights = document.getElementById('feature-insights');
        if (!insights) return;

        const topFeature = result.features[0];
        const methodName = this.explanationMethods[result.type] || result.type;
        
        insights.innerHTML = `
            <h5>${methodName} Insights</h5>
            <p><strong>Most Important Feature:</strong> ${topFeature.name}</p>
            <p><strong>Impact:</strong> ${this.describeFeatureImpact(topFeature, result.type)}</p>
            <p><strong>Recommendation:</strong> ${this.generateRecommendation(topFeature, result.type)}</p>
        `;
    }

    describeFeatureImpact(feature, method) {
        const value = Math.abs(feature.shapValue || feature.weight || feature.importance || 0);
        const magnitude = value > 0.5 ? 'High' : value > 0.2 ? 'Medium' : 'Low';
        
        switch (method) {
            case 'shap':
                return `${magnitude} impact (SHAP: ${feature.shapValue.toFixed(3)})`;
            case 'lime':
                return `${magnitude} local importance (Weight: ${feature.weight.toFixed(3)})`;
            case 'permutation':
                return `${magnitude} global importance (Score: ${feature.importance.toFixed(3)})`;
            default:
                return `${magnitude} importance`;
        }
    }

    generateRecommendation(feature, method) {
        const recommendations = {
            transaction_amount: "Monitor high-value transactions more closely for fraud detection.",
            merchant_category: "Consider merchant risk profiles in fraud scoring.",
            account_age: "Account tenure is a key factor in customer retention.",
            positive_words: "Sentiment polarity strongly influences classification.",
            user_history: "User behavioral patterns are crucial for predictions."
        };
        
        return recommendations[feature.name] || "Consider this feature's importance in model decisions.";
    }

    populateFeatureSelect() {
        const select = document.getElementById('pd-feature-select');
        const modelSelect = document.getElementById('xai-model-select');
        
        if (!select || !modelSelect) return;
        
        const features = this.getModelFeatures(modelSelect.value);
        select.innerHTML = '<option value="">Select Feature</option>';
        
        features.forEach(feature => {
            const option = document.createElement('option');
            option.value = feature;
            option.textContent = feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            select.appendChild(option);
        });
    }

    // SHAP specific methods
    generateSHAPSummary() {
        console.log('Generating SHAP summary plot...');
        this.dashboard.showNotification('SHAP summary plot generated', 'info');
    }

    generateSHAPWaterfall() {
        console.log('Generating SHAP waterfall plot...');
        this.dashboard.showNotification('SHAP waterfall plot generated', 'info');
    }

    generateSHAPForce() {
        console.log('Generating SHAP force plot...');
        this.dashboard.showNotification('SHAP force plot generated', 'info');
    }

    // LIME specific methods
    generateLIMEExplanation() {
        const instanceId = document.getElementById('lime-instance')?.value;
        if (!instanceId) {
            this.dashboard.showNotification('Please enter an instance ID', 'warning');
            return;
        }
        console.log(`Generating LIME explanation for instance ${instanceId}...`);
        this.dashboard.showNotification(`LIME explanation generated for instance ${instanceId}`, 'info');
    }

    // Partial Dependence methods
    generatePartialDependence() {
        const feature = document.getElementById('pd-feature-select')?.value;
        if (!feature) {
            this.dashboard.showNotification('Please select a feature', 'warning');
            return;
        }
        console.log(`Generating partial dependence plot for ${feature}...`);
        this.dashboard.showNotification(`Partial dependence plot generated for ${feature}`, 'info');
    }

    // Public API methods
    exportAnalysis() {
        const modelSelect = document.getElementById('xai-model-select');
        const methodSelect = document.getElementById('xai-method-select');
        
        const data = {
            timestamp: new Date().toISOString(),
            model: modelSelect?.value,
            method: methodSelect?.value,
            analysis: this.interpretationCache.get(`${modelSelect?.value}_${methodSelect?.value}`)
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xai-analysis-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize XAI Analyzer
window.XAIAnalyzer = XAIAnalyzer;