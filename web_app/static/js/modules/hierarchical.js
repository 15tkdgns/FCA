// Hierarchical Visualization Module
// Handles sunburst charts, treemaps, and other hierarchical visualizations

window.HierarchicalModule = {
    loadAll() {
        console.log('🌳 Loading hierarchical visualizations...');
        this.createSunburstChart();
        this.createTreemapChart();
    },

    createSunburstChart() {
        // Sample hierarchical data
        const trace = {
            type: 'sunburst',
            labels: [
                'Total Transactions', 
                'Online', 'In-Store', 'ATM',
                'Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'Check', 'Withdrawal', 'Deposit'
            ],
            parents: [
                '', 
                'Total Transactions', 'Total Transactions', 'Total Transactions',
                'Online', 'Online', 'Online', 'In-Store', 'In-Store', 'ATM', 'ATM'
            ],
            values: [
                100, 
                45, 35, 20,
                25, 15, 5, 20, 15, 12, 8
            ],
            hovertemplate: '<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percentParent}<extra></extra>',
            maxdepth: 3,
            branchvalues: 'total'
        };
        
        const layout = {
            title: 'Transaction Hierarchy - Sunburst Chart',
            template: 'plotly_white',
            height: 400,
            margin: {l: 50, r: 50, t: 80, b: 50}
        };
        
        Plotly.newPlot('sunburst-chart', [trace], layout, {
            responsive: true,
            displayModeBar: false
        });
    },

    createTreemapChart() {
        // Sample treemap data
        const trace = {
            type: 'treemap',
            labels: [
                'Financial Services',
                'Fraud Detection', 'Risk Assessment', 'Customer Analytics',
                'Transaction Monitoring', 'Behavioral Analysis', 'Credit Scoring', 'Portfolio Analysis',
                'Churn Prediction', 'Segmentation'
            ],
            parents: [
                '',
                'Financial Services', 'Financial Services', 'Financial Services',
                'Fraud Detection', 'Fraud Detection', 'Risk Assessment', 'Risk Assessment',
                'Customer Analytics', 'Customer Analytics'
            ],
            values: [
                100,
                40, 35, 25,
                20, 20, 20, 15,
                15, 10
            ],
            textinfo: 'label+value+percent parent',
            texttemplate: '<b>%{label}</b><br>%{value}<br>%{percentParent}',
            hovertemplate: '<b>%{label}</b><br>Value: %{value}<br>Percentage: %{percentParent}<extra></extra>',
            pathbar: {visible: true},
            colorscale: 'Blues'
        };
        
        const layout = {
            title: 'Business Areas - Treemap Visualization',
            template: 'plotly_white',
            height: 400,
            margin: {l: 50, r: 50, t: 80, b: 50}
        };
        
        Plotly.newPlot('treemap-chart', [trace], layout, {
            responsive: true,
            displayModeBar: false
        });
    }
};