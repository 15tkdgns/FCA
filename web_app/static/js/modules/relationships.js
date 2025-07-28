// Relationship Visualization Module
// Handles scatter plot matrices and parallel coordinates

window.RelationshipModule = {
    loadAll() {
        console.log('🔗 Loading relationship visualizations...');
        this.createScatterPlotMatrix();
        this.createParallelCoordinates();
    },

    createScatterPlotMatrix() {
        // Generate sample data for scatter plot matrix
        const n = 200;
        const features = ['Feature A', 'Feature B', 'Feature C', 'Feature D'];
        
        // Generate correlated data
        const data = [];
        for (let i = 0; i < n; i++) {
            const base = Math.random();
            data.push({
                'Feature A': base + Math.random() * 0.3,
                'Feature B': base * 0.8 + Math.random() * 0.4,
                'Feature C': (1 - base) * 0.6 + Math.random() * 0.3,
                'Feature D': Math.random(),
                'Category': Math.random() > 0.5 ? 'Type 1' : 'Type 2'
            });
        }
        
        const traces = [];
        
        // Create scatter matrix (simplified version)
        for (let i = 0; i < features.length; i++) {
            for (let j = 0; j < features.length; j++) {
                if (i !== j) {
                    const trace = {
                        x: data.map(d => d[features[j]]),
                        y: data.map(d => d[features[i]]),
                        mode: 'markers',
                        type: 'scatter',
                        marker: {
                            size: 4,
                            color: data.map(d => d.Category === 'Type 1' ? '#2563eb' : '#dc2626'),
                            opacity: 0.6
                        },
                        showlegend: false,
                        name: `${features[i]} vs ${features[j]}`,
                        hovertemplate: `<b>${features[j]}: %{x:.3f}<br>${features[i]}: %{y:.3f}</b><extra></extra>`
                    };
                    traces.push(trace);
                }
            }
        }
        
        // Use first trace for demo
        const layout = {
            title: 'Feature Relationships - Scatter Plot',
            template: 'plotly_white',
            height: 400,
            xaxis: {title: 'Feature A'},
            yaxis: {title: 'Feature B'},
            showlegend: false
        };
        
        Plotly.newPlot('scatter-matrix-chart', [traces[0]], layout, {
            responsive: true,
            displayModeBar: false
        });
    },

    createParallelCoordinates() {
        // Sample data for parallel coordinates
        const n = 100;
        const data = [];
        
        for (let i = 0; i < n; i++) {
            const type = Math.random() > 0.6 ? 'High Risk' : 'Low Risk';
            const multiplier = type === 'High Risk' ? 1.5 : 0.8;
            
            data.push({
                'Amount': Math.random() * 1000 * multiplier,
                'Balance': Math.random() * 5000 * multiplier,
                'Age': Math.random() * 50 + 20,
                'Risk Score': Math.random() * 100 * multiplier,
                'Frequency': Math.random() * 20 * multiplier,
                'Category': type
            });
        }
        
        const dimensions = [
            {
                label: 'Amount',
                values: data.map(d => d['Amount']),
                range: [0, Math.max(...data.map(d => d['Amount']))]
            },
            {
                label: 'Balance',
                values: data.map(d => d['Balance']),
                range: [0, Math.max(...data.map(d => d['Balance']))]
            },
            {
                label: 'Age',
                values: data.map(d => d['Age']),
                range: [20, 70]
            },
            {
                label: 'Risk Score',
                values: data.map(d => d['Risk Score']),
                range: [0, 100]
            },
            {
                label: 'Frequency',
                values: data.map(d => d['Frequency']),
                range: [0, Math.max(...data.map(d => d['Frequency']))]
            }
        ];
        
        const trace = {
            type: 'parcoords',
            line: {
                color: data.map(d => d.Category === 'High Risk' ? 1 : 0),
                colorscale: [[0, '#2563eb'], [1, '#dc2626']],
                showscale: true,
                colorbar: {
                    title: 'Risk Level',
                    tickvals: [0, 1],
                    ticktext: ['Low Risk', 'High Risk']
                }
            },
            dimensions: dimensions
        };
        
        const layout = {
            title: 'Parallel Coordinates - Multi-dimensional Analysis',
            template: 'plotly_white',
            height: 400,
            margin: {l: 100, r: 100, t: 80, b: 80}
        };
        
        Plotly.newPlot('parallel-coordinates-chart', [trace], layout, {
            responsive: true,
            displayModeBar: false
        });
    }
};