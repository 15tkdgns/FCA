#!/usr/bin/env python3
"""
Customer Attrition Prediction Engine
===================================

Advanced customer churn prediction using multiple ML approaches:
- Ensemble methods (Random Forest, Gradient Boosting, XGBoost)
- Deep learning models
- Customer lifecycle analysis
- Risk segmentation and retention strategies
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
import xgboost as xgb
import joblib
import logging
from typing import Dict, List, Tuple, Optional, Any, Union
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class AttritionPredictor:
    """
    Advanced customer attrition prediction system with:
    1. Multiple ML algorithms (RF, XGBoost, Gradient Boosting)
    2. Feature engineering for customer behavior analysis
    3. Risk segmentation and scoring
    4. Retention strategy recommendations
    5. Customer lifetime value integration
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_columns = []
        self.target_column = 'Exited'
        self.is_trained = False
        
        # Initialize models
        self._initialize_models()
        
    def _default_config(self) -> Dict:
        """Default configuration for attrition prediction"""
        return {
            'random_forest': {
                'n_estimators': 200,
                'max_depth': 15,
                'min_samples_split': 5,
                'min_samples_leaf': 2,
                'random_state': 42
            },
            'xgboost': {
                'n_estimators': 200,
                'max_depth': 6,
                'learning_rate': 0.1,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'random_state': 42
            },
            'gradient_boosting': {
                'n_estimators': 200,
                'max_depth': 5,
                'learning_rate': 0.1,
                'random_state': 42
            },
            'logistic_regression': {
                'C': 1.0,
                'random_state': 42,
                'max_iter': 1000
            },
            'ensemble_weights': {
                'random_forest': 0.3,
                'xgboost': 0.3,
                'gradient_boosting': 0.25,
                'logistic_regression': 0.15
            },
            'risk_thresholds': {
                'low': 0.25,
                'medium': 0.50,
                'high': 0.75
            }
        }
    
    def _initialize_models(self):
        """Initialize ML models with configuration"""
        self.models = {
            'random_forest': RandomForestClassifier(**self.config['random_forest']),
            'xgboost': xgb.XGBClassifier(**self.config['xgboost']),
            'gradient_boosting': GradientBoostingClassifier(**self.config['gradient_boosting']),
            'logistic_regression': LogisticRegression(**self.config['logistic_regression'])
        }
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer features for customer attrition prediction
        
        Args:
            df: Raw customer DataFrame
            
        Returns:
            DataFrame with engineered features
        """
        df_engineered = df.copy()
        
        # Age-based features
        if 'Age' in df_engineered.columns:
            df_engineered['Age_Group'] = pd.cut(
                df_engineered['Age'], 
                bins=[0, 30, 50, 70, 100], 
                labels=['Young', 'Middle', 'Senior', 'Elderly']
            )
            df_engineered['Is_Senior'] = (df_engineered['Age'] >= 60).astype(int)
        
        # Credit Score features
        if 'CreditScore' in df_engineered.columns:
            df_engineered['CreditScore_Tier'] = pd.cut(
                df_engineered['CreditScore'],
                bins=[0, 600, 700, 800, 850],
                labels=['Poor', 'Fair', 'Good', 'Excellent']
            )
            df_engineered['Low_Credit_Score'] = (df_engineered['CreditScore'] < 600).astype(int)
        
        # Balance-based features
        if 'Balance' in df_engineered.columns:
            df_engineered['Has_Balance'] = (df_engineered['Balance'] > 0).astype(int)
            df_engineered['High_Balance'] = (df_engineered['Balance'] > df_engineered['Balance'].quantile(0.75)).astype(int)
            df_engineered['Balance_Per_Product'] = df_engineered['Balance'] / (df_engineered.get('NumOfProducts', 1) + 1)
        
        # Salary features
        if 'EstimatedSalary' in df_engineered.columns:
            df_engineered['Salary_Tier'] = pd.cut(
                df_engineered['EstimatedSalary'],
                bins=5,
                labels=['Very_Low', 'Low', 'Medium', 'High', 'Very_High']
            )
            df_engineered['High_Earner'] = (df_engineered['EstimatedSalary'] > df_engineered['EstimatedSalary'].quantile(0.8)).astype(int)
        
        # Product usage features
        if 'NumOfProducts' in df_engineered.columns:
            df_engineered['Single_Product'] = (df_engineered['NumOfProducts'] == 1).astype(int)
            df_engineered['Multiple_Products'] = (df_engineered['NumOfProducts'] > 2).astype(int)
        
        # Tenure-based features
        if 'Tenure' in df_engineered.columns:
            df_engineered['New_Customer'] = (df_engineered['Tenure'] <= 2).astype(int)
            df_engineered['Long_Term_Customer'] = (df_engineered['Tenure'] >= 7).astype(int)
            df_engineered['Tenure_Squared'] = df_engineered['Tenure'] ** 2
        
        # Activity features
        if 'IsActiveMember' in df_engineered.columns:
            df_engineered['Inactive_Member'] = (1 - df_engineered['IsActiveMember']).astype(int)
        
        # Interaction features
        if all(col in df_engineered.columns for col in ['Age', 'Balance']):
            df_engineered['Age_Balance_Ratio'] = df_engineered['Age'] / (df_engineered['Balance'] + 1)
        
        if all(col in df_engineered.columns for col in ['CreditScore', 'EstimatedSalary']):
            df_engineered['Credit_Salary_Ratio'] = df_engineered['CreditScore'] / (df_engineered['EstimatedSalary'] / 1000 + 1)
        
        # Customer value score
        df_engineered['Customer_Value_Score'] = self._calculate_customer_value(df_engineered)
        
        return df_engineered
    
    def _calculate_customer_value(self, df: pd.DataFrame) -> pd.Series:
        """Calculate customer value score based on multiple factors"""
        value_score = pd.Series(0.0, index=df.index)
        
        # Balance contribution (normalized)
        if 'Balance' in df.columns:
            balance_norm = df['Balance'] / df['Balance'].max() if df['Balance'].max() > 0 else 0
            value_score += balance_norm * 0.3
        
        # Salary contribution (normalized)
        if 'EstimatedSalary' in df.columns:
            salary_norm = df['EstimatedSalary'] / df['EstimatedSalary'].max()
            value_score += salary_norm * 0.2
        
        # Credit score contribution (normalized)
        if 'CreditScore' in df.columns:
            credit_norm = df['CreditScore'] / 850.0  # Max credit score
            value_score += credit_norm * 0.2
        
        # Product usage contribution
        if 'NumOfProducts' in df.columns:
            product_norm = df['NumOfProducts'] / df['NumOfProducts'].max()
            value_score += product_norm * 0.15
        
        # Activity contribution
        if 'IsActiveMember' in df.columns:
            value_score += df['IsActiveMember'] * 0.15
        
        return value_score
    
    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess customer data for model training/prediction
        
        Args:
            df: Raw customer DataFrame
            
        Returns:
            Preprocessed DataFrame ready for modeling
        """
        df_processed = df.copy()
        
        # Engineer features
        df_processed = self.engineer_features(df_processed)
        
        # Handle missing values
        numeric_columns = df_processed.select_dtypes(include=[np.number]).columns
        df_processed[numeric_columns] = df_processed[numeric_columns].fillna(
            df_processed[numeric_columns].median()
        )
        
        categorical_columns = df_processed.select_dtypes(include=['object', 'category']).columns
        df_processed[categorical_columns] = df_processed[categorical_columns].fillna('Unknown')
        
        # Encode categorical variables
        for col in categorical_columns:
            if col != self.target_column:
                if col not in self.encoders:
                    self.encoders[col] = LabelEncoder()
                    df_processed[col] = self.encoders[col].fit_transform(df_processed[col].astype(str))
                else:
                    # Handle unseen categories
                    unique_values = set(df_processed[col].astype(str).unique())
                    known_values = set(self.encoders[col].classes_)
                    unknown_values = unique_values - known_values
                    
                    if unknown_values:
                        df_processed[col] = df_processed[col].astype(str).replace(
                            list(unknown_values), 'Unknown'
                        )
                    
                    df_processed[col] = self.encoders[col].transform(df_processed[col].astype(str))
        
        return df_processed
    
    def extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract features for model training/prediction"""
        feature_df = df.copy()
        
        # Remove target column if present
        if self.target_column in feature_df.columns:
            feature_df = feature_df.drop(columns=[self.target_column])
        
        # Remove non-predictive columns
        columns_to_remove = ['CustomerId', 'Surname', 'RowNumber']
        feature_df = feature_df.drop(columns=[col for col in columns_to_remove if col in feature_df.columns])
        
        return feature_df
    
    def train(self, df: pd.DataFrame, target_column: str = 'Exited') -> Dict[str, Any]:
        """
        Train customer attrition prediction models
        
        Args:
            df: Training DataFrame
            target_column: Name of target column
            
        Returns:
            Training results and performance metrics
        """
        logger.info("Starting customer attrition model training...")
        
        self.target_column = target_column
        
        # Preprocess data
        df_processed = self.preprocess_data(df)
        
        # Extract features and target
        X = self.extract_features(df_processed)
        y = df_processed[target_column] if target_column in df_processed.columns else None
        
        if y is None:
            raise ValueError(f"Target column '{target_column}' not found in DataFrame")
        
        self.feature_columns = X.columns.tolist()
        
        # Scale features for some models
        self.scalers['standard'] = StandardScaler()
        X_scaled = self.scalers['standard'].fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        X_train_scaled, X_test_scaled, _, _ = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )
        
        results = {}
        
        # Train models
        for model_name, model in self.models.items():
            logger.info(f"Training {model_name}...")
            
            # Use scaled features for logistic regression
            if model_name == 'logistic_regression':
                X_train_model = X_train_scaled
                X_test_model = X_test_scaled
            else:
                X_train_model = X_train
                X_test_model = X_test
            
            model.fit(X_train_model, y_train)
            
            # Evaluate model
            y_pred = model.predict(X_test_model)
            y_prob = model.predict_proba(X_test_model)[:, 1] if hasattr(model, 'predict_proba') else y_pred
            
            results[model_name] = {
                'accuracy': model.score(X_test_model, y_test),
                'auc_roc': roc_auc_score(y_test, y_prob),
                'classification_report': classification_report(y_test, y_pred, output_dict=True),
                'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
                'cross_val_scores': cross_val_score(model, X_train_model, y_train, cv=5).tolist()
            }
            
            # Feature importance for tree-based models
            if hasattr(model, 'feature_importances_'):
                importance_dict = dict(zip(self.feature_columns, model.feature_importances_))
                sorted_importance = sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
                results[model_name]['feature_importance'] = sorted_importance[:15]
        
        self.is_trained = True
        
        logger.info("Customer attrition model training completed!")
        return results
    
    def predict(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Predict customer attrition probability
        
        Args:
            df: DataFrame with customer features
            
        Returns:
            Dictionary with predictions, probabilities, and risk assessments
        """
        if not self.is_trained:
            raise ValueError("Models must be trained before making predictions")
        
        # Preprocess data
        df_processed = self.preprocess_data(df)
        X = self.extract_features(df_processed)
        
        # Ensure feature consistency
        missing_cols = set(self.feature_columns) - set(X.columns)
        if missing_cols:
            for col in missing_cols:
                X[col] = 0
        
        extra_cols = set(X.columns) - set(self.feature_columns)
        if extra_cols:
            X = X.drop(columns=list(extra_cols))
        
        X = X[self.feature_columns]  # Ensure correct order
        
        # Scale features
        X_scaled = self.scalers['standard'].transform(X)
        
        # Get predictions from all models
        predictions = {}
        probabilities = {}
        
        for model_name, model in self.models.items():
            # Use scaled features for logistic regression
            if model_name == 'logistic_regression':
                X_model = X_scaled
            else:
                X_model = X
            
            pred = model.predict(X_model)
            prob = model.predict_proba(X_model)[:, 1] if hasattr(model, 'predict_proba') else pred
            
            predictions[model_name] = pred.tolist()
            probabilities[model_name] = prob.tolist()
        
        # Ensemble prediction (weighted average)
        weights = self.config['ensemble_weights']
        ensemble_prob = np.zeros(len(X))
        
        for model_name, weight in weights.items():
            if model_name in probabilities:
                ensemble_prob += np.array(probabilities[model_name]) * weight
        
        # Risk assessment
        risk_assessments = self._assess_customer_risk(ensemble_prob, df_processed)
        
        # Retention strategies
        retention_strategies = self._recommend_retention_strategies(ensemble_prob, df_processed)
        
        return {
            'predictions': predictions,
            'probabilities': probabilities,
            'ensemble_probability': ensemble_prob.tolist(),
            'risk_assessments': risk_assessments,
            'retention_strategies': retention_strategies,
            'customer_count': len(df)
        }
    
    def _assess_customer_risk(self, probabilities: np.ndarray, df: pd.DataFrame) -> List[Dict]:
        """Assess detailed risk factors for each customer"""
        risk_assessments = []
        thresholds = self.config['risk_thresholds']
        
        for i, prob in enumerate(probabilities):
            customer_data = df.iloc[i]
            risk_factors = {}
            
            # Determine risk level
            if prob >= thresholds['high']:
                risk_level = 'HIGH'
            elif prob >= thresholds['medium']:
                risk_level = 'MEDIUM'
            elif prob >= thresholds['low']:
                risk_level = 'LOW'
            else:
                risk_level = 'MINIMAL'
            
            # Identify specific risk factors
            if 'IsActiveMember' in customer_data and customer_data['IsActiveMember'] == 0:
                risk_factors['inactive_member'] = True
            
            if 'NumOfProducts' in customer_data and customer_data['NumOfProducts'] == 1:
                risk_factors['single_product_user'] = True
            
            if 'Age' in customer_data and customer_data['Age'] > 60:
                risk_factors['senior_customer'] = True
            
            if 'Balance' in customer_data and customer_data['Balance'] == 0:
                risk_factors['zero_balance'] = True
            
            if 'CreditScore' in customer_data and customer_data['CreditScore'] < 600:
                risk_factors['low_credit_score'] = True
            
            # Customer value assessment
            customer_value = customer_data.get('Customer_Value_Score', 0.5)
            if customer_value > 0.7:
                value_segment = 'High_Value'
            elif customer_value > 0.4:
                value_segment = 'Medium_Value'
            else:
                value_segment = 'Low_Value'
            
            risk_assessments.append({
                'customer_index': i,
                'churn_probability': float(prob),
                'risk_level': risk_level,
                'risk_factors': risk_factors,
                'customer_value_segment': value_segment,
                'customer_value_score': float(customer_value)
            })
        
        return risk_assessments
    
    def _recommend_retention_strategies(self, probabilities: np.ndarray, df: pd.DataFrame) -> List[Dict]:
        """Recommend retention strategies based on customer profiles"""
        strategies = []
        
        for i, prob in enumerate(probabilities):
            customer_data = df.iloc[i]
            customer_strategies = []
            
            # High-risk customers
            if prob >= 0.75:
                customer_strategies.append({
                    'strategy': 'immediate_intervention',
                    'description': 'Immediate personal outreach and retention offer',
                    'priority': 'HIGH'
                })
            
            # Inactive members
            if customer_data.get('IsActiveMember', 1) == 0:
                customer_strategies.append({
                    'strategy': 'engagement_campaign',
                    'description': 'Targeted campaign to increase engagement',
                    'priority': 'MEDIUM'
                })
            
            # Single product users
            if customer_data.get('NumOfProducts', 2) == 1:
                customer_strategies.append({
                    'strategy': 'cross_selling',
                    'description': 'Offer additional products and services',
                    'priority': 'MEDIUM'
                })
            
            # High-value customers at risk
            customer_value = customer_data.get('Customer_Value_Score', 0.5)
            if customer_value > 0.7 and prob > 0.5:
                customer_strategies.append({
                    'strategy': 'vip_treatment',
                    'description': 'Provide VIP services and exclusive offers',
                    'priority': 'HIGH'
                })
            
            # Credit score issues
            if customer_data.get('CreditScore', 700) < 600:
                customer_strategies.append({
                    'strategy': 'financial_counseling',
                    'description': 'Offer financial counseling and credit improvement services',
                    'priority': 'LOW'
                })
            
            strategies.append({
                'customer_index': i,
                'recommended_strategies': customer_strategies,
                'strategy_count': len(customer_strategies)
            })
        
        return strategies
    
    def segment_customers(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Segment customers based on churn risk and value
        
        Args:
            df: Customer DataFrame
            
        Returns:
            Customer segmentation analysis
        """
        predictions = self.predict(df)
        probabilities = np.array(predictions['ensemble_probability'])
        risk_assessments = predictions['risk_assessments']
        
        # Extract customer values
        customer_values = [assessment['customer_value_score'] for assessment in risk_assessments]
        
        # Create segmentation matrix
        segments = {}
        
        for i, (prob, value) in enumerate(zip(probabilities, customer_values)):
            if prob >= 0.75:  # High churn risk
                if value >= 0.7:
                    segment = 'Champions_at_Risk'
                elif value >= 0.4:
                    segment = 'At_Risk'
                else:
                    segment = 'Cannot_Lose_Them'
            elif prob >= 0.5:  # Medium churn risk
                if value >= 0.7:
                    segment = 'Loyal_Customers'
                else:
                    segment = 'About_to_Sleep'
            else:  # Low churn risk
                if value >= 0.7:
                    segment = 'Champions'
                elif value >= 0.4:
                    segment = 'Potential_Loyalists'
                else:
                    segment = 'New_Customers'
            
            if segment not in segments:
                segments[segment] = []
            segments[segment].append(i)
        
        # Calculate segment statistics
        segment_stats = {}
        for segment, customer_indices in segments.items():
            segment_probs = [probabilities[i] for i in customer_indices]
            segment_values = [customer_values[i] for i in customer_indices]
            
            segment_stats[segment] = {
                'customer_count': len(customer_indices),
                'avg_churn_probability': np.mean(segment_probs),
                'avg_customer_value': np.mean(segment_values),
                'percentage': (len(customer_indices) / len(df)) * 100
            }
        
        return {
            'segments': segments,
            'segment_statistics': segment_stats,
            'total_customers': len(df)
        }
    
    def get_feature_importance(self) -> Dict[str, List[Tuple[str, float]]]:
        """Get feature importance from trained models"""
        if not self.is_trained:
            raise ValueError("Models must be trained first")
        
        importance_dict = {}
        
        # Get importance from tree-based models
        for model_name in ['random_forest', 'xgboost', 'gradient_boosting']:
            if model_name in self.models and hasattr(self.models[model_name], 'feature_importances_'):
                importance = self.models[model_name].feature_importances_
                importance_dict[model_name] = [
                    (feature, importance_val) 
                    for feature, importance_val in zip(self.feature_columns, importance)
                ]
                importance_dict[model_name].sort(key=lambda x: x[1], reverse=True)
        
        # Logistic regression coefficients
        if 'logistic_regression' in self.models:
            lr_coef = abs(self.models['logistic_regression'].coef_[0])
            importance_dict['logistic_regression'] = [
                (feature, coef) 
                for feature, coef in zip(self.feature_columns, lr_coef)
            ]
            importance_dict['logistic_regression'].sort(key=lambda x: x[1], reverse=True)
        
        return importance_dict
    
    def save_models(self, filepath: str):
        """Save trained models to disk"""
        if not self.is_trained:
            raise ValueError("No trained models to save")
        
        model_data = {
            'models': self.models,
            'scalers': self.scalers,
            'encoders': self.encoders,
            'feature_columns': self.feature_columns,
            'target_column': self.target_column,
            'config': self.config
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Attrition prediction models saved to {filepath}")
    
    def load_models(self, filepath: str):
        """Load trained models from disk"""
        model_data = joblib.load(filepath)
        
        self.models = model_data['models']
        self.scalers = model_data['scalers']
        self.encoders = model_data['encoders']
        self.feature_columns = model_data['feature_columns']
        self.target_column = model_data['target_column']
        self.config = model_data.get('config', self._default_config())
        self.is_trained = True
        
        logger.info(f"Attrition prediction models loaded from {filepath}")

class CustomerLifecycleAnalyzer:
    """
    Analyze customer lifecycle and predict lifecycle stage transitions
    """
    
    def __init__(self):
        self.lifecycle_stages = [
            'New', 'Growing', 'Mature', 'Declining', 'At_Risk', 'Churned'
        ]
    
    def analyze_lifecycle_stage(self, customer_data: Dict) -> str:
        """Determine customer lifecycle stage"""
        tenure = customer_data.get('Tenure', 0)
        is_active = customer_data.get('IsActiveMember', 1)
        num_products = customer_data.get('NumOfProducts', 1)
        balance = customer_data.get('Balance', 0)
        
        # New customers (tenure < 1 year)
        if tenure < 1:
            return 'New'
        
        # Churned customers (would need historical data)
        # For now, we'll identify inactive customers with zero balance
        if not is_active and balance == 0:
            return 'At_Risk'
        
        # Growing customers (increasing engagement)
        if tenure < 3 and num_products > 1 and is_active:
            return 'Growing'
        
        # Mature customers (stable, long-term)
        if tenure >= 3 and is_active and balance > 0:
            return 'Mature'
        
        # Declining customers (decreasing engagement)
        if tenure >= 3 and (not is_active or balance == 0):
            return 'Declining'
        
        return 'New'  # Default
    
    def calculate_customer_lifetime_value(self, customer_data: Dict) -> float:
        """Calculate estimated customer lifetime value"""
        # Simplified CLV calculation
        # In practice, this would use historical transaction data
        
        monthly_value = customer_data.get('EstimatedSalary', 50000) / 12 * 0.02  # 2% of monthly salary
        tenure_months = customer_data.get('Tenure', 0) * 12
        retention_rate = 0.8  # Assume 80% annual retention
        
        # Simple CLV formula
        clv = monthly_value * tenure_months * retention_rate
        
        return max(clv, 0)
    
    def recommend_lifecycle_actions(self, lifecycle_stage: str, customer_data: Dict) -> List[str]:
        """Recommend actions based on lifecycle stage"""
        actions = []
        
        if lifecycle_stage == 'New':
            actions.extend([
                'Welcome campaign',
                'Onboarding education',
                'Product introduction offers'
            ])
        elif lifecycle_stage == 'Growing':
            actions.extend([
                'Cross-selling opportunities',
                'Loyalty program enrollment',
                'Engagement rewards'
            ])
        elif lifecycle_stage == 'Mature':
            actions.extend([
                'VIP treatment',
                'Exclusive offers',
                'Referral incentives'
            ])
        elif lifecycle_stage == 'Declining':
            actions.extend([
                'Re-engagement campaign',
                'Win-back offers',
                'Product usage analysis'
            ])
        elif lifecycle_stage == 'At_Risk':
            actions.extend([
                'Immediate intervention',
                'Personal outreach',
                'Retention offers'
            ])
        
        return actions