'use client';

import Link from "next/link";
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PythonDemo from '@/components/PythonDemo';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect logged-in users to their organization
  useEffect(() => {
    if (status === 'loading') return; // Wait for session to load
    
    if (session?.user) {
      // Fetch user's organization and redirect
      fetch('/api/user/organization')
        .then(res => res.json())
        .then(data => {
          if (data.organizationSlug) {
            router.push(`/org/${data.organizationSlug}/dashboard`);
          }
        })
        .catch(error => {
          console.error('Failed to fetch organization:', error);
        });
      return;
    }
  }, [session, status, router]);

  return (
    <main className="relative overflow-hidden">
      {/* Background decorations */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[1280px] rounded-full bg-gradient-to-r from-indigo-200/50 via-purple-200/40 to-cyan-200/50 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-white to-zinc-50" />
      </div>

      {/* Shell container */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Hero */}
        <section className="pt-16 sm:pt-24 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl">
              Build interactive coding training
              <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 bg-clip-text text-transparent">right in the browser</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600">
              Create, deliver, and track hands-on coding lessons with live, in-browser execution and real-time feedback. Start with Python—scale to SQL, JavaScript, and more.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register/organization" className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-white shadow-sm transition-colors hover:bg-indigo-700">
                Start free trial
                <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 py-3 text-zinc-800 hover:bg-zinc-50">
                Talk to us
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-500">14‑day free trial • No credit card required • SOC2-ready architecture</p>
          </div>

          {/* Hero preview card */}
          <div className="mx-auto mt-12 max-w-5xl">
            <div className="relative rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-6">
              <div className="absolute -inset-x-4 -top-4 h-4 rounded-t-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 blur opacity-20" />
              <div className="grid items-stretch gap-6 md:grid-cols-2">
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">Live Python execution</h3>
                    <p className="mt-2 text-sm text-zinc-600">Type code, run instantly, and capture output—no installs, no friction.</p>
                  </div>
                  <ul className="mt-6 space-y-2 text-sm text-zinc-700">
                    <li>• Instructor content + in-browser runtime</li>
                    <li>• Progress tracking & analytics</li>
                    <li>• Safe sandboxed environment</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    <span className="h-2 w-2 rounded-full bg-yellow-400"></span>
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  </div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">
{`# Try Python in the browser
import statistics as stats
data = [88, 92, 79, 93, 85]
print('Mean:', round(stats.mean(data), 2))
print('Median:', stats.median(data))`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        

        {/* Features */}
  <section className="mx-auto mt-16 max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Bring Your Own Content */}
            <div className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
                <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 3h6l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M13 3v6h6" />
                  <path strokeWidth="1.5" strokeLinecap="round" d="M9 13h6M9 17h6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Bring Your Own Content</h3>
              <p className="mt-2 text-sm text-zinc-600">Transform your existing lessons into interactive coding experiences with live execution.</p>
            </div>

            {/* Track Team Progress */}
            <div className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
                <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 20h18" />
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 16l3-3 4 4 7-7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Track Team Progress</h3>
              <p className="mt-2 text-sm text-zinc-600">Monitor completion, performance, and engagement with built‑in analytics.</p>
            </div>

            {/* Enterprise Ready */}
            <div className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
                <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Enterprise Ready</h3>
              <p className="mt-2 text-sm text-zinc-600">SSO, audit logs, and role‑based access control ready for scale.</p>
            </div>
          </div>
  </section>

        {/* Interactive Demo */}
        <section className="mx-auto mt-16 max-w-6xl">
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 shadow-sm sm:p-8">
            <div className="mx-auto mb-6 max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-zinc-900">See the platform in action</h2>
              <p className="mt-2 text-zinc-600">The same environment your learners use—embedded right in the browser.</p>
            </div>
            <PythonDemo />
          </div>
        </section>

  {/* Training paths (trimmed to a single, sleeker card set) */}
        <section className="mx-auto mt-16 max-w-6xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mx-auto mb-8 max-w-2xl text-center">
      <h2 className="text-2xl font-bold text-zinc-900">Create training paths for any team</h2>
      <p className="mt-2 text-zinc-600">Leaders and team heads can build simple or complex learning paths tailored to their teams—across any industry.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                {badge:'BEGINNER', badgeColor:'bg-green-100 text-green-800', title:'Python for Healthcare Analytics', emoji:'🏥', chapters:'+4 more', gradient:'from-green-50 to-emerald-50'},
                {badge:'INTERMEDIATE', badgeColor:'bg-yellow-100 text-yellow-800', title:'Python for Financial Analysis', emoji:'💰', chapters:'+6 more', gradient:'from-blue-50 to-indigo-50'}
              ].map((t,idx)=> (
                <div key={idx} className="overflow-hidden rounded-xl border border-zinc-200">
                  <div className={`border-b border-zinc-200 bg-gradient-to-r px-6 py-4 ${t.gradient}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-3 text-2xl">{t.emoji}</span>
                        <h3 className="font-semibold text-zinc-900">{t.title}</h3>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${t.badgeColor}`}>{t.badge}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600">Curated chapters and exercises</span>
                      <span className="text-zinc-500">{t.chapters}</span>
                    </div>
                    <div className="mt-4 text-right">
                      <Link href="/login" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700">
                        Preview path
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <h3 className="text-lg font-semibold text-zinc-900">Ready to train your team?</h3>
              <p className="mt-1 text-sm text-zinc-600">Create custom paths with your own content and examples.</p>
              <Link href="/register/organization" className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-white hover:bg-indigo-700">
                Start your free trial
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto mt-16 max-w-6xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-zinc-900">Simple, transparent pricing</h2>
              <p className="mt-2 text-zinc-600">Start small and scale as your program grows.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 p-6 transition hover:border-indigo-300">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-zinc-900">Team</h3>
                  <p className="mt-1 text-sm text-zinc-600">For pilots and small teams</p>
                  <div className="mt-4"><span className="text-3xl font-bold text-zinc-900">$39</span><span className="text-zinc-600">/mo</span></div>
                  <div className="mt-2 text-sm text-green-600"><span className="font-medium">$23/mo</span> billed annually</div>
                  <div className="mt-4 text-sm text-zinc-600">Up to 25 members</div>
                  <Link href="/register/organization" className="mt-6 inline-flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Start free trial</Link>
                </div>
              </div>
              <div className="relative rounded-xl border border-indigo-200 bg-indigo-50 p-6">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">POPULAR</div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-zinc-900">Organization</h3>
                  <p className="mt-1 text-sm text-zinc-600">For departments and programs</p>
                  <div className="mt-4"><span className="text-3xl font-bold text-zinc-900">$129</span><span className="text-zinc-600">/mo</span></div>
                  <div className="mt-2 text-sm text-green-600"><span className="font-medium">$79/mo</span> billed annually</div>
                  <div className="mt-4 text-sm text-zinc-600">Up to 500 members</div>
                  <Link href="/register/organization" className="mt-6 inline-flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Start free trial</Link>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-zinc-200 pt-6 text-center">
              <p className="text-sm text-zinc-600">
                <strong>Need more than 500 seats?</strong>
              </p>
              <Link href="/contact" className="mt-2 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Contact us for Enterprise pricing
                <svg className="ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto my-20 max-w-5xl">
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 p-8 text-center text-white shadow-sm">
            <h2 className="text-2xl font-semibold">Transform your team’s technical training</h2>
            <p className="mt-2 text-white/90">Launch your first interactive Python path in minutes—expand to other languages as you grow.</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register/organization" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-medium text-indigo-700 hover:bg-zinc-50">
                Start free trial
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 font-medium text-white hover:bg-white/10">
                Existing user? Log in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
