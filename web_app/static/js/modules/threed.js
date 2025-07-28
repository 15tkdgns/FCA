// 3D Visualization Module
// Handles 3D scatter plots, surface plots, and other 3D visualizations

window.ThreeDModule = {
    loadAll() {
        console.log('🎯 Loading 3D visualizations...');
        this.create3DScatterPlot();
        this.create3DSurfacePlot();
    },

    create3DScatterPlot() {
        // Generate sample 3D scatter data
        const n = 200;
        const data = [];
        
        // Create two clusters for demonstration
        for (let i = 0; i < n; i++) {
            const cluster = Math.random() > 0.7 ? 1 : 0;
            const baseX = cluster ? 30 : 10;
            const baseY = cluster ? 25 : 15;
            const baseZ = cluster ? 40 : 20;
            
            data.push({
                x: baseX + (Math.random() - 0.5) * 20,
                y: baseY + (Math.random() - 0.5) * 15,
                z: baseZ + (Math.random() - 0.5) * 25,
                category: cluster ? 'High Risk' : 'Normal',
                size: Math.random() * 10 + 5
            });
        }
        
        const normalPoints = data.filter(d => d.category === 'Normal');
        const riskPoints = data.filter(d => d.category === 'High Risk');
        
        const traces = [
            {
                x: normalPoints.map(d => d.x),
                y: normalPoints.map(d => d.y),
                z: normalPoints.map(d => d.z),
                mode: 'markers',
                type: 'scatter3d',
                name: 'Normal',
                marker: {
                    size: normalPoints.map(d => d.size),
                    color: '#2563eb',
                    opacity: 0.6,
                    line: {
                        color: '#1d4ed8',
                        width: 1
                    }
                },
                hovertemplate: '<b>Normal Transaction</b><br>X: %{x:.1f}<br>Y: %{y:.1f}<br>Z: %{z:.1f}<extra></extra>'
            },
            {
                x: riskPoints.map(d => d.x),
                y: riskPoints.map(d => d.y),
                z: riskPoints.map(d => d.z),
                mode: 'markers',
                type: 'scatter3d',
                name: 'High Risk',
                marker: {
                    size: riskPoints.map(d => d.size),
                    color: '#dc2626',
                    opacity: 0.8,
                    line: {
                        color: '#b91c1c',
                        width: 1
                    }
                },
                hovertemplate: '<b>High Risk Transaction</b><br>X: %{x:.1f}<br>Y: %{y:.1f}<br>Z: %{z:.1f}<extra></extra>'
            }
        ];
        
        const layout = {
            title: '3D Scatter Plot - Transaction Risk Analysis',
            template: 'plotly_white',
            height: 500,
            scene: {
                xaxis: {title: 'Transaction Amount'},
                yaxis: {title: 'Account Age (months)'},
                zaxis: {title: 'Risk Score'},
                camera: {
                    eye: {x: 1.5, y: 1.5, z: 1.5}
                }
            },
            margin: {l: 0, r: 0, t: 50, b: 0},
            showlegend: true
        };
        
        Plotly.newPlot('scatter-3d-chart', traces, layout, {
            responsive: true,
            displayModeBar: false
        });
    },

    create3DSurfacePlot() {
        // Generate sample surface data
        const size = 30;
        const x = Array.from({length: size}, (_, i) => i);
        const y = Array.from({length: size}, (_, i) => i);
        const z = [];
        
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                // Create a surface with peaks and valleys
                const value = Math.sin(i * 0.3) * Math.cos(j * 0.3) * 10 + 
                             Math.exp(-((i-15)**2 + (j-15)**2) / 100) * 20 +
                             Math.random() * 2;
                row.push(value);
            }
            z.push(row);
        }
        
        const trace = {
            x: x,
            y: y,
            z: z,
            type: 'surface',
            colorscale: 'Viridis',
            hovertemplate: '<b>Surface Plot</b><br>X: %{x}<br>Y: %{y}<br>Z: %{z:.2f}<extra></extra>',
            colorbar: {
                title: 'Risk Level',
                titleside: 'right'
            }
        };
        
        const layout = {
            title: '3D Surface Plot - Risk Landscape',
            template: 'plotly_white',
            height: 500,
            scene: {
                xaxis: {title: 'Feature X'},
                yaxis: {title: 'Feature Y'},
                zaxis: {title: 'Risk Surface'},
                camera: {
                    eye: {x: 1.25, y: 1.25, z: 1.25}
                }
            },
            margin: {l: 0, r: 0, t: 50, b: 0}
        };
        
        Plotly.newPlot('surface-3d-chart', [trace], layout, {
            responsive: true,
            displayModeBar: false
        });
    }
};