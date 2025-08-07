'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            We are committed to protecting your privacy and personal data.
          </p>
          <p className="mt-2 text-sm text-gray-500">Last updated: August 6, 2025</p>
        </div>

        {/* Privacy Policy Content */}
        <div className="mt-12 prose prose-indigo prose-lg mx-auto">
          <h2>1. Introduction</h2>
          <p>
            This Privacy Policy explains how we collect, use, process, and disclose your information, including personal information, in conjunction with your access to and use of our Python Training Platform.
          </p>
          
          <h2>2. Information We Collect</h2>
          <p>
            We collect different types of information from or through the Service:
          </p>
          <h3>2.1. User-Provided Information</h3>
          <p>
            When you use our Service, as a user or as a visitor, you may provide, and we may collect personal information. This includes:
          </p>
          <ul>
            <li>Account registration information (name, email address, password)</li>
            <li>Profile information (job title, company, profile picture)</li>
            <li>User content (such as messages, posts, responses to exercises)</li>
            <li>Payment information (handled by our secure payment processors)</li>
          </ul>
          
          <h3>2.2. Information from Your Use of the Service</h3>
          <p>
            We collect information about your interactions with our platform, including:
          </p>
          <ul>
            <li>Usage data (pages visited, features used, content accessed)</li>
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Progress and performance data (exercise completion, quiz scores)</li>
          </ul>
          
          <h2>3. How We Use Your Information</h2>
          <p>
            We use the information we collect for various purposes, including to:
          </p>
          <ul>
            <li>Provide, operate, and maintain our Service</li>
            <li>Improve, personalize, and expand our Service</li>
            <li>Understand and analyze how you use our Service</li>
            <li>Develop new products, services, features, and functionality</li>
            <li>Communicate with you for customer service, updates, and marketing</li>
            <li>Process transactions and send related information</li>
            <li>Find and prevent fraud, and respond to trust and safety issues</li>
          </ul>
          
          <h2>4. Sharing Your Information</h2>
          <p>
            We may share the information we collect in various ways, including:
          </p>
          <ul>
            <li>With service providers who perform services for us</li>
            <li>With business partners, with your consent</li>
            <li>For compliance with legal obligations</li>
            <li>To protect and defend our rights and property</li>
            <li>With your consent or at your direction</li>
          </ul>
          <p>
            We will never sell your personal information to advertisers or other third parties.
          </p>
          
          <h2>5. Data Retention</h2>
          <p>
            We will retain your information for as long as your account is active or as needed to provide you with our Service. We will also retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.
          </p>
          
          <h2>6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.
          </p>
          
          <h2>7. Your Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul>
            <li>Right to access the personal information we hold about you</li>
            <li>Right to rectify inaccurate personal information</li>
            <li>Right to erasure ("right to be forgotten")</li>
            <li>Right to data portability</li>
            <li>Right to restrict processing of your personal information</li>
            <li>Right to object to processing of your personal information</li>
          </ul>
          
          <h2>8. Children's Privacy</h2>
          <p>
            Our Service is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
          </p>
          
          <h2>9. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this page.
          </p>
          
          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please{' '}
            <Link href="/contact" className="text-indigo-600 hover:text-indigo-800">
              contact us
            </Link>.
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
