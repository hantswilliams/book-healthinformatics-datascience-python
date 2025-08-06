import Link from 'next/link';

export default function ResourcesPage() {
  const pythonResources = [
    {
      title: "Python.org Official Tutorial",
      description: "The official Python tutorial from Python.org",
      url: "https://docs.python.org/3/tutorial/",
      category: "Python Basics"
    },
    {
      title: "Pandas Documentation", 
      description: "Complete guide to data manipulation with Pandas",
      url: "https://pandas.pydata.org/docs/",
      category: "Data Analysis"
    },
    {
      title: "Jupyter Notebook Documentation",
      description: "Learn how to use Jupyter notebooks effectively",
      url: "https://jupyter-notebook.readthedocs.io/",
      category: "Tools"
    },
    {
      title: "Healthcare Data Science on Kaggle",
      description: "Real healthcare datasets and competitions",
      url: "https://www.kaggle.com/datasets?search=healthcare",
      category: "Healthcare Data"
    }
  ];

  const healthcareResources = [
    {
      title: "HL7 FHIR",
      description: "Healthcare interoperability standard",
      url: "https://www.hl7.org/fhir/",
      category: "Standards"
    },
    {
      title: "CMS Public Datasets",
      description: "Centers for Medicare & Medicaid Services data",
      url: "https://www.cms.gov/Research-Statistics-Data-and-Systems",
      category: "Public Data"
    },
    {
      title: "Medical Imaging in Python",
      description: "Working with medical images using Python",
      url: "https://pydicom.github.io/",
      category: "Medical Imaging"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Learning Resources</h1>
        <p className="text-xl text-gray-600">
          Helpful links and resources to enhance your Python and healthcare data science journey
        </p>
      </div>

      {/* Python Resources */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Python & Data Science</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {pythonResources.map((resource, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded">
                  {resource.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {resource.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {resource.description}
              </p>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Visit Resource
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Healthcare Resources */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Healthcare & Medical Informatics</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {healthcareResources.map((resource, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  {resource.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {resource.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {resource.description}
              </p>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Visit Resource
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Practice Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Practice?</h2>
        <p className="text-lg mb-6">
          Apply what you&apos;ve learned with our interactive Python exercises
        </p>
        <Link
          href="/progress"
          className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          Start Learning
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}