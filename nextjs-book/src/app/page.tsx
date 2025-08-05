import Link from "next/link";
import { chapters } from "@/data/chapters";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🐍 Python Learning for Healthcare
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Master Python programming for healthcare data analysis with interactive lessons, 
          real-world examples, and hands-on coding exercises.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">🖥️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Editor</h3>
          <p className="text-gray-600">
            Write and execute Python code directly in your browser with Monaco Editor and Pyodide.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">🏥</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Healthcare Focus</h3>
          <p className="text-gray-600">
            Learn Python specifically for healthcare data analysis, medical informatics, and clinical research.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Real Examples</h3>
          <p className="text-gray-600">
            Work with real healthcare datasets and learn industry-standard libraries like Pandas.
          </p>
        </div>
      </div>

      {/* Chapters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Path</h2>
        <div className="space-y-4">
          {chapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={`/chapter/${chapter.id}`}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors duration-200"
            >
              <span className="text-2xl mr-4">{chapter.emoji}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {chapter.id === 'chapter1' 
                    ? 'Learn Python basics with healthcare examples'
                    : 'Analyze healthcare data with Pandas and Python'
                  }
                </p>
              </div>
              <svg
                className="ml-auto w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Get Started Section */}
      <div className="text-center mt-12">
        <p className="text-gray-600 mb-6">Ready to start your healthcare data science journey?</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/register"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Create Account
            <svg
              className="ml-2 w-4 h-4"
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
            Sign In
          </Link>
        </div>
        
        {/* Demo Accounts */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Try Demo Accounts</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <p className="font-medium text-gray-900">Student Account</p>
              <p className="text-gray-600">Email: student1@healthinformatics.com</p>
              <p className="text-gray-600">Password: password123</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="font-medium text-gray-900">Instructor Account</p>
              <p className="text-gray-600">Email: instructor@healthinformatics.com</p>
              <p className="text-gray-600">Password: password123</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="font-medium text-gray-900">Admin Account</p>
              <p className="text-gray-600">Email: admin@healthinformatics.com</p>
              <p className="text-gray-600">Password: password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
