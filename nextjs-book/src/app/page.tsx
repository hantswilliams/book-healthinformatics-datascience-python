'use client';

import Link from "next/link";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoMark from "@/components/LogoMark";
import ThemeToggle from "@/components/ThemeToggle";
import { useSupabase } from '@/lib/SupabaseProvider';
import { motion } from "framer-motion";

export default function Home() {
  const { user, userProfile, organization, loading } = useSupabase();
  const router = useRouter();

  // Redirect logged-in users to their organization
  useEffect(() => {
    if (loading) return; // Wait for auth to load
    
    if (user && userProfile && organization) {
      // Redirect to organization dashboard
      router.push(`/org/${organization.slug}/dashboard`);
      return;
    }
  }, [user, userProfile, organization, loading, router]);

  return (
    <main className="relative min-h-screen bg-zinc-950 overflow-hidden">
      {/* Aurora background effects */}
      <div className="aurora-dark absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>
      
      {/* Light mode background effects */}
      <div className="aurora-light absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-violet-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
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
                {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500">
                  <span className="text-sm font-bold text-white">🐍</span>
                </div> */}
                <LogoMark className="h-6 w-6 text-white" variant="brackets" />
                <span className="text-lg font-semibold text-white">Interactive Coding</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              {/* <Link href="/contact" className="text-sm text-zinc-400 hover:text-white transition-colors">Contact</Link> */}
              {/* <ThemeToggle /> */}
              <Link href="/login" className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/10 transition-colors">Log in</Link>
              <Link href="/register/organization" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Shell container */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Hero */}
        <section className="pt-16 sm:pt-24 lg:pt-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-4 w-fit mx-auto rounded-full border border-white/10 dark:border-white/10 light:border-zinc-200 bg-white/5 dark:bg-white/5 light:bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-white/70 dark:text-white/70 light:text-zinc-600 shadow-sm backdrop-blur">
              Interactive Learning Platform
            </div>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white dark:text-white light:text-zinc-900 sm:text-6xl">
              <span className="block">Build interactive coding</span>
              <span className="block">training programs</span>
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">for any industry</span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-zinc-300 dark:text-zinc-300 light:text-zinc-600 max-w-3xl mx-auto">
              Create, deliver, and track hands-on coding lessons with live, in-browser execution and real-time feedback. Start with Python—scale to SQL, JavaScript, and more.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register/organization" className="group inline-flex items-center justify-center rounded-lg bg-white dark:bg-white light:bg-zinc-900 px-8 py-4 text-base font-semibold text-zinc-900 dark:text-zinc-900 light:text-white shadow-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-100 light:hover:bg-zinc-800 hover:shadow-xl">
                Start free trial
                <svg className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-lg border border-white/20 dark:border-white/20 light:border-zinc-200 bg-white/5 dark:bg-white/5 light:bg-zinc-100 px-8 py-4 text-base font-semibold text-white dark:text-white light:text-zinc-900 backdrop-blur hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-zinc-200 transition-colors">
                Talk to us
              </Link>
            </div>
            <p className="mt-6 text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500">14‑day free trial • No credit card required • SOC2-ready architecture</p>
          </motion.div>

        </section>

        {/* Features */}
        <section className="mx-auto mt-24 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-16 text-center"
          >
            <h2 className="text-3xl font-bold text-white dark:text-white light:text-zinc-900">Everything you need to train your team</h2>
            <p className="mt-4 text-xl text-zinc-300 dark:text-zinc-300 light:text-zinc-600">From content creation to performance tracking</p>
          </motion.div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {/* Bring Your Own Content */}
            <div
              className="group rounded-2xl border border-white/10 dark:border-white/10 light:border-zinc-200 bg-white/5 dark:bg-white/5 light:bg-zinc-50 backdrop-blur-sm p-8 transition-all hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-zinc-100"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 3h6l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M13 3v6h6" />
                  <path strokeWidth="1.5" strokeLinecap="round" d="M9 13h6M9 17h6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white dark:text-white light:text-zinc-900">Bring Your Own Content</h3>
              <p className="mt-3 text-zinc-300 dark:text-zinc-300 light:text-zinc-600">Transform your existing lessons into interactive coding experiences with live execution.</p>
            </div>

            {/* Track Team Progress */}
            <div
              className="group rounded-2xl border border-white/10 dark:border-white/10 light:border-zinc-200 bg-white/5 dark:bg-white/5 light:bg-zinc-50 backdrop-blur-sm p-8 transition-all hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-zinc-100"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 20h18" />
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 16l3-3 4 4 7-7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white dark:text-white light:text-zinc-900">Track Team Progress</h3>
              <p className="mt-3 text-zinc-300 dark:text-zinc-300 light:text-zinc-600">Monitor completion, performance, and engagement with built‑in analytics.</p>
            </div>

            {/* Enterprise Ready */}
            <div
              className="group rounded-2xl border border-white/10 dark:border-white/10 light:border-zinc-200 bg-white/5 dark:bg-white/5 light:bg-zinc-50 backdrop-blur-sm p-8 transition-all hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-zinc-100"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white dark:text-white light:text-zinc-900">Enterprise Ready</h3>
              <p className="mt-3 text-zinc-300 dark:text-zinc-300 light:text-zinc-600">SSO, audit logs, and role‑based access control ready for scale.</p>
            </div>
          </div>
        </section>


        {/* Industry Examples */}
        <section className="mx-auto mt-24 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 sm:p-12"
          >
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-white">Tailored for every industry</h2>
              <p className="mt-4 text-xl text-zinc-300">Build training paths with examples from healthcare, finance, education, and more.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {title:'Healthcare Analytics', emoji:'', description:'Build patient analysis systems and medical data pipelines', link:'/demo-healthcare', gradient:'from-teal-500/20 to-cyan-500/20'},
                {title:'Financial Analysis', emoji:'', description:'Create trading algorithms and portfolio management tools', link:'/demo-finance', gradient:'from-green-500/20 to-emerald-500/20'},
                {title:'University Programs', emoji:'', description:'Develop CS curricula with interactive coding assignments', link:'/demo-university', gradient:'from-indigo-500/20 to-violet-500/20'}
              ].map((t,idx)=> (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * (idx + 1) }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 transition-all hover:bg-white/10"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-0 transition-opacity group-hover:opacity-100`}></div>
                  <div className="relative">
                    <div className="mb-4 text-3xl">{t.emoji}</div>
                    <h3 className="text-xl font-semibold text-white mb-3">{t.title}</h3>
                    <p className="text-zinc-300 mb-6">{t.description}</p>
                    <Link href={t.link} className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-cyan-300 backdrop-blur-sm transition-all hover:border-cyan-300/50 hover:bg-gradient-to-r hover:from-cyan-400/30 hover:to-emerald-400/30 hover:text-cyan-100 hover:shadow-lg hover:shadow-cyan-400/40 hover:scale-105">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 0 1-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                      </svg>
                      View live demo
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                      </svg>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <h3 className="text-xl font-semibold text-white">Ready to train your team?</h3>
              <p className="mt-2 text-zinc-300">Create custom paths with your own content and examples.</p>
              <Link href="/register/organization" className="mt-6 inline-flex items-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors">
                Start your free trial
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Pricing */}
        <section className="mx-auto mt-24 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 sm:p-12"
          >
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-white">Simple, transparent pricing</h2>
              <p className="mt-4 text-xl text-zinc-300">Start with a free trial, scale to enterprise. Built for teams across healthcare, finance, and education.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 transition-all hover:bg-white/10"
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Starter</h3>
                  <p className="text-white/60 text-sm mb-6">Perfect for small teams and pilots</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-white">Free</span>
                    <span className="text-white/60 text-sm ml-2">for 30 days</span>
                  </div>
                </div>
                
                <ul className="space-y-3 text-sm text-white/70 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Up to 25 learners
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Core Python curriculum
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Interactive assignments
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Basic progress tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Email support
                  </li>
                </ul>
                
                <Link href="/register/organization" className="block w-full text-center rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                  Start free trial
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="relative rounded-2xl border border-indigo-400/50 bg-gradient-to-b from-indigo-900/20 to-white/5 p-6 backdrop-blur"
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Professional</h3>
                  <p className="text-white/60 text-sm mb-6">For departments and programs</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-white">$99</span>
                    <span className="text-white/60 text-sm ml-2">per month</span>
                  </div>
                  <div className="text-indigo-400 text-sm mb-6">
                    <span className="font-medium">$79/month</span> billed annually
                  </div>
                </div>
                
                <ul className="space-y-3 text-sm text-white/70 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Up to 500 learners
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Everything in Starter
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Industry-specific content
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Advanced analytics dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Custom branding
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Priority support
                  </li>
                </ul>
                
                <Link href="/register/organization" className="block w-full text-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 transition-colors">
                  Start professional trial
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Enterprise</h3>
                  <p className="text-white/60 text-sm mb-6">Institution-wide deployment</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-white">Custom</span>
                    <span className="text-white/60 text-sm ml-2">pricing</span>
                  </div>
                </div>
                
                <ul className="space-y-3 text-sm text-white/70 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Unlimited learners
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Everything in Professional
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Custom integrations (LMS, SSO)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Dedicated success manager
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    White-label solution
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    24/7 support
                  </li>
                </ul>
                
                <Link href="/contact" className="block w-full text-center rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                  Contact sales
                </Link>
              </motion.div>
            </div>
            <div className="mt-12 border-t border-white/10 pt-8 text-center">
              <p className="text-zinc-300">
                <strong className="text-white">All plans include:</strong> Free 30-day trial • No setup fees • Cancel anytime
              </p>
            </div>
          </motion.div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto my-24 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 p-12 text-center text-white shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 via-violet-600/90 to-cyan-600/90 backdrop-blur-sm"></div>
            <div className="relative">
              <h2 className="text-4xl font-bold">Transform your team's technical training</h2>
              <p className="mt-4 text-xl text-white/90 max-w-3xl mx-auto">Launch your first interactive Python path in minutes—expand to other languages as you grow.</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/register/organization" className="group inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-semibold text-indigo-700 shadow-lg transition-all hover:bg-zinc-50 hover:shadow-xl">
                  Start free trial
                  <svg className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur hover:bg-white/20 transition-colors">
                  Existing user? Log in
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
