import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import requests
import io
import os
import json
from datetime import datetime

print("Downloading energy dataset...")
url = "https://archive.ics.uci.edu/static/public/374/data.csv"
response = requests.get(url, timeout=60)
response.raise_for_status()
data = pd.read_csv(io.StringIO(response.text))

data['date'] = data['date'].astype(str)
data['date'] = data['date'].str.replace(r'(\d{4}-\d{2}-\d{2})(\d{2}:)', r'\1 \2', regex=True)
data['date'] = pd.to_datetime(data['date'], format='%Y-%m-%d %H:%M:%S', errors='coerce')
data = data.dropna(subset=['date'])

data['month'] = data['date'].dt.month
data['day_of_week'] = data['date'].dt.dayofweek
data['hour'] = data['date'].dt.hour
data['is_weekend'] = (data['day_of_week'] >= 5).astype(int)

drop_cols = ['date', 'Appliances', 'rv1', 'rv2']
X = data.drop(columns=drop_cols)
y = data['Appliances'].astype(float)

print(f"Dataset shape: {X.shape}, Target range: {y.min():.1f} - {y.max():.1f} Wh")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, shuffle=True
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = RandomForestRegressor(
    n_estimators=300,        

    max_depth=15,            

    min_samples_split=10,    

    min_samples_leaf=5,      

    max_features='sqrt',     

    bootstrap=True,
    random_state=42,
    n_jobs=-1,
    oob_score=True          

)

print("Training model...")
model.fit(X_train_scaled, y_train)

train_pred = model.predict(X_train_scaled)
test_pred = model.predict(X_test_scaled)

train_metrics = {
    "r2": float(r2_score(y_train, train_pred)),
    "mae": float(mean_absolute_error(y_train, train_pred)),
    "rmse": float(np.sqrt(mean_squared_error(y_train, train_pred))),
    "oob_score": float(model.oob_score_)
}

test_metrics = {
    "r2": float(r2_score(y_test, test_pred)),
    "mae": float(mean_absolute_error(y_test, test_pred)),
    "rmse": float(np.sqrt(mean_squared_error(y_test, test_pred)))
}

feature_importance = (
    pd.DataFrame({
        "feature": X.columns,
        "importance": model.feature_importances_
    })
    .sort_values("importance", ascending=False)
    .reset_index(drop=True)
)

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(model, os.path.join(MODEL_DIR, 'energy_model.pkl'))
joblib.dump(scaler, os.path.join(MODEL_DIR, 'scaler.pkl'))  

joblib.dump(X.columns.tolist(), os.path.join(MODEL_DIR, 'features.pkl'))

metadata = {
    "train_metrics": train_metrics,
    "test_metrics": test_metrics,
    "target_unit": "Wh per 10min interval",
    "dataset_rows": int(len(data)),
    "features_count": len(X.columns),
    "feature_names": X.columns.tolist(),
    "model_type": "RandomForestRegressor",
    "scaler_type": "StandardScaler",
    "trained_at": datetime.now().isoformat(),
    "prediction_notes": "Multiply by 144 and divide by 1000 for daily kWh"
}

joblib.dump(metadata, os.path.join(MODEL_DIR, 'metadata.pkl'))

feature_importance.to_csv(os.path.join(MODEL_DIR, 'feature_importance.csv'), index=False)

print("\n" + "="*60)
print("TRAINING COMPLETE - Files saved:")
print(f"   energy_model.pkl")
print(f"   scaler.pkl (CRITICAL for prediction)")
print(f"   features.pkl")
print(f"   metadata.pkl")
print(f"   feature_importance.csv")
print("="*60)

print("\n PERFORMANCE:")
print(f"Train R²: {train_metrics['r2']:.4f}, Test R²: {test_metrics['r2']:.4f}")
print(f"Train RMSE: {train_metrics['rmse']:.1f} Wh, Test RMSE: {test_metrics['rmse']:.1f} Wh")
print(f"OOB Score: {train_metrics['oob_score']:.4f}")

print("\n TOP 5 FEATURES:")
print(feature_importance.head().to_string(index=False))

print("\n Ready for production use with your prediction script!")