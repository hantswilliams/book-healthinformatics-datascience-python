'use client';

import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-zinc-900">Terms of Service</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-zinc-600">
          Please read these terms carefully before using our platform.
        </p>
        <p className="mt-2 text-sm text-zinc-500">Last updated: August 6, 2025</p>
      </div>

      {/* Terms of Service Content */}
      <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="prose prose-indigo prose-lg max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Python Training Platform ("the Service"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing the Service.
          </p>
          
          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily access the materials on the Service for personal, non-commercial educational purposes only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>Modify or copy the materials except for personal learning;</li>
            <li>Use the materials for any commercial purpose;</li>
            <li>Attempt to decompile or reverse engineer any software contained on the Service;</li>
            <li>Remove any copyright or other proprietary notations from the materials; or</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
          </ul>
          
          <h2>3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding the password and for all activities that occur under your account.
          </p>
          <p>
            You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
          </p>
          
          <h2>4. Content</h2>
          <p>
            Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post to the Service, including its legality, reliability, and appropriateness.
          </p>
          
          <h2>5. Intellectual Property</h2>
          <p>
            The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of our company and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
          </p>
          
          <h2>6. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
          
          <h2>7. Limitation of Liability</h2>
          <p>
            In no event shall our company, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
          </p>
          <ul>
            <li>Your access to or use of or inability to access or use the Service;</li>
            <li>Any conduct or content of any third party on the Service;</li>
            <li>Any content obtained from the Service; and</li>
            <li>Unauthorized access, use or alteration of your transmissions or content.</li>
          </ul>
          
          <h2>8. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </p>
          
          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please{' '}
            <Link href="/contact" className="font-medium text-indigo-600 hover:text-indigo-700">
              contact us
            </Link>.
          </p>
        </div>
        </div>

      {/* Back to Home */}
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
