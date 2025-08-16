'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PythonEditor from '@/components/PythonEditor';
import LogoMark from '@/components/LogoMark';

const examples = [
  {
    id: 'basic',
    title: 'Essential Healthcare Data',
    description: 'Building blocks for clinical excellence',
    code: `# Healthcare Excellence Through Data
# Professional-grade patient management

class PatientRecord:
    def __init__(self, patient_id, name, age):
        self.patient_id = patient_id
        self.name = name
        self.age = age
        self.vitals = {}
        self.medications = []
        self.alerts = []
    
    def add_vital_signs(self, **vitals):
        """Record comprehensive vital signs"""
        self.vitals.update(vitals)
        self._check_clinical_alerts()
    
    def _check_clinical_alerts(self):
        """Professional alert system"""
        if 'systolic_bp' in self.vitals:
            if self.vitals['systolic_bp'] > 140:
                self.alerts.append("Hypertension - Consider medication review")
        
        if 'heart_rate' in self.vitals:
            if self.vitals['heart_rate'] > 100:
                self.alerts.append("Tachycardia - Monitor closely")
    
    def clinical_summary(self):
        """Generate professional patient summary"""
        print(f"📋 CLINICAL RECORD - {self.name}")
        print("=" * 50)
        print(f"Patient ID: {self.patient_id}")
        print(f"Age: {self.age} years")
        
        if self.vitals:
            print("\\n🩺 CURRENT VITALS:")
            for vital, value in self.vitals.items():
                print(f"  • {vital.replace('_', ' ').title()}: {value}")
        
        if self.alerts:
            print("\\n⚠️  CLINICAL ALERTS:")
            for alert in self.alerts:
                print(f"  • {alert}")
        else:
            print("\\n✅ No active clinical alerts")

# Create and manage patient record
patient = PatientRecord("HC2024-001", "Sarah Johnson", 52)

# Record vital signs
patient.add_vital_signs(
    systolic_bp=145,
    diastolic_bp=92,
    heart_rate=78,
    temperature=98.4,
    oxygen_saturation=97
)

# Display professional summary
patient.clinical_summary()

print("\\n📊 CLINICAL INSIGHTS:")
print("• Blood pressure indicates Stage 1 Hypertension")
print("• Recommend lifestyle counseling and follow-up")
print("• Consider DASH diet and exercise program")`,
    complexity: 'Foundation',
    icon: '📋'
  },
  {
    id: 'intermediate',
    title: 'Quality Improvement Analytics',
    description: 'Evidence-based practice optimization',
    code: `# Healthcare Quality & Performance Analytics
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Professional quality metrics tracking
class QualityMetricsAnalyzer:
    def __init__(self):
        self.metrics = {}
        self.benchmarks = {
            'readmission_rate': 12.0,  # Industry benchmark: <12%
            'patient_satisfaction': 85.0,  # Target: >85%
            'length_of_stay': 4.2,  # Target: <4.2 days
            'medication_errors': 2.0,  # Target: <2 per 1000 doses
            'infection_rate': 1.5  # Target: <1.5%
        }
    
    def analyze_performance_data(self):
        """Comprehensive performance analysis"""
        np.random.seed(2024)
        
        # Simulate 6 months of quality data
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        
        performance_data = {
            'month': months,
            'readmissions': np.random.normal(10.5, 1.8, 6).clip(7, 15),
            'satisfaction_scores': np.random.normal(87.2, 3.1, 6).clip(80, 95),
            'avg_length_stay': np.random.normal(4.0, 0.4, 6).clip(3.2, 5.1),
            'medication_errors': np.random.normal(1.7, 0.3, 6).clip(1.0, 2.5),
            'infection_rates': np.random.normal(1.3, 0.2, 6).clip(0.8, 2.0),
            'total_admissions': np.random.randint(180, 220, 6)
        }
        
        df = pd.DataFrame(performance_data)
        
        print("🏥 HEALTHCARE QUALITY DASHBOARD")
        print("=" * 55)
        print("Six-Month Performance Analysis")
        print()
        
        # Calculate performance against benchmarks
        current_readmission = df['readmissions'].mean()
        current_satisfaction = df['satisfaction_scores'].mean()
        current_los = df['avg_length_stay'].mean()
        current_errors = df['medication_errors'].mean()
        current_infections = df['infection_rates'].mean()
        
        print("📊 KEY PERFORMANCE INDICATORS:")
        print("-" * 45)
        
        # Readmission rate analysis
        readmission_status = "✅" if current_readmission < self.benchmarks['readmission_rate'] else "⚠️"
        print(f"{readmission_status} 30-Day Readmission Rate: {current_readmission}% "
              f"(Benchmark: <{self.benchmarks['readmission_rate']}%)")
        
        # Patient satisfaction
        satisfaction_status = "✅" if current_satisfaction > self.benchmarks['patient_satisfaction'] else "⚠️"
        print(f"{satisfaction_status} Patient Satisfaction: {current_satisfaction}% "
              f"(Target: >{self.benchmarks['patient_satisfaction']}%)")
        
        # Length of stay
        los_status = "✅" if current_los < self.benchmarks['length_of_stay'] else "⚠️"
        print(f"{los_status} Average Length of Stay: {current_los} days "
              f"(Target: <{self.benchmarks['length_of_stay']} days)")
        
        # Safety metrics
        error_status = "✅" if current_errors < self.benchmarks['medication_errors'] else "⚠️"
        print(f"{error_status} Medication Error Rate: {current_errors}/1000 doses "
              f"(Target: <{self.benchmarks['medication_errors']})")
        
        infection_status = "✅" if current_infections < self.benchmarks['infection_rate'] else "⚠️"
        print(f"{infection_status} Healthcare-Associated Infections: {current_infections}% "
              f"(Target: <{self.benchmarks['infection_rate']}%)")
        
        print()
        print("📈 TREND ANALYSIS:")
        print("-" * 30)
        
        # Month-over-month trends
        readmission_trend = df['readmissions'].iloc[-1] - df['readmissions'].iloc[0]
        satisfaction_trend = df['satisfaction_scores'].iloc[-1] - df['satisfaction_scores'].iloc[0]
        
        trend_arrow = "📈" if readmission_trend < 0 else "📉"
        print(f"{trend_arrow} Readmissions: {readmission_trend}% change vs. January")
        
        trend_arrow = "📈" if satisfaction_trend > 0 else "📉"
        print(f"{trend_arrow} Satisfaction: {satisfaction_trend}% change vs. January")
        
        print()
        print("🎯 QUALITY IMPROVEMENT INITIATIVES:")
        print("• Implement bedside rounds protocol")
        print("• Enhanced discharge planning process")
        print("• Staff satisfaction and retention programs")
        print("• Patient education and engagement tools")
        
        return df

# Execute quality analysis
analyzer = QualityMetricsAnalyzer()
quality_data = analyzer.analyze_performance_data()

print()
print("💡 EVIDENCE-BASED RECOMMENDATIONS:")
print("Based on current performance metrics and industry best practices")`,
    complexity: 'Professional',
    icon: '📊'
  },
  {
    id: 'advanced',
    title: 'Strategic Health Insights',
    description: 'Executive dashboard for healthcare leaders',
    code: `# Strategic Healthcare Dashboard
import pandas as pd

# Executive Health Analytics Summary
print("🌟 EXECUTIVE HEALTHCARE DASHBOARD")
print("=" * 50)
print()

# Key Performance Indicators
kpis = {
    'Total Patients': 25000,
    'Patient Satisfaction': 89.2,
    'Average Length of Stay': 3.8,
    'Readmission Rate': 8.5,
    'Cost per Patient': 4200
}

print("📊 KEY PERFORMANCE INDICATORS:")
print("-" * 40)
for metric, value in kpis.items():
    if 'Rate' in metric or 'Satisfaction' in metric or 'Stay' in metric:
        unit = '%' if 'Rate' in metric or 'Satisfaction' in metric else ' days'
        status = '✅' if value < 10 or value > 85 else '⚠️'
    else:
        unit = ''
        status = '📈'
    
    print(f"{status} {metric}: {value}{unit}")

print()
print("🎯 STRATEGIC INITIATIVES:")
print("-" * 35)
print("• Population Health Management")
print("• Value-Based Care Contracts") 
print("• Digital Health Innovation")
print("• Quality Improvement Programs")

print()
print("💼 FINANCIAL PROJECTIONS:")
print("-" * 30)
print("Projected Annual Savings: $2.5M")
print("ROI on Technology Investment: 340%")
print("Cost Reduction Target: 12%")

print()
print("📈 GROWTH OPPORTUNITIES:")
print("-" * 28)
print("• Telehealth Expansion: +45% utilization")
print("• Preventive Care: +30% engagement")
print("• Chronic Care Management: +25% enrollment")

print()
print("🏆 INDUSTRY BENCHMARKS:")
print("-" * 28)
benchmarks = [
    "Patient Satisfaction: Top 10% nationally",
    "Readmission Rates: Below national average", 
    "Quality Scores: 4.8/5.0 stars",
    "Financial Performance: Above peer median"
]

for benchmark in benchmarks:
    print(f"✨ {benchmark}")

print()
print("🚀 STRATEGIC RECOMMENDATIONS:")
print("1. Expand population health analytics")
print("2. Implement AI-driven care coordination")
print("3. Enhance patient engagement platforms")
print("4. Optimize resource allocation strategies")`,
    complexity: 'Executive',
    icon: '🌟'
  }
];

export default function LandingV3() {
  const [currentExample, setCurrentExample] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  useEffect(() => {
    if (isAutoPlay) {
      const interval = setInterval(() => {
        setCurrentExample((prev) => (prev + 1) % examples.length);
      }, 9000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlay]);

  const currentCode = examples[currentExample];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <header className="border-b border-amber-200/60 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark className="h-8 w-8 text-amber-600" variant="brackets" />
            <span className="text-xl font-bold text-gray-900">HealthCare Pro</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-lg shadow-md transition-all duration-200"
          >
            Start Your Journey
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200 mb-8">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm font-medium text-amber-800">Trusted by Healthcare Leaders</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              <span className="text-amber-600">Professional</span> Healthcare
              <br />
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Data Excellence
              </span>
            </h1>
            
            <p className="text-xl text-gray-700 max-w-4xl mx-auto mb-12 leading-relaxed">
              Elevate your healthcare organization with enterprise-grade data analytics, quality improvement tools, 
              and strategic population health management. Built for today's healthcare professionals.
            </p>
            
            {/* Auto-play toggle */}
            <div className="flex items-center justify-center gap-6 mb-12">
              <button
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isAutoPlay
                    ? 'bg-green-100 text-green-700 border-2 border-green-200 shadow-md'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 shadow-sm'
                }`}
              >
                {isAutoPlay ? '⏸️ Pause Walkthrough' : '▶️ Auto Walkthrough'}
              </button>
              <span className="text-sm text-gray-600">
                See how professionals transform healthcare with data
              </span>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <nav className="flex">
                {examples.map((example, index) => (
                  <button
                    key={example.id}
                    onClick={() => setCurrentExample(index)}
                    className={`flex-1 px-8 py-6 text-sm font-semibold text-center transition-all duration-200 ${
                      currentExample === index
                        ? 'text-amber-700 border-b-3 border-amber-500 bg-white shadow-sm'
                        : 'text-gray-600 hover:text-amber-700 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">{example.icon}</span>
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
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {currentCode.title}
                </h3>
                <p className="text-gray-700 text-lg">{currentCode.description}</p>
              </div>
              
              {/* Interactive Python Editor */}
              <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg">
                <PythonEditor
                  initialCode={currentCode.code}
                />
              </div>
            </div>
          </div>

          {/* Value Props */}
          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200">
              <div className="text-5xl mb-6">📋</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Clinical Excellence</h3>
              <p className="text-gray-700 leading-relaxed">
                Professional-grade tools for patient management, clinical documentation, and evidence-based care delivery.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 border border-orange-200">
              <div className="text-5xl mb-6">📊</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Quality Analytics</h3>
              <p className="text-gray-700 leading-relaxed">
                Comprehensive quality metrics, performance dashboards, and improvement initiatives that drive results.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-red-100 to-pink-100 border border-red-200">
              <div className="text-5xl mb-6">🌟</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Strategic Impact</h3>
              <p className="text-gray-700 leading-relaxed">
                Population health management and strategic planning tools for healthcare transformation leaders.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-3 px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
            >
              🎯 Transform Your Healthcare Organization
            </Link>
            <p className="text-sm text-gray-600 mt-6 max-w-2xl mx-auto">
              Join healthcare executives and quality leaders who trust our platform for strategic decision-making
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}