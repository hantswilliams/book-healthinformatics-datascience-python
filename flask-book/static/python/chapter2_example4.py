import pandas as pd
import numpy as np

# Create a DataFrame with missing values - common in healthcare data
df_missing = pd.DataFrame({
    'PatientID': [1, 2, 3, 4, 5],
    'Age': [65, np.nan, 78, 35, np.nan],
    'BloodPressure': [140, 120, np.nan, np.nan, 145],
    'Cholesterol': [240, 180, 260, np.nan, 230],
    'Glucose': [np.nan, 110, 140, 90, 130]
})

print("Healthcare DataFrame with missing values:")
print(df_missing)
print("\n")

# 1. Check for missing values
print("Count of missing values in each column:")
print(df_missing.isna().sum())
print("\n")

print("Percentage of missing values in each column:")
print(df_missing.isna().mean() * 100)
print("\n")

# 2. Fill missing values with the mean of each column
print("Fill missing values with column means:")
print(df_missing.fillna(df_missing.mean()))
print("\n")

# 3. Fill missing values with a specific value
print("Fill missing values with zeros:")
print(df_missing.fillna(0))
print("\n")

# 4. Fill missing values with forward fill (use previous value)
print("Fill missing values with forward fill:")
print(df_missing.fillna(method='ffill'))
print("\n")

# 5. Drop rows with any missing values
print("Drop rows with any missing values:")
print(df_missing.dropna())
print("\n")

# 6. Drop rows with all missing values
print("Drop rows with all missing values:")
print(df_missing.dropna(how='all'))
print("\n")

# 7. Analyze only complete cases
print("Select only rows with complete data for 'Age' and 'BloodPressure':")
print(df_missing.dropna(subset=['Age', 'BloodPressure']))
print("\n")

# 8. Replace missing values conditionally
# For example, fill Age NaN with median only for Cholesterol > 200
median_age = df_missing['Age'].median()
high_chol_idx = df_missing['Cholesterol'] > 200

df_conditional = df_missing.copy()
df_conditional.loc[high_chol_idx & df_conditional['Age'].isna(), 'Age'] = median_age

print("Fill Age NaN with median only for patients with high cholesterol:")
print(df_conditional)
