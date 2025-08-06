# Creating Healthcare Data Visualizations
# Learn to create meaningful charts for medical data analysis

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Create comprehensive healthcare dataset
np.random.seed(42)
n_patients = 100

patients_data = {
    'patient_id': [f'PT{i:03d}' for i in range(1, n_patients + 1)],
    'age': np.random.randint(18, 85, n_patients),
    'gender': np.random.choice(['M', 'F'], n_patients),
    'diagnosis': np.random.choice(['Hypertension', 'Diabetes', 'Asthma', 'Healthy', 'Cardiac'], n_patients),
    'systolic_bp': np.random.normal(130, 20, n_patients).astype(int),
    'diastolic_bp': np.random.normal(80, 15, n_patients).astype(int),
    'bmi': np.round(np.random.normal(26, 5, n_patients), 1),
    'length_of_stay': np.random.randint(1, 15, n_patients),
    'treatment_cost': np.random.normal(5000, 2000, n_patients).astype(int)
}

df = pd.DataFrame(patients_data)
print("Healthcare Dataset for Visualization")
print(f"Dataset shape: {df.shape}")
print(df.head())

# Set up plotting style
plt.style.use('default')
plt.rcParams['figure.figsize'] = (12, 8)

print("\n" + "="*50)
print("VISUALIZATION 1: AGE DISTRIBUTION")
print("="*50)

# Histogram: Patient age distribution
plt.figure(figsize=(10, 6))
plt.hist(df['age'], bins=15, edgecolor='black', alpha=0.7, color='skyblue')
plt.title('Patient Age Distribution', fontsize=16, fontweight='bold')
plt.xlabel('Age (years)', fontsize=12)
plt.ylabel('Number of Patients', fontsize=12)
plt.grid(True, alpha=0.3)

# Add statistics
mean_age = df['age'].mean()
plt.axvline(mean_age, color='red', linestyle='--', 
           label=f'Mean Age: {mean_age:.1f}')
plt.legend()
plt.tight_layout()
plt.show()

print("\n" + "="*50)
print("VISUALIZATION 2: DIAGNOSIS COMPARISON")
print("="*50)

# Bar chart: Diagnosis frequency
diagnosis_counts = df['diagnosis'].value_counts()
plt.figure(figsize=(10, 6))
bars = plt.bar(diagnosis_counts.index, diagnosis_counts.values, 
               color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'])
plt.title('Patient Count by Diagnosis', fontsize=16, fontweight='bold')
plt.xlabel('Diagnosis', fontsize=12)
plt.ylabel('Number of Patients', fontsize=12)
plt.xticks(rotation=45)

# Add value labels on bars
for bar in bars:
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2., height + 0.5,
             f'{int(height)}', ha='center', va='bottom')

plt.tight_layout()
plt.show()

print("\n" + "="*50)
print("VISUALIZATION 3: BMI vs BLOOD PRESSURE")
print("="*50)

# Scatter plot: BMI vs Systolic BP with diagnosis coloring
diagnosis_colors = {'Hypertension': 'red', 'Diabetes': 'orange', 
                   'Asthma': 'blue', 'Healthy': 'green', 'Cardiac': 'purple'}

plt.figure(figsize=(12, 8))
for diagnosis in df['diagnosis'].unique():
    subset = df[df['diagnosis'] == diagnosis]
    plt.scatter(subset['bmi'], subset['systolic_bp'], 
               label=diagnosis, alpha=0.7, s=60,
               color=diagnosis_colors.get(diagnosis, 'gray'))

plt.title('BMI vs Systolic Blood Pressure by Diagnosis', 
          fontsize=16, fontweight='bold')
plt.xlabel('BMI (kg/m²)', fontsize=12)
plt.ylabel('Systolic Blood Pressure (mmHg)', fontsize=12)

# Add reference lines
plt.axhline(140, color='red', linestyle='--', alpha=0.5, 
           label='Hypertension Threshold')
plt.axvline(30, color='orange', linestyle='--', alpha=0.5, 
           label='Obesity Threshold')

plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

print("\n" + "="*50)
print("VISUALIZATION 4: TREATMENT COST BY GENDER")
print("="*50)

# Box plot: Treatment cost by gender
gender_groups = [df[df['gender'] == 'M']['treatment_cost'].values,
                df[df['gender'] == 'F']['treatment_cost'].values]

plt.figure(figsize=(8, 6))
box_plot = plt.boxplot(gender_groups, labels=['Male', 'Female'], 
                      patch_artist=True)

# Color the boxes
colors = ['lightblue', 'lightpink']
for patch, color in zip(box_plot['boxes'], colors):
    patch.set_facecolor(color)

plt.title('Treatment Cost Distribution by Gender', 
          fontsize=16, fontweight='bold')
plt.ylabel('Treatment Cost ($)', fontsize=12)
plt.grid(True, alpha=0.3)

# Add statistics
male_median = df[df['gender'] == 'M']['treatment_cost'].median()
female_median = df[df['gender'] == 'F']['treatment_cost'].median()
print(f"Median cost - Male: ${male_median:,.0f}, Female: ${female_median:,.0f}")

plt.tight_layout()
plt.show()

print("\n" + "="*50)
print("VISUALIZATION 5: LENGTH OF STAY TRENDS")
print("="*50)

# Line plot: Average length of stay by age groups
age_bins = pd.cut(df['age'], bins=[0, 30, 45, 60, 100], 
                  labels=['18-30', '31-45', '46-60', '60+'])
df['age_group'] = age_bins

los_by_age = df.groupby('age_group')['length_of_stay'].mean()

plt.figure(figsize=(10, 6))
plt.plot(los_by_age.index, los_by_age.values, 
         marker='o', linewidth=3, markersize=8, color='#2E8B57')
plt.title('Average Length of Stay by Age Group', 
          fontsize=16, fontweight='bold')
plt.xlabel('Age Group', fontsize=12)
plt.ylabel('Average Length of Stay (days)', fontsize=12)
plt.grid(True, alpha=0.3)

# Add value labels
for i, v in enumerate(los_by_age.values):
    plt.text(i, v + 0.1, f'{v:.1f}', ha='center', va='bottom', 
             fontweight='bold')

plt.tight_layout()
plt.show()

print("\n" + "="*50)
print("SUMMARY STATISTICS")
print("="*50)

# Print summary insights
print("Key Healthcare Insights from Visualizations:")
print(f"• Average patient age: {df['age'].mean():.1f} years")
print(f"• Most common diagnosis: {df['diagnosis'].value_counts().index[0]}")
print(f"• Average BMI: {df['bmi'].mean():.1f} kg/m²")
print(f"• Average systolic BP: {df['systolic_bp'].mean():.1f} mmHg")
print(f"• Average treatment cost: ${df['treatment_cost'].mean():,.0f}")
print(f"• Average length of stay: {df['length_of_stay'].mean():.1f} days")

# Patients needing attention
high_risk = len(df[(df['systolic_bp'] > 140) & (df['bmi'] > 30)])
print(f"• High-risk patients (high BP + obesity): {high_risk}")

print("\n" + "="*50)
print("YOUR TURN - PRACTICE EXERCISES")
print("="*50)

print("""
Try creating these additional visualizations:

1. Histogram of BMI distribution with obesity/overweight thresholds
2. Bar chart of average treatment cost by diagnosis
3. Scatter plot of age vs length of stay
4. Box plot of BMI by diagnosis type
5. Line plot showing cost trends by age groups

Experiment with colors, labels, and styling to make your charts clear and professional!
""")

# Show final dataset sample
print("\nFinal dataset sample:")
print(df[['patient_id', 'age', 'gender', 'diagnosis', 'bmi', 'systolic_bp']].head())