import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import requests
import io
import os

print("Downloading UCI Appliances Energy Prediction dataset...")
url = "https://archive.ics.uci.edu/static/public/374/data.csv"
response = requests.get(url)
data = pd.read_csv(io.StringIO(response.text))

print(f"Dataset loaded: {data.shape}")

X = data.drop(['date', 'Appliances', 'rv1', 'rv2'], axis=1)
y = data['Appliances']

print("Features:", X.columns.tolist())

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X.values)

X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

print(f"Train R²: {model.score(X_train, y_train):.4f}")
print(f"Test R²: {model.score(X_test, y_test):.4f}")

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(model, os.path.join(MODEL_DIR, 'energy_model.pkl'))
joblib.dump(scaler, os.path.join(MODEL_DIR, 'scaler.pkl'))
joblib.dump(X.columns.tolist(), os.path.join(MODEL_DIR, 'features.pkl'))


