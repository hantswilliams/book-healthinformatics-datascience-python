import pandas as pd
import json
import requests
from io import StringIO
import random

# Basic pandas DataFrame creation from a dictionary
print("Creating a simple DataFrame from a dictionary:")
data = {
    'Name': ['Alice', 'Bob', 'Charlie'],
    'Age': [28, 35, 24],
    'Gender': ['Female', 'Male', 'Male']
}

df = pd.DataFrame(data)
print(df)
print("\n" + "-"*50 + "\n")

# Example of reading a CSV file (commented out as it requires a file)
print("Example of reading a CSV file:")
print("# Basic CSV reading")
print("data = pd.read_csv('data.csv')")
print("# With additional parameters")
print("data = pd.read_csv('data.csv', nrows=100, usecols=['Name', 'Age'], dtype={'Name': str, 'Age': int})")
print("\n" + "-"*50 + "\n")

# Example of reading from a URL (using a built-in pandas dataset)
print("Example of reading data from a URL:")
# Creating a simple CSV in memory to demonstrate
csv_data = """
Name,Age,Department,Salary
John,30,IT,60000
Jane,25,HR,55000
Bob,45,Finance,70000
Alice,35,IT,65000
Mike,40,Marketing,60000
"""
# Convert string data to file-like object
csv_file = StringIO(csv_data.strip())
# Read CSV from the string IO object
url_df = pd.read_csv(csv_file)
print(url_df)
print("\n" + "-"*50 + "\n")

# Example of reading from a JSON API
print("Example of JSON data processing:")
# Creating a simple JSON in memory to demonstrate
json_data = """
{
  "data": [
    {"Name": "John", "Age": 30, "Department": "IT", "Salary": 60000},
    {"Name": "Jane", "Age": 25, "Department": "HR", "Salary": 55000},
    {"Name": "Bob", "Age": 45, "Department": "Finance", "Salary": 70000}
  ]
}
"""
# Parse the JSON
parsed_json = json.loads(json_data)
# Extract only the data part
json_df = pd.DataFrame(parsed_json['data'])
print(json_df)
print("\n" + "-"*50 + "\n")

# Sample code for reading a random sample from a file
print("Example of reading a random sample from a large file:")
print("import pandas as pd")
print("import random")
print("# Load a random sample of 1% of rows from a CSV file")
print("data = pd.read_csv('large_data.csv', header=None, skiprows=lambda i: i > 0 and random.random() > 0.01)")
print("\n" + "-"*50 + "\n")

# Example of SQL-like operations on a DataFrame
print("Example of SQL-like operations on a DataFrame:")
# First, creating a sample DataFrame
df = pd.DataFrame({
    'PatientID': [1, 2, 3, 4, 5],
    'Name': ['John', 'Jane', 'Bob', 'Alice', 'Mike'],
    'Age': [30, 25, 45, 35, 40],
    'Department': ['Cardiology', 'Neurology', 'Cardiology', 'Oncology', 'Neurology'],
    'BloodPressure': [120, 115, 130, 125, 110]
})

# Displaying original data
print("Original DataFrame:")
print(df)
print()

# Filtering (WHERE in SQL)
print("Filtering (WHERE in SQL):")
print("Patients over 30 years old:")
print(df[df['Age'] > 30])
print()

# Selecting specific columns (SELECT in SQL)
print("Selecting specific columns (SELECT in SQL):")
print("Only Name and Age columns:")
print(df[['Name', 'Age']])
print()

# Grouping and aggregation (GROUP BY in SQL)
print("Grouping and aggregation (GROUP BY in SQL):")
print("Average age by department:")
print(df.groupby('Department')['Age'].mean())
print()

# Sorting (ORDER BY in SQL)
print("Sorting (ORDER BY in SQL):")
print("Sort by Age in descending order:")
print(df.sort_values('Age', ascending=False))
print("\n" + "-"*50 + "\n")

print("Example of handling missing values:")
# Create a DataFrame with missing values
df_missing = pd.DataFrame({
    'PatientID': [1, 2, 3, 4, 5],
    'Age': [30, None, 45, 35, None],
    'BloodPressure': [120, 115, None, None, 110]
})

print("DataFrame with missing values:")
print(df_missing)
print()

# Check for missing values
print("Check for missing values:")
print(df_missing.isna().sum())
print()

# Fill missing values
print("Fill missing values with mean:")
print(df_missing.fillna(df_missing.mean()))
print()

# Drop rows with missing values
print("Drop rows with missing values:")
print(df_missing.dropna())
print("\n" + "-"*50 + "\n")

print("This notebook demonstrates basic pandas operations for data loading and manipulation.")
print("Use these examples as a starting point for your own data analysis projects in health informatics.")
