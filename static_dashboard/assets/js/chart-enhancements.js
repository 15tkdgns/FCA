/**
 * Chart Enhancements - Advanced visual and interaction improvements
 * Provides enhanced chart styling, animations, and user experience features
 */

class ChartEnhancements {
    constructor() {
        this.initialized = false;
        this.init();
    }
    
    init() {
        this.initialized = true;
        console.log('✨ ChartEnhancements initialized');
        
        // Add event listeners for chart interactions
        this.setupChartInteractions();
        
        // Setup theme-aware chart updates
        this.setupThemeAwareness();
        
        // Add chart animation system
        this.setupChartAnimations();
    }
    
    /**
     * Enhanced chart configuration with modern styling
     */
    getEnhancedPlotlyConfig() {
        return {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: [
                'pan2d', 'lasso2d', 'select2d', 'autoScale2d',
                'hoverCompareCartesian', 'toggleSpikelines'
            ],
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png',
                filename: 'fca_chart',
                height: 600,
                width: 800,
                scale: 2
            },
            modeBarButtons: [[
                'zoom2d', 'zoomIn2d', 'zoomOut2d', 'resetScale2d',
                'downloadImage'
            ]],
            showTips: true,
            plotGlPixelRatio: 2
        };
    }
    
    /**
     * Enhanced layout configuration with modern design
     */
    getEnhancedLayout(baseLayout = {}) {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const isDark = currentTheme === 'dark';
        
        return {
            ...baseLayout,
            font: {
                family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                size: 12,
                color: isDark ? '#f7fafc' : '#5a5c69'
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            margin: { t: 60, r: 40, b: 60, l: 60, ...baseLayout.margin },
            autosize: true,
            showlegend: true,
            legend: {
                orientation: 'v',
                x: 1.05,
                y: 0.5,
                xanchor: 'left',
                yanchor: 'middle',
                bgcolor: 'rgba(255,255,255,0.9)',
                bordercolor: isDark ? '#4a5568' : '#e2e8f0',
                borderwidth: 1,
                font: {
                    size: 11,
                    color: isDark ? '#f7fafc' : '#5a5c69'
                },
                ...baseLayout.legend
            },
            title: {
                font: {
                    size: 18,
                    color: isDark ? '#f7fafc' : '#5a5c69',
                    family: "'Nunito', sans-serif"
                },
                x: 0.05,
                xanchor: 'left',
                ...baseLayout.title
            },
            xaxis: {
                gridcolor: isDark ? '#4a5568' : '#e3e6f0',
                gridwidth: 1,
                showgrid: true,
                zeroline: false,
                tickfont: {
                    color: isDark ? '#cbd5e0' : '#6e707e'
                },
                ...baseLayout.xaxis
            },
            yaxis: {
                gridcolor: isDark ? '#4a5568' : '#e3e6f0',
                gridwidth: 1,
                showgrid: true,
                zeroline: false,
                tickfont: {
                    color: isDark ? '#cbd5e0' : '#6e707e'
                },
                ...baseLayout.yaxis
            },
            hovermode: 'closest',
            dragmode: 'zoom',
            transitions: [
                {
                    duration: 500,
                    easing: 'cubic-in-out'
                }
            ]
        };
    }
    
    /**
     * Modern color palettes for charts
     */
    getColorPalettes() {
        return {
            primary: [
                '#667eea', '#764ba2', '#f093fb', '#f5576c',
                '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
            ],
            fraud: [
                '#e74a3b', '#f39c12', '#2ecc71', '#3498db',
                '#9b59b6', '#1abc9c', '#f1c40f', '#e67e22'
            ],
            sentiment: [
                '#2ecc71', '#95a5a6', '#e74a3b'  // Positive, Neutral, Negative
            ],
            segments: [
                '#667eea', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'
            ],
            gradient: {
                blue: ['#667eea', '#764ba2'],
                green: ['#2ecc71', '#27ae60'],
                red: ['#e74a3b', '#c0392b'],
                purple: ['#9b59b6', '#8e44ad']
            }
        };
    }
    
    /**
     * Apply enhanced styling to pie charts
     */
    enhancePieChart(trace, chartType = 'default') {
        const palettes = this.getColorPalettes();
        
        const enhanced = {
            ...trace,
            marker: {
                ...trace.marker,
                line: {
                    color: '#ffffff',
                    width: 3
                },
                colors: trace.marker?.colors || palettes[chartType] || palettes.primary
            },
            textfont: {
                size: 13,
                color: 'white',
                family: "'Nunito', sans-serif"
            },
            textinfo: 'label+percent',
            textposition: 'inside',
            insidetextorientation: 'radial',
            hoverinfo: 'label+value+percent',
            hoverlabel: {
                bgcolor: 'rgba(0,0,0,0.8)',
                bordercolor: 'white',
                font: {
                    color: 'white',
                    size: 12
                }
            }
        };
        
        return enhanced;
    }
    
    /**
     * Apply enhanced styling to bar charts
     */
    enhanceBarChart(trace, chartType = 'default') {
        const palettes = this.getColorPalettes();
        
        const enhanced = {
            ...trace,
            marker: {
                ...trace.marker,
                opacity: 0.85,
                line: {
                    color: 'rgba(255,255,255,0.8)',
                    width: 2
                },
                color: trace.marker?.color || palettes[chartType] || palettes.primary
            },
            textfont: {
                size: 11,
                color: 'white',
                family: "'Nunito', sans-serif"
            },
            hoverlabel: {
                bgcolor: 'rgba(0,0,0,0.8)',
                bordercolor: 'white',
                font: {
                    color: 'white',
                    size: 12
                }
            }
        };
        
        return enhanced;
    }
    
    /**
     * Setup chart interactions and click handlers
     */
    setupChartInteractions() {
        document.addEventListener('plotly_click', (event) => {
            const chartElement = event.target;
            const containerId = chartElement.id;
            
            // Add click feedback
            this.addClickFeedback(chartElement);
            
            // Log interaction for analytics
            console.log(`📊 Chart interaction: ${containerId}`, event.points);
        });
        
        document.addEventListener('plotly_hover', (event) => {
            const chartElement = event.target;
            
            // Add hover effects
            this.addHoverEffects(chartElement);
        });
        
        document.addEventListener('plotly_unhover', (event) => {
            const chartElement = event.target;
            
            // Remove hover effects
            this.removeHoverEffects(chartElement);
        });
    }
    
    /**
     * Add click feedback animation
     */
    addClickFeedback(chartElement) {
        const container = chartElement.closest('.chart-container');
        if (container) {
            container.style.transform = 'scale(0.98)';
            setTimeout(() => {
                container.style.transform = '';
            }, 150);
        }
    }
    
    /**
     * Add hover effects
     */
    addHoverEffects(chartElement) {
        const container = chartElement.closest('.chart-container');
        if (container) {
            container.setAttribute('data-interactive', 'true');
            container.style.borderColor = 'var(--primary-color)';
        }
    }
    
    /**
     * Remove hover effects
     */
    removeHoverEffects(chartElement) {
        const container = chartElement.closest('.chart-container');
        if (container) {
            container.style.borderColor = '';
        }
    }
    
    /**
     * Setup theme-aware chart updates
     */
    setupThemeAwareness() {
        // Listen for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    this.updateChartsForTheme();
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }
    
    /**
     * Update all charts when theme changes
     */
    updateChartsForTheme() {
        console.log('🎨 Updating charts for theme change...');
        
        const plotlyCharts = document.querySelectorAll('.plotly-graph-div');
        plotlyCharts.forEach((chart) => {
            try {
                if (chart.data && chart.layout) {
                    const enhancedLayout = this.getEnhancedLayout(chart.layout);
                    Plotly.relayout(chart, enhancedLayout);
                }
            } catch (error) {
                console.warn('⚠️ Failed to update chart theme:', error);
            }
        });
    }
    
    /**
     * Setup chart animations
     */
    setupChartAnimations() {
        // Intersection Observer for chart reveal animations
        const chartObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.animateChartReveal(entry.target);
                }
            });
        }, { threshold: 0.2 });
        
        // Observe all chart containers
        document.querySelectorAll('.chart-container').forEach((container) => {
            chartObserver.observe(container);
        });
    }
    
    /**
     * Animate chart reveal
     */
    animateChartReveal(container) {
        container.style.opacity = '0';
        container.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            container.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 100);
    }
    
    /**
     * Add loading spinner effect
     */
    addLoadingSpinner(containerId, message = 'Loading chart...') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="chart-loading">
                    <div class="chart-loading-spinner"></div>
                    <div class="chart-loading-text">${message}</div>
                </div>
            `;
        }
    }
    
    /**
     * Create enhanced chart with all improvements
     */
    async createEnhancedChart(containerId, traces, layout, chartType = 'default') {
        try {
            // Add loading spinner
            this.addLoadingSpinner(containerId, 'Creating chart...');
            
            // Wait a moment for visual feedback
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Get enhanced configuration
            const config = this.getEnhancedPlotlyConfig();
            const enhancedLayout = this.getEnhancedLayout(layout);
            
            // Enhance traces based on chart type
            const enhancedTraces = traces.map(trace => {
                if (trace.type === 'pie') {
                    return this.enhancePieChart(trace, chartType);
                } else if (trace.type === 'bar') {
                    return this.enhanceBarChart(trace, chartType);
                }
                return trace;
            });
            
            // Create the chart
            const container = document.getElementById(containerId);
            if (container) {
                await Plotly.newPlot(container, enhancedTraces, enhancedLayout, config);
                
                // Mark as interactive
                const chartContainer = container.closest('.chart-container');
                if (chartContainer) {
                    chartContainer.setAttribute('data-interactive', 'true');
                }
                
                console.log(`✨ Enhanced chart created: ${containerId}`);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error(`❌ Failed to create enhanced chart ${containerId}:`, error);
            return false;
        }
    }
}

// CSS for loading shimmer (inject into page)
const shimmerCSS = `
<style>
.chart-loading-shimmer {
    padding: 2rem;
    animation: fadeIn 0.3s ease-in;
}

.shimmer-line, .shimmer-bar {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
}

.shimmer-title {
    height: 20px;
    width: 60%;
    margin-bottom: 2rem;
}

.shimmer-chart {
    display: flex;
    align-items: end;
    gap: 1rem;
    height: 200px;
}

.shimmer-bar {
    flex: 1;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px 4px 0 0;
}

@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
</style>
`;

// Inject shimmer CSS
document.head.insertAdjacentHTML('beforeend', shimmerCSS);

// Make available globally
if (typeof window !== 'undefined') {
    window.ChartEnhancements = ChartEnhancements;
    window.chartEnhancements = new ChartEnhancements();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartEnhancements;
}