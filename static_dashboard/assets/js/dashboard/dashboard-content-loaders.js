/**
 * FCA Analysis Dashboard - Content Loaders
 * =======================================
 * 
 * Contains all page-specific content loading methods
 * extracted from the main dashboard controller.
 */

class DashboardContentLoaders {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.data = dashboard.data;
        this.safeLog = dashboard.safeLog;
    }

    // Dashboard main page content
    async loadDashboardContent() {
        this.updateSummaryCards();
        await this.renderDashboardCharts();
        this.updateModelHealth();
        this.updateLastUpdated();
    }

    updateSummaryCards() {
        const summary = this.data.summary;
        
        if (summary) {
            // Total Datasets
            document.getElementById('total-datasets').textContent = summary.total_datasets || '8';
            
            // Models Trained
            document.getElementById('models-trained').textContent = summary.models_trained || '3';
            
            // Fraud Detection Rate
            const fraudRate = summary.business_insights?.fraud_detection_rate || 0.368;
            document.getElementById('fraud-detection-rate').textContent = `${(fraudRate * 100).toFixed(1)}%`;
            
            // System Status
            const status = summary.system_status || 'operational';
            const statusElement = document.getElementById('system-status');
            statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusElement.className = `h5 mb-0 font-weight-bold ${status === 'operational' ? 'text-success' : 'text-warning'}`;
        }
        
        console.log('📊 Summary cards updated');
    }

    async renderDashboardCharts() {
        console.log('📈 Starting to render dashboard charts...');
        console.log('Available data:', Object.keys(this.data));
        
        // Wait for DOM to be fully ready
        await new Promise(resolve => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
        
        // Check if chart containers exist
        const containers = ['model-performance-chart', 'fraud-risk-chart', 'sentiment-distribution-chart', 'customer-segments-chart'];
        const missingContainers = containers.filter(id => !document.getElementById(id));
        
        if (missingContainers.length > 0) {
            console.warn('⚠️ Missing chart containers:', missingContainers);
            this.renderFallbackCharts();
            return;
        }
        
        // Use legacy FCACharts for compatibility
        if (window.FCACharts) {
            try {
                console.log('🔄 Using legacy chart system for reliability');
                
                window.FCACharts.renderModelComparison(this.data.charts);
                window.FCACharts.renderFraudDistribution(this.data.charts);
                window.FCACharts.renderSentimentDistribution(this.data.charts);
                window.FCACharts.renderCustomerSegments(this.data.charts);
                
                console.log('✅ Legacy dashboard charts rendered successfully');
            } catch (error) {
                console.error('❌ Error rendering dashboard charts:', error);
                this.renderFallbackCharts();
            }
        } else {
            console.warn('⚠️ Charts library not loaded, using fallback');
            this.renderFallbackCharts();
        }
    }

    renderFallbackCharts() {
        // Simple fallback charts using basic HTML
        const chartContainers = [
            'model-performance-chart',
            'fraud-risk-chart',
            'sentiment-distribution-chart',
            'customer-segments-chart'
        ];
        
        chartContainers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="chart-loading">
                        <span>Chart loading...</span>
                    </div>
                `;
            }
        });
    }

    updateModelHealth() {
        const summary = this.data.summary;
        const healthContainer = document.getElementById('model-health-cards');
        
        if (summary?.model_health && healthContainer) {
            const models = summary.model_health;
            
            let healthHTML = '';
            
            Object.entries(models).forEach(([modelName, health]) => {
                const statusClass = health.status === 'healthy' ? 'success' : 
                                   health.status === 'warning' ? 'warning' : 'danger';
                
                const metricValue = health.accuracy || health.auc || 'N/A';
                const metricLabel = health.accuracy ? 'Accuracy' : 'AUC';
                
                healthHTML += `
                    <div class="col-md-4 mb-3">
                        <div class="model-health-card ${statusClass}">
                            <div class="card-title">
                                ${modelName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div class="card-value">
                                ${typeof metricValue === 'number' ? (metricValue * 100).toFixed(1) + '%' : metricValue}
                            </div>
                            <div class="card-subtitle">
                                ${metricLabel} • ${health.status}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            healthContainer.innerHTML = healthHTML;
            console.log('💊 Model health updated');
        }
    }

    updateLastUpdated() {
        const summary = this.data.summary;
        if (summary?.last_updated) {
            const date = new Date(summary.last_updated);
            const timeString = date.toLocaleString();
            document.getElementById('last-updated').textContent = timeString;
        }
    }

    // Fraud detection page content
    loadFraudContent() {
        // Render fraud-specific charts
        if (window.FCACharts) {
            try {
                console.log('🛡️ Loading fraud content and charts...');
                const mockData = this.dashboard.generateMockXAIData();
                
                window.FCACharts.renderFraudFeatureImportance(this.data.charts);
                window.FCACharts.renderFraudDistribution(this.data.charts);
                window.FCACharts.renderSHAPSummary(mockData);
                window.FCACharts.renderLIMEExplanation(mockData);
                window.FCACharts.renderDecisionTree(mockData);
                window.FCACharts.renderConfidenceDistribution(mockData);
                
                console.log('✅ Fraud charts rendered successfully');
            } catch (error) {
                console.error('❌ Error rendering fraud charts:', error);
            }
        } else {
            console.warn('⚠️ FCACharts not available for fraud page');
        }
        
        const fraudPage = document.getElementById('fraud-detailed-charts');
        if (fraudPage && this.data.fraud_data) {
            fraudPage.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Performance Metrics</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>Accuracy:</strong> ${(this.data.fraud_data.performance_metrics.accuracy * 100).toFixed(2)}%</p>
                                <p><strong>Precision:</strong> ${(this.data.fraud_data.performance_metrics.precision * 100).toFixed(2)}%</p>
                                <p><strong>Recall:</strong> ${(this.data.fraud_data.performance_metrics.recall * 100).toFixed(2)}%</p>
                                <p><strong>F1-Score:</strong> ${(this.data.fraud_data.performance_metrics.f1_score * 100).toFixed(2)}%</p>
                                <p><strong>AUC-ROC:</strong> ${(this.data.fraud_data.performance_metrics.roc_auc * 100).toFixed(2)}%</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Risk Distribution</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>High Risk:</strong> ${this.data.fraud_data.risk_distribution.HIGH.toLocaleString()} cases</p>
                                <p><strong>Medium Risk:</strong> ${this.data.fraud_data.risk_distribution.MEDIUM.toLocaleString()} cases</p>
                                <p><strong>Low Risk:</strong> ${this.data.fraud_data.risk_distribution.LOW.toLocaleString()} cases</p>
                                <p><strong>Minimal Risk:</strong> ${this.data.fraud_data.risk_distribution.MINIMAL.toLocaleString()} cases</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Sentiment analysis page content
    loadSentimentContent() {
        // Render sentiment-specific charts
        if (window.FCACharts) {
            try {
                console.log('💭 Loading sentiment content and charts...');
                
                window.FCACharts.renderSentimentDistribution(this.data.charts);
                window.FCACharts.renderSentimentTimeline(this.data.sentiment_data);
                window.FCACharts.renderDomainSentiment(this.data.sentiment_data);
                
                console.log('✅ Sentiment charts rendered successfully');
            } catch (error) {
                console.error('❌ Error rendering sentiment charts:', error);
            }
        } else {
            console.warn('⚠️ FCACharts not available for sentiment page');
        }
        
        const sentimentPage = document.getElementById('sentiment-detailed-charts');
        if (sentimentPage && this.data.sentiment_data) {
            const dist = this.data.sentiment_data.sentiment_distribution;
            sentimentPage.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Sentiment Distribution</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>Positive:</strong> ${(dist.positive * 100).toFixed(1)}%</p>
                                <p><strong>Neutral:</strong> ${(dist.neutral * 100).toFixed(1)}%</p>
                                <p><strong>Negative:</strong> ${(dist.negative * 100).toFixed(1)}%</p>
                                <p><strong>Total Sentences:</strong> ${this.data.sentiment_data.dataset_info.total_sentences.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Model Performance</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>Ensemble Accuracy:</strong> ${(this.data.sentiment_data.model_performance.ensemble_accuracy * 100).toFixed(1)}%</p>
                                <hr>
                                <h6>Individual Models:</h6>
                                ${Object.entries(this.data.sentiment_data.model_performance.individual_models).map(([model, metrics]) => 
                                    `<p><strong>${model.toUpperCase()}:</strong> ${(metrics.accuracy * 100).toFixed(1)}%</p>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Customer attrition page content
    loadAttritionContent() {
        // Render attrition-specific charts
        if (window.FCACharts) {
            try {
                console.log('👥 Loading attrition content and charts...');
                const mockData = this.dashboard.generateMockXAIData();
                
                window.FCACharts.renderCustomerSegments(this.data.charts);
                window.FCACharts.renderAttritionFeatureImportance(this.data.attrition_data);
                window.FCACharts.renderAttritionConfidence(this.data.attrition_data);
                window.FCACharts.renderFeatureInteraction(mockData);
                window.FCACharts.renderMonthlyChurnTrend(this.data.attrition_data);
                
                console.log('✅ Attrition charts rendered successfully');
            } catch (error) {
                console.error('❌ Error rendering attrition charts:', error);
            }
        } else {
            console.warn('⚠️ FCACharts not available for attrition page');
        }
        
        const attritionPage = document.getElementById('attrition-detailed-charts');
        if (attritionPage && this.data.attrition_data) {
            attritionPage.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Customer Overview</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>Total Customers:</strong> ${this.data.attrition_data.dataset_info.total_customers.toLocaleString()}</p>
                                <p><strong>Churn Rate:</strong> ${(this.data.attrition_data.dataset_info.churn_rate * 100).toFixed(1)}%</p>
                                <p><strong>Retained:</strong> ${this.data.attrition_data.dataset_info.retained_customers.toLocaleString()}</p>
                                <p><strong>Churned:</strong> ${this.data.attrition_data.dataset_info.churned_customers.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Top Customer Segments</h6>
                            </div>
                            <div class="card-body">
                                ${Object.entries(this.data.attrition_data.customer_segments).slice(0, 4).map(([segment, data]) => 
                                    `<p><strong>${segment.replace(/_/g, ' ')}:</strong> ${data.count.toLocaleString()} (${data.percentage}%)</p>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Datasets page content
    loadDatasetsContent() {
        const datasetsPage = document.getElementById('datasets-table');
        if (datasetsPage && this.data.datasets) {
            let tableHTML = `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Dataset Name</th>
                                <th>Type</th>
                                <th>Records</th>
                                <th>Features</th>
                                <th>Size (MB)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Combine all datasets
            const allDatasets = [
                ...(this.data.datasets.available_datasets.fraud_detection || []),
                ...(this.data.datasets.available_datasets.sentiment_analysis || []),
                ...(this.data.datasets.available_datasets.customer_analytics || [])
            ];
            
            allDatasets.forEach(dataset => {
                const statusBadge = dataset.status === 'ready' ? 
                    '<span class="badge badge-success">Ready</span>' :
                    '<span class="badge badge-warning">Processing</span>';
                
                tableHTML += `
                    <tr>
                        <td><strong>${dataset.name}</strong><br><small class="text-muted">${dataset.description}</small></td>
                        <td>${dataset.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                        <td>${dataset.records.toLocaleString()}</td>
                        <td>${dataset.features}</td>
                        <td>${dataset.size_mb}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            });
            
            tableHTML += '</tbody></table></div>';
            datasetsPage.innerHTML = tableHTML;
        }
    }
}

// Export for use in other modules
window.DashboardContentLoaders = DashboardContentLoaders;