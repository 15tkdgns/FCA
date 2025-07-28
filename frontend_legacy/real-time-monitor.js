// Real-time Monitoring System
class RealTimeMonitor {
    constructor(dashboard, updateInterval = 30000) {
        this.dashboard = dashboard;
        this.updateInterval = updateInterval;
        this.isRunning = false;
        this.intervalId = null;
        this.webSocket = null;
        this.connectionRetries = 0;
        this.maxRetries = 5;
        this.lastUpdate = null;
        
        this.init();
    }

    init() {
        this.setupWebSocket();
        this.setupPerformanceMonitoring();
        this.setupStatusIndicators();
    }

    // WebSocket connection for real-time updates
    setupWebSocket() {
        try {
            // Try to establish WebSocket connection
            const wsURL = 'ws://localhost:5003/ws';
            this.webSocket = new WebSocket(wsURL);
            
            this.webSocket.onopen = () => {
                console.log('✅ WebSocket connected');
                this.connectionRetries = 0;
                this.updateConnectionStatus('connected');
            };
            
            this.webSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleRealtimeData(data);
                } catch (error) {
                    console.error('WebSocket message parsing error:', error);
                }
            };
            
            this.webSocket.onclose = () => {
                console.log('⚠️ WebSocket disconnected');
                this.updateConnectionStatus('disconnected');
                this.attemptReconnect();
            };
            
            this.webSocket.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.updateConnectionStatus('error');
            };
            
        } catch (error) {
            console.warn('WebSocket not available, using polling fallback');
            this.startPolling();
        }
    }

    // Fallback to polling if WebSocket fails
    startPolling() {
        if (this.isRunning) return;
        
        console.log('🔄 Starting real-time polling...');
        this.isRunning = true;
        
        this.intervalId = setInterval(async () => {
            await this.pollForUpdates();
        }, this.updateInterval);
        
        // Initial poll
        this.pollForUpdates();
    }

    stopPolling() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('⏹️ Real-time polling stopped');
    }

    async pollForUpdates() {
        try {
            // Poll health status
            const health = await this.dashboard.apiClient.checkHealth();
            this.updateSystemHealth(health);
            
            // Poll summary data
            const summary = await this.dashboard.apiClient.getSummary();
            if (APIUtils.isSuccess(summary)) {
                this.handleDataUpdate('summary', summary.data);
            }
            
            // Update last update timestamp
            this.lastUpdate = new Date();
            this.updateLastUpdateTime();
            
        } catch (error) {
            console.error('Polling update failed:', error);
            this.updateConnectionStatus('error');
        }
    }

    // Handle real-time data from WebSocket
    handleRealtimeData(data) {
        switch (data.type) {
            case 'model_update':
                this.handleModelUpdate(data.payload);
                break;
            case 'system_health':
                this.updateSystemHealth(data.payload);
                break;
            case 'new_prediction':
                this.handleNewPrediction(data.payload);
                break;
            case 'training_progress':
                this.handleTrainingProgress(data.payload);
                break;
            default:
                console.log('Unknown real-time data type:', data.type);
        }
    }

    // Handle different types of updates
    handleDataUpdate(type, data) {
        switch (type) {
            case 'summary':
                this.dashboard.updateDashboardMetrics(data);
                break;
            case 'fraud':
                if (this.dashboard.currentPage === 'fraud') {
                    this.dashboard.updateFraudTable(data);
                    this.dashboard.updateFraudStats(data);
                }
                break;
            case 'sentiment':
                if (this.dashboard.currentPage === 'sentiment') {
                    this.dashboard.updateSentimentTable(data);
                    this.dashboard.updateSentimentStats(data);
                }
                break;
            case 'attrition':
                if (this.dashboard.currentPage === 'attrition') {
                    this.dashboard.updateAttritionMetrics(data);
                }
                break;
        }
    }

    handleModelUpdate(data) {
        console.log('📊 Model update received:', data);
        
        // Show notification
        this.dashboard.showNotification(
            `Model "${data.model}" updated - Accuracy: ${(data.accuracy * 100).toFixed(1)}%`,
            'info'
        );
        
        // Update relevant page if currently visible
        if (this.dashboard.currentPage === data.domain) {
            this.handleDataUpdate(data.domain, data.results);
        }
        
        // Animate updated metrics
        this.animateMetricUpdate(data);
    }

    handleNewPrediction(data) {
        console.log('🔮 New prediction received:', data);
        
        // Update prediction displays
        this.updatePredictionDisplays(data);
        
        // Show notification for high confidence predictions
        if (data.confidence > 0.9) {
            this.dashboard.showNotification(
                `High confidence prediction: ${data.prediction} (${(data.confidence * 100).toFixed(1)}%)`,
                'success'
            );
        }
    }

    handleTrainingProgress(data) {
        console.log('🏋️ Training progress:', data);
        
        // Update training progress if on training page
        if (this.dashboard.currentPage === 'training') {
            this.updateTrainingProgress(data);
        }
        
        // Show completion notification
        if (data.status === 'completed') {
            this.dashboard.showNotification(
                `Training completed for ${data.model} - Final accuracy: ${(data.accuracy * 100).toFixed(1)}%`,
                'success'
            );
        }
    }

    // System health monitoring
    updateSystemHealth(health) {
        const statusElement = document.getElementById('system-status');
        const statusTextElement = document.querySelector('.status-text');
        
        if (statusElement && statusTextElement) {
            if (health.status === 'healthy' && health.all_available) {
                statusElement.className = 'status-dot online';
                statusTextElement.textContent = 'Online';
            } else {
                statusElement.className = 'status-dot offline';
                statusTextElement.textContent = 'Issues Detected';
            }
        }
        
        // Update detailed health in settings if visible
        this.updateHealthDetails(health);
    }

    updateHealthDetails(health) {
        const healthContainer = document.getElementById('system-health-details');
        if (!healthContainer) return;
        
        const healthHTML = Object.entries(health.data_sources || {}).map(([source, status]) => `
            <div class="health-item">
                <span class="health-source">${source}</span>
                <span class="health-status ${status ? 'healthy' : 'unhealthy'}">
                    ${status ? '✅ Available' : '❌ Unavailable'}
                </span>
            </div>
        `).join('');
        
        healthContainer.innerHTML = healthHTML;
    }

    // Connection status management
    updateConnectionStatus(status) {
        const liveIndicator = document.querySelector('.live-indicator');
        const liveDot = document.querySelector('.live-dot');
        const liveText = liveIndicator?.querySelector('span');
        
        if (liveIndicator && liveDot && liveText) {
            switch (status) {
                case 'connected':
                    liveIndicator.className = 'live-indicator connected';
                    liveDot.style.backgroundColor = '#28a745';
                    liveText.textContent = 'Real-time Updates';
                    break;
                case 'disconnected':
                    liveIndicator.className = 'live-indicator warning';
                    liveDot.style.backgroundColor = '#ffc107';
                    liveText.textContent = 'Reconnecting...';
                    break;
                case 'error':
                    liveIndicator.className = 'live-indicator error';
                    liveDot.style.backgroundColor = '#dc3545';
                    liveText.textContent = 'Connection Error';
                    break;
            }
        }
    }

    updateLastUpdateTime() {
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement && this.lastUpdate) {
            const timeString = this.lastUpdate.toLocaleTimeString();
            lastUpdateElement.textContent = `Last Updated: ${timeString}`;
        }
    }

    // Performance monitoring
    setupPerformanceMonitoring() {
        this.performanceMetrics = {
            pageLoadTime: performance.now(),
            apiResponseTimes: [],
            chartRenderTimes: [],
            memoryUsage: []
        };
        
        // Monitor API response times
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const start = performance.now();
            const response = await originalFetch.apply(this, args);
            const duration = performance.now() - start;
            
            if (args[0].includes('/api/')) {
                this.performanceMetrics.apiResponseTimes.push({
                    url: args[0],
                    duration,
                    timestamp: Date.now()
                });
                
                // Keep only last 50 measurements
                if (this.performanceMetrics.apiResponseTimes.length > 50) {
                    this.performanceMetrics.apiResponseTimes.shift();
                }
            }
            
            return response;
        };
        
        // Monitor memory usage periodically
        setInterval(() => {
            if (performance.memory) {
                this.performanceMetrics.memoryUsage.push({
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    timestamp: Date.now()
                });
                
                // Keep only last 100 measurements
                if (this.performanceMetrics.memoryUsage.length > 100) {
                    this.performanceMetrics.memoryUsage.shift();
                }
            }
        }, 10000); // Every 10 seconds
    }

    // Status indicators
    setupStatusIndicators() {
        // Add status indicators to sidebar
        this.addSystemStatusIndicator();
        this.addPerformanceIndicator();
    }

    addSystemStatusIndicator() {
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (!sidebarFooter) return;
        
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'system-status-indicator';
        statusIndicator.innerHTML = `
            <div class="status-item">
                <span class="status-label">API Status</span>
                <span class="status-value" id="api-status-indicator">Checking...</span>
            </div>
            <div class="status-item">
                <span class="status-label">Response Time</span>
                <span class="status-value" id="response-time-indicator">--ms</span>
            </div>
        `;
        
        sidebarFooter.appendChild(statusIndicator);
    }

    addPerformanceIndicator() {
        // Update response time indicator
        setInterval(() => {
            const responseTimeElement = document.getElementById('response-time-indicator');
            if (responseTimeElement && this.performanceMetrics.apiResponseTimes.length > 0) {
                const recentTimes = this.performanceMetrics.apiResponseTimes.slice(-10);
                const avgTime = recentTimes.reduce((sum, item) => sum + item.duration, 0) / recentTimes.length;
                responseTimeElement.textContent = `${Math.round(avgTime)}ms`;
                
                // Color code based on performance
                if (avgTime < 500) {
                    responseTimeElement.className = 'status-value good';
                } else if (avgTime < 1000) {
                    responseTimeElement.className = 'status-value warning';
                } else {
                    responseTimeElement.className = 'status-value error';
                }
            }
        }, 5000);
    }

    // Utility methods
    animateMetricUpdate(data) {
        const metricElements = document.querySelectorAll('.metric-value');
        metricElements.forEach(element => {
            element.classList.add('pulse');
            setTimeout(() => {
                element.classList.remove('pulse');
            }, 1000);
        });
    }

    updatePredictionDisplays(data) {
        // Update real-time predictions if visible
        const predictionsContainer = document.getElementById('realtime-predictions-dashboard');
        if (predictionsContainer) {
            // Add new prediction to the top
            const predictionHTML = `
                <div class="prediction-item new-prediction">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="stock-symbol">${data.symbol}</span>
                        <span class="prediction-direction ${data.direction}">${data.change}</span>
                    </div>
                    <div class="prediction-confidence">
                        <span class="confidence">Confidence: ${(data.confidence * 100).toFixed(0)}%</span>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${data.confidence * 100}%"></div>
                        </div>
                    </div>
                </div>
            `;
            
            predictionsContainer.insertAdjacentHTML('afterbegin', predictionHTML);
            
            // Remove old predictions (keep max 5)
            const predictions = predictionsContainer.querySelectorAll('.prediction-item');
            if (predictions.length > 5) {
                predictions[predictions.length - 1].remove();
            }
            
            // Remove new-prediction class after animation
            setTimeout(() => {
                const newPrediction = predictionsContainer.querySelector('.new-prediction');
                if (newPrediction) {
                    newPrediction.classList.remove('new-prediction');
                }
            }, 2000);
        }
    }

    updateTrainingProgress(data) {
        // Update training progress indicators
        const progressElement = document.getElementById(`${data.model.toLowerCase()}-progress-fill`);
        const statusElement = document.getElementById(`${data.model.toLowerCase()}-status`);
        const accuracyElement = document.getElementById(`${data.model.toLowerCase()}-accuracy`);
        
        if (progressElement) {
            progressElement.style.width = `${data.progress}%`;
        }
        
        if (statusElement) {
            statusElement.textContent = data.status;
            statusElement.className = `model-status ${data.status.toLowerCase()}`;
        }
        
        if (accuracyElement && data.accuracy) {
            accuracyElement.textContent = `${(data.accuracy * 100).toFixed(1)}%`;
        }
    }

    // Connection retry logic
    attemptReconnect() {
        if (this.connectionRetries >= this.maxRetries) {
            console.log('Max reconnection attempts reached, switching to polling');
            this.startPolling();
            return;
        }
        
        const delay = Math.pow(2, this.connectionRetries) * 1000; // Exponential backoff
        this.connectionRetries++;
        
        setTimeout(() => {
            console.log(`Attempting to reconnect... (${this.connectionRetries}/${this.maxRetries})`);
            this.setupWebSocket();
        }, delay);
    }

    // Cleanup
    destroy() {
        this.stopPolling();
        
        if (this.webSocket) {
            this.webSocket.close();
            this.webSocket = null;
        }
        
        console.log('🧹 Real-time monitor destroyed');
    }

    // Public methods for dashboard control
    pause() {
        this.stopPolling();
        if (this.webSocket) {
            this.webSocket.close();
        }
        console.log('⏸️ Real-time monitoring paused');
    }

    resume() {
        if (!this.isRunning) {
            this.setupWebSocket();
            if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
                this.startPolling();
            }
        }
        console.log('▶️ Real-time monitoring resumed');
    }

    // Get performance metrics
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            uptime: Date.now() - this.performanceMetrics.pageLoadTime,
            lastUpdate: this.lastUpdate
        };
    }
}

// Export for dashboard use
window.RealTimeMonitor = RealTimeMonitor;