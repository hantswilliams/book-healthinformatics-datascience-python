import pandas as pd
from io import StringIO

# Creating sample CSV data in memory
csv_data = """
PatientID,Age,BloodPressure,Cholesterol,Diagnosis
P001,65,140/90,240,Hypertension
P002,42,120/80,180,Healthy
P003,78,160/95,260,Hypertension
P004,35,118/76,190,Healthy
P005,50,145/92,230,Hypertension
"""

# Convert string data to file-like object
csv_file = StringIO(csv_data.strip())

# Read CSV from the string IO object
df = pd.read_csv(csv_file)

print("Original DataFrame from CSV:")
print(df)
print("\n")

# Example of using different parameters
# Only read specific columns
columns_df = pd.read_csv(csv_file, usecols=['PatientID', 'Age', 'Diagnosis'])
print("DataFrame with selected columns:")
print(columns_df)
print("\n")

# Reset the StringIO buffer to start
csv_file.seek(0)

# Example of filtering data during loading
filtered_df = pd.read_csv(csv_file, skiprows=lambda i: i > 0 and df.loc[i-1, 'Age'] < 50)
print("DataFrame with filtered rows (Age ≥ 50):")
print(filtered_df)
