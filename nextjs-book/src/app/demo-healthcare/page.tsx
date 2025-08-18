"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PythonEditor from "@/components/PythonEditor";
import LogoMark from "@/components/LogoMark";
import { motion } from "framer-motion";

/*
  Healthcare-focused landing page with Stripe-inspired design:
  - Teal/cyan medical theme with subtle healthcare-focused gradients
  - Interactive Python assignments for healthcare professionals
  - Pricing tailored for medical institutions and training programs
*/

const examples = [
  {
    id: "basic",
    title: "Assignment: Patient data analysis",
    blurb: "Week 3 assignment: process and analyze patient vital signs.",
    file: "patient_vitals.py",
    code: `# MedPython 101 - Assignment 3: Patient Vitals Analysis
# Student: Dr. Sarah Kim | Due: Oct 15, 2024

def analyze_patient_vitals(patient_data):
    """
    Analyze patient vital signs and generate clinical insights.
    Teaches: data structures, conditional logic, medical calculations.
    """
    # Patient vitals dictionary
    vitals = {
        'patient_id': patient_data['id'],
        'systolic_bp': patient_data['systolic'],
        'diastolic_bp': patient_data['diastolic'],
        'heart_rate': patient_data['hr'],
        'temperature': patient_data['temp'],
        'oxygen_sat': patient_data['spo2']
    }
    
    # Calculate Mean Arterial Pressure (MAP)
    map_value = (vitals['systolic_bp'] + 2 * vitals['diastolic_bp']) / 3
    vitals['map'] = round(map_value, 1)
    
    # Clinical assessment flags
    alerts = []
    
    # Blood pressure assessment
    if vitals['systolic_bp'] > 140 or vitals['diastolic_bp'] > 90:
        alerts.append("⚠️ Hypertension - requires follow-up")
    elif vitals['systolic_bp'] < 90:
        alerts.append("🔴 Hypotension - immediate attention needed")
    
    # Heart rate assessment
    if vitals['heart_rate'] > 100:
        alerts.append("⚡ Tachycardia detected")
    elif vitals['heart_rate'] < 60:
        alerts.append("🐌 Bradycardia detected")
    
    # Temperature assessment
    if vitals['temperature'] > 100.4:
        alerts.append("🔥 Fever - monitor closely")
    elif vitals['temperature'] < 96.0:
        alerts.append("❄️ Hypothermia risk")
    
    # Oxygen saturation
    if vitals['oxygen_sat'] < 95:
        alerts.append("🫁 Low oxygen saturation - check respiratory status")
    
    return {
        'vitals': vitals,
        'alerts': alerts,
        'risk_level': 'HIGH' if len(alerts) > 2 else 'MODERATE' if alerts else 'LOW'
    }

# Test with sample patient data
patient = {
    'id': 'P001',
    'systolic': 145,
    'diastolic': 92,
    'hr': 88,
    'temp': 101.2,
    'spo2': 96
}

result = analyze_patient_vitals(patient)

print("🏥 PATIENT ASSESSMENT REPORT")
print("=" * 40)
print(f"Patient ID: {result['vitals']['patient_id']}")
print(f"Blood Pressure: {result['vitals']['systolic_bp']}/{result['vitals']['diastolic_bp']} mmHg")
print(f"Mean Arterial Pressure: {result['vitals']['map']} mmHg")
print(f"Heart Rate: {result['vitals']['heart_rate']} bpm")
print(f"Temperature: {result['vitals']['temperature']}°F")
print(f"Oxygen Saturation: {result['vitals']['oxygen_sat']}%")
print(f"\\nRisk Level: {result['risk_level']}")

if result['alerts']:
    print("\\n🚨 CLINICAL ALERTS:")
    for alert in result['alerts']:
        print(f"  {alert}")
else:
    print("\\n✅ All vitals within normal limits")`,
  },
  {
    id: "intermediate",
    title: "Assignment: Drug interaction checker",
    blurb: "Week 8 assignment: build a medication safety system with APIs.",
    file: "drug_interaction.py",
    code: `# MedPython 101 - Assignment 8: Drug Interaction Safety System
# Student: Dr. Marcus Chen | Due: Nov 12, 2024

import json
from datetime import datetime

class DrugInteractionChecker:
    """
    A medication safety system for checking drug interactions.
    Demonstrates: APIs, data processing, healthcare informatics, safety systems.
    """
    
    def __init__(self):
        # Simplified drug interaction database
        self.interactions = {
            ('warfarin', 'aspirin'): {
                'severity': 'HIGH',
                'description': 'Increased bleeding risk',
                'recommendation': 'Monitor INR closely, consider dose adjustment'
            },
            ('metformin', 'contrast_dye'): {
                'severity': 'MODERATE',
                'description': 'Risk of lactic acidosis',
                'recommendation': 'Hold metformin 48h before contrast procedure'
            },
            ('digoxin', 'furosemide'): {
                'severity': 'MODERATE',
                'description': 'Hypokalemia increases digoxin toxicity',
                'recommendation': 'Monitor potassium and digoxin levels'
            },
            ('simvastatin', 'clarithromycin'): {
                'severity': 'HIGH',
                'description': 'Increased statin levels, rhabdomyolysis risk',
                'recommendation': 'Consider statin dose reduction or temporary hold'
            }
        }
        
        self.patient_medications = []
    
    def add_medication(self, drug_name, dose, frequency, prescriber):
        """Add a medication to patient's current list."""
        medication = {
            'drug': drug_name.lower(),
            'dose': dose,
            'frequency': frequency,
            'prescriber': prescriber,
            'date_added': datetime.now().strftime('%Y-%m-%d')
        }
        
        self.patient_medications.append(medication)
        print(f"✅ Added {drug_name} {dose} {frequency}")
        
        # Check for interactions with newly added drug
        self.check_interactions(drug_name.lower())
    
    def check_interactions(self, new_drug):
        """Check for interactions with existing medications."""
        interactions_found = []
        
        for med in self.patient_medications:
            existing_drug = med['drug']
            if existing_drug != new_drug:
                # Check both directions of interaction
                interaction = (self.interactions.get((existing_drug, new_drug)) or 
                             self.interactions.get((new_drug, existing_drug)))
                
                if interaction:
                    interactions_found.append({
                        'drugs': f"{existing_drug} + {new_drug}",
                        'severity': interaction['severity'],
                        'description': interaction['description'],
                        'recommendation': interaction['recommendation']
                    })
        
        if interactions_found:
            print(f"\\n🚨 DRUG INTERACTIONS DETECTED with {new_drug}:")
            for interaction in interactions_found:
                print(f"\\n  🔴 {interaction['drugs'].upper()}")
                print(f"  Severity: {interaction['severity']}")
                print(f"  Risk: {interaction['description']}")
                print(f"  Action: {interaction['recommendation']}")
        else:
            print(f"\\n✅ No known interactions found with {new_drug}")
    
    def generate_medication_list(self):
        """Generate current medication list for clinical review."""
        print("\\n📋 CURRENT MEDICATION LIST")
        print("=" * 50)
        
        if not self.patient_medications:
            print("No medications on file")
            return
        
        for i, med in enumerate(self.patient_medications, 1):
            print(f"{i}. {med['drug'].title()}")
            print(f"   Dose: {med['dose']}")
            print(f"   Frequency: {med['frequency']}")
            print(f"   Prescriber: {med['prescriber']}")
            print(f"   Started: {med['date_added']}")
            print()
    
    def clinical_decision_support(self):
        """Provide clinical decision support summary."""
        total_interactions = 0
        high_risk_count = 0
        
        # Check all possible drug combinations
        for i, med1 in enumerate(self.patient_medications):
            for med2 in self.patient_medications[i+1:]:
                interaction = (self.interactions.get((med1['drug'], med2['drug'])) or 
                             self.interactions.get((med2['drug'], med1['drug'])))
                if interaction:
                    total_interactions += 1
                    if interaction['severity'] == 'HIGH':
                        high_risk_count += 1
        
        print("\\n🎯 CLINICAL DECISION SUPPORT")
        print("-" * 30)
        print(f"Total medications: {len(self.patient_medications)}")
        print(f"Drug interactions: {total_interactions}")
        print(f"High-risk interactions: {high_risk_count}")
        
        if high_risk_count > 0:
            print("\\n⚠️ PRIORITY: Review high-risk interactions immediately")
        elif total_interactions > 0:
            print("\\n📝 Recommend: Monitor for moderate-risk interactions")
        else:
            print("\\n✅ No significant drug interactions detected")

# Example usage - Emergency Department scenario
print("🏥 DRUG INTERACTION SAFETY SYSTEM")
print("Emergency Department - Patient Admission")
print("=" * 50)

checker = DrugInteractionChecker()

# Patient presents with chest pain, current medications:
checker.add_medication("Warfarin", "5mg", "daily", "Dr. Johnson")
checker.add_medication("Metformin", "500mg", "twice daily", "Dr. Smith")

# New medications being considered:
print("\\n💊 Adding new medications for chest pain workup...")
checker.add_medication("Aspirin", "81mg", "daily", "Dr. Emergency")

# Generate comprehensive report
checker.generate_medication_list()
checker.clinical_decision_support()

print("\\n🎓 LEARNING OBJECTIVES ACHIEVED:")
print("• Healthcare data structures and medication management")
print("• Drug interaction database querying and safety checks")
print("• Clinical decision support system design")
print("• Real-world medical informatics application")`,
  },
  {
    id: "advanced",
    title: "Assignment: EHR data pipeline",
    blurb: "Final project: build an Electronic Health Record analytics system.",
    file: "ehr_analytics.py",
    code: String.raw`# MedPython 101 - Final Project: EHR Analytics Dashboard
# Student: Dr. Jennifer Rodriguez | Due: Dec 10, 2024

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

class EHRAnalytics:
    """
    Electronic Health Record analytics system for population health insights.
    Final project demonstrating: data science, statistical analysis, 
    healthcare informatics, and clinical research methods.
    """
    
    def __init__(self):
        self.patient_data = []
        self.encounters = []
        self.generate_synthetic_ehr_data()
    
    def generate_synthetic_ehr_data(self):
        """Generate realistic EHR data for analysis."""
        print("🏥 Generating synthetic EHR dataset...")
        
        # Create 1000 patients with realistic demographics
        np.random.seed(42)
        
        conditions = ['Diabetes', 'Hypertension', 'COPD', 'CAD', 'Depression', 'Obesity']
        insurance_types = ['Medicare', 'Medicaid', 'Commercial', 'Uninsured']
        
        for patient_id in range(1, 1001):
            # Demographics
            age = np.random.normal(65, 20).clip(18, 95)
            gender = np.random.choice(['M', 'F'])
            
            # Comorbidities (more likely with age)
            num_conditions = np.random.poisson(max(0, (age - 40) / 20))
            patient_conditions = np.random.choice(conditions, 
                                                size=min(num_conditions, len(conditions)), 
                                                replace=False).tolist()
            
            self.patient_data.append({
                'patient_id': f'P{patient_id:04d}',
                'age': int(age),
                'gender': gender,
                'conditions': patient_conditions,
                'insurance': np.random.choice(insurance_types, 
                                            p=[0.3, 0.2, 0.4, 0.1])
            })
            
            # Generate encounters for each patient
            num_encounters = np.random.poisson(3)  # Average 3 visits per year
            for _ in range(num_encounters):
                encounter_date = datetime.now() - timedelta(
                    days=np.random.randint(0, 365)
                )
                
                # Simulate visit types and costs
                visit_type = np.random.choice(['Office Visit', 'Emergency', 'Inpatient', 'Telehealth'],
                                            p=[0.5, 0.2, 0.1, 0.2])
                
                base_cost = {'Office Visit': 200, 'Emergency': 2000, 
                           'Inpatient': 8000, 'Telehealth': 100}[visit_type]
                
                # Cost increases with number of conditions
                cost_multiplier = 1 + len(patient_conditions) * 0.3
                total_cost = base_cost * cost_multiplier * np.random.uniform(0.7, 1.5)
                
                self.encounters.append({
                    'patient_id': f'P{patient_id:04d}',
                    'encounter_date': encounter_date.strftime('%Y-%m-%d'),
                    'visit_type': visit_type,
                    'cost': round(total_cost, 2),
                    'primary_diagnosis': np.random.choice(patient_conditions) if patient_conditions else 'Wellness'
                })
        
        print(f"✅ Generated {len(self.patient_data)} patients and {len(self.encounters)} encounters")
    
    def population_health_analysis(self):
        """Analyze population health trends and outcomes."""
        print("\\n📊 POPULATION HEALTH ANALYSIS")
        print("=" * 50)
        
        # Convert to DataFrame for analysis
        patients_df = pd.DataFrame(self.patient_data)
        encounters_df = pd.DataFrame(self.encounters)
        
        # Demographics analysis
        avg_age = patients_df['age'].mean()
        gender_dist = patients_df['gender'].value_counts()
        
        print(f"👥 PATIENT DEMOGRAPHICS:")
        print(f"  Total Patients: {len(patients_df):,}")
        print(f"  Average Age: {avg_age:.1f} years")
        print(f"  Gender Distribution: {gender_dist['M']} Male, {gender_dist['F']} Female")
        
        # Most common conditions
        all_conditions = []
        for conditions in patients_df['conditions']:
            all_conditions.extend(conditions)
        
        condition_counts = pd.Series(all_conditions).value_counts()
        print(f"\\n🏥 TOP CHRONIC CONDITIONS:")
        for condition, count in condition_counts.head(5).items():
            prevalence = (count / len(patients_df)) * 100
            print(f"  {condition}: {count} patients ({prevalence:.1f}%)")
        
        # Healthcare utilization
        encounters_df['cost'] = pd.to_numeric(encounters_df['cost'])
        total_cost = encounters_df['cost'].sum()
        avg_cost_per_encounter = encounters_df['cost'].mean()
        
        visit_type_counts = encounters_df['visit_type'].value_counts()
        
        print(f"\\n💰 HEALTHCARE UTILIZATION:")
        print(f"  Total Encounters: {len(encounters_df):,}")
        print(f"  Total Healthcare Costs: $\{total_cost:,.2f}")
        print(f"  Average Cost per Encounter: $\{avg_cost_per_encounter:.2f}")
        
        print(f"\\n🏥 ENCOUNTER TYPES:")
        for visit_type, count in visit_type_counts.items():
            percentage = (count / len(encounters_df)) * 100
            avg_cost = encounters_df[encounters_df['visit_type'] == visit_type]['cost'].mean()
            print(f"  \{visit_type}: \{count} visits (\{percentage:.1f}%), Avg Cost: $\{avg_cost:.2f}")
    
    def risk_stratification(self):
        """Identify high-risk patients for care management."""
        print("\\n🎯 RISK STRATIFICATION ANALYSIS")
        print("-" * 40)
        
        patients_df = pd.DataFrame(self.patient_data)
        encounters_df = pd.DataFrame(self.encounters)
        
        # Calculate risk scores for each patient
        risk_scores = []
        
        for _, patient in patients_df.iterrows():
            patient_id = patient['patient_id']
            
            # Risk factors
            age_risk = min(patient['age'] / 10, 10)  # Age factor (max 10)
            condition_risk = len(patient['conditions']) * 2  # 2 points per condition
            
            # Utilization risk (high emergency department usage)
            patient_encounters = encounters_df[encounters_df['patient_id'] == patient_id]
            ed_visits = len(patient_encounters[patient_encounters['visit_type'] == 'Emergency'])
            utilization_risk = ed_visits * 3  # 3 points per ED visit
            
            # Insurance risk (uninsured = higher risk)
            insurance_risk = 5 if patient['insurance'] == 'Uninsured' else 0
            
            total_risk = age_risk + condition_risk + utilization_risk + insurance_risk
            
            risk_scores.append({
                'patient_id': patient_id,
                'age': patient['age'],
                'conditions': len(patient['conditions']),
                'ed_visits': ed_visits,
                'insurance': patient['insurance'],
                'risk_score': round(total_risk, 1)
            })
        
        # Sort by risk score
        risk_df = pd.DataFrame(risk_scores).sort_values('risk_score', ascending=False)
        
        # High-risk patients (top 10%)
        high_risk_threshold = risk_df['risk_score'].quantile(0.9)
        high_risk_patients = risk_df[risk_df['risk_score'] >= high_risk_threshold]
        
        print(f"High-Risk Threshold: {high_risk_threshold:.1f} points")
        print(f"High-Risk Patients: {len(high_risk_patients)} ({len(high_risk_patients)/len(risk_df)*100:.1f}%)")
        
        print(f"\\n🚨 TOP 5 HIGHEST RISK PATIENTS:")
        for _, patient in high_risk_patients.head().iterrows():
            print(f"  {patient['patient_id']}: Score {patient['risk_score']}")
            print(f"    Age: {patient['age']}, Conditions: {patient['conditions']}, ED Visits: {patient['ed_visits']}")
            print(f"    Insurance: {patient['insurance']}")
            print()
    
    def quality_metrics(self):
        """Calculate healthcare quality and outcome metrics."""
        print("\\n⭐ QUALITY METRICS & OUTCOMES")
        print("-" * 35)
        
        encounters_df = pd.DataFrame(self.encounters)
        patients_df = pd.DataFrame(self.patient_data)
        
        # Readmission rate (simplified simulation)
        inpatient_encounters = encounters_df[encounters_df['visit_type'] == 'Inpatient']
        simulated_readmissions = len(inpatient_encounters) * 0.12  # 12% readmission rate
        
        # Telehealth adoption
        telehealth_encounters = len(encounters_df[encounters_df['visit_type'] == 'Telehealth'])
        telehealth_rate = (telehealth_encounters / len(encounters_df)) * 100
        
        # Cost per quality metrics
        diabetic_patients = patients_df[patients_df['conditions'].apply(lambda x: 'Diabetes' in x)]
        diabetic_cost = encounters_df[encounters_df['patient_id'].isin(diabetic_patients['patient_id'])]['cost'].sum()
        
        print(f"📈 KEY QUALITY INDICATORS:")
        print(f"  Estimated Readmission Rate: {simulated_readmissions/len(inpatient_encounters)*100:.1f}%")
        print(f"  Telehealth Adoption: {telehealth_rate:.1f}%")
        print(f"  Diabetic Care Cost: $\{diabetic_cost:,.2f}")
        
        # Recommendations
        print(f"\\n💡 CLINICAL RECOMMENDATIONS:")
        if telehealth_rate < 15:
            print("  • Increase telehealth programs to improve access")
        if simulated_readmissions > 10:
            print("  • Implement care transition programs to reduce readmissions")
        print("  • Focus care management on high-risk patient cohorts")
        print("  • Consider value-based care contracts for chronic conditions")

# Run comprehensive EHR analytics
print("🏥 ELECTRONIC HEALTH RECORD ANALYTICS SYSTEM")
print("=" * 60)

ehr = EHRAnalytics()
ehr.population_health_analysis()
ehr.risk_stratification()
ehr.quality_metrics()

print("\\n✅ FINAL PROJECT DEMONSTRATES:")
print("• Large-scale healthcare data processing and analysis")
print("• Population health management and risk stratification")
print("• Healthcare quality metrics and outcome measurement")
print("• Real-world clinical informatics and data science")
print("• Electronic Health Record system design principles")`,
  },
];

export default function LandingV1() {
  const [tab, setTab] = useState(0);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return; const id = setInterval(() => setTab((t) => (t + 1) % examples.length), 7000);
    return () => clearInterval(id);
  }, [auto]);

  const active = examples[tab];

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-white">
      {/* Layered healthcare aurora background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(14,165,233,0.35),transparent)] blur-2xl" />
        <div className="absolute top-1/3 -right-24 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(6,182,212,0.35),transparent)] blur-2xl" />
        <div className="absolute bottom-0 left-1/4 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(34,197,94,0.25),transparent)] blur-2xl" />
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.08]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0B0E]/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-6 w-6 text-white" variant="brackets" />
            <span className="text-sm font-semibold tracking-tight text-white/90">Interactive Coding: Health Care</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex text-sm text-white/70">
            <Link href="#features" className="hover:text-white">Features</Link>
            <Link href="#examples" className="hover:text-white">Examples</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/90 hover:bg-white/5">Sign in</Link>
            <Link href="/register/organization" className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black hover:bg-white/90">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Healthcare-themed gradient background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_0%_0%,#0ea5e9_0%,transparent_60%),radial-gradient(120%_80%_at_100%_0%,#06b6d4_0%,transparent_60%),radial-gradient(120%_80%_at_50%_100%,#22c55e_0%,transparent_60%)] opacity-90" />
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            {/* Left copy */}
            <div>
              <div className="mb-4 w-fit rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-semibold text-black/70 shadow-sm backdrop-blur">Trusted by Medical Schools & Health Systems</div>
              <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
                <span className="block">Healthcare data science</span>
                <span className="block">education platform</span>
                <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-green-300 bg-clip-text text-transparent">for medical professionals</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-black/70">
                Train healthcare professionals in Python programming, medical data analysis, and clinical informatics. From EHR analytics to population health insights.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <Link href="/register/organization" className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white hover:bg-black/90">Get started</Link>
                <Link href="/contact" className="rounded-full border border-black/10 bg-white/70 px-6 py-2 text-sm font-semibold text-black hover:bg-white/90 backdrop-blur">Contact sales</Link>
              </div>
            </div>

            {/* Right stacked product preview */}
            <div className="relative">
              {/* Back card (analytics) */}
              <div className="absolute -right-6 -top-6 hidden w-[340px] rotate-2 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-2xl backdrop-blur md:block">
                <div className="text-sm font-semibold text-black">Patient Analytics</div>
                <div className="mt-2 h-28 w-full">
                  {/* Healthcare metrics chart */}
                  <svg viewBox="0 0 300 100" className="h-full w-full">
                    <polyline fill="none" stroke="currentColor" strokeWidth="3" className="text-teal-600" points="0,80 40,65 80,70 120,50 160,55 200,35 240,40 280,25" />
                  </svg>
                </div>
                <div className="mt-2 text-xs text-black/70">Patient outcomes improved <span className="text-green-600 font-semibold">+28.5%</span></div>
              </div>

              {/* Front card (editor) */}
              <div className="rounded-2xl border border-black/10 bg-white/90 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
                  <div className="text-sm font-semibold text-black">Medical Data Analysis • Patient Vitals</div>
                  <div className="text-xs text-black/60">Python</div>
                </div>
                <div className="h-[360px]">
                  <PythonEditor initialCode={examples[0].code} />
                </div>
              </div>
            </div>
          </div>

          {/* Healthcare institution marquee */}
          <div className="mt-12 overflow-hidden">
            <div className="mx-auto grid max-w-5xl grid-cols-2 items-center gap-6 opacity-70 sm:grid-cols-4">
              {["Mayo Clinic Ed","Johns Hopkins","Cleveland Clinic","UCSF Health","Mass General","Kaiser Permanente"].map((n) => (
                <div key={n} className="flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs tracking-wide text-white/70">{n}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Code examples */}
      <section id="examples" className="px-4">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl">
            {/* Tab bar */}
            <div className="relative flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-sm">
              {/* Moving active background */}
              <motion.div
                layout
                className="absolute inset-y-1 left-1 rounded-lg bg-white/10"
                style={{ width: `${100 / examples.length}%` , translateX: `calc(${tab} * (100% + 4px))` }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
              {examples.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => setTab(i)}
                  className={`relative z-10 flex-1 rounded-lg px-3 py-2 text-left ${i===tab?"text-white":"text-white/70 hover:text-white"}`}
                >
                  <div className="text-[11px] uppercase tracking-wider">{e.file}</div>
                  <div className="text-[13px] font-medium">{e.title}</div>
                </button>
              ))}
            </div>

            {/* Panel */}
            <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr,1fr]">
              <div className="rounded-xl border border-white/10 bg-[#0B0C11]">
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/60">
                  <div className="truncate">{active.blurb}</div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5">python</span>
                    <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5">medical</span>
                  </div>
                </div>
                <div className="h-[460px] rounded-b-xl">
                  <PythonEditor initialCode={active.code} />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0B0C11] p-4">
                <h3 className="text-sm font-semibold">Medical concepts covered</h3>
                <ul className="mt-2 space-y-2 text-sm text-white/70">
                  {tab===0 && (
                    <>
                      <li>• Patient vital signs analysis</li>
                      <li>• Clinical decision support</li>
                      <li>• Medical alert systems</li>
                    </>
                  )}
                  {tab===1 && (
                    <>
                      <li>• Drug interaction checking</li>
                      <li>• Medication safety systems</li>
                      <li>• Clinical informatics</li>
                    </>
                  )}
                  {tab===2 && (
                    <>
                      <li>• Electronic Health Records</li>
                      <li>• Population health analytics</li>
                      <li>• Healthcare quality metrics</li>
                    </>
                  )}
                </ul>
                <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                  Medical professionals: these examples use real clinical workflows and healthcare data standards.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="px-4">
        <div className="mx-auto max-w-6xl py-16 md:py-20">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {h:"Clinical data fluency", p:"Train staff on EHR analytics, population health metrics, and healthcare quality measures."},
              {h:"Medical safety systems", p:"Build drug interaction checkers, clinical decision support, and patient safety applications."},
              {h:"Healthcare compliance", p:"HIPAA-compliant training environment with medical data governance and privacy controls."},
            ].map((f) => (
              <div key={f.h} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">{f.h}</div>
                <p className="mt-1 text-sm text-white/70">{f.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Bottom CTA */}
      <section className="px-4">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-gradient-to-r from-white/10 to-white/5 p-8 text-center">
          <h2 className="text-2xl font-semibold">Ready to advance healthcare education?</h2>
          <p className="mt-2 text-white/70">Join medical institutions training the next generation of data-driven healthcare professionals. HIPAA-compliant with clinical data security.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/register/organization" className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-black hover:bg-white/90">Start medical program</Link>
            <Link href="/contact" className="rounded-full border border-white/15 bg-white/5 px-6 py-2 text-sm font-semibold text-white hover:bg-white/10">Request demo</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 px-4 py-10 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Interactive Coding: Health Care · Privacy · Terms · HIPAA Compliance
      </footer>
    </div>
  );
}