import sys
import json
import joblib
import numpy as np
import os

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

model = joblib.load(os.path.join(MODEL_DIR, 'energy_model.pkl'))
scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
features = joblib.load(os.path.join(MODEL_DIR, 'features.pkl'))

def validate_input(data):
    required = ['appliancesCount', 'temperature', 'humidity', 'budget', 'usageHours', 'perUnitRate']
    for field in required:
        if field not in data or not isinstance(data[field], (int, float)):
            raise ValueError(f"Missing or invalid {field}")

def map_user_input_to_features(user_data):
    feature_vector = np.zeros(len(features))
    
    feature_map = {
        'T1': float(user_data['temperature']),
        'RH_1': float(user_data['humidity']),
        'T2': 22.0, 'RH_2': 40.0, 'T3': 23.0, 'RH_3': 45.0,
        'T4': 21.0, 'RH_4': 42.0, 'T5': 24.0, 'RH_5': 50.0,
        'T6': 20.0, 'RH_6': 38.0, 'T7': 22.5, 'RH_7': 41.0,
        'T8': 23.5, 'RH_8': 43.0, 'T9': 21.5, 'RH_9': 39.0,
        'T_out': float(user_data['temperature']),
        'RH_out': float(user_data['humidity']),
        'Press_mm_hg': 1013.25,
        'Wind speed': 4.0,
        'Visibility': 8.0,
        'Tdewpoint': 15.0,
        'lights': float(user_data['appliancesCount']) * 0.5
    }
    
    for i, feat in enumerate(features):
        feature_vector[i] = feature_map.get(feat, 0.0)
    
    return scaler.transform(feature_vector.reshape(1, -1))[0]

if len(sys.argv) < 2:
    print(json.dumps({"error": "No input data provided"}))
    sys.exit(1)

try:
    input_data = json.loads(sys.argv[1])
    validate_input(input_data)
    
    daily_wh = model.predict([map_user_input_to_features(input_data)])[0]
    daily_kwh = daily_wh / 1000
    monthly_kwh = daily_kwh * input_data['usageHours'] * 30
    monthly_cost = monthly_kwh * input_data['perUnitRate']
    
    budget_exceeded = monthly_cost > input_data['budget']
    savings_needed = max(0, round((monthly_cost - input_data['budget']) / input_data['perUnitRate'], 2))
    
    recommendations = []
    if budget_exceeded:
        recommendations = [
            f"Reduce usage by {savings_needed:.1f} kWh/month to stay within budget",
            "Replace bulbs with LEDs (saves 75%)",
            "Set AC to 24-26°C (saves 6% per °C)",
            "Unplug standby appliances",
            "Use fans instead of AC when possible"
        ]
    else:
        recommendations = [
            f"You're saving ₹{input_data['budget'] - monthly_cost:.0f} vs budget!",
            "Maintain current usage to stay under budget",
            "Consider energy-efficient appliances for even more savings"
        ]
    
    result = {
        "predicted_daily_kwh": round(float(daily_kwh), 2),
        "predicted_monthly_kwh": round(float(monthly_kwh), 2),
        "predicted_monthly_cost": round(float(monthly_cost), 2),
        "per_unit_rate": float(input_data['perUnitRate']),
        "budget": float(input_data['budget']),
        "budget_exceeded": bool(budget_exceeded),
        "savings_needed_kwh": float(savings_needed),
        "recommendations": recommendations[:4]
    }
    
    print(json.dumps(result))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
