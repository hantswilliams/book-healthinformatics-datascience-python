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
              Thanks for reaching out. We'll get back to you soon.
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
              <Link href="/login" className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/10 transition-colors">Log in</Link>
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
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Contact</h1>
          <p className="mt-6 text-xl text-zinc-300 max-w-3xl mx-auto">
            Have questions or need help getting started? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="mt-12 max-w-lg mx-auto">
          <div>
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
                      <option value="1-10">1-10 people</option>
                      <option value="11-25">11-25 people</option>
                      <option value="26-100">26-100 people</option>
                      <option value="100+">100+ people</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-white">
                    Message
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="mt-1 block w-full bg-zinc-800/50 border border-white/10 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 px-3 py-2 text-white placeholder-zinc-400"
                    placeholder="How can we help you?"
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
        </div>
      </div>
    </main>
  );
}