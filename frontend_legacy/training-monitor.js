// Training Monitor System
class TrainingMonitor {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.isTraining = false;
        this.currentTrainingSession = null;
        this.trainingHistory = [];
        this.progressCallbacks = new Map();
        
        this.init();
    }

    init() {
        this.setupTrainingControls();
        this.setupProgressTracking();
        this.loadTrainingHistory();
    }

    // Setup training control buttons
    setupTrainingControls() {
        const startBtn = document.getElementById('start-training-btn');
        const stopBtn = document.getElementById('stop-training-btn');
        const retrainBtn = document.querySelector('.btn-retrain');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startTraining());
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopTraining());
        }

        if (retrainBtn) {
            retrainBtn.addEventListener('click', () => this.retrainAllModels());
        }
    }

    // Setup progress tracking
    setupProgressTracking() {
        this.progressElements = {
            overall: document.querySelector('.progress-circle'),
            currentStep: document.querySelector('.current-step'),
            estimatedTime: document.querySelector('.estimated-time'),
            bestAccuracy: document.querySelector('.best-accuracy')
        };

        this.modelProgress = {
            'random_forest': {
                progressBar: document.getElementById('rf-progress-fill'),
                status: document.getElementById('rf-status'),
                accuracy: document.getElementById('rf-accuracy'),
                time: document.getElementById('rf-time'),
                progressText: document.getElementById('rf-progress-text')
            },
            'gradient_boosting': {
                progressBar: document.getElementById('gb-progress-fill'),
                status: document.getElementById('gb-status'),
                accuracy: document.getElementById('gb-accuracy'),
                time: document.getElementById('gb-time'),
                progressText: document.getElementById('gb-progress-text')
            },
            'lstm': {
                progressBar: document.getElementById('lstm-progress-fill'),
                status: document.getElementById('lstm-status'),
                accuracy: document.getElementById('lstm-accuracy'),
                time: document.getElementById('lstm-time'),
                progressText: document.getElementById('lstm-progress-text')
            }
        };
    }

    // Start training process
    async startTraining() {
        if (this.isTraining) {
            console.warn('Training already in progress');
            return;
        }

        try {
            this.isTraining = true;
            this.updateTrainingStatus('starting');
            
            // Get training configuration
            const config = this.getTrainingConfig();
            
            // Create new training session
            this.currentTrainingSession = {
                id: Date.now(),
                startTime: new Date(),
                config: config,
                models: [],
                status: 'running'
            };

            // Start training API call
            const response = await this.dashboard.apiClient.makeRequest('/api/training/start', {
                method: 'POST',
                body: JSON.stringify(config)
            });

            if (response.status === 'success') {
                this.dashboard.showNotification('Training started successfully', 'success');
                this.startProgressMonitoring();
            } else {
                throw new Error(response.error || 'Failed to start training');
            }

        } catch (error) {
            console.error('Training start failed:', error);
            this.dashboard.showNotification(`Training failed to start: ${error.message}`, 'error');
            this.isTraining = false;
            this.updateTrainingStatus('error');
        }
    }

    // Stop training process
    async stopTraining() {
        if (!this.isTraining) {
            console.warn('No training in progress');
            return;
        }

        try {
            const response = await this.dashboard.apiClient.makeRequest('/api/training/stop', {
                method: 'POST'
            });

            if (response.status === 'success') {
                this.dashboard.showNotification('Training stopped', 'info');
            }

            this.isTraining = false;
            this.updateTrainingStatus('stopped');
            
            if (this.currentTrainingSession) {
                this.currentTrainingSession.status = 'stopped';
                this.currentTrainingSession.endTime = new Date();
            }

        } catch (error) {
            console.error('Training stop failed:', error);
            this.dashboard.showNotification(`Failed to stop training: ${error.message}`, 'error');
        }
    }

    // Retrain all models
    async retrainAllModels() {
        const confirmed = confirm('This will retrain all models. Are you sure?');
        if (!confirmed) return;

        try {
            this.dashboard.showNotification('Starting model retraining...', 'info');
            
            const response = await this.dashboard.apiClient.makeRequest('/api/training/retrain-all', {
                method: 'POST'
            });

            if (response.status === 'success') {
                this.dashboard.showNotification('Model retraining started', 'success');
                this.startTraining();
            } else {
                throw new Error(response.error || 'Failed to start retraining');
            }

        } catch (error) {
            console.error('Retraining failed:', error);
            this.dashboard.showNotification(`Retraining failed: ${error.message}`, 'error');
        }
    }

    // Get training configuration from form
    getTrainingConfig() {
        const modelCheckboxes = {
            random_forest: document.getElementById('model-rf')?.checked || false,
            gradient_boosting: document.getElementById('model-gb')?.checked || false,
            lstm: document.getElementById('model-lstm')?.checked || false
        };

        const trainingMode = document.getElementById('training-mode')?.value || 'full';
        const startDate = document.getElementById('start-date')?.value || '2024-01-01';
        const endDate = document.getElementById('end-date')?.value || '2024-12-31';

        return {
            models: Object.entries(modelCheckboxes)
                .filter(([model, enabled]) => enabled)
                .map(([model]) => model),
            mode: trainingMode,
            dateRange: {
                start: startDate,
                end: endDate
            }
        };
    }

    // Start progress monitoring
    startProgressMonitoring() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        this.progressInterval = setInterval(async () => {
            if (!this.isTraining) {
                clearInterval(this.progressInterval);
                return;
            }

            try {
                const progress = await this.dashboard.apiClient.makeRequest('/api/training/progress');
                if (progress.status === 'success') {
                    this.updateProgress(progress.data);
                }
            } catch (error) {
                console.error('Progress monitoring error:', error);
            }
        }, 2000); // Check every 2 seconds
    }

    // Update progress displays
    updateProgress(progressData) {
        // Update overall progress
        this.updateOverallProgress(progressData.overall);
        
        // Update individual model progress
        Object.entries(progressData.models || {}).forEach(([modelName, modelData]) => {
            this.updateModelProgress(modelName, modelData);
        });

        // Update training log
        if (progressData.logs && progressData.logs.length > 0) {
            this.updateTrainingLog(progressData.logs);
        }

        // Check if training completed
        if (progressData.overall.status === 'completed') {
            this.handleTrainingCompletion(progressData);
        }
    }

    // Update overall progress
    updateOverallProgress(overallData) {
        if (this.progressElements.overall) {
            const percentage = overallData.percentage || 0;
            const progressCircle = this.progressElements.overall;
            
            progressCircle.setAttribute('data-percent', percentage);
            const valueElement = progressCircle.querySelector('.progress-value');
            if (valueElement) {
                valueElement.textContent = `${percentage}%`;
            }
        }

        if (this.progressElements.currentStep) {
            this.progressElements.currentStep.textContent = overallData.currentStep || 'Processing...';
        }

        if (this.progressElements.estimatedTime) {
            this.progressElements.estimatedTime.textContent = overallData.estimatedTime || '--:--';
        }

        if (this.progressElements.bestAccuracy) {
            this.progressElements.bestAccuracy.textContent = overallData.bestAccuracy || '--';
        }
    }

    // Update individual model progress
    updateModelProgress(modelName, modelData) {
        const elements = this.modelProgress[modelName];
        if (!elements) return;

        // Update progress bar
        if (elements.progressBar) {
            elements.progressBar.style.width = `${modelData.progress || 0}%`;
        }

        // Update status
        if (elements.status) {
            elements.status.textContent = modelData.status || 'Pending';
            elements.status.className = `model-status ${(modelData.status || 'pending').toLowerCase()}`;
        }

        // Update accuracy
        if (elements.accuracy && modelData.accuracy) {
            elements.accuracy.textContent = `${(modelData.accuracy * 100).toFixed(1)}%`;
        }

        // Update time
        if (elements.time && modelData.timeElapsed) {
            elements.time.textContent = this.formatTime(modelData.timeElapsed);
        }

        // Update progress text
        if (elements.progressText) {
            elements.progressText.textContent = modelData.progressText || '';
        }

        // Add completion animation
        if (modelData.status === 'completed') {
            const modelElement = document.getElementById(`${modelName.replace('_', '-')}-progress`);
            if (modelElement) {
                modelElement.classList.add('completed');
            }
        }
    }

    // Update training log
    updateTrainingLog(logs) {
        const logContainer = document.getElementById('training-log');
        if (!logContainer) return;

        logs.forEach(logEntry => {
            const logElement = document.createElement('div');
            logElement.className = `log-entry ${logEntry.level}`;
            logElement.innerHTML = `
                <span class="log-time">${new Date(logEntry.timestamp).toLocaleTimeString()}</span>
                <span class="log-level">${logEntry.level.toUpperCase()}</span>
                <span class="log-message">${logEntry.message}</span>
            `;

            // Add to top of log
            logContainer.insertBefore(logElement, logContainer.firstChild);

            // Remove old entries (keep last 100)
            const entries = logContainer.querySelectorAll('.log-entry');
            if (entries.length > 100) {
                entries[entries.length - 1].remove();
            }
        });

        // Auto-scroll if user is at bottom
        if (logContainer.scrollTop + logContainer.clientHeight >= logContainer.scrollHeight - 10) {
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }

    // Handle training completion
    handleTrainingCompletion(progressData) {
        this.isTraining = false;
        this.updateTrainingStatus('completed');

        if (this.currentTrainingSession) {
            this.currentTrainingSession.status = 'completed';
            this.currentTrainingSession.endTime = new Date();
            this.currentTrainingSession.results = progressData.results;
            
            // Save to history
            this.trainingHistory.push({ ...this.currentTrainingSession });
            this.saveTrainingHistory();
        }

        // Show completion notification
        const bestAccuracy = progressData.overall.bestAccuracy;
        this.dashboard.showNotification(
            `Training completed! Best accuracy: ${bestAccuracy}`,
            'success'
        );

        // Update dashboard with new results
        this.dashboard.apiClient.refreshCache();
        this.dashboard.loadDashboardData();

        // Generate training report
        this.generateTrainingReport(progressData);
    }

    // Update training status UI
    updateTrainingStatus(status) {
        const startBtn = document.getElementById('start-training-btn');
        const stopBtn = document.getElementById('stop-training-btn');
        const statusIndicator = document.getElementById('training-indicator');
        const statusText = document.getElementById('training-status-text');

        switch (status) {
            case 'starting':
            case 'running':
                if (startBtn) startBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = false;
                if (statusIndicator) statusIndicator.textContent = '🔄';
                if (statusText) statusText.textContent = 'Training in Progress';
                break;
                
            case 'stopped':
            case 'error':
            case 'completed':
                if (startBtn) startBtn.disabled = false;
                if (stopBtn) stopBtn.disabled = true;
                if (statusIndicator) {
                    statusIndicator.textContent = status === 'completed' ? '✅' : 
                                                 status === 'error' ? '❌' : '⏹️';
                }
                if (statusText) {
                    statusText.textContent = status === 'completed' ? 'Training Completed' :
                                           status === 'error' ? 'Training Error' :
                                           'Ready to Train';
                }
                break;
        }
    }

    // Generate training report
    generateTrainingReport(progressData) {
        const report = {
            sessionId: this.currentTrainingSession?.id,
            timestamp: new Date().toISOString(),
            duration: this.currentTrainingSession ? 
                     this.currentTrainingSession.endTime - this.currentTrainingSession.startTime : 0,
            models: progressData.results || {},
            summary: {
                totalModels: Object.keys(progressData.results || {}).length,
                bestAccuracy: progressData.overall.bestAccuracy,
                averageAccuracy: this.calculateAverageAccuracy(progressData.results),
                successRate: this.calculateSuccessRate(progressData.results)
            }
        };

        // Save report
        this.saveTrainingReport(report);

        // Display report link
        this.displayReportLink(report);
    }

    // Utility methods
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    calculateAverageAccuracy(results) {
        const accuracies = Object.values(results).map(r => r.accuracy).filter(Boolean);
        return accuracies.length > 0 ? 
               accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length : 0;
    }

    calculateSuccessRate(results) {
        const total = Object.keys(results).length;
        const successful = Object.values(results).filter(r => r.status === 'completed').length;
        return total > 0 ? successful / total : 0;
    }

    // Storage methods
    saveTrainingHistory() {
        try {
            localStorage.setItem('fca_training_history', JSON.stringify(this.trainingHistory));
        } catch (error) {
            console.error('Failed to save training history:', error);
        }
    }

    loadTrainingHistory() {
        try {
            const stored = localStorage.getItem('fca_training_history');
            if (stored) {
                this.trainingHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load training history:', error);
            this.trainingHistory = [];
        }
    }

    saveTrainingReport(report) {
        try {
            const reports = JSON.parse(localStorage.getItem('fca_training_reports') || '[]');
            reports.push(report);
            
            // Keep only last 50 reports
            if (reports.length > 50) {
                reports.splice(0, reports.length - 50);
            }
            
            localStorage.setItem('fca_training_reports', JSON.stringify(reports));
        } catch (error) {
            console.error('Failed to save training report:', error);
        }
    }

    displayReportLink(report) {
        const reportLink = document.createElement('div');
        reportLink.className = 'training-report-link';
        reportLink.innerHTML = `
            <div class="report-notification">
                <i class="fas fa-file-alt"></i>
                <span>Training report generated</span>
                <button onclick="window.dashboard?.trainingMonitor?.downloadReport('${report.sessionId}')" class="btn btn-small">
                    Download Report
                </button>
            </div>
        `;

        // Add to page temporarily
        document.body.appendChild(reportLink);
        
        // Remove after 10 seconds
        setTimeout(() => {
            if (reportLink.parentNode) {
                reportLink.parentNode.removeChild(reportLink);
            }
        }, 10000);
    }

    downloadReport(sessionId) {
        const reports = JSON.parse(localStorage.getItem('fca_training_reports') || '[]');
        const report = reports.find(r => r.sessionId == sessionId);
        
        if (report) {
            const blob = new Blob([JSON.stringify(report, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `training-report-${sessionId}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    // Public API
    getTrainingHistory() {
        return this.trainingHistory;
    }

    getCurrentSession() {
        return this.currentTrainingSession;
    }

    isCurrentlyTraining() {
        return this.isTraining;
    }

    // Cleanup
    destroy() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        console.log('🧹 Training monitor destroyed');
    }
}

// Export for dashboard use
window.TrainingMonitor = TrainingMonitor;