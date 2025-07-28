/**
 * Real Time Monitor Module
 * 실시간 데이터 모니터링
 */
import { BaseModule } from '../core/BaseModule.js';

export class RealTimeMonitor extends BaseModule {
    constructor() {
        super('RealTimeMonitor', ['APIClient']);
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.websocket = null;
    }

    async onInitialize() {
        this.logger.info('Real-time monitor initializing...');
        
        // Initialize WebSocket connection if available
        await this.initializeWebSocket();
        
        // Start monitoring
        this.startMonitoring();
    }

    async onDestroy() {
        this.stopMonitoring();
        
        if (this.websocket) {
            this.websocket.close();
        }
    }

    async initializeWebSocket() {
        try {
            // WebSocket connection for real-time updates
            const wsUrl = 'ws://localhost:5000/ws';
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                this.logger.info('WebSocket connected');
            };
            
            this.websocket.onmessage = (event) => {
                this.handleRealtimeData(JSON.parse(event.data));
            };
            
            this.websocket.onerror = (error) => {
                this.logger.warn('WebSocket error:', error);
            };
            
            this.websocket.onclose = () => {
                this.logger.info('WebSocket disconnected');
            };
            
        } catch (error) {
            this.logger.warn('WebSocket initialization failed:', error);
        }
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.updateMetrics();
        }, 5000); // Update every 5 seconds
        
        this.logger.info('Real-time monitoring started');
    }

    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this.logger.info('Real-time monitoring stopped');
    }

    updateMetrics() {
        // Update real-time metrics display
        this.updateSystemStatus();
        this.updatePerformanceMetrics();
    }

    updateSystemStatus() {
        const statusElement = document.getElementById('system-status');
        if (statusElement) {
            const isOnline = this.websocket?.readyState === WebSocket.OPEN;
            statusElement.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
        }
    }

    updatePerformanceMetrics() {
        // Update various performance indicators
        const liveIndicator = document.querySelector('.live-indicator .live-dot');
        if (liveIndicator) {
            liveIndicator.style.animation = 'pulse 2s infinite';
        }
    }

    handleRealtimeData(data) {
        this.logger.debug('Real-time data received:', data);
        
        // Handle different types of real-time data
        switch (data.type) {
            case 'metrics_update':
                this.handleMetricsUpdate(data.payload);
                break;
            case 'alert':
                this.handleAlert(data.payload);
                break;
            default:
                this.logger.debug('Unknown real-time data type:', data.type);
        }
    }

    handleMetricsUpdate(metrics) {
        // Update dashboard metrics in real-time
        Object.entries(metrics).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = value;
                element.classList.add('updated');
                setTimeout(() => element.classList.remove('updated'), 500);
            }
        });
    }

    handleAlert(alert) {
        // Show real-time alerts
        this.logger.warn('Real-time alert:', alert);
        
        if (window.dashboard && typeof window.dashboard.showNotification === 'function') {
            window.dashboard.showNotification(alert.message, alert.type || 'warning');
        }
    }

    // Public API
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            websocketConnected: this.websocket?.readyState === WebSocket.OPEN,
            lastUpdate: new Date().toISOString()
        };
    }
}

export default RealTimeMonitor;