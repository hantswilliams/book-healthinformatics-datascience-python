'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PythonEditor from '@/components/PythonEditor';
import LogoMark from '@/components/LogoMark';

const examples = [
  {
    id: 'basic',
    title: 'Start Simple: Python Basics',
    description: 'Learn fundamental programming concepts',
    code: `# Welcome to Python for Healthcare!
# Let's start with the basics

patient_name = "John Doe"
age = 45
temperature = 98.6

print(f"Patient: {patient_name}")
print(f"Age: {age} years")
print(f"Temperature: {temperature}°F")

# Check if temperature is normal
if temperature > 100.4:
    print("🔥 Fever detected - needs attention!")
else:
    print("✅ Normal temperature")`,
    complexity: 'Beginner',
    icon: '📚'
  },
  {
    id: 'intermediate',
    title: 'Healthcare Data Analysis',
    description: 'Work with real patient data structures',
    code: `# Healthcare Data Management
import pandas as pd

# Sample patient vitals data
patient_data = {
    'patient_id': ['P001', 'P002', 'P003', 'P004'],
    'systolic_bp': [120, 140, 110, 160],
    'diastolic_bp': [80, 90, 70, 100],
    'heart_rate': [72, 88, 65, 95],
    'age': [34, 56, 28, 67]
}

df = pd.DataFrame(patient_data)
print("Patient Vitals Overview:")
print(df)

# Calculate mean arterial pressure
df['map'] = (df['systolic_bp'] + 2 * df['diastolic_bp']) / 3
print(f"\\nAverage MAP: {df['map'].mean():.1f} mmHg")

# Flag high-risk patients
high_risk = df[(df['systolic_bp'] > 140) | (df['diastolic_bp'] > 90)]
print(f"\\n🚨 {len(high_risk)} patients need hypertension follow-up")`,
    complexity: 'Intermediate',
    icon: '📊'
  },
  {
    id: 'advanced',
    title: 'Population Health Analytics',
    description: 'Advanced clinical research and outcomes analysis',
    code: `# Advanced Healthcare Analytics
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Simulate real clinical trial data
np.random.seed(42)

# Generate synthetic patient cohort
n_patients = 1000
patients = pd.DataFrame({
    'patient_id': [f'P{i:04d}' for i in range(n_patients)],
    'age': np.random.normal(65, 15, n_patients).clip(18, 95),
    'baseline_hba1c': np.random.normal(8.2, 1.5, n_patients).clip(6, 12),
    'treatment_group': np.random.choice(['Control', 'Treatment'], n_patients),
    'comorbidities': np.random.poisson(2, n_patients)
})

# Simulate 6-month follow-up outcomes
treatment_effect = np.where(patients['treatment_group'] == 'Treatment', -1.2, -0.3)
patients['followup_hba1c'] = (patients['baseline_hba1c'] + 
                             treatment_effect + 
                             np.random.normal(0, 0.8, n_patients)).clip(5, 12)

# Clinical outcomes analysis
baseline_mean = patients['baseline_hba1c'].mean()
control_improvement = patients[patients['treatment_group'] == 'Control']['baseline_hba1c'].mean() - \\
                     patients[patients['treatment_group'] == 'Control']['followup_hba1c'].mean()
treatment_improvement = patients[patients['treatment_group'] == 'Treatment']['baseline_hba1c'].mean() - \\
                       patients[patients['treatment_group'] == 'Treatment']['followup_hba1c'].mean()

print("🏥 CLINICAL TRIAL RESULTS")
print("=" * 40)
print(f"Total patients enrolled: {len(patients):,}")
print(f"Average baseline HbA1c: {baseline_mean:.2f}%")
print(f"\\n📈 TREATMENT OUTCOMES:")
print(f"Control group improvement: {control_improvement:.2f}%")
print(f"Treatment group improvement: {treatment_improvement:.2f}%")
print(f"Additional benefit: {treatment_improvement - control_improvement:.2f}%")

# Statistical significance (simplified)
effect_size = (treatment_improvement - control_improvement) / patients['baseline_hba1c'].std()
print(f"\\n📊 Effect size: {effect_size:.3f}")

if effect_size > 0.5:
    print("🎯 CLINICALLY SIGNIFICANT improvement detected!")
    print("💊 Recommend treatment for target population")
else:
    print("⚠️  Treatment effect below clinical significance threshold")`,
    complexity: 'Advanced',
    icon: '🧬'
  }
];

export default function LandingV1() {
  const [currentExample, setCurrentExample] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  useEffect(() => {
    if (isAutoPlay) {
      const interval = setInterval(() => {
        setCurrentExample((prev) => (prev + 1) % examples.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlay]);

  const currentCode = examples[currentExample];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Medical grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(6 182 212) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>
      
      {/* Header */}
      <header className="relative border-b border-teal-200/60 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <LogoMark className="h-8 w-8 text-teal-600" variant="brackets" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <span className="text-xl font-bold text-gray-900">MedLearn Pro</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
          >
            <span className="mr-2">🩺</span>
            Start Learning
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100/80 border border-teal-200 mb-8 backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-teal-800">Evidence-Based Learning Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              <span className="block">Clinical Python</span>
              <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Excellence
              </span>
            </h1>
            
            <p className="text-xl text-gray-700 max-w-4xl mx-auto mb-12 leading-relaxed">
              Transform patient care through data-driven insights. Master clinical analytics, 
              research methodologies, and health informatics with our progressive Python curriculum 
              designed for healthcare professionals.
            </p>
            
            {/* Auto-play toggle */}
            <div className="flex items-center justify-center gap-6 mb-12">
              <button
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isAutoPlay
                    ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-lg shadow-green-200/50'
                    : 'bg-white/80 text-gray-700 border-2 border-gray-200 hover:bg-white shadow-md'
                }`}
              >
                {isAutoPlay ? '⏸️ Pause Clinical Demo' : '▶️ Start Clinical Demo'}
              </button>
              <span className="text-sm text-gray-600 bg-white/60 px-3 py-1 rounded-full">
                Progressive complexity: Basic → Advanced → Expert
              </span>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-teal-200/50 overflow-hidden">
            {/* Medical accent border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500"></div>
            
            {/* Tab Navigation */}
            <div className="border-b border-teal-100/80 bg-gradient-to-r from-teal-50/50 to-cyan-50/50">
              <nav className="flex">
                {examples.map((example, index) => (
                  <button
                    key={example.id}
                    onClick={() => setCurrentExample(index)}
                    className={`flex-1 px-8 py-6 text-sm font-semibold text-center transition-all duration-200 ${
                      currentExample === index
                        ? 'text-teal-700 border-b-3 border-teal-500 bg-white/90 shadow-lg'
                        : 'text-gray-600 hover:text-teal-700 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className={`text-2xl p-2 rounded-xl ${
                        currentExample === index 
                          ? 'bg-teal-100 shadow-sm' 
                          : 'bg-transparent'
                      }`}>
                        {example.icon}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{example.title}</div>
                        <div className="text-xs opacity-80 font-medium">{example.complexity}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Code Content */}
            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {currentCode.title}
                  </h3>
                </div>
                <p className="text-gray-700 text-lg bg-teal-50/50 px-4 py-2 rounded-lg border-l-4 border-teal-400">
                  {currentCode.description}
                </p>
              </div>
              
              {/* Interactive Python Editor */}
              <div className="border-2 border-teal-200/60 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-white to-teal-50/30">
                <PythonEditor
                  initialCode={currentCode.code}
                />
              </div>
            </div>
          </div>

          {/* Value Props */}
          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <div className="relative text-center p-8 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-teal-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-teal-200">
              <div className="absolute top-4 right-4 w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="text-5xl mb-6 filter drop-shadow-sm">🏥</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Clinical Applications</h3>
              <p className="text-gray-700 leading-relaxed">
                Real-world patient data scenarios, electronic health records analysis, and clinical decision support systems.
              </p>
            </div>
            
            <div className="relative text-center p-8 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-cyan-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-cyan-200">
              <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="text-5xl mb-6 filter drop-shadow-sm">📈</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Progressive Mastery</h3>
              <p className="text-gray-700 leading-relaxed">
                Structured learning path from Python fundamentals to advanced biostatistics and clinical research.
              </p>
            </div>
            
            <div className="relative text-center p-8 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-200">
              <div className="absolute top-4 right-4 w-2 h-2 bg-teal-500 rounded-full"></div>
              <div className="text-5xl mb-6 filter drop-shadow-sm">🧬</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Evidence-Based</h3>
              <p className="text-gray-700 leading-relaxed">
                Statistical analysis, clinical trials, outcomes research, and quality improvement methodologies.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20 text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl blur-lg opacity-30"></div>
              <Link
                href="/login"
                className="relative inline-flex items-center gap-3 px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-teal-500/25"
              >
                <span className="text-2xl">🩺</span>
                Begin Your Clinical Python Journey
              </Link>
            </div>
            <p className="text-sm text-gray-600 mt-6 max-w-2xl mx-auto bg-white/60 px-4 py-2 rounded-full">
              Trusted by 10,000+ healthcare professionals worldwide for evidence-based data analysis
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}