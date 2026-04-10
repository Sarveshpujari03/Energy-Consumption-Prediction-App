import pandas as pd
import numpy as np
import requests
import io
import os
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor, GradientBoostingRegressor

print("Downloading energy dataset...")

urls = [
    "https://raw.githubusercontent.com/LuisM78/Appliances-energy-prediction-data/master/energydata_complete.csv",
    "https://archive.ics.uci.edu/static/public/374/data.csv",
    "https://archive.ics.uci.edu/ml/machine-learning-databases/00374/energydata_complete.csv"
]

data = None
last_error = None

for url in urls:
    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        data = pd.read_csv(io.StringIO(response.text))
        print(f"Dataset downloaded successfully from: {url}")
        break
    except Exception as e:
        last_error = e
        print(f"Failed to download from: {url}")

if data is None:
    raise RuntimeError(f"Could not download dataset from any source. Last error: {last_error}")

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

models = {
    "RandomForest": RandomForestRegressor(
        n_estimators=300,
        max_depth=15,
        min_samples_split=10,
        min_samples_leaf=5,
        max_features='sqrt',
        bootstrap=True,
        random_state=42,
        n_jobs=-1,
        oob_score=True
    ),
    "ExtraTrees": ExtraTreesRegressor(
        n_estimators=300,
        max_depth=15,
        min_samples_split=10,
        min_samples_leaf=5,
        max_features='sqrt',
        bootstrap=False,
        random_state=42,
        n_jobs=-1
    ),
    "GradientBoosting": GradientBoostingRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=6,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42
    )
}

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(MODEL_DIR, exist_ok=True)

results = []
all_predictions = {}
feature_importance_dict = {}

for model_name, model in models.items():
    print(f"Training {model_name}...")
    model.fit(X_train_scaled, y_train)

    train_pred = model.predict(X_train_scaled)
    test_pred = model.predict(X_test_scaled)

    train_r2 = float(r2_score(y_train, train_pred))
    test_r2 = float(r2_score(y_test, test_pred))
    train_mae = float(mean_absolute_error(y_train, train_pred))
    test_mae = float(mean_absolute_error(y_test, test_pred))
    train_rmse = float(np.sqrt(mean_squared_error(y_train, train_pred)))
    test_rmse = float(np.sqrt(mean_squared_error(y_test, test_pred)))

    row = {
        "model": model_name,
        "train_r2": train_r2,
        "test_r2": test_r2,
        "train_mae": train_mae,
        "test_mae": test_mae,
        "train_rmse": train_rmse,
        "test_rmse": test_rmse
    }

    if hasattr(model, "oob_score_"):
        row["oob_score"] = float(model.oob_score_)
    else:
        row["oob_score"] = None

    results.append(row)
    all_predictions[model_name] = test_pred

    if hasattr(model, "feature_importances_"):
        fi = pd.DataFrame({
            "feature": X.columns,
            "importance": model.feature_importances_
        }).sort_values("importance", ascending=False).reset_index(drop=True)
        feature_importance_dict[model_name] = fi
        fi.to_csv(os.path.join(MODEL_DIR, f"{model_name.lower()}_feature_importance.csv"), index=False)

    joblib.dump(model, os.path.join(MODEL_DIR, f"{model_name.lower()}_model.pkl"))

joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
joblib.dump(X.columns.tolist(), os.path.join(MODEL_DIR, "features.pkl"))

results_df = pd.DataFrame(results).sort_values(by="test_r2", ascending=False).reset_index(drop=True)
results_df.to_csv(os.path.join(MODEL_DIR, "model_comparison.csv"), index=False)

metadata = {
    "dataset_rows": int(len(data)),
    "features_count": len(X.columns),
    "feature_names": X.columns.tolist(),
    "target_unit": "Wh per 10min interval",
    "trained_at": datetime.now().isoformat(),
    "models_trained": list(models.keys()),
    "best_model_by_test_r2": results_df.iloc[0]["model"],
    "prediction_notes": "Multiply by 144 and divide by 1000 for daily kWh"
}

joblib.dump(metadata, os.path.join(MODEL_DIR, "metadata.pkl"))

plt.figure(figsize=(10, 6))
sns.barplot(data=results_df, x="model", y="test_r2", palette="viridis")
plt.title("Test R² Comparison")
plt.ylabel("Test R²")
plt.xlabel("Model")
plt.tight_layout()
plt.savefig(os.path.join(MODEL_DIR, "test_r2_comparison.png"), dpi=300)
plt.close()

plt.figure(figsize=(10, 6))
sns.barplot(data=results_df, x="model", y="test_rmse", palette="magma")
plt.title("Test RMSE Comparison")
plt.ylabel("Test RMSE (Wh)")
plt.xlabel("Model")
plt.tight_layout()
plt.savefig(os.path.join(MODEL_DIR, "test_rmse_comparison.png"), dpi=300)
plt.close()

for model_name, preds in all_predictions.items():
    plt.figure(figsize=(8, 8))
    sns.scatterplot(x=y_test, y=preds, alpha=0.4)
    min_val = min(y_test.min(), preds.min())
    max_val = max(y_test.max(), preds.max())
    plt.plot([min_val, max_val], [min_val, max_val], color="red", linestyle="--")
    plt.title(f"{model_name} - Actual vs Predicted")
    plt.xlabel("Actual Appliances Energy (Wh)")
    plt.ylabel("Predicted Appliances Energy (Wh)")
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, f"{model_name.lower()}_actual_vs_predicted.png"), dpi=300)
    plt.close()

bins = [-1, 50, 100, 200, 400, 700, y_test.max() + 1]
labels = ["0-50", "51-100", "101-200", "201-400", "401-700", "700+"]

y_test_binned = pd.cut(y_test, bins=bins, labels=labels)

for model_name, preds in all_predictions.items():
    pred_binned = pd.cut(preds, bins=bins, labels=labels)
    cm = pd.crosstab(y_test_binned, pred_binned, rownames=["Actual Range"], colnames=["Predicted Range"], dropna=False)

    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
    plt.title(f"{model_name} - Binned Prediction Matrix")
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, f"{model_name.lower()}_binned_matrix.png"), dpi=300)
    plt.close()

print("\n" + "=" * 60)
print("TRAINING COMPLETE - Files saved:")
for model_name in models.keys():
    print(f"   {model_name.lower()}_model.pkl")
print("   scaler.pkl")
print("   features.pkl")
print("   metadata.pkl")
print("   model_comparison.csv")
print("   test_r2_comparison.png")
print("   test_rmse_comparison.png")
for model_name in models.keys():
    print(f"   {model_name.lower()}_actual_vs_predicted.png")
    print(f"   {model_name.lower()}_binned_matrix.png")
    if model_name in feature_importance_dict:
        print(f"   {model_name.lower()}_feature_importance.csv")
print("=" * 60)

print("\nMODEL PERFORMANCE:")
print(results_df.to_string(index=False))

print(f"\nBest model based on Test R²: {results_df.iloc[0]['model']}")
print("\nReady for report generation and production comparison!")