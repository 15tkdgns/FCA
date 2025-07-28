/**
 * Training Monitor Module
 * 모델 훈련 모니터링
 */
import { BaseModule } from '../core/BaseModule.js';

export class TrainingMonitor extends BaseModule {
    constructor() {
        super('TrainingMonitor', ['APIClient']);
        this.activeTrainingJobs = new Map();
        this.trainingHistory = [];
    }

    async onInitialize() {
        this.logger.info('Training monitor initializing...');
        
        // Set up training job monitoring
        this.setupTrainingMonitoring();
    }

    setupTrainingMonitoring() {
        // Monitor training jobs
        this.monitoringInterval = setInterval(() => {
            this.checkTrainingJobs();
        }, 10000); // Check every 10 seconds
        
        this.logger.info('Training monitoring started');
    }

    async onDestroy() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
    }

    async checkTrainingJobs() {
        try {
            // Simulate checking training jobs
            const jobs = await this.fetchTrainingJobs();
            this.updateTrainingStatus(jobs);
        } catch (error) {
            this.logger.error('Failed to check training jobs:', error);
        }
    }

    async fetchTrainingJobs() {
        // Mock training jobs data
        return [
            {
                id: 'job_001',
                name: 'Fraud Detection Model v2.1',
                status: 'running',
                progress: 75,
                eta: '5 minutes',
                metrics: {
                    accuracy: 0.94,
                    loss: 0.12
                }
            },
            {
                id: 'job_002',
                name: 'Sentiment Analysis BERT',
                status: 'completed',
                progress: 100,
                metrics: {
                    accuracy: 0.96,
                    f1_score: 0.95
                }
            }
        ];
    }

    updateTrainingStatus(jobs) {
        jobs.forEach(job => {
            this.activeTrainingJobs.set(job.id, job);
        });
        
        // Update UI if available
        this.updateTrainingUI();
    }

    updateTrainingUI() {
        // Update training status in the UI
        const trainingContainer = document.getElementById('training-status');
        if (trainingContainer) {
            this.renderTrainingJobs(trainingContainer);
        }
    }

    renderTrainingJobs(container) {
        container.innerHTML = '';
        
        if (this.activeTrainingJobs.size === 0) {
            container.innerHTML = '<p>No active training jobs</p>';
            return;
        }
        
        this.activeTrainingJobs.forEach(job => {
            const jobElement = this.createElement('div', { className: 'training-job' });
            jobElement.innerHTML = `
                <div class="job-header">
                    <h4>${job.name}</h4>
                    <span class="job-status ${job.status}">${job.status.toUpperCase()}</span>
                </div>
                <div class="job-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${job.progress}%"></div>
                    </div>
                    <span class="progress-text">${job.progress}%</span>
                </div>
                ${job.eta ? `<div class="job-eta">ETA: ${job.eta}</div>` : ''}
                <div class="job-metrics">
                    ${Object.entries(job.metrics || {}).map(([key, value]) => 
                        `<span class="metric">${key}: ${value}</span>`
                    ).join(' | ')}
                </div>
            `;
            
            container.appendChild(jobElement);
        });
    }

    // Training management methods
    async startTraining(config) {
        try {
            this.logger.info('Starting training job:', config);
            
            // Simulate starting a training job
            const jobId = `job_${Date.now()}`;
            const job = {
                id: jobId,
                name: config.name || 'Unnamed Training Job',
                status: 'starting',
                progress: 0,
                startTime: new Date(),
                config
            };
            
            this.activeTrainingJobs.set(jobId, job);
            this.updateTrainingUI();
            
            return jobId;
            
        } catch (error) {
            this.logger.error('Failed to start training:', error);
            throw error;
        }
    }

    async stopTraining(jobId) {
        try {
            this.logger.info('Stopping training job:', jobId);
            
            const job = this.activeTrainingJobs.get(jobId);
            if (job) {
                job.status = 'stopped';
                job.endTime = new Date();
                this.updateTrainingUI();
            }
            
        } catch (error) {
            this.logger.error('Failed to stop training:', error);
            throw error;
        }
    }

    getTrainingJob(jobId) {
        return this.activeTrainingJobs.get(jobId);
    }

    getAllTrainingJobs() {
        return Array.from(this.activeTrainingJobs.values());
    }

    // Public API
    getStatus() {
        return {
            activeJobs: this.activeTrainingJobs.size,
            runningJobs: Array.from(this.activeTrainingJobs.values())
                .filter(job => job.status === 'running').length,
            totalJobs: this.trainingHistory.length
        };
    }
}

export default TrainingMonitor;