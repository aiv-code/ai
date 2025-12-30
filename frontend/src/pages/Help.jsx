import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Book, MessageCircle, FileText } from 'lucide-react';

const faqs = [
  {
    question: 'How do I connect a data source?',
    answer: 'Go to Data Sources page and click "Add Data Source". Choose your data source type (PostgreSQL, Excel, or Parquet) and fill in the connection details. For Excel/Parquet files, you can either upload a file or provide a file path if the file is already on the server.',
  },
  {
    question: 'What file formats are supported?',
    answer: 'For Excel data sources, we support .xlsx, .xls, and .csv files. For Parquet data sources, we support .parquet files. Maximum file size is 50MB per upload.',
  },
  {
    question: 'How do I query my data?',
    answer: 'Use natural language queries on the Dashboard page. Simply type your question in plain English, select the data sources you want to query, and click "Run Query". The system will automatically convert your question into the appropriate query format.',
  },
  {
    question: 'Can I export query results?',
    answer: 'Yes! After running a query, you can export the results by clicking the export buttons in the data table. Supported formats include CSV, Excel, and you can also copy data to clipboard.',
  },
  {
    question: 'How do I preview my data?',
    answer: 'Go to the Data Sources page and click the "Preview" button next to any data source. This will show you the schema (column names and types) and sample data from your source.',
  },
  {
    question: 'What is an API key and where do I get it?',
    answer: 'Your API key is used to authenticate requests to the backend API. You can find or update your API key in the Settings page. If you need a new API key, contact your administrator.',
  },
  {
    question: 'How do I manage multiple clients?',
    answer: 'If you have admin access, you can manage clients from the Admin page. This allows you to create, view, and delete client accounts. Each client has their own API key and data sources.',
  },
  {
    question: 'Can I schedule queries?',
    answer: 'Currently, queries are executed on-demand. Scheduled queries are planned for a future release. Check the roadmap for updates.',
  },
];

const documentationSections = [
  {
    title: 'Getting Started',
    icon: Book,
    content: 'Learn how to set up your first data source and run your first query.',
  },
  {
    title: 'API Documentation',
    icon: FileText,
    content: 'Complete API reference for integrating with our backend services.',
  },
  {
    title: 'Support',
    icon: MessageCircle,
    content: 'Need help? Contact our support team or check our community forums.',
  },
];

export function Help() {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <HelpCircle className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold text-gray-900">Help & Documentation</h1>
        </div>
        <p className="text-gray-600">
          Find answers to common questions and learn how to use the platform
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {documentationSections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:border-primary-300 transition-colors cursor-pointer"
            >
              <Icon className="w-8 h-8 text-primary-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{section.title}</h3>
              <p className="text-sm text-gray-600">{section.content}</p>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                {expandedFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedFaq === index && (
                <div className="px-4 pb-4 text-gray-600">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="mt-8 bg-primary-50 rounded-lg border border-primary-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Still need help?
        </h3>
        <p className="text-gray-600 mb-4">
          If you can't find what you're looking for, our support team is here to help.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="mailto:support@example.com"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Contact Support
          </a>
          <a
            href="https://docs.example.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white text-primary-500 border border-primary-500 rounded-lg hover:bg-primary-50 transition-colors"
          >
            View Full Documentation
          </a>
        </div>
      </div>
    </div>
  );
}


