import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, roc_auc_score
import joblib
import json
from datetime import datetime
import requests

def load_and_preprocess_data():
    """Load and preprocess the enhanced fraud dataset"""
    print("Loading enhanced fraud dataset...")
    
    url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/enhanced_fraud_dataset-ZMjbsPepn5xUXRFrSs12xgofaGgWk1.csv"
    df = pd.read_csv(url)
    
    print(f"Loaded {len(df)} transactions")
    print("Data shape:", df.shape)
    print("\nColumns:", df.columns.tolist())
    print("\nFirst few rows:")
    print(df.head())
    
    # Convert numeric columns
    numeric_columns = [
        'step', 'amount', 'oldbalanceOrg', 'newbalanceOrig', 'oldbalanceDest', 'newbalanceDest',
        'hour', 'day_of_week', 'is_weekend', 'is_night', 'avg_amount', 'transaction_count',
        'amount_std', 'amount_to_balance_ratio', 'amount_zscore', 'is_round_amount',
        'balance_drained', 'dest_transaction_count', 'is_new_dest', 'hourly_txn_count',
        'balance_change_ratio', 'unique_destinations', 'unique_senders_to_dest',
        'deviation_flag', 'high_velocity_flag', 'suspicious_time_flag',
        'txn_frequency_per_day', 'amount_risk_score', 'behavioral_risk_score', 'isFraud'
    ]
    
    for col in numeric_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Handle categorical variables
    df['type_DEBIT'] = (df['type'] == 'DEBIT').astype(int)
    df['type_TRANSFER'] = (df['type'] == 'TRANSFER').astype(int)
    df['type_CASH_OUT'] = (df['type'] == 'CASH_OUT').astype(int)
    df['type_PAYMENT'] = (df['type'] == 'PAYMENT').astype(int)
    df['type_CASH_IN'] = (df['type'] == 'CASH_IN').astype(int)
    
    print(f"\nTarget distribution (isFraud):")
    print(df['isFraud'].value_counts())
    fraud_rate = df['isFraud'].mean() * 100
    print(f"Fraud rate: {fraud_rate:.2f}%")
    
    return df

def train_model(df):
    """Train the enhanced fraud detection model"""
    print("\nTraining enhanced fraud detection model...")
    
    feature_columns = [
        'amount', 'oldbalanceOrg', 'newbalanceOrig', 'oldbalanceDest', 'newbalanceDest',
        'hour', 'day_of_week', 'is_weekend', 'is_night', 'avg_amount', 'transaction_count',
        'amount_std', 'amount_to_balance_ratio', 'amount_zscore', 'is_round_amount',
        'balance_drained', 'dest_transaction_count', 'is_new_dest', 'hourly_txn_count',
        'balance_change_ratio', 'unique_destinations', 'unique_senders_to_dest',
        'deviation_flag', 'high_velocity_flag', 'suspicious_time_flag',
        'txn_frequency_per_day', 'amount_risk_score', 'behavioral_risk_score',
        'type_DEBIT', 'type_TRANSFER', 'type_CASH_OUT', 'type_PAYMENT', 'type_CASH_IN'
    ]
    
    # Filter features that exist in the dataset
    available_features = [col for col in feature_columns if col in df.columns]
    print(f"Using {len(available_features)} features for training")
    
    X = df[available_features]
    y = df['isFraud']
    
    # Handle missing values
    X = X.fillna(0)
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    )
    
    model.fit(X_train_scaled, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    auc_score = roc_auc_score(y_test, y_pred_proba)
    
    print(f"\nModel Performance:")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"AUC Score: {auc_score:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': available_features,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nTop 10 Most Important Features:")
    print(feature_importance.head(10))
    
    # Save model and preprocessing objects
    model_data = {
        'model': model,
        'scaler': scaler,
        'feature_columns': available_features,
        'accuracy': accuracy,
        'auc_score': auc_score,
        'feature_importance': feature_importance.to_dict('records'),
        'trained_at': datetime.now().isoformat(),
        'training_samples': len(X_train),
        'test_samples': len(X_test)
    }
    
    joblib.dump(model_data, 'fraud_detection_model.pkl')
    print("\nModel saved as 'fraud_detection_model.pkl'")
    
    return model_data

def generate_sample_predictions(df, model_data):
    """Generate predictions for sample data"""
    print("\nGenerating sample predictions...")
    
    # Take a sample of transactions
    sample_df = df.sample(n=min(200, len(df)), random_state=42).copy()
    
    # Prepare features
    X_sample = sample_df[model_data['feature_columns']].fillna(0)
    X_sample_scaled = model_data['scaler'].transform(X_sample)
    
    # Make predictions
    predictions = model_data['model'].predict_proba(X_sample_scaled)[:, 1]
    sample_df['predicted_risk_score'] = predictions * 100
    sample_df['predicted_status'] = np.where(predictions > 0.5, 'suspicious', 'normal')
    
    sample_results = []
    for _, row in sample_df.iterrows():
        result = {
            'transactionId': f"txn_{row['step']}_{row['nameOrig']}",
            'customerId': row['nameOrig'],
            'type': row['type'],
            'amount': float(row['amount']),
            'actual_fraud': int(row['isFraud']),
            'predicted_risk_score': float(row['predicted_risk_score']),
            'predicted_status': row['predicted_status'],
            'amount_risk_score': float(row['amount_risk_score']),
            'behavioral_risk_score': float(row['behavioral_risk_score']),
            'hour': int(row['hour']),
            'is_weekend': int(row['is_weekend'])
        }
        sample_results.append(result)
    
    with open('sample_predictions.json', 'w') as f:
        json.dump(sample_results, f, indent=2, default=str)
    
    print(f"Generated predictions for {len(sample_results)} transactions")
    
    # Calculate prediction accuracy on sample
    correct_predictions = sum(1 for r in sample_results 
                            if (r['predicted_status'] == 'suspicious') == (r['actual_fraud'] == 1))
    sample_accuracy = correct_predictions / len(sample_results)
    print(f"Sample prediction accuracy: {sample_accuracy:.4f}")
    
    return sample_results

if __name__ == "__main__":
    try:
        # Load and preprocess data
        df = load_and_preprocess_data()
        
        # Train model
        model_data = train_model(df)
        
        # Generate sample predictions
        sample_predictions = generate_sample_predictions(df, model_data)
        
        print("\n✅ Enhanced fraud detection model training completed successfully!")
        print(f"Model accuracy: {model_data['accuracy']:.4f}")
        print(f"AUC Score: {model_data['auc_score']:.4f}")
        print(f"Training samples: {model_data['training_samples']:,}")
        print(f"Test samples: {model_data['test_samples']:,}")
        print(f"Sample predictions generated: {len(sample_predictions)}")
        
    except Exception as e:
        print(f"❌ Error during model training: {str(e)}")
        raise
