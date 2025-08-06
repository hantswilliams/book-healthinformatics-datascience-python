# Filtering and Sorting Healthcare Data
# Practice essential data manipulation skills

import pandas as pd
import numpy as np

# Create expanded patient dataset
np.random.seed(42)  # For reproducible results
patients_data = {
    'patient_id': [f'PT{i:03d}' for i in range(1, 21)],
    'age': np.random.randint(18, 85, 20),
    'gender': np.random.choice(['M', 'F'], 20),
    'diagnosis': np.random.choice(['Hypertension', 'Diabetes', 'Asthma', 'Healthy', 'Cardiac'], 20),
    'systolic_bp': np.random.randint(100, 180, 20),
    'diastolic_bp': np.random.randint(60, 110, 20),
    'bmi': np.round(np.random.uniform(18.5, 35.0, 20), 1),
    'has_insurance': np.random.choice([True, False], 20, p=[0.85, 0.15]),
    'admission_date': pd.date_range('2024-01-01', periods=20, freq='3D')
}

df = pd.DataFrame(patients_data)
print("=== Complete Patient Dataset ===")
print(df.head(10))

print("\n" + "="*50)
print("FILTERING EXAMPLES")
print("="*50)

# Filter 1: Patients over 60 years old
elderly_patients = df[df['age'] > 60]
print(f"\n1. Patients over 60 years old ({len(elderly_patients)} patients):")
print(elderly_patients[['patient_id', 'age', 'diagnosis']])

# Filter 2: Female patients with diabetes
female_diabetic = df[(df['gender'] == 'F') & (df['diagnosis'] == 'Diabetes')]
print(f"\n2. Female diabetic patients ({len(female_diabetic)} patients):")
print(female_diabetic[['patient_id', 'age', 'gender', 'diagnosis']])

# Filter 3: High-risk patients (high BP and high BMI)
high_risk = df[(df['systolic_bp'] > 140) & (df['bmi'] > 30)]
print(f"\n3. High-risk patients (high BP + BMI > 30) ({len(high_risk)} patients):")
print(high_risk[['patient_id', 'systolic_bp', 'bmi', 'diagnosis']])

# Filter 4: Patients without insurance
uninsured = df[df['has_insurance'] == False]
print(f"\n4. Uninsured patients ({len(uninsured)} patients):")
print(uninsured[['patient_id', 'age', 'diagnosis', 'has_insurance']])

print("\n" + "="*50)
print("SORTING EXAMPLES")
print("="*50)

# Sort 1: By age (oldest first)
sorted_by_age = df.sort_values('age', ascending=False)
print("\n1. Patients sorted by age (oldest first):")
print(sorted_by_age[['patient_id', 'age', 'diagnosis']].head())

# Sort 2: By BMI (highest first)
sorted_by_bmi = df.sort_values('bmi', ascending=False)
print("\n2. Patients sorted by BMI (highest first):")
print(sorted_by_bmi[['patient_id', 'bmi', 'diagnosis']].head())

# Sort 3: Multiple columns - by diagnosis, then age
sorted_multi = df.sort_values(['diagnosis', 'age'], ascending=[True, False])
print("\n3. Sorted by diagnosis (A-Z), then age (oldest first):")
print(sorted_multi[['patient_id', 'diagnosis', 'age']].head(10))

# Sort 4: By admission date (most recent first)
sorted_by_date = df.sort_values('admission_date', ascending=False)
print("\n4. Patients by admission date (most recent first):")
print(sorted_by_date[['patient_id', 'admission_date', 'diagnosis']].head())

print("\n" + "="*50)
print("ADVANCED FILTERING")
print("="*50)

# Advanced filter: Patients needing immediate attention
# Criteria: High BP (>160/100) OR very high BMI (>35)
critical_patients = df[
    ((df['systolic_bp'] > 160) | (df['diastolic_bp'] > 100)) | 
    (df['bmi'] > 35)
]
print(f"\nCritical patients needing immediate attention ({len(critical_patients)} patients):")
print(critical_patients[['patient_id', 'systolic_bp', 'diastolic_bp', 'bmi']])

# Filter with string operations: Find specific diagnoses
cardiac_conditions = df[df['diagnosis'].str.contains('Cardiac', na=False)]
print(f"\nPatients with cardiac conditions ({len(cardiac_conditions)} patients):")
print(cardiac_conditions[['patient_id', 'age', 'diagnosis']])

print("\n" + "="*50)
print("YOUR PRACTICE EXERCISES")
print("="*50)

print("""
Try these exercises by modifying the code above:

1. Find all male patients under 40 with high BMI (>28)
2. Sort patients by systolic blood pressure (highest first)  
3. Find patients admitted in January 2024
4. Filter for patients with 'normal' blood pressure (systolic 90-120, diastolic 60-80)
5. Find the top 5 oldest patients with insurance

Modify the filters and sorts above to practice!
""")

# Example solution for exercise 1:
exercise_1 = df[(df['gender'] == 'M') & (df['age'] < 40) & (df['bmi'] > 28)]
print(f"\nExample - Male patients under 40 with high BMI: {len(exercise_1)} patients")
print(exercise_1[['patient_id', 'gender', 'age', 'bmi']])