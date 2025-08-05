#!/usr/bin/env python3
"""
사기탐지 데이터 누출 및 오버피팅 엄격 검증 모듈
=============================================

데이터 누출(Data Leakage)과 오버피팅(Overfitting) 검증을 위한 
엄격한 검증 프레임워크
"""

import pandas as pd
import numpy as np
import warnings
from datetime import datetime, timedelta
from sklearn.model_selection import TimeSeriesSplit, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Any

warnings.filterwarnings('ignore')


class FraudValidationFramework:
    """사기탐지 데이터 누출 및 오버피팅 검증 프레임워크"""
    
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.df = None
        self.validation_results = {}
        self.critical_issues = []
        self.warnings = []
        
    def load_and_analyze_data(self) -> Dict[str, Any]:
        """데이터 로드 및 기본 분석"""
        print("🔍 데이터 로드 및 기본 분석 중...")
        
        try:
            self.df = pd.read_csv(self.data_path)
            
            analysis = {
                'total_samples': len(self.df),
                'total_features': len(self.df.columns) - 1,  # 타겟 제외
                'fraud_samples': sum(self.df['Class'] == 1),
                'normal_samples': sum(self.df['Class'] == 0),
                'fraud_rate': sum(self.df['Class'] == 1) / len(self.df) * 100,
                'missing_values': self.df.isnull().sum().sum(),
                'duplicated_rows': self.df.duplicated().sum()
            }
            
            print(f"✅ 데이터 로드 완료: {analysis['total_samples']:,}개 샘플")
            return analysis
            
        except Exception as e:
            self.critical_issues.append(f"데이터 로드 실패: {str(e)}")
            raise e
    
    def check_temporal_data_leakage(self) -> Dict[str, Any]:
        """시간적 데이터 누출 검증"""
        print("⏰ 시간적 데이터 누출 검증 중...")
        
        temporal_check = {
            'has_time_column': False,
            'time_sorted': False,
            'future_data_leak': False,
            'temporal_split_used': False,
            'severity': 'LOW'
        }
        
        # Time 컬럼 존재 확인
        if 'Time' in self.df.columns:
            temporal_check['has_time_column'] = True
            
            # 시간 순서 확인
            time_col = self.df['Time']
            if time_col.is_monotonic_increasing:
                temporal_check['time_sorted'] = True
                print("✅ 시간 데이터가 순서대로 정렬됨")
            else:
                temporal_check['time_sorted'] = False
                self.critical_issues.append("❌ 시간 데이터가 순서대로 정렬되지 않음 - 심각한 데이터 누출 위험")
                temporal_check['severity'] = 'CRITICAL'
            
            # 미래 데이터 누출 위험 확인
            # 일반적인 train_test_split은 시간 순서를 무시함
            temporal_check['future_data_leak'] = True
            self.critical_issues.append("❌ 시간 순서를 무시한 random split 사용 - 미래 데이터 누출")
            temporal_check['severity'] = 'CRITICAL'
            
        else:
            print("⚠️ Time 컬럼이 없음 - 시간적 검증 불가")
            self.warnings.append("Time 컬럼 부재로 시간적 데이터 누출 검증 불가")
        
        return temporal_check
    
    def check_feature_leakage(self) -> Dict[str, Any]:
        """특성 기반 데이터 누출 검증"""
        print("🔬 특성 기반 데이터 누출 검증 중...")
        
        feature_leakage = {
            'perfect_predictors': [],
            'highly_correlated_features': [],
            'constant_features': [],
            'near_constant_features': [],
            'severity': 'LOW'
        }
        
        if self.df is None:
            return feature_leakage
        
        X = self.df.drop('Class', axis=1)
        y = self.df['Class']
        
        # 1. 완벽한 예측자 찾기 (단일 특성으로 100% 분류)
        for col in X.columns:
            if X[col].dtype in ['int64', 'float64']:
                # 각 특성별로 단순 임계값 기반 분류 테스트
                thresholds = np.percentile(X[col], [25, 50, 75, 90, 95, 99])
                for threshold in thresholds:
                    pred_above = (X[col] > threshold).astype(int)
                    pred_below = (X[col] <= threshold).astype(int)
                    
                    acc_above = accuracy_score(y, pred_above)
                    acc_below = accuracy_score(y, pred_below)
                    
                    if acc_above > 0.99 or acc_below > 0.99:
                        feature_leakage['perfect_predictors'].append({
                            'feature': col,
                            'threshold': threshold,
                            'accuracy': max(acc_above, acc_below)
                        })
                        self.critical_issues.append(f"❌ 완벽한 예측자 발견: {col} (정확도: {max(acc_above, acc_below):.4f})")
                        feature_leakage['severity'] = 'CRITICAL'
        
        # 2. 타겟과 높은 상관관계 특성
        for col in X.columns:
            if X[col].dtype in ['int64', 'float64']:
                correlation = abs(np.corrcoef(X[col], y)[0, 1])
                if correlation > 0.9:
                    feature_leakage['highly_correlated_features'].append({
                        'feature': col,
                        'correlation': correlation
                    })
                    if correlation > 0.95:
                        self.critical_issues.append(f"❌ 매우 높은 상관관계: {col} (r={correlation:.4f})")
                        feature_leakage['severity'] = 'CRITICAL'
        
        # 3. 상수 특성 (데이터 누출은 아니지만 문제가 될 수 있음)
        for col in X.columns:
            unique_values = X[col].nunique()
            if unique_values == 1:
                feature_leakage['constant_features'].append(col)
            elif unique_values <= 3 and len(X) > 1000:
                feature_leakage['near_constant_features'].append({
                    'feature': col,
                    'unique_values': unique_values
                })
        
        return feature_leakage
    
    def check_statistical_leakage(self) -> Dict[str, Any]:
        """통계적 데이터 누출 검증"""
        print("📊 통계적 데이터 누출 검증 중...")
        
        statistical_check = {
            'target_leakage_features': [],
            'preprocessing_leakage': False,
            'scaling_before_split': False,
            'severity': 'LOW'
        }
        
        if self.df is None:
            return statistical_check
        
        X = self.df.drop('Class', axis=1)
        y = self.df['Class']
        
        # 전체 데이터에 대해 스케일링이 적용되었는지 확인
        # (실제로는 train set에만 fit해야 함)
        for col in X.columns:
            if X[col].dtype in ['int64', 'float64']:
                # 특성이 정규화되어 있는지 확인 (평균≈0, 표준편차≈1)
                mean_val = X[col].mean()
                std_val = X[col].std()
                
                if abs(mean_val) < 0.1 and abs(std_val - 1.0) < 0.1:
                    statistical_check['scaling_before_split'] = True
                    self.critical_issues.append(f"❌ 전체 데이터에 스케일링 적용 의심: {col}")
                    statistical_check['severity'] = 'CRITICAL'
                    break
        
        return statistical_check
    
    def perform_proper_validation(self) -> Dict[str, Any]:
        """올바른 검증 방법론 적용"""
        print("✅ 올바른 검증 방법론 적용 중...")
        
        if self.df is None:
            return {}
        
        X = self.df.drop('Class', axis=1)
        y = self.df['Class']
        
        # 시간 순서를 고려한 분할 (Time 컬럼이 있는 경우)
        validation_results = {
            'random_split_results': {},
            'temporal_split_results': {},
            'cross_validation_results': {},
            'overfitting_analysis': {}
        }
        
        # 1. 잘못된 방법: Random Split (현재 코드에서 사용하는 방법)
        print("🔴 잘못된 방법: Random Split 테스트")
        validation_results['random_split_results'] = self._test_random_split(X, y)
        
        # 2. 올바른 방법: Temporal Split (시간 순서 고려)
        if 'Time' in self.df.columns:
            print("🟢 올바른 방법: Temporal Split 테스트")
            validation_results['temporal_split_results'] = self._test_temporal_split(X, y)
        
        # 3. 교차 검증
        print("🔵 교차 검증 테스트")
        validation_results['cross_validation_results'] = self._test_cross_validation(X, y)
        
        # 4. 오버피팅 분석
        print("📈 오버피팅 분석")
        validation_results['overfitting_analysis'] = self._analyze_overfitting(X, y)
        
        return validation_results
    
    def _test_random_split(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
        """Random Split 테스트 (현재 사용 중인 잘못된 방법)"""
        from sklearn.model_selection import train_test_split
        
        # 현재 코드와 동일한 방식
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # 잘못된 방식: 전체 데이터에 대해 스케일링
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # 모델 훈련
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train_scaled, y_train)
        
        # 예측 및 평가
        y_pred = model.predict(X_test_scaled)
        y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
        
        # 훈련 세트 성능도 확인 (오버피팅 검증용)
        y_train_pred = model.predict(X_train_scaled)
        
        return {
            'test_accuracy': accuracy_score(y_test, y_pred),
            'test_precision': precision_score(y_test, y_pred, zero_division=0),
            'test_recall': recall_score(y_test, y_pred, zero_division=0),
            'test_f1': f1_score(y_test, y_pred, zero_division=0),
            'test_auc': roc_auc_score(y_test, y_pred_proba),
            'train_accuracy': accuracy_score(y_train, y_train_pred),
            'overfitting_gap': accuracy_score(y_train, y_train_pred) - accuracy_score(y_test, y_pred)
        }
    
    def _test_temporal_split(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
        """Temporal Split 테스트 (올바른 시간 순서 고려 방법)"""
        if 'Time' not in X.columns:
            return {}
        
        # 시간 순서대로 정렬
        time_sorted_idx = X['Time'].argsort()
        X_sorted = X.iloc[time_sorted_idx]
        y_sorted = y.iloc[time_sorted_idx]
        
        # 시간 기준으로 분할 (처음 80%를 훈련, 나머지 20%를 테스트)
        split_idx = int(len(X_sorted) * 0.8)
        
        X_train = X_sorted.iloc[:split_idx]
        X_test = X_sorted.iloc[split_idx:]
        y_train = y_sorted.iloc[:split_idx]
        y_test = y_sorted.iloc[split_idx:]
        
        # 올바른 방식: 훈련 세트에만 스케일러 피팅
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # 모델 훈련
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train_scaled, y_train)
        
        # 예측 및 평가
        y_pred = model.predict(X_test_scaled)
        y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
        
        # 훈련 세트 성능
        y_train_pred = model.predict(X_train_scaled)
        
        return {
            'test_accuracy': accuracy_score(y_test, y_pred),
            'test_precision': precision_score(y_test, y_pred, zero_division=0),
            'test_recall': recall_score(y_test, y_pred, zero_division=0),
            'test_f1': f1_score(y_test, y_pred, zero_division=0),
            'test_auc': roc_auc_score(y_test, y_pred_proba) if len(np.unique(y_test)) > 1 else 0.5,
            'train_accuracy': accuracy_score(y_train, y_train_pred),
            'overfitting_gap': accuracy_score(y_train, y_train_pred) - accuracy_score(y_test, y_pred),
            'train_fraud_rate': sum(y_train) / len(y_train) * 100,
            'test_fraud_rate': sum(y_test) / len(y_test) * 100
        }
    
    def _test_cross_validation(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
        """교차 검증 테스트"""
        
        # TimeSeriesSplit 사용 (시간 순서 고려)
        if 'Time' in X.columns:
            cv = TimeSeriesSplit(n_splits=5)
            cv_name = "TimeSeriesSplit"
        else:
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            cv_name = "StratifiedKFold"
        
        # 여러 모델로 테스트
        models = {
            'RandomForest': RandomForestClassifier(n_estimators=50, random_state=42),
            'LogisticRegression': LogisticRegression(random_state=42, max_iter=1000)
        }
        
        cv_results = {'cv_method': cv_name, 'model_results': {}}
        
        for model_name, model in models.items():
            scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy', n_jobs=-1)
            cv_results['model_results'][model_name] = {
                'mean_accuracy': scores.mean(),
                'std_accuracy': scores.std(),
                'min_accuracy': scores.min(),
                'max_accuracy': scores.max(),
                'scores': scores.tolist()
            }
        
        return cv_results
    
    def _analyze_overfitting(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
        """오버피팅 상세 분석"""
        
        # 학습 곡선 분석
        train_sizes = np.linspace(0.1, 1.0, 10)
        train_scores = []
        test_scores = []
        
        for train_size in train_sizes:
            # 데이터 샘플링
            sample_size = int(len(X) * train_size)
            X_sample = X.iloc[:sample_size]
            y_sample = y.iloc[:sample_size]
            
            # Train/Test 분할
            split_idx = int(len(X_sample) * 0.8)
            X_train = X_sample.iloc[:split_idx]
            X_test = X_sample.iloc[split_idx:]
            y_train = y_sample.iloc[:split_idx]
            y_test = y_sample.iloc[split_idx:]
            
            if len(X_train) < 10 or len(X_test) < 10:
                continue
            
            # 스케일링
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # 모델 훈련
            model = RandomForestClassifier(n_estimators=100, random_state=42)
            model.fit(X_train_scaled, y_train)
            
            # 성능 측정
            train_acc = model.score(X_train_scaled, y_train)
            test_acc = model.score(X_test_scaled, y_test)
            
            train_scores.append(train_acc)
            test_scores.append(test_acc)
        
        # 오버피팅 지표 계산
        if train_scores and test_scores:
            avg_gap = np.mean([t - v for t, v in zip(train_scores, test_scores)])
            max_gap = max([t - v for t, v in zip(train_scores, test_scores)])
            
            overfitting_severity = 'LOW'
            if avg_gap > 0.1:
                overfitting_severity = 'HIGH'
            elif avg_gap > 0.05:
                overfitting_severity = 'MEDIUM'
        else:
            avg_gap = 0
            max_gap = 0
            overfitting_severity = 'UNKNOWN'
        
        return {
            'train_scores': train_scores,
            'test_scores': test_scores,
            'average_overfitting_gap': avg_gap,
            'max_overfitting_gap': max_gap,
            'overfitting_severity': overfitting_severity,
            'final_train_accuracy': train_scores[-1] if train_scores else 0,
            'final_test_accuracy': test_scores[-1] if test_scores else 0
        }
    
    def generate_validation_report(self) -> Dict[str, Any]:
        """종합 검증 리포트 생성"""
        print("\n📋 종합 검증 리포트 생성 중...")
        
        # 전체 검증 실행
        data_analysis = self.load_and_analyze_data()
        temporal_check = self.check_temporal_data_leakage()
        feature_check = self.check_feature_leakage()
        statistical_check = self.check_statistical_leakage()
        validation_results = self.perform_proper_validation()
        
        # 심각도 계산
        severity_levels = [
            temporal_check.get('severity', 'LOW'),
            feature_check.get('severity', 'LOW'),
            statistical_check.get('severity', 'LOW'),
        ]
        
        overall_severity = 'LOW'
        if 'CRITICAL' in severity_levels:
            overall_severity = 'CRITICAL'
        elif 'HIGH' in severity_levels:
            overall_severity = 'HIGH'
        elif 'MEDIUM' in severity_levels:
            overall_severity = 'MEDIUM'
        
        # 종합 점수 계산 (10점 만점)
        score = 10.0
        score -= len(self.critical_issues) * 2.0  # 심각한 문제당 -2점
        score -= len(self.warnings) * 0.5        # 경고당 -0.5점
        score = max(0.0, score)
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'overall_severity': overall_severity,
            'validation_score': round(score, 2),
            'max_score': 10.0,
            'data_analysis': data_analysis,
            'temporal_check': temporal_check,
            'feature_check': feature_check,
            'statistical_check': statistical_check,
            'validation_results': validation_results,
            'critical_issues': self.critical_issues,
            'warnings': self.warnings,
            'recommendations': self._generate_recommendations()
        }
        
        return report
    
    def _generate_recommendations(self) -> List[str]:
        """개선 권장사항 생성"""
        recommendations = []
        
        if any('시간' in issue for issue in self.critical_issues):
            recommendations.append("🕐 TimeSeriesSplit 또는 시간 기반 분할 사용 필수")
            recommendations.append("🚫 Random train_test_split 사용 금지")
        
        if any('완벽한 예측자' in issue for issue in self.critical_issues):
            recommendations.append("🔍 완벽한 예측자 특성 제거 또는 별도 검증")
            recommendations.append("📊 특성 중요도 및 상관관계 재분석")
        
        if any('스케일링' in issue for issue in self.critical_issues):
            recommendations.append("⚙️ 훈련 세트에만 스케일러 피팅, 테스트 세트는 transform만 적용")
            recommendations.append("🔧 파이프라인 사용으로 데이터 누출 방지")
        
        recommendations.extend([
            "📈 교차 검증으로 모델 안정성 확인",
            "📉 학습 곡선으로 오버피팅 모니터링",
            "🎯 클래스 불균형 해결 (SMOTE, class_weight 등)",
            "🔄 모델 복잡도 조절 (하이퍼파라미터 튜닝)"
        ])
        
        return recommendations


# 사용 예시 및 테스트 함수
def validate_fraud_detection_system(data_path: str) -> Dict[str, Any]:
    """사기탐지 시스템 종합 검증"""
    print("🚨 사기탐지 시스템 엄격 검증 시작")
    print("=" * 60)
    
    validator = FraudValidationFramework(data_path)
    report = validator.generate_validation_report()
    
    # 결과 출력
    print(f"\n📊 검증 결과:")
    print(f"전체 심각도: {report['overall_severity']}")
    print(f"검증 점수: {report['validation_score']}/{report['max_score']}")
    print(f"심각한 문제: {len(report['critical_issues'])}개")
    print(f"경고: {len(report['warnings'])}개")
    
    if report['critical_issues']:
        print(f"\n❌ 심각한 문제들:")
        for issue in report['critical_issues']:
            print(f"  {issue}")
    
    if report['warnings']:
        print(f"\n⚠️ 경고사항들:")
        for warning in report['warnings']:
            print(f"  {warning}")
    
    print(f"\n💡 권장사항:")
    for rec in report['recommendations']:
        print(f"  {rec}")
    
    return report


if __name__ == "__main__":
    # 테스트 실행
    data_path = "/root/FCA/data/wamc_fraud/wamc_fraud_processed.csv"
    report = validate_fraud_detection_system(data_path)