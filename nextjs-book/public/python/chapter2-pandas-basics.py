# Loading and Exploring Healthcare Data with Pandas
# Let's work with a sample patient dataset

import pandas as pd
import numpy as np

# Create a sample healthcare dataset
# In real projects, you'd load this from CSV, Excel, or database
patients_data = {
    'patient_id': ['PT001', 'PT002', 'PT003', 'PT004', 'PT005', 'PT006', 'PT007', 'PT008'],
    'age': [34, 67, 45, 23, 56, 78, 41, 62],
    'gender': ['F', 'M', 'F', 'M', 'F', 'M', 'F', 'M'],
    'diagnosis': ['Hypertension', 'Diabetes', 'Asthma', 'Healthy', 'Diabetes', 'Hypertension', 'Asthma', 'Diabetes'],
    'systolic_bp': [140, 160, 120, 110, 145, 170, 125, 155],
    'diastolic_bp': [90, 95, 80, 70, 85, 100, 75, 90],
    'bmi': [28.5, 31.2, 22.1, 21.8, 29.7, 33.1, 24.5, 30.2],
    'has_insurance': [True, True, False, True, True, True, False, True]
}

# Create DataFrame
df = pd.DataFrame(patients_data)

print("=== Healthcare Dataset Overview ===")
print("Dataset shape (rows, columns):", df.shape)
print("\nFirst 5 patients:")
print(df.head())

print("\n=== Basic Dataset Information ===")
print(df.info())

print("\n=== Summary Statistics ===")
print(df.describe())

print("\n=== Data Types ===")
print(df.dtypes)

# Explore specific columns
print("\n=== Diagnosis Distribution ===")
print(df['diagnosis'].value_counts())

print("\n=== Gender Distribution ===")
print(df['gender'].value_counts())

print("\n=== Insurance Coverage ===")
print(df['has_insurance'].value_counts())

# Calculate some basic healthcare metrics
print("\n=== Healthcare Insights ===")
print(f"Average patient age: {df['age'].mean():.1f} years")
print(f"Average BMI: {df['bmi'].mean():.1f}")
print(f"Average systolic BP: {df['systolic_bp'].mean():.1f} mmHg")
print(f"Percentage with insurance: {df['has_insurance'].mean()*100:.1f}%")

# Identify patients with high blood pressure (>140/90)
high_bp_patients = df[(df['systolic_bp'] > 140) | (df['diastolic_bp'] > 90)]
print(f"\nPatients with high blood pressure: {len(high_bp_patients)}")
print(high_bp_patients[['patient_id', 'age', 'systolic_bp', 'diastolic_bp']])

# Try exploring the data yourself:
# 1. Find patients over 60 years old
# 2. Calculate average BMI by gender
# 3. Find patients with BMI over 30 (obese)

print("\n=== Your Turn ===")
print("Try modifying the code above to explore different aspects of the data!")