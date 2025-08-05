// FCA Static Web Dashboard - Page-specific Logic

class FCAPages {
    constructor() {
        this.currentPage = 'dashboard';
    }

    // Update page statistics
    updatePageStats(pageName, data) {
        switch (pageName) {
            case 'dashboard':
                this.updateDashboardStats(data);
                break;
            case 'fraud':
                this.updateFraudStats(data);
                break;
            case 'sentiment':
                this.updateSentimentStats(data);
                break;
            case 'attrition':
                this.updateAttritionStats(data);
                break;
        }
    }

    // Update dashboard statistics
    updateDashboardStats(data) {
        // This could include real-time updates, animations, etc.
        console.log('Dashboard stats updated');
    }

    // Update fraud detection statistics
    updateFraudStats(data) {
        // Add any fraud-specific interactions
        console.log('Fraud stats updated');
    }

    // Update sentiment analysis statistics
    updateSentimentStats(data) {
        // Add any sentiment-specific interactions
        console.log('Sentiment stats updated');
    }

    // Update attrition statistics
    updateAttritionStats(data) {
        // Add any attrition-specific interactions
        console.log('Attrition stats updated');
    }

    // Format number with commas
    formatNumber(num) {
        return num.toLocaleString();
    }

    // Format percentage
    formatPercentage(num, decimals = 1) {
        return `${num.toFixed(decimals)}%`;
    }

    // Generate random data for demo purposes
    generateRandomData(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Animate counter from 0 to target value
    animateCounter(elementId, targetValue, duration = 1000) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = 0;
        const increment = targetValue / (duration / 16);
        let currentValue = startValue;

        const updateCounter = () => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                element.textContent = this.formatNumber(targetValue);
            } else {
                element.textContent = this.formatNumber(Math.floor(currentValue));
                requestAnimationFrame(updateCounter);
            }
        };

        updateCounter();
    }

    // Show loading spinner
    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('page-content').style.display = 'none';
    }

    // Hide loading spinner
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('page-content').style.display = 'block';
    }

    // Show toast notification
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        // Add to page
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        toastContainer.appendChild(toast);

        // Show toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Remove after hiding
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Handle data refresh
    async refreshData() {
        this.showToast('Refreshing data...', 'info');
        
        // Simulate data refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.showToast('Data refreshed successfully!', 'success');
    }

    // Export data to CSV
    exportToCSV(data, filename) {
        const csvContent = this.convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, filename);
        } else {
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        this.showToast('Data exported successfully!', 'success');
    }

    // Convert object array to CSV
    convertToCSV(objArray) {
        const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
        let str = '';

        // Get headers
        const headers = Object.keys(array[0]);
        str += headers.join(',') + '\r\n';

        // Get data
        for (let i = 0; i < array.length; i++) {
            let line = '';
            for (let index in headers) {
                if (line !== '') line += ',';
                line += array[i][headers[index]];
            }
            str += line + '\r\n';
        }

        return str;
    }

    // Print current page
    printPage() {
        window.print();
    }

    // Toggle full screen mode
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // Scroll to top
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Add keyboard shortcuts
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R for refresh
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refreshData();
            }

            // Ctrl/Cmd + P for print
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                this.printPage();
            }

            // F11 for fullscreen
            if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
            }

            // Home key to scroll to top
            if (e.key === 'Home') {
                e.preventDefault();
                this.scrollToTop();
            }

            // Number keys for navigation
            if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey) {
                const pages = ['dashboard', 'fraud', 'sentiment', 'attrition', 'datasets', 'comparison'];
                const pageIndex = parseInt(e.key) - 1;
                if (pages[pageIndex] && window.dashboard) {
                    window.dashboard.showPage(pages[pageIndex]);
                    
                    // Update active nav link
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    const targetLink = document.querySelector(`[data-page="${pages[pageIndex]}"]`);
                    if (targetLink) targetLink.classList.add('active');
                }
            }
        });
    }

    // Initialize page enhancements
    init() {
        this.addKeyboardShortcuts();
        
        // Add scroll to top button
        this.addScrollToTopButton();
        
        // Add refresh button to header
        this.addRefreshButton();
        
        console.log('✅ Page enhancements initialized');
    }

    // Add scroll to top button
    addScrollToTopButton() {
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-arrow-up"></i>';
        button.className = 'btn btn-primary position-fixed';
        button.style.cssText = 'bottom: 20px; right: 20px; z-index: 1000; border-radius: 50%; width: 50px; height: 50px; display: none;';
        button.onclick = () => this.scrollToTop();
        
        document.body.appendChild(button);
        
        // Show/hide based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 100) {
                button.style.display = 'block';
            } else {
                button.style.display = 'none';
            }
        });
    }

    // Add refresh button to header
    addRefreshButton() {
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) {
            const refreshBtn = document.createElement('button');
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            refreshBtn.className = 'btn btn-outline-primary btn-sm position-absolute top-0 end-0 m-3';
            refreshBtn.onclick = () => this.refreshData();
            
            pageHeader.style.position = 'relative';
            pageHeader.appendChild(refreshBtn);
        }
    }
}

// Initialize page enhancements
document.addEventListener('DOMContentLoaded', () => {
    window.FCAPages = new FCAPages();
    window.FCAPages.init();
});