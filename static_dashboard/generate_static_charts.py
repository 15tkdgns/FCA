#!/usr/bin/env python3
"""
Static Chart Generator for FCA Dashboard
Generates static chart images as fallback for JavaScript charts
"""

import json
import os
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import plotly.offline as pyo
from datetime import datetime

class StaticChartGenerator:
    def __init__(self, data_dir="data", output_dir="assets/images/charts"):
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Load all data files
        self.data = {}
        self.load_data()
        
        print("📊 Static Chart Generator initialized")
        print(f"📁 Data directory: {self.data_dir}")
        print(f"🖼️ Output directory: {self.output_dir}")
    
    def load_data(self):
        """Load all JSON data files"""
        data_files = [
            'charts.json',
            'xai_data.json', 
            'summary.json',
            'fraud_data.json',
            'sentiment_data.json',
            'attrition_data.json',
            'datasets.json'
        ]
        
        for file in data_files:
            file_path = self.data_dir / file
            if file_path.exists():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        self.data[file.replace('.json', '')] = json.load(f)
                    print(f"✅ Loaded {file}")
                except Exception as e:
                    print(f"❌ Failed to load {file}: {e}")
            else:
                print(f"⚠️ File not found: {file}")
    
    def generate_model_comparison_chart(self):
        """Generate model performance comparison bar chart"""
        try:
            data = self.data['charts']['model_comparison']
            
            fig = go.Figure(data=[
                go.Bar(
                    x=data['labels'],
                    y=data['datasets'][0]['data'],
                    marker_color=['#e74a3b', '#36b9cc', '#f6c23e'],
                    text=[f"{val:.1%}" for val in data['datasets'][0]['data']],
                    textposition='auto',
                    hovertemplate='<b>%{x}</b><br>Performance: %{text}<extra></extra>'
                )
            ])
            
            fig.update_layout(
                title='Model Performance Comparison',
                xaxis_title='Models',
                yaxis_title='Performance Score',
                yaxis_tickformat='.1%',
                template='plotly_white',
                height=400,
                font=dict(family="Nunito, sans-serif", size=12)
            )
            
            output_path = self.output_dir / "model_comparison.png"
            fig.write_image(str(output_path), width=800, height=400, scale=2)
            print(f"✅ Generated: {output_path}")
            
        except Exception as e:
            print(f"❌ Error generating model comparison chart: {e}")
    
    def generate_fraud_distribution_chart(self):
        """Generate fraud risk distribution pie chart"""
        try:
            data = self.data['charts']['fraud_distribution']
            
            fig = go.Figure(data=[
                go.Pie(
                    labels=data['labels'],
                    values=data['data'],
                    marker_colors=data['backgroundColor'],
                    textinfo='percent',
                    textposition='inside',
                    hovertemplate='<b>%{label}</b><br>Cases: %{value:,}<br>Percentage: %{percent}<extra></extra>'
                )
            ])
            
            fig.update_layout(
                title='Fraud Risk Distribution',
                template='plotly_white',
                height=400,
                font=dict(family="Nunito, sans-serif", size=12),
                showlegend=True,
                legend=dict(orientation="v", x=1.05, y=0.5)
            )
            
            output_path = self.output_dir / "fraud_distribution.png"
            fig.write_image(str(output_path), width=800, height=400, scale=2)
            print(f"✅ Generated: {output_path}")
            
        except Exception as e:
            print(f"❌ Error generating fraud distribution chart: {e}")
    
    def generate_sentiment_distribution_chart(self):
        """Generate sentiment distribution pie chart"""
        try:
            data = self.data['charts']['sentiment_distribution']
            
            fig = go.Figure(data=[
                go.Pie(
                    labels=data['labels'],
                    values=data['data'],
                    marker_colors=data['backgroundColor'],
                    textinfo='percent',
                    textposition='inside',
                    hovertemplate='<b>%{label}</b><br>Proportion: %{percent}<extra></extra>'
                )
            ])
            
            fig.update_layout(
                title='Sentiment Distribution',
                template='plotly_white',
                height=400,
                font=dict(family="Nunito, sans-serif", size=12),
                showlegend=True,
                legend=dict(orientation="v", x=1.05, y=0.5)
            )
            
            output_path = self.output_dir / "sentiment_distribution.png"
            fig.write_image(str(output_path), width=800, height=400, scale=2)
            print(f"✅ Generated: {output_path}")
            
        except Exception as e:
            print(f"❌ Error generating sentiment distribution chart: {e}")
    
    def generate_customer_segments_chart(self):
        """Generate customer segments donut chart"""
        try:
            data = self.data['charts']['customer_segments']
            
            fig = go.Figure(data=[
                go.Pie(
                    labels=data['labels'],
                    values=data['data'],
                    hole=0.4,  # Makes it a donut chart
                    marker_colors=data['backgroundColor'],
                    textinfo='percent',
                    textposition='inside',
                    hovertemplate='<b>%{label}</b><br>Customers: %{value:,}<br>Percentage: %{percent}<extra></extra>'
                )
            ])
            
            fig.update_layout(
                title='Customer Segments',
                template='plotly_white',
                height=400,
                font=dict(family="Nunito, sans-serif", size=12),
                showlegend=True,
                legend=dict(orientation="v", x=1.05, y=0.5),
                annotations=[dict(text='Customer<br>Segments', x=0.5, y=0.5, 
                                font_size=12, showarrow=False)]
            )
            
            output_path = self.output_dir / "customer_segments.png"
            fig.write_image(str(output_path), width=800, height=400, scale=2)
            print(f"✅ Generated: {output_path}")
            
        except Exception as e:
            print(f"❌ Error generating customer segments chart: {e}")
    
    def generate_lime_explanation_chart(self):
        """Generate LIME explanation horizontal bar chart"""
        try:
            data = self.data['xai_data']['lime_explanations']['fraud_detection']['features']
            
            features = [f['name'] for f in data]
            impacts = [f['impact'] for f in data]
            colors = ['#dc3545' if impact > 0 else '#28a745' for impact in impacts]
            
            fig = go.Figure(data=[
                go.Bar(
                    x=impacts,
                    y=features,
                    orientation='h',
                    marker_color=colors,
                    text=[f"{impact:+.3f}" for impact in impacts],
                    textposition='auto',
                    hovertemplate='<b>%{y}</b><br>Impact: %{text}<extra></extra>'
                )
            ])
            
            fig.update_layout(
                title='LIME Local Explanation',
                xaxis_title='Feature Impact',
                yaxis_title='Features',
                template='plotly_white',
                height=400,
                font=dict(family="Nunito, sans-serif", size=12)
            )
            
            # Add vertical line at x=0
            fig.add_vline(x=0, line_width=2, line_color="black")
            
            output_path = self.output_dir / "lime_explanation.png"
            fig.write_image(str(output_path), width=800, height=400, scale=2)
            print(f"✅ Generated: {output_path}")
            
        except Exception as e:
            print(f"❌ Error generating LIME explanation chart: {e}")
    
    def generate_prediction_confidence_chart(self):
        """Generate prediction confidence distribution chart"""
        try:
            data = self.data['xai_data']['prediction_confidence']['fraud_detection']['confidence_distribution']
            
            fig = go.Figure(data=[
                go.Bar(
                    x=data['bins'],
                    y=data['counts'],
                    marker_color=data['colors'],
                    text=[f"{count:,}" for count in data['counts']],
                    textposition='auto',
                    hovertemplate='<b>%{x}</b><br>Predictions: %{y:,}<extra></extra>'
                )
            ])
            
            fig.update_layout(
                title='Prediction Confidence Distribution',
                xaxis_title='Confidence Range',
                yaxis_title='Number of Predictions',
                template='plotly_white',
                height=400,
                font=dict(family="Nunito, sans-serif", size=12)
            )
            
            output_path = self.output_dir / "prediction_confidence.png"
            fig.write_image(str(output_path), width=800, height=400, scale=2)
            print(f"✅ Generated: {output_path}")
            
        except Exception as e:
            print(f"❌ Error generating prediction confidence chart: {e}")
    
    def generate_feature_interaction_chart(self):
        """Generate feature interaction heatmap"""
        try:
            data = self.data['xai_data']['feature_interaction']['fraud_detection']['interaction_matrix']
            
            fig = go.Figure(data=go.Heatmap(
                z=data['values'],
                x=data['features'],
                y=data['features'],
                colorscale='RdBu',
                zmid=0,
                hovertemplate='<b>%{y} ↔ %{x}</b><br>Interaction: %{z:.3f}<extra></extra>'
            ))
            
            fig.update_layout(
                title='Feature Interaction Matrix',
                xaxis_title='Features',
                yaxis_title='Features',
                template='plotly_white',
                height=500,
                font=dict(family="Nunito, sans-serif", size=12)
            )
            
            output_path = self.output_dir / "feature_interaction.png"
            fig.write_image(str(output_path), width=600, height=500, scale=2)
            print(f"✅ Generated: {output_path}")
            
        except Exception as e:
            print(f"❌ Error generating feature interaction chart: {e}")
    
    def generate_training_process_chart(self):
        """Generate training process tracking chart"""
        try:
            data = self.data['xai_data']['training_process']['fraud_detection']['epochs']
            
            epochs = [d['epoch'] for d in data]
            train_loss = [d['train_loss'] for d in data]
            val_loss = [d['val_loss'] for d in data]
            train_acc = [d['train_acc'] for d in data]
            val_acc = [d['val_acc'] for d in data]
            
            # Create subplots with secondary y-axis
            fig = make_subplots(specs=[[{"secondary_y": True}]])
            
            # Add loss traces
            fig.add_trace(
                go.Scatter(x=epochs, y=train_loss, mode='lines+markers', 
                          name='Training Loss', line=dict(color='#dc3545', width=3)),
                secondary_y=False,
            )
            fig.add_trace(
                go.Scatter(x=epochs, y=val_loss, mode='lines+markers', 
                          name='Validation Loss', line=dict(color='#fd7e14', width=3)),
                secondary_y=False,
            )
            
            # Add accuracy traces
            fig.add_trace(
                go.Scatter(x=epochs, y=train_acc, mode='lines+markers', 
                          name='Training Accuracy', line=dict(color='#28a745', width=3)),
                secondary_y=True,
            )
            fig.add_trace(
                go.Scatter(x=epochs, y=val_acc, mode='lines+markers', 
                          name='Validation Accuracy', line=dict(color='#20c997', width=3)),
                secondary_y=True,
            )
            
            # Set y-axes titles
            fig.update_yaxes(title_text="Loss", secondary_y=False)
            fig.update_yaxes(title_text="Accuracy", secondary_y=True)
            
            fig.update_layout(
                title='Training Process Tracking',
                xaxis_title='Epoch',
                template='plotly_white',
                height=400,
                font=dict(family="Nunito, sans-serif", size=12),
                legend=dict(x=0.02, y=0.98, bgcolor='rgba(255,255,255,0.8)')
            )
            
            output_path = self.output_dir / "training_process.png"
            fig.write_image(str(output_path), width=800, height=400, scale=2)
            print(f"✅ Generated: {output_path}")
            
        except Exception as e:
            print(f"❌ Error generating training process chart: {e}")
    
    def generate_model_comparison_analysis_chart(self):
        """Generate detailed model comparison analysis"""
        try:
            data = self.data['xai_data']['model_comparison']['performance_metrics']
            
            fig = go.Figure()
            
            metrics = ['accuracy', 'precision', 'recall', 'f1_score']
            colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e']
            
            for i, metric in enumerate(metrics):
                fig.add_trace(go.Bar(
                    name=metric.replace('_', ' ').title(),
                    x=data['models'],
                    y=data[metric],
                    marker_color=colors[i],
                    opacity=0.8
                ))
            
            fig.update_layout(
                title='Model Performance Comparison Analysis',
                xaxis_title='Models',
                yaxis_title='Score',
                yaxis_tickformat='.1%',
                barmode='group',
                template='plotly_white',
                height=400,
                font=dict(family="Nunito, sans-serif", size=12),
                legend=dict(x=0.02, y=0.98, bgcolor='rgba(255,255,255,0.8)')
            )
            
            output_path = self.output_dir / "model_comparison_analysis.png"
            fig.write_image(str(output_path), width=800, height=400, scale=2)
            print(f"✅ Generated: {output_path}")
            
        except Exception as e:
            print(f"❌ Error generating model comparison analysis chart: {e}")
    
    def generate_feature_importance_chart(self):
        """Generate fraud feature importance chart"""
        try:
            data = self.data['charts']['feature_importance']['fraud']
            
            features = data['labels']
            values = data['data']
            colors = ['#dc3545' if v > 0.12 else '#ffc107' if v > 0.08 else '#28a745' for v in values]
            
            fig = go.Figure(data=[
                go.Bar(
                    x=values,
                    y=features,
                    orientation='h',
                    marker_color=colors,
                    text=[f"{val:.1%}" for val in values],
                    textposition='auto',
                    hovertemplate='<b>%{y}</b><br>Importance: %{text}<extra></extra>'
                )
            ])
            
            fig.update_layout(
                title='Fraud Detection - Feature Importance',
                xaxis_title='Importance Score',
                yaxis_title='Features',
                xaxis_tickformat='.1%',
                template='plotly_white',
                height=400,
                font=dict(family="Nunito, sans-serif", size=12)
            )
            
            output_path = self.output_dir / "fraud_feature_importance.png"
            fig.write_image(str(output_path), width=800, height=400, scale=2)
            print(f"✅ Generated: {output_path}")
            
        except Exception as e:
            print(f"❌ Error generating feature importance chart: {e}")
    
    def generate_all_charts(self):
        """Generate all static charts"""
        print("🚀 Starting static chart generation...")
        
        chart_generators = [
            self.generate_model_comparison_chart,
            self.generate_fraud_distribution_chart,
            self.generate_sentiment_distribution_chart,
            self.generate_customer_segments_chart,
            self.generate_lime_explanation_chart,
            self.generate_prediction_confidence_chart,
            self.generate_feature_interaction_chart,
            self.generate_training_process_chart,
            self.generate_model_comparison_analysis_chart,
            self.generate_feature_importance_chart
        ]
        
        success_count = 0
        for generator in chart_generators:
            try:
                generator()
                success_count += 1
            except Exception as e:
                print(f"❌ Error in {generator.__name__}: {e}")
        
        print(f"\n🎉 Chart generation complete: {success_count}/{len(chart_generators)} successful")
        return success_count
    
    def create_chart_index(self):
        """Create an index of generated charts"""
        chart_index = {
            "generated_at": datetime.now().isoformat(),
            "charts": {}
        }
        
        # Check which charts were generated
        chart_files = list(self.output_dir.glob("*.png"))
        
        for chart_file in chart_files:
            chart_name = chart_file.stem
            chart_index["charts"][chart_name] = {
                "filename": chart_file.name,
                "path": f"assets/images/charts/{chart_file.name}",
                "size": chart_file.stat().st_size,
                "modified": datetime.fromtimestamp(chart_file.stat().st_mtime).isoformat()
            }
        
        # Save index
        index_path = self.output_dir / "chart_index.json"
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(chart_index, f, indent=2, ensure_ascii=False)
        
        print(f"📋 Chart index saved: {index_path}")
        return chart_index

def main():
    """Main function"""
    print("📊 FCA Static Chart Generator")
    print("=" * 50)
    
    # Check if required packages are installed
    try:
        import kaleido
        print("✅ kaleido (for image export) is available")
    except ImportError:
        print("❌ kaleido is required for image export")
        print("   Install with: pip install kaleido")
        return 1
    
    # Initialize generator
    generator = StaticChartGenerator()
    
    # Generate all charts
    success_count = generator.generate_all_charts()
    
    # Create index
    index = generator.create_chart_index()
    
    print(f"\n📈 Generated {len(index['charts'])} chart images")
    print(f"📁 Output directory: {generator.output_dir}")
    
    # List generated files
    for name, info in index['charts'].items():
        size_kb = info['size'] / 1024
        print(f"   {name}.png ({size_kb:.1f} KB)")
    
    return 0 if success_count > 0 else 1

if __name__ == "__main__":
    sys.exit(main())