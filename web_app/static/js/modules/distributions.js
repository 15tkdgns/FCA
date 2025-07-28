// Distribution Visualization Module
// Handles violin plots, box plots, ridgeline plots, and feature distributions

window.DistributionModule = {
    loadAll() {
        console.log('📈 Loading distribution visualizations...');
        this.createViolinPlot();
        this.createBoxPlot();
        this.createRidgelinePlot();
        this.createFeatureDistributionHeatmap();
    },

    createViolinPlot() {
        // Sample data for violin plot
        const categories = ['Group A', 'Group B', 'Group C'];
        const data = [];
        
        categories.forEach(category => {
            const values = Array.from({length: 100}, () => 
                Math.random() * 20 + Math.sin(Math.random() * 10) * 5 + 15
            );
            
            data.push({
                type: 'violin',
                y: values,
                name: category,
                box: {visible: true},
                meanline: {visible: true},
                fillcolor: ['#2563eb', '#059669', '#d97706'][categories.indexOf(category)],
                opacity: 0.6
            });
        });
        
        const layout = {
            title: 'Violin Plot - Data Distribution by Category',
            template: 'plotly_white',
            height: 400,
            yaxis: {title: 'Values'},
            showlegend: true
        };
        
        Plotly.newPlot('violin-plot-chart', data, layout, {
            responsive: true,
            displayModeBar: false
        });
    },

    createBoxPlot() {
        // Sample data for box plot
        const categories = ['Low Risk', 'Medium Risk', 'High Risk'];
        const data = [];
        
        categories.forEach((category, idx) => {
            const values = Array.from({length: 50}, () => 
                Math.random() * 30 + idx * 20 + Math.random() * 10
            );
            
            data.push({
                type: 'box',
                y: values,
                name: category,
                marker: {color: ['#059669', '#d97706', '#dc2626'][idx]},
                boxpoints: 'outliers'
            });
        });
        
        const layout = {
            title: 'Box Plot - Risk Score Distribution',
            template: 'plotly_white',
            height: 400,
            yaxis: {title: 'Risk Score'},
            showlegend: true
        };
        
        Plotly.newPlot('box-plot-chart', data, layout, {
            responsive: true,
            displayModeBar: false
        });
    },

    createRidgelinePlot() {
        // Sample ridgeline plot (using violin plots oriented horizontally)
        const categories = ['Category 1', 'Category 2', 'Category 3', 'Category 4'];
        const data = [];
        
        categories.forEach((category, idx) => {
            const values = Array.from({length: 100}, () => 
                Math.random() * 15 + Math.sin(idx) * 3 + idx * 5
            );
            
            data.push({
                type: 'violin',
                x: values,
                y: Array(100).fill(category),
                name: category,
                orientation: 'h',
                side: 'positive',
                fillcolor: `hsl(${idx * 90}, 70%, 60%)`,
                opacity: 0.7,
                line: {color: `hsl(${idx * 90}, 70%, 40%)`},
                showlegend: false
            });
        });
        
        const layout = {
            title: 'Ridgeline Plot - Multiple Distribution Comparison',
            template: 'plotly_white',
            height: 400,
            xaxis: {title: 'Values'},
            yaxis: {title: 'Categories'},
            showlegend: false
        };
        
        Plotly.newPlot('ridgeline-plot-chart', data, layout, {
            responsive: true,
            displayModeBar: false
        });
    },

    createFeatureDistributionHeatmap() {
        // Sample feature distribution data
        const features = ['Feature A', 'Feature B', 'Feature C', 'Feature D', 'Feature E'];
        const bins = 20;
        const distributionData = [];
        
        for (let i = 0; i < features.length; i++) {
            const row = [];
            for (let j = 0; j < bins; j++) {
                // Create different distribution shapes for each feature
                const x = j / bins;
                let value;
                switch (i % 3) {
                    case 0: // Normal distribution
                        value = Math.exp(-Math.pow(x - 0.5, 2) / 0.1);
                        break;
                    case 1: // Exponential distribution
                        value = Math.exp(-x * 3);
                        break;
                    case 2: // Bimodal distribution
                        value = Math.exp(-Math.pow(x - 0.3, 2) / 0.05) + 
                               Math.exp(-Math.pow(x - 0.7, 2) / 0.05);
                        break;
                }
                row.push(value + Math.random() * 0.1);
            }
            distributionData.push(row);
        }
        
        const trace = {
            z: distributionData,
            x: Array.from({length: bins}, (_, i) => `Bin ${i+1}`),
            y: features,
            type: 'heatmap',
            colorscale: 'Plasma',
            hovertemplate: '<b>%{y}</b><br>Bin: %{x}<br>Density: %{z:.3f}<extra></extra>',
            colorbar: {title: 'Density', titleside: 'right'}
        };
        
        const layout = {
            title: 'Feature Distribution Heatmap',
            template: 'plotly_white',
            height: 400,
            margin: {l: 100, r: 100, t: 80, b: 80},
            xaxis: {title: 'Value Bins'},
            yaxis: {title: 'Features'}
        };
        
        Plotly.newPlot('feature-distribution-chart', [trace], layout, {
            responsive: true,
            displayModeBar: false
        });
    }
};