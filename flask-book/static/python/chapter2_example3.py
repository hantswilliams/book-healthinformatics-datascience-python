import pandas as pd

# Create a healthcare DataFrame
df = pd.DataFrame({
    'PatientID': [1, 2, 3, 4, 5],
    'Age': [65, 42, 78, 35, 50],
    'Department': ['Cardiology', 'Neurology', 'Cardiology', 'Oncology', 'Neurology'],
    'BloodPressure': [140, 120, 160, 118, 145],
    'Cholesterol': [240, 180, 260, 190, 230]
})

print("Original Healthcare DataFrame:")
print(df)
print("\n")

# 1. Filtering (WHERE in SQL)
print("Patients over 60 years old:")
print(df[df['Age'] > 60])
print("\n")

# 2. Selecting specific columns (SELECT in SQL)
print("Only PatientID and Department columns:")
print(df[['PatientID', 'Department']])
print("\n")

# 3. Grouping and aggregation (GROUP BY in SQL)
print("Average values by department:")
print(df.groupby('Department').mean())
print("\n")

# 4. Sorting (ORDER BY in SQL)
print("Sort by Age in descending order:")
print(df.sort_values('Age', ascending=False))
print("\n")

# 5. Filtering with multiple conditions
print("Patients in Cardiology with high cholesterol (>250):")
print(df[(df['Department'] == 'Cardiology') & (df['Cholesterol'] > 250)])
print("\n")

# 6. Basic statistics
print("Summary statistics for numerical columns:")
print(df.describe())
print("\n")

# 7. Value counts
print("Department distribution:")
print(df['Department'].value_counts())
