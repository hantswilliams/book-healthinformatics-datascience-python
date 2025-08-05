import pandas as pd

# Create a simple DataFrame from a dictionary
data = {
    'Name': ['Alice', 'Bob', 'Charlie'],
    'Age': [28, 35, 24],
    'Gender': ['Female', 'Male', 'Male']
}

df = pd.DataFrame(data)
print("Basic DataFrame created from a dictionary:")
print(df)
print("\n")

# Create a DataFrame with healthcare data
health_data = {
    'PatientID': ['P001', 'P002', 'P003', 'P004', 'P005'],
    'Age': [65, 42, 78, 35, 50],
    'BloodPressure': ['120/80', '130/85', '160/90', '125/82', '140/88'],
    'Diagnosis': ['Hypertension', 'Diabetes', 'Heart Disease', 'Healthy', 'Obesity']
}

health_df = pd.DataFrame(health_data)
print("Healthcare DataFrame:")
print(health_df)
