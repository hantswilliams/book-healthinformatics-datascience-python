# Variables and Data Types Practice
# Let's practice creating and using different types of variables

# Patient Information Example
patient_id = "PT-001"
patient_name = "John Smith"
patient_age = 45
patient_height = 175.5  # in centimeters
patient_weight = 80.2   # in kilograms
has_insurance = True
is_smoker = False

# Display patient information
print("=== Patient Information ===")
print("ID:", patient_id)
print("Name:", patient_name)
print("Age:", patient_age, "years old")
print("Height:", patient_height, "cm")
print("Weight:", patient_weight, "kg")
print("Has Insurance:", has_insurance)
print("Smoker:", is_smoker)

# Calculate BMI (Body Mass Index)
height_in_meters = patient_height / 100
bmi = patient_weight / (height_in_meters ** 2)
print("BMI:", round(bmi, 2))

# Working with different data types
print("\n=== Data Type Examples ===")
print("Patient ID type:", type(patient_id))
print("Age type:", type(patient_age))
print("Height type:", type(patient_height))
print("Insurance status type:", type(has_insurance))

# Try creating your own patient variables below:
# Create variables for a different patient with:
# - Patient ID (string)
# - Age (integer)
# - Temperature (float) - normal body temp is around 98.6°F
# - Has fever (boolean) - True if temp > 100.4°F

# Your code here:
my_patient_id = "PT-002"
my_patient_age = 32
my_patient_temp = 99.1
my_has_fever = my_patient_temp > 100.4

print("\n=== My Patient ===")
print("ID:", my_patient_id)
print("Age:", my_patient_age)
print("Temperature:", my_patient_temp, "°F")
print("Has Fever:", my_has_fever)