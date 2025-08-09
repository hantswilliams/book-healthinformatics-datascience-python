'use client';

import { useState } from 'react';
import EnhancedChapterBuilder from '@/components/EnhancedChapterBuilder';

interface EnhancedSection {
  id: string;
  type: 'markdown' | 'python';
  title: string;
  content: string;
  executionMode: 'shared' | 'isolated' | 'inherit';
  order: number;
  dependsOn?: string[];
  isEditing?: boolean;
}

interface EnhancedChapter {
  id: string;
  title: string;
  emoji: string;
  defaultExecutionMode: 'shared' | 'isolated';
  sections: EnhancedSection[];
  order: number;
}

export default function TestEnhancedBuilder() {
  const [chapter, setChapter] = useState<EnhancedChapter>({
    id: 'demo-chapter',
    title: 'Introduction to Pandas for Healthcare',
    emoji: '🏥',
    defaultExecutionMode: 'shared',
    sections: [
      {
        id: 'section-1',
        type: 'markdown',
        title: 'Overview',
        content: `# Welcome to Healthcare Data Analysis

This chapter introduces you to using pandas for healthcare data analysis.

## What You'll Learn
- Loading and exploring healthcare datasets
- Basic data cleaning and preprocessing
- Creating visualizations for medical data
- Statistical analysis of patient outcomes

Let's get started!`,
        executionMode: 'inherit',
        order: 0
      },
      {
        id: 'section-2',
        type: 'python',
        title: 'Import Libraries',
        content: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

print("Libraries loaded successfully!")
print(f"Pandas version: {pd.__version__}")`,
        executionMode: 'shared',
        order: 1
      },
      {
        id: 'section-3',
        type: 'python',
        title: 'Load Sample Healthcare Data',
        content: `# Create sample patient data
patient_data = {
    'patient_id': ['P001', 'P002', 'P003', 'P004', 'P005'],
    'age': [34, 67, 45, 23, 56],
    'gender': ['F', 'M', 'F', 'M', 'F'],
    'condition': ['Hypertension', 'Diabetes', 'Healthy', 'Asthma', 'Diabetes'],
    'systolic_bp': [140, 160, 120, 110, 145],
    'diastolic_bp': [90, 95, 80, 70, 85],
    'cholesterol': [220, 180, 190, 160, 210]
}

df = pd.DataFrame(patient_data)
print("Dataset created:")
print(df)
print(f"\\nDataset shape: {df.shape}")`,
        executionMode: 'shared',
        order: 2
      },
      {
        id: 'section-4',
        type: 'python',
        title: 'Independent Exercise - Calculate BMI',
        content: `# Independent exercise: Calculate BMI for sample patients
# This cell runs in isolation - create your own data

# Sample patient heights and weights
heights = [165, 180, 170, 175, 160]  # cm
weights = [65, 85, 70, 80, 60]       # kg

# TODO: Calculate BMI for each patient
# BMI = weight(kg) / (height(m))^2

# Your code here:


# Expected output: BMI values around 18.5-30`,
        executionMode: 'isolated',
        order: 3
      }
    ],
    order: 0
  });

  const handleChapterUpdate = (updatedChapter: EnhancedChapter) => {
    setChapter(updatedChapter);
  };

  const handleSave = async (chapterToSave: EnhancedChapter) => {
    // Simulate API call
    console.log('Saving chapter:', chapterToSave);
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Chapter saved successfully!');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b1020' }}>
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        borderBottom: '1px solid #23305d',
        backgroundColor: 'rgba(18, 26, 51, 0.5)'
      }}>
        <h1 style={{ 
          color: '#e8ecff', 
          margin: 0, 
          fontSize: '24px' 
        }}>
          Enhanced Chapter Builder Demo
        </h1>
        <p style={{ 
          color: '#a6b0d6', 
          margin: '8px 0 0 0',
          fontSize: '14px'
        }}>
          Test the new Monaco Editor integration and execution modes
        </p>
      </div>
      
      <EnhancedChapterBuilder 
        initialChapter={chapter}
        onChapterUpdate={handleChapterUpdate}
        onSave={handleSave}
      />
      
      {/* Debug Panel */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '300px',
        background: '#121a33',
        border: '1px solid #23305d',
        borderRadius: '12px',
        padding: '16px',
        color: '#e8ecff',
        fontSize: '12px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Chapter State</h3>
        <div>
          <strong>Title:</strong> {chapter.title}<br/>
          <strong>Sections:</strong> {chapter.sections.length}<br/>
          <strong>Default Mode:</strong> {chapter.defaultExecutionMode}<br/>
          <strong>Modes Used:</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
            {chapter.sections.map(section => (
              <li key={section.id}>
                {section.title}: {section.executionMode === 'inherit' ? `${chapter.defaultExecutionMode} (inherited)` : section.executionMode}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}