import json
import pandas as pd
import requests
from io import StringIO

# Example 1: Basic JSON Handling
print("Example 1: Basic JSON to DataFrame")
json_data = """
{
  "patients": [
    {"id": "P001", "name": "John Smith", "age": 45, "condition": "Hypertension"},
    {"id": "P002", "name": "Mary Johnson", "age": 62, "condition": "Diabetes"},
    {"id": "P003", "name": "Robert Williams", "age": 35, "condition": "Asthma"}
  ]
}
"""

# Parse the JSON string
data = json.loads(json_data)

# Convert to DataFrame
df1 = pd.DataFrame(data['patients'])
print(df1)
print("\n")

# Example 2: Nested JSON
print("Example 2: Nested JSON to DataFrame")
nested_json = """
{
  "hospital": "General Hospital",
  "department": "Cardiology",
  "patients": [
    {
      "id": "P001",
      "demographics": {"name": "John Smith", "age": 45, "gender": "Male"},
      "vitals": {"blood_pressure": "140/90", "heart_rate": 82, "temperature": 98.6}
    },
    {
      "id": "P002",
      "demographics": {"name": "Mary Johnson", "age": 62, "gender": "Female"},
      "vitals": {"blood_pressure": "150/95", "heart_rate": 90, "temperature": 99.1}
    }
  ]
}
"""

# Parse the nested JSON
nested_data = json.loads(nested_json)

# Flatten nested JSON using pandas json_normalize
df2 = pd.json_normalize(nested_data['patients'])
print(df2)
print("\n")

# Example 3: Simulating JSON from an API
print("Example 3: JSON API Simulation")
# Create a simulated CSV response from an API
csv_api_data = """id,name,age,blood_pressure
P001,John Smith,45,140/90
P002,Mary Johnson,62,150/95
P003,Robert Williams,35,120/80
"""

# Convert to StringIO and read as CSV
csv_io = StringIO(csv_api_data)
df3 = pd.read_csv(csv_io)
print(df3)
print("\n")

# Example 4: Handling complex nested structures
print("Example 4: Complex Nested JSON")
complex_json = """
{
  "hospital_data": {
    "name": "General Hospital",
    "departments": [
      {
        "name": "Cardiology",
        "patients": [
          {"id": "C001", "diagnosis": "Hypertension"},
          {"id": "C002", "diagnosis": "Heart Failure"}
        ]
      },
      {
        "name": "Neurology",
        "patients": [
          {"id": "N001", "diagnosis": "Epilepsy"},
          {"id": "N002", "diagnosis": "Stroke"}
        ]
      }
    ]
  }
}
"""

# Parse the complex JSON
complex_data = json.loads(complex_json)

# Extract and process nested data
departments = []
for dept in complex_data['hospital_data']['departments']:
    for patient in dept['patients']:
        departments.append({
            'department': dept['name'],
            'patient_id': patient['id'],
            'diagnosis': patient['diagnosis']
        })

df4 = pd.DataFrame(departments)
print(df4)
