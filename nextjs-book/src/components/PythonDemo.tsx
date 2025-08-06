'use client';

import { useState } from 'react';
import Link from 'next/link';

const PythonDemo = () => {
  const [selectedDemo, setSelectedDemo] = useState('basics');
  const [hasRun, setHasRun] = useState(false);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const demos = {
    basics: {
      title: '🐍 New Python Developer',
      description: 'Create your first variables and calculations',
      code: `# Welcome to Python!
# Let's create some variables and do calculations

name = "Future Python Developer"
current_year = 2025
python_version = 3.12

print(f"Hello, {name}!")
print(f"Python {python_version} in {current_year}")
print()

# Do some math
numbers = [10, 25, 30, 15, 40]
average = sum(numbers) / len(numbers)
maximum = max(numbers)

print("📊 Data Analysis:")
print(f"Numbers: {numbers}")
print(f"Average: {average:.1f}")
print(f"Maximum: {maximum}")
print()
print("🎉 Congratulations! You just ran Python code!")`
    },
    healthcare: {
      title: '🏥 Healthcare Data Specialist',
      description: 'Analyze patient data and calculate health metrics',
      code: `# Healthcare Data Analysis
import json
from statistics import mean

# Sample patient data
patients = [
    {"name": "Alice", "age": 34, "heart_rate": 72, "blood_pressure": "120/80"},
    {"name": "Bob", "age": 45, "heart_rate": 68, "blood_pressure": "115/75"},
    {"name": "Carol", "age": 29, "heart_rate": 75, "blood_pressure": "110/70"},
    {"name": "David", "age": 52, "heart_rate": 70, "blood_pressure": "125/85"}
]

print("🏥 Healthcare Analytics Dashboard")
print("=" * 35)

# Calculate average age and heart rate
ages = [p["age"] for p in patients]
heart_rates = [p["heart_rate"] for p in patients]

avg_age = mean(ages)
avg_hr = mean(heart_rates)

print(f"📈 Patient Statistics:")
print(f"   Total Patients: {len(patients)}")
print(f"   Average Age: {avg_age:.1f} years")
print(f"   Average Heart Rate: {avg_hr:.1f} bpm")
print()

print("👥 Patient Summary:")
for patient in patients:
    status = "Normal" if patient["heart_rate"] < 100 else "Elevated"
    print(f"   {patient['name']}: {patient['age']} years, HR: {patient['heart_rate']} ({status})")

print()
print("🎉 You just analyzed healthcare data with Python!")`
    },
    finance: {
      title: '💰 Quantitative Financial Analysts',
      description: 'Calculate investment returns and portfolio performance',
      code: `# Financial Portfolio Analysis
from datetime import datetime

# Sample investment portfolio
portfolio = {
    "AAPL": {"shares": 50, "buy_price": 150.00, "current_price": 175.50},
    "GOOGL": {"shares": 20, "buy_price": 2800.00, "current_price": 2950.25},
    "MSFT": {"shares": 30, "buy_price": 300.00, "current_price": 285.75},
    "TSLA": {"shares": 15, "buy_price": 200.00, "current_price": 180.00}
}

print("💰 Portfolio Performance Dashboard")
print("=" * 40)

total_invested = 0
total_current = 0

print("📊 Individual Stock Performance:")
print("-" * 40)

for stock, data in portfolio.items():
    invested = data["shares"] * data["buy_price"]
    current_value = data["shares"] * data["current_price"]
    gain_loss = current_value - invested
    gain_loss_pct = (gain_loss / invested) * 100
    
    status = "🟢" if gain_loss > 0 else "🔴"
    print(f"{status} {stock}:")
    print(f"   Shares: {data['shares']}")
    print(f"   Invested: $\{invested:,.2f}")
    print(f"   Current: $\{current_value:,.2f}")
    print(f"   Gain/Loss: $\{gain_loss:+,.2f} ({gain_loss_pct:+.1f}%)")
    print()
    
    total_invested += invested
    total_current += current_value

total_gain_loss = total_current - total_invested
total_return_pct = (total_gain_loss / total_invested) * 100

print("📈 Portfolio Summary:")
print(f"   Total Invested: $\{total_invested:,.2f}")
print(f"   Current Value: $\{total_current:,.2f}")
print(f"   Total Return: $\{total_gain_loss:+,.2f} ({total_return_pct:+.1f}%)")
print()
print("🎉 You just built a financial analysis tool with Python!")`
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setHasRun(false);
    
    // Simulate code execution with a delay
    setTimeout(() => {
      // Mock the output - in a real implementation you'd execute the Python code
      const demo = demos[selectedDemo as keyof typeof demos];
      
      if (selectedDemo === 'basics') {
        setOutput(`Hello, Future Python Developer!
Python 3.12 in 2025

📊 Data Analysis:
Numbers: [10, 25, 30, 15, 40]
Average: 24.0
Maximum: 40

🎉 Congratulations! You just ran Python code!`);
      } else if (selectedDemo === 'healthcare') {
        setOutput(`🏥 Healthcare Analytics Dashboard
===================================

📈 Patient Statistics:
   Total Patients: 4
   Average Age: 40.0 years
   Average Heart Rate: 71.2 bpm

👥 Patient Summary:
   Alice: 34 years, HR: 72 (Normal)
   Bob: 45 years, HR: 68 (Normal)
   Carol: 29 years, HR: 75 (Normal)
   David: 52 years, HR: 70 (Normal)

🎉 You just analyzed healthcare data with Python!`);
      } else if (selectedDemo === 'finance') {
        setOutput(`💰 Portfolio Performance Dashboard
========================================

📊 Individual Stock Performance:
----------------------------------------
🟢 AAPL:
   Shares: 50
   Invested: $7,500.00
   Current: $8,775.00
   Gain/Loss: +$1,275.00 (+17.0%)

🟢 GOOGL:
   Shares: 20
   Invested: $56,000.00
   Current: $59,005.00
   Gain/Loss: +$3,005.00 (+5.4%)

🔴 MSFT:
   Shares: 30
   Invested: $9,000.00
   Current: $8,572.50
   Gain/Loss: -$427.50 (-4.8%)

🔴 TSLA:
   Shares: 15
   Invested: $3,000.00
   Current: $2,700.00
   Gain/Loss: -$300.00 (-10.0%)

📈 Portfolio Summary:
   Total Invested: $75,500.00
   Current Value: $79,052.50
   Total Return: +$3,552.50 (+4.7%)

🎉 You just built a financial analysis tool with Python!`);
      }
      
      setIsRunning(false);
      setHasRun(true);
    }, 2000);
  };

  const currentDemo = demos[selectedDemo as keyof typeof demos];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Demo Selection */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {Object.entries(demos).map(([key, demo]) => (
          <button
            key={key}
            onClick={() => {
              setSelectedDemo(key);
              setHasRun(false);
              setOutput('');
            }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedDemo === key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-zinc-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {demo.title}
          </button>
        ))}
      </div>

      {/* Demo Description */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">{currentDemo.title}</h3>
        <p className="text-zinc-600">{currentDemo.description}</p>
      </div>

      {/* Code Editor */}
      <div className="bg-zinc-900 rounded-lg overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-zinc-400 text-sm font-mono">demo.py</span>
          </div>
          <button
            onClick={runCode}
            disabled={isRunning}
            className={`px-4 py-1.5 rounded font-medium text-sm transition-colors ${
              isRunning
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isRunning ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running...
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M9 14h1m4 0h1M13.5 2.5L13.5 5.5M13.5 18.5L13.5 21.5" />
                </svg>
                Run Code
              </span>
            )}
          </button>
        </div>
        
        <div className="p-4">
          <pre className="text-sm text-gray-300 font-mono leading-relaxed overflow-x-auto">
            {currentDemo.code}
          </pre>
        </div>
      </div>

      {/* Output */}
      {(output || isRunning) && (
        <div className="mt-4 bg-zinc-800 rounded-lg overflow-hidden shadow-lg">
          <div className="px-4 py-2 bg-zinc-700 border-b border-zinc-600">
            <span className="text-zinc-300 text-sm font-mono flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Output
            </span>
          </div>
          <div className="p-4">
            {isRunning ? (
              <div className="flex items-center text-zinc-400">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Executing Python code...
              </div>
            ) : (
              <pre className="text-sm text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
                {output}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Success Message */}
      {hasRun && (
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-green-800 mb-2">🎉 Perfect! This is How Your Team Will Learn</h3>
          <p className="text-green-700 mb-4">
            You just experienced our interactive platform firsthand. Your students will have this same hands-on experience with your training content.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                const nextDemo = selectedDemo === 'basics' ? 'healthcare' : selectedDemo === 'healthcare' ? 'finance' : 'basics';
                setSelectedDemo(nextDemo);
                setHasRun(false);
                setOutput('');
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Try Another Example
            </button>
            <Link
              href="/register/organization"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Get Started for Your Team
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PythonDemo;