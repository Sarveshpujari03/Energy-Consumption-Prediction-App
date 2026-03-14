# ⚡ Energy Consumption Prediction System

## 📌 Overview

The **Energy Consumption Prediction System** is a machine learning based web application that predicts energy consumption using the **Random Forest algorithm**.

The system combines **machine learning, a Node.js backend, and a modern React frontend** to allow users to generate predictions through a web interface.

The machine learning model is trained using Python and then integrated with a backend API that serves predictions to the frontend application.

---

## 🧠 Machine Learning Model

The prediction model is implemented using **Python** and trained using the **Random Forest algorithm**.

Random Forest is an ensemble learning technique that improves prediction accuracy by combining multiple decision trees.

The model is trained on energy consumption data and learns patterns between environmental and operational features to predict energy usage.

---

## 🛠️ Tech Stack

### Machine Learning

* Python
* Scikit-learn
* Pandas
* NumPy
* Joblib

### Backend

* Node.js
* Express.js
* REST APIs

### Frontend

* React (Vite)
* Tailwind CSS
* JavaScript

### Database

* SQL Database (configured through environment variables)


---

# 🚀 Setup Instructions

## 1️⃣ Train the Machine Learning Model

Navigate to the model directory and run:

```bash
python train.py
```

This will train the **Random Forest model** and generate the required model files used by the backend for predictions.

---

## 2️⃣ Backend Setup (Node.js)

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file and configure the database connection.

Example:

```
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
PORT=5000
```

Start the backend server:

```bash
npm start
```

The backend will run the API responsible for prediction requests and database interactions.

---

## 3️⃣ Frontend Setup (React + Vite + Tailwind)

Navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the frontend development server:

```bash
npm run dev
```

The frontend application will start and connect to the backend APIs.

---

## 📊 Features

* Energy consumption prediction using Machine Learning
* Random Forest based predictive model
* REST API based backend
* Modern responsive frontend using React and Tailwind
* Database integration for storing data
* Scalable full-stack architecture

---

## 🔄 System Workflow

1. The **Python script trains the Random Forest model**
2. The trained model is saved as `.pkl` files
3. The **Node.js backend loads the model** and exposes prediction APIs
4. The **React frontend sends input data to the backend**
5. The backend returns the **predicted energy consumption**

