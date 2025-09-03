# Intro to Python Course Example

## Chapter 1: Python Basics & Variables

### Section 1: Welcome to Python (Markdown)
```markdown
# Welcome to Python Programming! 🐍

Python is a powerful, easy-to-learn programming language that's perfect for beginners and experienced programmers alike. In this course, we'll cover the fundamental concepts you need to start writing Python code.

## What You'll Learn
- Variables and data types
- Basic operations and expressions
- Control flow (if statements, loops)
- Functions and code organization

## Why Python?
- **Simple syntax** - Reads like English
- **Versatile** - Used for web development, data science, AI, and more
- **Large community** - Tons of libraries and resources
- **Career opportunities** - High demand in tech industry

Let's start with your first Python program!
```

### Section 2: Your First Python Program (Python)
```python
# Your very first Python program!
# This is a comment - Python ignores everything after the #

print("Hello, World!")
print("Welcome to Python programming!")

# Try changing the message and run the code again
print("I'm learning Python!")
```

### Section 3: Understanding Variables (Markdown)
```markdown
# Variables in Python

Variables are like labeled boxes that store data. In Python, creating a variable is simple - just assign a value to a name.

## Variable Rules
- Names can contain letters, numbers, and underscores
- Must start with a letter or underscore
- Case sensitive (`name` and `Name` are different)
- Cannot use Python keywords (`if`, `for`, `def`, etc.)

## Good Variable Names
```python
student_name = "Alice"
age = 25
is_enrolled = True
```

## Bad Variable Names
```python
2names = "Bob"  # Can't start with number
class = "Python"  # 'class' is a keyword
```
```

### Section 4: Working with Variables (Python)
```python
# Creating variables
name = "Alice"
age = 25
height = 5.6
is_student = True

# Printing variables
print("Name:", name)
print("Age:", age)
print("Height:", height, "feet")
print("Is student:", is_student)

# Try creating your own variables below:
favorite_color = "blue"
lucky_number = 7

print("My favorite color is", favorite_color)
print("My lucky number is", lucky_number)
```

### Section 5: Python Data Types (Assessment - Multiple Choice)
```json
{
  "questionText": "Which of the following are valid Python data types?",
  "questionType": "multiple_choice",
  "options": ["int", "string", "boolean", "float", "list"],
  "correctAnswer": ["int", "float", "list"],
  "explanation": "In Python, the basic data types are int (integers), float (decimal numbers), str (strings), bool (booleans), and list (collections). Note that 'string' is not correct - Python uses 'str'.",
  "points": 2,
  "allowRetries": true,
  "showFeedback": true,
  "partialCredit": true,
  "caseSensitive": false
}
```

---

## Chapter 2: Data Types and Operations

### Section 1: Numbers and Math (Markdown)
```markdown
# Working with Numbers

Python handles two main types of numbers:
- **Integers** (`int`) - Whole numbers like 42, -17, 0
- **Floats** (`float`) - Decimal numbers like 3.14, -2.5, 1.0

## Basic Math Operations
| Operation | Symbol | Example | Result |
|-----------|--------|---------|--------|
| Addition | `+` | `5 + 3` | `8` |
| Subtraction | `-` | `10 - 4` | `6` |
| Multiplication | `*` | `6 * 7` | `42` |
| Division | `/` | `15 / 3` | `5.0` |
| Floor Division | `//` | `17 // 5` | `3` |
| Modulo | `%` | `17 % 5` | `2` |
| Exponentiation | `**` | `2 ** 3` | `8` |
```

### Section 2: Math Practice (Python)
```python
# Basic arithmetic
result1 = 10 + 5
result2 = 20 - 8
result3 = 6 * 7
result4 = 15 / 3

print("Addition:", result1)
print("Subtraction:", result2)
print("Multiplication:", result3)
print("Division:", result4)

# More advanced operations
power = 2 ** 8
remainder = 17 % 5
floor_div = 17 // 5

print("2 to the power of 8:", power)
print("17 divided by 5 remainder:", remainder)
print("17 floor divided by 5:", floor_div)

# Try your own calculations:
# Calculate the area of a rectangle (length * width)
length = 12
width = 8
area = length * width
print(f"Rectangle area: {area}")
```

### Section 3: Strings and Text (Markdown)
```markdown
# Working with Strings

Strings are text data in Python. You can create them using single quotes, double quotes, or triple quotes for multi-line text.

## String Creation
```python
single_quotes = 'Hello'
double_quotes = "World"
multi_line = """This is a
multi-line string"""
```

## Common String Methods
- `.upper()` - Convert to uppercase
- `.lower()` - Convert to lowercase
- `.strip()` - Remove whitespace
- `.replace()` - Replace text
- `.split()` - Split into list
- `len()` - Get length
```

### Section 4: String Operations (Python)
```python
# Creating strings
first_name = "Alice"
last_name = "Johnson"
city = "New York"

# String concatenation
full_name = first_name + " " + last_name
print("Full name:", full_name)

# F-strings (modern way to format strings)
introduction = f"Hi, I'm {first_name} and I live in {city}"
print(introduction)

# String methods
message = "  Welcome to Python Programming!  "
print("Original:", repr(message))
print("Uppercase:", message.upper())
print("Lowercase:", message.lower())
print("Stripped:", message.strip())
print("Length:", len(message))

# Try creating your own string operations:
hobby = "programming"
sentence = f"I love {hobby} because it's creative and logical!"
print(sentence)
```

### Section 5: Data Type Quiz (Assessment - True/False)
```json
{
  "questionText": "In Python, the result of 10 / 3 is an integer.",
  "questionType": "true_false",
  "correctAnswer": false,
  "explanation": "In Python 3, the / operator always returns a float, even when dividing integers. 10 / 3 returns 3.3333333333333335. To get integer division, use // which would give 3.",
  "points": 1,
  "allowRetries": true,
  "showFeedback": true
}
```

---

## Chapter 3: Control Flow and Functions

### Section 1: Making Decisions with If Statements (Markdown)
```markdown
# Control Flow: Making Decisions

Programs often need to make decisions based on data. Python uses `if`, `elif`, and `else` statements for this.

## Basic If Statement
```python
age = 18
if age >= 18:
    print("You can vote!")
```

## If-Else Statement
```python
temperature = 75
if temperature > 80:
    print("It's hot outside!")
else:
    print("Nice weather!")
```

## Multiple Conditions
```python
score = 85
if score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")
elif score >= 70:
    print("Grade: C")
else:
    print("Grade: F")
```
```

### Section 2: If Statements Practice (Python)
```python
# Simple if statement
age = 25
if age >= 18:
    print("You are an adult")

# If-else statement
temperature = 72
if temperature > 75:
    print("It's warm!")
else:
    print("It's cool!")

# Multiple conditions - grade calculator
score = 88

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

print(f"Your score of {score} is a grade {grade}")

# Try your own: Create a program that checks if a number is positive, negative, or zero
number = -5
if number > 0:
    print("Positive number")
elif number < 0:
    print("Negative number")
else:
    print("Zero")
```

### Section 3: Functions - Reusable Code (Markdown)
```markdown
# Functions: Organizing Your Code

Functions are reusable blocks of code that perform specific tasks. They help organize your code and avoid repetition.

## Function Syntax
```python
def function_name(parameters):
    """Optional docstring"""
    # Function body
    return result  # Optional
```

## Simple Function
```python
def greet():
    print("Hello, World!")

greet()  # Call the function
```

## Function with Parameters
```python
def greet_person(name):
    print(f"Hello, {name}!")

greet_person("Alice")
```

## Function with Return Value
```python
def add_numbers(a, b):
    result = a + b
    return result

sum_result = add_numbers(5, 3)
```
```

### Section 4: Creating Functions (Python)
```python
# Simple function
def say_hello():
    print("Hello from my function!")

# Call the function
say_hello()

# Function with parameters
def greet_user(name, age):
    print(f"Hello {name}, you are {age} years old!")

greet_user("Bob", 30)

# Function that returns a value
def calculate_area(length, width):
    area = length * width
    return area

# Use the function
room_area = calculate_area(12, 10)
print(f"Room area: {room_area} square feet")

# Function with multiple return values
def get_name_parts(full_name):
    parts = full_name.split()
    first_name = parts[0]
    last_name = parts[-1]
    return first_name, last_name

first, last = get_name_parts("Alice Johnson")
print(f"First: {first}, Last: {last}")

# Try creating your own function:
def calculate_tip(bill_amount, tip_percentage):
    tip = bill_amount * (tip_percentage / 100)
    total = bill_amount + tip
    return tip, total

tip_amount, total_bill = calculate_tip(50, 18)
print(f"Tip: ${tip_amount:.2f}, Total: ${total_bill:.2f}")
```

### Section 5: Functions Quiz (Assessment - Short Answer)
```json
{
  "questionText": "What Python keyword is used to define a function?",
  "questionType": "short_answer",
  "correctAnswer": "def",
  "explanation": "The 'def' keyword is used to define functions in Python. It's followed by the function name, parentheses for parameters, and a colon.",
  "points": 1,
  "allowRetries": true,
  "showFeedback": true,
  "caseSensitive": false
}
```