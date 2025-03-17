'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';
import { api } from '@/lib/api';

export interface ArticleInfo {
  title: string;
  url: string;
  extract: string;
  thumbnailUrl?: string;
  categories: string[];
  missingInfo: string[];
  editUrl: string;
  viewUrl: string;
}

interface ArticleCardProps {
  article: ArticleInfo;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [proposedContent, setProposedContent] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Format the article title to be more readable
  const formattedTitle = article.title.replace(/_/g, ' ');

  const handleValidateContent = async () => {
    if (!proposedContent.trim()) return;

    setIsValidating(true);
    setValidationResult('');
    setValidationError(null);

    try {
      const response = await api.validateContent({
        content: proposedContent,
        articleTitle: article.title,
      });

      // Process the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Stream reader not available');
      }

      // Read the stream chunks
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode and append the chunk to the validation result
        const chunk = decoder.decode(value, { stream: true });
        setValidationResult(prev => prev + chunk);
      }
    } catch (err) {
      console.error('Error validating content:', err);
      setValidationError('Failed to validate content. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };
    
  // Use remark to convert markdown into HTML string
  const processedContent = remark()
    .use(html)
    .process(validationResult)
    .then(result => result.toString());

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {formattedTitle}
          </h3>
          <div className="flex items-center space-x-1">
            {article.categories.slice(0, 2).map((category, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
              >
                {category.replace(/^Category:|Stub$|stubs$/i, '').trim()}
              </span>
            ))}
            {article.categories.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                +{article.categories.length - 2}
              </span>
            )}
          </div>
        </div>
        
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {article.extract || "No description available."}
        </p>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
        >
          {isExpanded ? 'Show less' : 'Show more'}
          <svg 
            className={`ml-1 h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="mt-4 border-t pt-4 border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-white">
              Contribution Opportunities:
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {article.missingInfo.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
              {article.missingInfo.length === 0 && (
                <li>This stub article needs more detailed information.</li>
              )}
            </ul>

            <div className="mt-6">
              <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-white">
                Propose Content Addition:
              </h4>
              <div className="space-y-4">
                <textarea
                  value={proposedContent}
                  onChange={(e) => setProposedContent(e.target.value)}
                  placeholder="Write your proposed content here. It will be validated against Wikipedia's content policies..."
                  className="w-full h-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleValidateContent}
                  disabled={!proposedContent.trim() || isValidating}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isValidating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Validating...
                    </>
                  ) : (
                    'Validate Content'
                  )}
                </button>

                {validationError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-400">
                    {validationError}
                  </div>
                )}

                {validationResult && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Content Policy Review
                        </h5>
                        <div className="mt-2 prose prose-xs dark:prose-invert prose-blue max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h2: ({node, ...props}) => <h2 className="text-sm font-medium text-blue-800 dark:text-blue-300 mt-4 first:mt-0" {...props} />,
                              p: ({node, ...props}) => <p className="text-sm text-blue-700 dark:text-blue-400" {...props} />,
                              ul: ({node, ...props}) => <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc pl-4 mt-1" {...props} />,
                              li: ({node, ...props}) => <li className="mt-0.5" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-semibold text-blue-800 dark:text-blue-300" {...props} />
                            }}
                          >
                            {validationResult}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex space-x-3">
              <a
                href={article.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Article
              </a>
              <a
                href={article.editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit on Wikipedia
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 