"""
차트 생성 모듈
==============

FCA 프로젝트의 모든 차트 및 시각화 생성 기능을 담당합니다.
- Plotly를 사용한 인터랙티브 차트 생성
- 도메인별 전용 차트 (사기 탐지, 감정 분석, 고객 이탈)
- 모델 비교 차트
"""

import json
import plotly
import plotly.graph_objs as go
import plotly.express as px
from ..data import load_fraud_data, load_sentiment_data, load_attrition_data


class ChartGenerator:
    """차트 생성을 담당하는 클래스"""
    
    def __init__(self):
        """ChartGenerator 초기화"""
        self.default_layout = {
            'template': 'plotly_white',
            'font': {'family': 'Inter, sans-serif'},
            'margin': {'l': 40, 'r': 40, 't': 60, 'b': 40}
        }
    
    def create_fraud_distribution_chart(self):
        """사기 탐지 분포 차트 생성"""
        fraud_data = load_fraud_data()
        
        fig = go.Figure()
        
        normal_count = fraud_data['total_transactions'] - fraud_data['fraud_transactions']
        fraud_count = fraud_data['fraud_transactions']
        
        fig.add_trace(go.Bar(
            x=['Normal Transactions', 'Fraudulent Transactions'],
            y=[normal_count, fraud_count],
            name='Transaction Count',
            marker_color=['#3b82f6', '#ef4444'],
            text=[f"{normal_count:,}", f"{fraud_count:,}"],
            textposition='auto',
            hovertemplate='<b>%{x}</b><br>Count: %{y:,}<extra></extra>'
        ))
        
        fig.update_layout(
            title={
                'text': 'Credit Card Transaction Distribution',
                'x': 0.5,
                'font': {'size': 18, 'weight': 'bold'}
            },
            xaxis_title='Transaction Type',
            yaxis_title='Count',
            height=400,
            showlegend=False,
            **self.default_layout
        )
        
        return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
    
    def create_fraud_performance_chart(self):
        """사기 탐지 성능 차트 생성"""
        fraud_data = load_fraud_data()
        
        fig = go.Figure()
        
        metrics = ['Accuracy', 'Precision', 'Recall', 'F1-Score']
        values = [
            fraud_data['accuracy'], 
            fraud_data['precision'], 
            fraud_data['recall'], 
            fraud_data['f1_score']
        ]
        colors = ['#3b82f6', '#10b981', '#f59e0b', '#06b6d4']
        
        fig.add_trace(go.Bar(
            x=metrics,
            y=values,
            marker_color=colors,
            text=[f"{v:.1f}%" for v in values],
            textposition='auto',
            hovertemplate='<b>%{x}</b><br>Score: %{y:.1f}%<extra></extra>'
        ))
        
        fig.update_layout(
            title={
                'text': 'Fraud Detection Model Performance',
                'x': 0.5,
                'font': {'size': 18, 'weight': 'bold'}
            },
            yaxis_title='Performance (%)',
            height=400,
            showlegend=False,
            yaxis={'range': [0, 100]},
            **self.default_layout
        )
        
        return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
    
    def create_sentiment_chart(self):
        """감정 분석 파이 차트 생성"""
        sentiment_data = load_sentiment_data()
        
        fig = go.Figure()
        
        labels = ['Positive', 'Neutral', 'Negative']
        values = [
            sentiment_data['positive'], 
            sentiment_data['neutral'], 
            sentiment_data['negative']
        ]
        colors = ['#10b981', '#64748b', '#ef4444']
        
        fig.add_trace(go.Pie(
            labels=labels,
            values=values,
            marker_colors=colors,
            hole=0.4,
            textinfo='label+percent',
            textfont_size=12,
            hovertemplate='<b>%{label}</b><br>Count: %{value:,}<br>Percentage: %{percent}<extra></extra>'
        ))
        
        fig.update_layout(
            title={
                'text': 'Financial News Sentiment Distribution',
                'x': 0.5,
                'font': {'size': 18, 'weight': 'bold'}
            },
            height=400,
            annotations=[{
                'text': f'Total<br>{sentiment_data["total_sentences"]:,}',
                'x': 0.5, 'y': 0.5,
                'font_size': 16,
                'showarrow': False
            }],
            **self.default_layout
        )
        
        return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
    
    def create_attrition_chart(self):
        """고객 이탈률 차트 생성"""
        # 나이대별 이탈률 샘플 데이터
        age_groups = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+']
        churn_rates = [15.2, 18.7, 22.1, 25.3, 19.8, 12.4]
        
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            x=age_groups,
            y=churn_rates,
            name='Churn Rate (%)',
            marker_color='#f59e0b',
            text=[f"{rate:.1f}%" for rate in churn_rates],
            textposition='auto',
            hovertemplate='<b>Age Group: %{x}</b><br>Churn Rate: %{y:.1f}%<extra></extra>'
        ))
        
        fig.update_layout(
            title={
                'text': 'Customer Churn Rate by Age Group',
                'x': 0.5,
                'font': {'size': 18, 'weight': 'bold'}
            },
            xaxis_title='Age Group',
            yaxis_title='Churn Rate (%)',
            height=400,
            showlegend=False,
            yaxis={'range': [0, 30]},
            **self.default_layout
        )
        
        return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
    
    def create_model_comparison_chart(self):
        """모델 성능 비교 차트 생성"""
        fig = go.Figure()
        
        models = ['Random Forest', 'XGBoost', 'Logistic Regression', 'Neural Network']
        
        # 도메인별 성능 데이터
        domains = {
            'Fraud Detection': {'values': [99.91, 99.89, 99.12, 99.85], 'color': '#3b82f6'},
            'Sentiment Analysis': {'values': [87.3, 85.9, 82.1, 88.7], 'color': '#10b981'},
            'Customer Attrition': {'values': [89.4, 91.2, 85.7, 90.1], 'color': '#f59e0b'}
        }
        
        for domain, data in domains.items():
            fig.add_trace(go.Bar(
                name=domain,
                x=models,
                y=data['values'],
                marker_color=data['color'],
                hovertemplate=f'<b>{domain}</b><br>Model: %{{x}}<br>Accuracy: %{{y:.1f}}%<extra></extra>'
            ))
        
        fig.update_layout(
            title={
                'text': 'Model Performance Comparison Across Domains',
                'x': 0.5,
                'font': {'size': 18, 'weight': 'bold'}
            },
            xaxis_title='Models',
            yaxis_title='Accuracy (%)',
            barmode='group',
            height=500,
            yaxis={'range': [75, 100]},
            legend={'orientation': 'h', 'y': -0.2},
            **self.default_layout
        )
        
        return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
    
    def create_dataset_overview_chart(self):
        """데이터셋 개요 차트 생성"""
        fraud_data = load_fraud_data()
        sentiment_data = load_sentiment_data()
        attrition_data = load_attrition_data()
        
        fig = go.Figure()
        
        datasets = ['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition']
        record_counts = [
            fraud_data['total_transactions'],
            sentiment_data['total_sentences'],
            attrition_data['total_customers']
        ]
        accuracies = [
            fraud_data['accuracy'],
            sentiment_data['accuracy'],
            attrition_data['accuracy']
        ]
        
        # 레코드 수 막대 차트
        fig.add_trace(go.Bar(
            name='Record Count',
            x=datasets,
            y=record_counts,
            yaxis='y',
            marker_color='#3b82f6',
            hovertemplate='<b>%{x}</b><br>Records: %{y:,}<extra></extra>'
        ))
        
        # 정확도 라인 차트 (보조 Y축)
        fig.add_trace(go.Scatter(
            name='Accuracy (%)',
            x=datasets,
            y=accuracies,
            yaxis='y2',
            mode='lines+markers',
            line={'color': '#ef4444', 'width': 3},
            marker={'size': 8},
            hovertemplate='<b>%{x}</b><br>Accuracy: %{y:.1f}%<extra></extra>'
        ))
        
        fig.update_layout(
            title={
                'text': 'Dataset Overview: Records vs Accuracy',
                'x': 0.5,
                'font': {'size': 18, 'weight': 'bold'}
            },
            xaxis_title='Datasets',
            yaxis={'title': 'Record Count', 'side': 'left'},
            yaxis2={'title': 'Accuracy (%)', 'side': 'right', 'overlaying': 'y', 'range': [80, 100]},
            height=400,
            legend={'orientation': 'h', 'y': -0.2},
            **self.default_layout
        )
        
        return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)


# 전역 차트 생성기 인스턴스
chart_generator = ChartGenerator()


# 편의 함수들
def create_fraud_distribution_chart():
    """사기 탐지 분포 차트 생성 (편의 함수)"""
    return chart_generator.create_fraud_distribution_chart()


def create_fraud_performance_chart():
    """사기 탐지 성능 차트 생성 (편의 함수)"""
    return chart_generator.create_fraud_performance_chart()


def create_sentiment_chart():
    """감정 분석 차트 생성 (편의 함수)"""
    return chart_generator.create_sentiment_chart()


def create_attrition_chart():
    """고객 이탈 차트 생성 (편의 함수)"""
    return chart_generator.create_attrition_chart()


def create_model_comparison_chart():
    """모델 비교 차트 생성 (편의 함수)"""
    return chart_generator.create_model_comparison_chart()


def create_dataset_overview_chart():
    """데이터셋 개요 차트 생성 (편의 함수)"""
    return chart_generator.create_dataset_overview_chart()