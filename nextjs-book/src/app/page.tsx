'use client';

import Link from "next/link";
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PythonDemo from '@/components/PythonDemo';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect logged-in users to progress page
  useEffect(() => {
    if (status === 'loading') return; // Wait for session to load
    
    if (session?.user) {
      router.push('/progress');
      return;
    }
  }, [session, status, router]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">
          The Interactive Python 🐍  Training Platform
        </h1>
        <p className="text-xl text-zinc-600 max-w-3xl mx-auto">
          Empower your team with hands-on Python skills. Create and deliver interactive coding lessons with live examples, 
          in-browser execution, and real-time feedback. Perfect for educators, HR leaders, and tech directors upskilling their workforce.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">Bring Your Own Content</h3>
          <p className="text-zinc-600">
            Upload your training materials, code examples, and exercises. Transform static content into interactive Python experiences.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">Track Team Progress</h3>
          <p className="text-zinc-600">
            Monitor learner progress, completion rates, and skill development. Perfect for HR teams and training managers.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">🖥️</span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">Live Code Execution</h3>
          <p className="text-zinc-600">
            Students run Python code directly in their browser. No setup, no installation - just pure hands-on learning.
          </p>
        </div>
      </div>

      {/* Interactive Demo Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-100 p-8 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">See the Platform in Action</h2>
          <p className="text-zinc-600">
            Experience how your team will learn - interactive Python execution with real results. 
            This is the same environment your students will use.
          </p>
        </div>
        
        <PythonDemo />
      </div>

      {/* Sample Training Paths Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Sample Training Paths</h2>
          <p className="text-zinc-600 max-w-2xl mx-auto">
            See how organizations structure their Python training. You can create similar paths with your own content and industry-specific examples.
          </p>
        </div>
        
        {/* Show demo learning paths for visitors */}
        <div className="space-y-8">
            {/* Healthcare Track */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🏥</span>
                    <div>
                      <h3 className="font-bold text-zinc-900">Python for Healthcare Analytics</h3>
                      <p className="text-sm text-zinc-600 mt-1">Master healthcare data analysis and patient insights</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">BEGINNER</span>
                    <span className="text-sm text-zinc-500">8 chapters</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid gap-2">
                  {[
                    { emoji: '📊', title: 'Healthcare Data Fundamentals', locked: false },
                    { emoji: '🔢', title: 'Patient Data Analysis with Pandas', locked: false },
                    { emoji: '📈', title: 'Medical Statistics & Visualization', locked: true },
                    { emoji: '🧬', title: 'Clinical Data Mining', locked: true }
                  ].map((chapter, idx) => (
                    <Link
                      key={idx}
                      href="/login"
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <span className="text-lg mr-3">{chapter.emoji}</span>
                      <span className={`font-medium flex-1 ${chapter.locked ? 'text-zinc-400' : 'text-zinc-900'}`}>
                        {chapter.title}
                      </span>
                      {chapter.locked && (
                        <svg className="w-4 h-4 text-zinc-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                  <div className="text-center py-2">
                    <span className="text-sm text-zinc-500">+4 more chapters</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Finance Track */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💰</span>
                    <div>
                      <h3 className="font-bold text-zinc-900">Python for Financial Analysis</h3>
                      <p className="text-sm text-zinc-600 mt-1">Build trading algorithms and financial models</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">INTERMEDIATE</span>
                    <span className="text-sm text-zinc-500">10 chapters</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid gap-2">
                  {[
                    { emoji: '📊', title: 'Financial Data Sources & APIs', locked: false },
                    { emoji: '📈', title: 'Stock Market Analysis with Python', locked: false },
                    { emoji: '🤖', title: 'Algorithmic Trading Strategies', locked: true },
                    { emoji: '⚖️', title: 'Risk Management & Portfolio Optimization', locked: true }
                  ].map((chapter, idx) => (
                    <Link
                      key={idx}
                      href="/login"
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <span className="text-lg mr-3">{chapter.emoji}</span>
                      <span className={`font-medium flex-1 ${chapter.locked ? 'text-zinc-400' : 'text-zinc-900'}`}>
                        {chapter.title}
                      </span>
                      {chapter.locked && (
                        <svg className="w-4 h-4 text-zinc-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                  <div className="text-center py-2">
                    <span className="text-sm text-zinc-500">+6 more chapters</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center py-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Ready to Train Your Team?</h3>
              <p className="text-zinc-600 mb-4">Create custom training paths like these with your own content and examples</p>
              <Link
                href="/register/organization"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                Start Your Free Trial
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
          </div>
        </div>
      </div>

      {/* Get Started Section */}
      <div className="text-center mt-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Transform Your Team's Technical Training Today</h2>
          <p className="text-zinc-600 max-w-2xl mx-auto">
            Join forward-thinking organizations who are upskilling their teams with interactive Python training. 
            A perfect solution for software/technology teams, educators. and HR leaders looking to enhance their workforce's skills.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/register/organization"
            className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-lg"
          >
            Start Free Trial
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg border border-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
          >
            Trainer/Student Sign In
          </Link>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>✨ 14-day free trial • No credit card required • No setup fees • 50% off annual plans</p>
        </div>
        
        {/* Pricing Preview */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-bold text-zinc-900 text-center mb-6">Simple, Transparent Pricing</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Team Plan */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors">
              <div className="text-center">
                <h4 className="text-xl font-bold text-zinc-900 mb-2">Team</h4>
                <p className="text-zinc-600 text-sm mb-4">Perfect for small teams and pilot programs</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-zinc-900">$39</span>
                  <span className="text-zinc-600">/month</span>
                </div>
                <div className="text-sm text-green-600 mb-4">
                  <span className="font-medium">$23/month</span> when paid annually (41% savings)
                </div>
                <div className="text-sm text-zinc-600 mb-6">
                  Up to 25 team members
                </div>
                <Link
                  href="/register/organization"
                  className="w-full inline-flex justify-center items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Organization Plan */}
            <div className="border border-indigo-200 rounded-lg p-6 bg-indigo-50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>
              </div>
              <div className="text-center">
                <h4 className="text-xl font-bold text-zinc-900 mb-2">Organization</h4>
                <p className="text-zinc-600 text-sm mb-4">For growing teams and departments</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-zinc-900">$129</span>
                  <span className="text-zinc-600">/month</span>
                </div>
                <div className="text-sm text-green-600 mb-4">
                  <span className="font-medium">$79/month</span> when paid annually (39% savings)
                </div>
                <div className="text-sm text-zinc-600 mb-6">
                  Up to 500 team members
                </div>
                <Link
                  href="/register/organization"
                  className="w-full inline-flex justify-center items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-zinc-600 mb-2">
              <strong>Need more than 500 seats?</strong>
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              Contact us for Enterprise pricing
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
        
        {/* Target Audience */}
        {/* <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <div className="text-center p-3">
            <div className="text-2xl mb-2">👩‍🏫</div>
            <div className="text-sm font-medium text-zinc-700">Educators</div>
          </div>
          <div className="text-center p-3">
            <div className="text-2xl mb-2">👔</div>
            <div className="text-sm font-medium text-zinc-700">HR Leaders</div>
          </div>
          <div className="text-center p-3">
            <div className="text-2xl mb-2">🖥️</div>
            <div className="text-sm font-medium text-zinc-700">Tech Directors</div>
          </div>
          <div className="text-center p-3">
            <div className="text-2xl mb-2">📈</div>
            <div className="text-sm font-medium text-zinc-700">VPs of Learning</div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
