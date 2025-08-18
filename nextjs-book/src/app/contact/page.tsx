'use client';

import { useState } from 'react';
import Link from 'next/link';
import LogoMark from "@/components/LogoMark";
import { motion } from "framer-motion";

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  teamSize: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    teamSize: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // In a real implementation, you would send this to your backend
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Aurora background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-50">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500/20 mb-4">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Message Sent!</h2>
            <p className="text-zinc-300 mb-6">
              Thanks for reaching out. Our team will get back to you within 24 hours to discuss your Enterprise needs.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-zinc-900 bg-white hover:bg-zinc-100 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-zinc-950 overflow-hidden">
      {/* Aurora background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <LogoMark className="h-6 w-6 text-white" variant="brackets" />
                <span className="text-lg font-semibold text-white">Interactive Coding</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <Link href="/demo-healthcare" className="text-sm text-zinc-400 hover:text-white transition-colors">Healthcare</Link>
              <Link href="/demo-finance" className="text-sm text-zinc-400 hover:text-white transition-colors">Finance</Link>
              <Link href="/demo-university" className="text-sm text-zinc-400 hover:text-white transition-colors">Education</Link>
              <Link href="/contact" className="text-sm text-white">Contact</Link>
              <Link href="/register/organization" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="relative z-10 max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Enterprise Solutions</h1>
          <p className="mt-6 text-xl text-zinc-300 max-w-3xl mx-auto">
            Ready to scale Python training across your large organization? Let's discuss a custom solution that fits your needs.
          </p>
        </motion.div>

        <div className="mt-12 max-w-lg mx-auto lg:max-w-none lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Get in Touch</h2>
            <p className="mt-3 text-lg leading-6 text-zinc-300">
              Tell us about your organization and training requirements. We'll create a tailored proposal for you.
            </p>
            <div className="mt-9">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-white">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full bg-zinc-800/50 border border-white/10 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 px-3 py-2 text-white placeholder-zinc-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-white">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full bg-zinc-800/50 border border-white/10 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 px-3 py-2 text-white placeholder-zinc-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full bg-zinc-800/50 border border-white/10 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 px-3 py-2 text-white placeholder-zinc-400"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-white">
                    Company *
                  </label>
                  <input
                    type="text"
                    name="company"
                    id="company"
                    required
                    value={formData.company}
                    onChange={handleInputChange}
                    className="mt-1 block w-full bg-zinc-800/50 border border-white/10 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 px-3 py-2 text-white placeholder-zinc-400"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-white">
                      Job Title
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      className="mt-1 block w-full bg-zinc-800/50 border border-white/10 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 px-3 py-2 text-white placeholder-zinc-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="teamSize" className="block text-sm font-medium text-white">
                      Team Size *
                    </label>
                    <select
                      name="teamSize"
                      id="teamSize"
                      required
                      value={formData.teamSize}
                      onChange={handleInputChange}
                      className="mt-1 block w-full bg-zinc-800/50 border border-white/10 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 px-3 py-2 text-white"
                    >
                      <option value="">Select team size</option>
                      <option value="500-1000">500-1,000 members</option>
                      <option value="1000-5000">1,000-5,000 members</option>
                      <option value="5000+">5,000+ members</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-white">
                    Tell us about your training needs
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="mt-1 block w-full bg-zinc-800/50 border border-white/10 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 px-3 py-2 text-white placeholder-zinc-400"
                    placeholder="What kind of Python training are you looking to deliver? Any specific requirements or integration needs?"
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-red-900/20 border border-red-500/30 p-4">
                    <div className="text-sm text-red-400">{error}</div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-zinc-900 bg-white hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Enterprise Benefits */}
          <div className="mt-12 lg:mt-0">
            <h2 className="text-2xl font-bold text-white">Enterprise Features</h2>
            <p className="mt-3 text-lg leading-6 text-zinc-300">
              Everything you need to train large technical teams at scale.
            </p>
            <div className="mt-8 space-y-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-cyan-500 text-white">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Unlimited Team Members</h3>
                  <p className="mt-2 text-base text-zinc-300">
                    Train as many employees as you need, from small departments to company-wide initiatives.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-cyan-500 text-white">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Advanced Security</h3>
                  <p className="mt-2 text-base text-zinc-300">
                    SSO integration, audit logs, and enterprise-grade security controls to meet your compliance requirements.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-cyan-500 text-white">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Custom Deployment</h3>
                  <p className="mt-2 text-base text-zinc-300">
                    On-premises deployment, private cloud, or hybrid solutions tailored to your infrastructure.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-cyan-500 text-white">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Dedicated Support</h3>
                  <p className="mt-2 text-base text-zinc-300">
                    Dedicated account manager, priority support, and SLA guarantees to ensure your success.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <h3 className="text-lg font-medium text-cyan-400">Quick Response</h3>
              <p className="mt-2 text-sm text-cyan-300">
                We typically respond to Enterprise inquiries within 2 hours during business hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}