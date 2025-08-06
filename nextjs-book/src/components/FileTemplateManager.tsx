'use client';

import { useState } from 'react';

interface Template {
  name: string;
  type: 'markdown' | 'python';
  description: string;
  content: string;
}

interface FileTemplateManagerProps {
  onCreateFromTemplate?: (template: Template, filename: string) => void;
}

export default function FileTemplateManager({ onCreateFromTemplate }: FileTemplateManagerProps) {
  const [selectedType, setSelectedType] = useState<'markdown' | 'python'>('markdown');
  const [filename, setFilename] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const templates: Template[] = [
    // Markdown Templates
    {
      name: 'Introduction',
      type: 'markdown',
      description: 'Chapter or section introduction template',
      content: `# Introduction to [Topic]

Welcome to this section! Here we'll explore the fundamentals of [topic] and how it applies to health informatics.

## Learning Objectives

By the end of this section, you will be able to:

- [ ] Understand the basic concepts of [topic]
- [ ] Apply these concepts to healthcare scenarios
- [ ] Identify key use cases in health informatics

## Key Concepts

### Concept 1
Brief explanation of the first key concept...

### Concept 2
Brief explanation of the second key concept...

## Healthcare Applications

This topic is particularly relevant in healthcare because:

1. **Application 1**: Description of how this applies to patient care
2. **Application 2**: Description of how this applies to data management
3. **Application 3**: Description of how this applies to research

## Coming Up

In the next section, we'll put these concepts into practice with hands-on exercises.`
    },
    {
      name: 'Concept Explanation',
      type: 'markdown',
      description: 'Template for explaining technical concepts',
      content: `# [Concept Name]

## Overview

[Concept Name] is a fundamental concept in [field] that allows us to [brief description].

## Definition

**[Concept Name]**: [Clear, concise definition]

## Why It Matters

In health informatics, this concept is crucial because:

- **Reason 1**: Explanation
- **Reason 2**: Explanation
- **Reason 3**: Explanation

## How It Works

The process involves several key steps:

1. **Step 1**: Description
2. **Step 2**: Description
3. **Step 3**: Description

## Examples in Healthcare

### Example 1: [Scenario Name]
Description of how this concept applies to a specific healthcare scenario.

\`\`\`
Example code or data structure if applicable
\`\`\`

### Example 2: [Scenario Name]
Another practical example showing the concept in action.

## Key Takeaways

- ✅ **Point 1**: Summary of key learning
- ✅ **Point 2**: Summary of key learning
- ✅ **Point 3**: Summary of key learning

## Next Steps

Now let's practice using this concept with some hands-on exercises!`
    },
    {
      name: 'Chapter Summary',
      type: 'markdown',
      description: 'End-of-chapter summary and review',
      content: `# Chapter Summary

Congratulations! You've completed this chapter and learned some essential concepts for health informatics.

## What You've Learned

### ✅ Core Concepts
- **Concept 1**: Brief summary of what was covered
- **Concept 2**: Brief summary of what was covered
- **Concept 3**: Brief summary of what was covered

### ✅ Practical Skills
- **Skill 1**: What you can now do
- **Skill 2**: What you can now do
- **Skill 3**: What you can now do

### ✅ Healthcare Applications
- **Application 1**: How this applies to patient care
- **Application 2**: How this applies to data analysis
- **Application 3**: How this applies to research

## Key Tools & Libraries

During this chapter, you worked with:

- **Tool 1**: Brief description of its purpose
- **Tool 2**: Brief description of its purpose
- **Tool 3**: Brief description of its purpose

## Review Questions

Test your understanding:

1. **Question 1**: [Concept-based question]
2. **Question 2**: [Application-based question]
3. **Question 3**: [Critical thinking question]

## Coming Up Next

In the next chapter, we'll build on these foundations to explore:

- **Topic 1**: Preview of upcoming content
- **Topic 2**: Preview of upcoming content
- **Topic 3**: Preview of upcoming content

## Additional Resources

- [Resource 1]: Description
- [Resource 2]: Description
- [Resource 3]: Description

Ready for the next challenge? Let's continue your learning journey!`
    },

    // Python Templates
    {
      name: 'Basic Exercise',
      type: 'python',
      description: 'Simple Python exercise with examples',
      content: `# [Exercise Name]
# Practice basic Python concepts for health informatics

print("=== [Exercise Name] ===")
print("Let's practice [concept] with healthcare data")

# Example: Basic variables and operations
patient_name = "John Doe"
patient_age = 45
patient_height = 175  # cm
patient_weight = 80   # kg

print(f"Patient: {patient_name}")
print(f"Age: {patient_age} years")
print(f"Height: {patient_height} cm")
print(f"Weight: {patient_weight} kg")

# Calculate BMI
height_m = patient_height / 100
bmi = patient_weight / (height_m ** 2)
print(f"BMI: {bmi:.2f}")

# Your turn! Complete the exercises below:

# Exercise 1: [Description]
# TODO: Write your code here


# Exercise 2: [Description]  
# TODO: Write your code here


# Exercise 3: [Description]
# TODO: Write your code here


print("\\n=== Exercise Complete! ===")
print("Great job practicing [concept]!")
`
    },
    {
      name: 'Data Analysis Exercise',
      type: 'python',
      description: 'Exercise focused on data analysis with pandas',
      content: `# [Data Analysis Exercise Name]
# Analyze healthcare data using pandas

import pandas as pd
import matplotlib.pyplot as plt

print("=== [Exercise Name] ===")
print("Let's analyze some healthcare data!")

# Create sample healthcare dataset
# In a real scenario, you'd load this from a CSV or database
sample_data = {
    'patient_id': ['P001', 'P002', 'P003', 'P004', 'P005'],
    'age': [34, 67, 45, 23, 56],
    'gender': ['F', 'M', 'F', 'M', 'F'],
    'condition': ['Hypertension', 'Diabetes', 'Healthy', 'Asthma', 'Diabetes'],
    'systolic_bp': [140, 160, 120, 110, 145],
    'diastolic_bp': [90, 95, 80, 70, 85]
}

df = pd.DataFrame(sample_data)

print("\\n=== Dataset Overview ===")
print(df.head())
print(f"\\nDataset shape: {df.shape}")

# Basic analysis
print("\\n=== Basic Statistics ===")
print(f"Average age: {df['age'].mean():.1f} years")
print(f"Average systolic BP: {df['systolic_bp'].mean():.1f} mmHg")

# Exercise tasks:

# Task 1: Filter data
print("\\n=== Task 1: Data Filtering ===")
# TODO: Find patients over 50 years old
# TODO: Find patients with high blood pressure (systolic > 140)

# Task 2: Group analysis
print("\\n=== Task 2: Group Analysis ===")
# TODO: Calculate average age by condition
# TODO: Count patients by gender

# Task 3: Data visualization
print("\\n=== Task 3: Visualization ===")
# TODO: Create a bar chart of conditions
# TODO: Create a scatter plot of age vs systolic BP

# Your analysis here:


print("\\n=== Analysis Complete! ===")
print("Excellent work with healthcare data analysis!")
`
    },
    {
      name: 'Machine Learning Exercise',
      type: 'python',
      description: 'Introduction to ML concepts with healthcare data',
      content: `# [Machine Learning Exercise Name]
# Introduction to machine learning with healthcare data

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

print("=== [Exercise Name] ===")
print("Let's explore machine learning with healthcare data!")

# Generate sample healthcare dataset
np.random.seed(42)
n_patients = 200

# Create realistic healthcare features
data = {
    'age': np.random.normal(50, 15, n_patients).clip(18, 90).astype(int),
    'bmi': np.random.normal(26, 5, n_patients).clip(15, 50),
    'systolic_bp': np.random.normal(130, 20, n_patients).clip(90, 200).astype(int),
    'cholesterol': np.random.normal(200, 40, n_patients).clip(100, 400).astype(int),
    'exercise_hours': np.random.exponential(2, n_patients).clip(0, 20)
}

df = pd.DataFrame(data)

# Create target variable (simplified risk assessment)
# This is for educational purposes only - not for real medical decisions!
risk_score = (
    (df['age'] > 60).astype(int) +
    (df['bmi'] > 30).astype(int) +
    (df['systolic_bp'] > 140).astype(int) +
    (df['cholesterol'] > 240).astype(int) +
    (df['exercise_hours'] < 1).astype(int)
)
df['high_risk'] = (risk_score >= 3).astype(int)

print("\\n=== Dataset Overview ===")
print(df.head(10))
print(f"\\nDataset shape: {df.shape}")
print(f"High-risk patients: {df['high_risk'].sum()} ({df['high_risk'].mean()*100:.1f}%)")

# Exercise tasks:

# Task 1: Data exploration
print("\\n=== Task 1: Explore the Data ===")
# TODO: Calculate summary statistics
# TODO: Look at correlations between variables

# Task 2: Prepare data for machine learning
print("\\n=== Task 2: Data Preparation ===")
# TODO: Split features and target
# TODO: Create train/test split

# Task 3: Train and evaluate a model
print("\\n=== Task 3: Machine Learning Model ===")
# TODO: Train a logistic regression model
# TODO: Make predictions and evaluate performance

# Your code here:


print("\\n=== Important Note ===")
print("This is a simplified educational example.")
print("Real medical ML requires extensive validation and regulatory approval!")
print("\\n=== Exercise Complete! ===")
`
    }
  ];

  const filteredTemplates = templates.filter(t => t.type === selectedType);

  const handleCreateFile = () => {
    if (!selectedTemplate || !filename) return;
    
    const extension = selectedTemplate.type === 'markdown' ? '.md' : '.py';
    const fullFilename = filename.endsWith(extension) ? filename : filename + extension;
    
    onCreateFromTemplate?.(selectedTemplate, fullFilename);
    setFilename('');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-zinc-900 mb-4">File Templates</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Selection */}
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              File Type
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedType('markdown')}
                className={`px-3 py-2 text-sm rounded-md ${
                  selectedType === 'markdown'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-zinc-700 border border-gray-300'
                }`}
              >
                📝 Markdown
              </button>
              <button
                onClick={() => setSelectedType('python')}
                className={`px-3 py-2 text-sm rounded-md ${
                  selectedType === 'python'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-zinc-700 border border-gray-300'
                }`}
              >
                🐍 Python
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Choose Template
            </label>
            <div className="space-y-2">
              {filteredTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    selectedTemplate === template
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-zinc-900">{template.name}</div>
                  <div className="text-sm text-zinc-600">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Filename
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={`Enter filename${selectedType === 'markdown' ? '.md' : '.py'}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleCreateFile}
            disabled={!selectedTemplate || !filename}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Create File from Template
          </button>
        </div>

        {/* Template Preview */}
        <div>
          <h4 className="text-sm font-medium text-zinc-700 mb-2">Template Preview</h4>
          <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
            {selectedTemplate ? (
              <pre className="text-xs font-mono whitespace-pre-wrap text-zinc-800">
                {selectedTemplate.content}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                <div className="text-center">
                  <span className="text-4xl block mb-2">📄</span>
                  <p>Select a template to see preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}