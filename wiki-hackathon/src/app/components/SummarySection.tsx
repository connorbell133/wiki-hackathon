'use client';

import { useEffect, useState } from 'react';
import { ArticleInfo } from './ArticleCard';

interface SummarySectionProps {
  articles: ArticleInfo[];
  query: string;
  reranked?: boolean;
  isVisible: boolean;
}

export default function SummarySection({ articles, query, reranked = false, isVisible }: SummarySectionProps) {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when articles change
    setSummary('');
    setError(null);
    
    // Only generate summary if we have articles and the component is visible
    if (articles.length === 0 || !isVisible) {
      return;
    }

    const generateSummary = async () => {
      setIsLoading(true);
      
      try {
        // Stream the response from the API
        const response = await fetch('/api/generate-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articles,
            query,
            reranked
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate summary');
        }

        // Process the stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Stream reader not available');
        }

        // Clear any existing summary
        setSummary('');

        // Read the stream chunks
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode and append the chunk to the summary
          const chunk = decoder.decode(value, { stream: true });
          setSummary(prevSummary => prevSummary + chunk);
        }
        
      } catch (err) {
        console.error('Error generating summary:', err);
        setError('Failed to generate summary. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    generateSummary();
  }, [articles, query, reranked, isVisible]);

  // Don't render anything if there are no articles or the component isn't visible
  if (articles.length === 0 || !isVisible) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-5">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              AI Summary
            </h3>
            
            {isLoading && !summary && (
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating summary...
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            
            {summary && (
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {summary}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 