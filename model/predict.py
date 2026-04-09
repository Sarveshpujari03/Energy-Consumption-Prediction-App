import sys
import json
import joblib
import numpy as np
import os
import traceback
from datetime import datetime

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    model = joblib.load(os.path.join(MODEL_DIR, "energy_model.pkl"))
    scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
    features = joblib.load(os.path.join(MODEL_DIR, "features.pkl"))
except Exception as e:
    print(json.dumps({
        "error": f"Model loading failed: {str(e)}"
    }))
    sys.exit(1)

APPLIANCE_WATTS = {
    "led_bulb": 9,
    "tube_light": 20,
    "ceiling_fan": 75,
    "exhaust_fan": 40,
    "tv": 100,
    "laptop": 65,
    "desktop": 200,
    "refrigerator": 180,
    "washing_machine": 500,
    "microwave": 1200,
    "induction_cooktop": 1800,
    "mixer_grinder": 500,
    "water_purifier": 25,
    "geyser": 2000,
    "air_cooler": 200,
    "air_conditioner": 1500,
    "iron": 1000,
    "wifi_router": 12,
    "water_pump": 750
}

ROOM_TEMP_FEATURES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T_out']
ROOM_HUMIDITY_FEATURES = ['RH_1', 'RH_2', 'RH_3', 'RH_4', 'RH_5', 'RH_6', 'RH_7', 'RH_8', 'RH_9', 'RH_out']

def validate_input(data):
    required = ['householdSize', 'temperature', 'humidity', 'budget', 'perUnitRate', 'appliancesList']
    for field in required:
        if field not in data:
            raise ValueError(f"Missing {field}")

    if not isinstance(data['householdSize'], (int, float)) or data['householdSize'] <= 0:
        raise ValueError("Invalid householdSize")

    if not isinstance(data['temperature'], (int, float)):
        raise ValueError("Invalid temperature")

    if not isinstance(data['humidity'], (int, float)):
        raise ValueError("Invalid humidity")

    if not isinstance(data['budget'], (int, float)) or data['budget'] < 0:
        raise ValueError("Invalid budget")

    if not isinstance(data['perUnitRate'], (int, float)) or data['perUnitRate'] <= 0:
        raise ValueError("Invalid perUnitRate")

    if not isinstance(data['appliancesList'], list) or len(data['appliancesList']) == 0:
        raise ValueError("appliancesList must be a non-empty list")

    for item in data['appliancesList']:
        if not isinstance(item, dict):
            raise ValueError("Each appliance must be an object")

        if 'name' not in item or not isinstance(item['name'], str) or not item['name'].strip():
            raise ValueError("Each appliance must include a valid name")

        if 'quantity' not in item or not isinstance(item['quantity'], (int, float)) or item['quantity'] <= 0:
            raise ValueError("Each appliance must include a valid quantity")

        if 'hours' not in item or not isinstance(item['hours'], (int, float)) or item['hours'] < 0:
            raise ValueError("Each appliance must include valid hours")

        if 'wattage' in item and item['wattage'] is not None:
            if not isinstance(item['wattage'], (int, float)) or item['wattage'] <= 0:
                raise ValueError("Invalid wattage value")

def normalize_name(name):
    return (
        name.strip()
        .lower()
        .replace(" ", "_")
        .replace("(", "")
        .replace(")", "")
        .replace("-", "_")
    )

def get_appliance_watts(item):
    if item.get('wattage') is not None:
        return float(item['wattage'])
    key = normalize_name(item['name'])
    return float(APPLIANCE_WATTS.get(key, 100))

def aggregate_appliances(appliances):
    total_count = 0.0
    total_watts = 0.0
    total_daily_kwh_est = 0.0
    total_usage_hours = 0.0
    high_load_count = 0.0
    cooling_load = 0.0
    lighting_load = 0.0

    for item in appliances:
        count = float(item['quantity'])
        hours = float(item['hours'])
        watts = get_appliance_watts(item)
        name_key = normalize_name(item['name'])

        total_count += count
        total_watts += watts * count
        total_usage_hours += hours * count
        total_daily_kwh_est += (watts * count * hours) / 1000.0

        if watts >= 1000:
            high_load_count += count

        if any(x in name_key for x in ['air_conditioner', 'air_cooler', 'ceiling_fan', 'exhaust_fan', 'fan']):
            cooling_load += watts * count

        if any(x in name_key for x in ['led_bulb', 'tube_light', 'bulb', 'light']):
            lighting_load += watts * count

    avg_hours_per_appliance = total_usage_hours / total_count if total_count > 0 else 0.0

    return {
        "total_count": total_count,
        "total_watts": total_watts,
        "total_daily_kwh_est": total_daily_kwh_est,
        "total_usage_hours": total_usage_hours,
        "avg_hours_per_appliance": avg_hours_per_appliance,
        "high_load_count": high_load_count,
        "cooling_load": cooling_load,
        "lighting_load": lighting_load
    }

def build_feature_vector(user_data):
    appliance_stats = aggregate_appliances(user_data['appliancesList'])
    now = datetime.now()

    values = {feature: 0.0 for feature in features}

    temp = float(user_data['temperature'])
    humidity = float(user_data['humidity'])
    household_size = float(user_data['householdSize'])

    for feature in ROOM_TEMP_FEATURES:
        if feature in values:
            values[feature] = temp

    for feature in ROOM_HUMIDITY_FEATURES:
        if feature in values:
            values[feature] = humidity

    if 'lights' in values:
        values['lights'] = appliance_stats['lighting_load'] / 10.0

    if 'Press_mm_hg' in values:
        values['Press_mm_hg'] = 1013.25

    if 'Wind speed' in values:
        values['Wind speed'] = 3.5

    if 'Visibility' in values:
        values['Visibility'] = 40.0

    if 'Tdewpoint' in values:
        values['Tdewpoint'] = temp - ((100.0 - humidity) / 5.0)

    if 'month' in values:
        values['month'] = float(now.month)

    if 'day_of_week' in values:
        values['day_of_week'] = float(now.weekday())

    if 'hour' in values:
        values['hour'] = 18.0

    if 'is_weekend' in values:
        values['is_weekend'] = 1.0 if now.weekday() >= 5 else 0.0

    appliance_factor = appliance_stats['total_daily_kwh_est']
    occupancy_factor = max(1.0, household_size / 2.0)

    for feature in ['T1', 'T2', 'T3']:
        if feature in values:
            values[feature] += min(3.0, appliance_factor * 0.15 * occupancy_factor)

    vector = np.array([values[f] for f in features], dtype=float).reshape(1, -1)
    vector = scaler.transform(vector)
    return vector, appliance_stats

if len(sys.argv) < 2:
    print(json.dumps({"error": "No input data provided"}))
    sys.exit(1)

try:
    input_data = json.loads(sys.argv[1])
    validate_input(input_data)

    feature_vector, appliance_stats = build_feature_vector(input_data)
    predicted_wh_10min = float(model.predict(feature_vector)[0])

    model_daily_kwh = max(0.0, (predicted_wh_10min * 144.0) / 1000.0)
    appliance_daily_kwh = appliance_stats['total_daily_kwh_est']
    blended_daily_kwh = (0.65 * appliance_daily_kwh) + (0.35 * model_daily_kwh)

    monthly_kwh = blended_daily_kwh * 30.0
    monthly_cost = monthly_kwh * float(input_data['perUnitRate'])

    budget = float(input_data['budget'])
    per_unit_rate = float(input_data['perUnitRate'])
    budget_exceeded = monthly_cost > budget
    savings_needed_kwh = max(0.0, (monthly_cost - budget) / per_unit_rate)

    recommendations = []

    if budget_exceeded:
        recommendations.append(f"Reduce about {savings_needed_kwh:.1f} kWh/month to stay within budget")

        sorted_apps = sorted(
            input_data['appliancesList'],
            key=lambda x: get_appliance_watts(x) * float(x['quantity']) * float(x['hours']),
            reverse=True
        )

        for item in sorted_apps[:3]:
            name = item['name']
            count = float(item['quantity'])
            hours = float(item['hours'])
            watts = get_appliance_watts(item)
            monthly_use = (watts * count * hours * 30.0) / 1000.0
            recommendations.append(f"Review {name} usage, it contributes about {monthly_use:.1f} kWh/month")

        if float(input_data['temperature']) >= 30:
            recommendations.append("Higher temperature can increase cooling consumption, reduce AC or cooler runtime where possible")
        else:
            recommendations.append("Shift heavy appliances to shorter or less frequent usage where possible")
    else:
        recommendations.append(f"Estimated savings versus budget: ₹{(budget - monthly_cost):.0f}")
        recommendations.append("Your current usage pattern is within budget")
        recommendations.append("You can still reduce high-load appliance runtime for extra savings")

    result = {
        "predicted_daily_kwh": round(blended_daily_kwh, 2),
        "predicted_monthly_kwh": round(monthly_kwh, 2),
        "predicted_monthly_cost": round(monthly_cost, 2),
        "per_unit_rate": per_unit_rate,
        "budget": budget,
        "budget_exceeded": bool(budget_exceeded),
        "savings_needed_kwh": round(float(savings_needed_kwh), 2),
        "input_summary": {
            "household_size": int(float(input_data["householdSize"])),
            "appliance_types": len(input_data["appliancesList"]),
            "total_appliance_count": round(appliance_stats["total_count"], 2),
            "estimated_connected_load_watts": round(appliance_stats["total_watts"], 2),
            "appliance_based_daily_kwh": round(appliance_daily_kwh, 2),
            "model_based_daily_kwh": round(model_daily_kwh, 2)
        },
        "recommendations": recommendations[:4]
    }

    print(json.dumps(result))
except Exception as e:
    print(json.dumps({
        "error": str(e),
        "trace": traceback.format_exc()
    }))
    sys.exit(1)