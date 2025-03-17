'use client';

import { useState } from 'react';
import InputForm from './components/InputForm';
import ArticleList from './components/ArticleList';
import SummarySection from './components/SummarySection';
import { ArticleInfo } from './components/ArticleCard';
import { api } from '@/lib/api';

export default function Home() {
  const [articles, setArticles] = useState<ArticleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);

  // Handle form submission
  const handleExpertiseSubmit = async (data: { topics: string[]; text: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      setShowSummary(false); // Hide summary while loading
      
      // Store query for summary generation
      const queryText = [
        ...data.topics,
        data.text
      ].filter(Boolean).join(", ");
      setLastQuery(queryText);
      
      const apiArticles = await api.findRelevantStubs({
        topics: data.topics,
        text: data.text,
        limit: 10
      });
      
      // Map API response to component format
      const mappedArticles = apiArticles.map(article => ({
        ...article,
        url: article.viewUrl, // Map viewUrl to url for backward compatibility
      }));
      
      setArticles(mappedArticles);
      
      // Show summary if we have articles
      if (mappedArticles.length > 0) {
        setShowSummary(true);
      }
    } catch (err) {
      console.error('Error fetching stub articles:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setArticles([]);
      setShowSummary(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Wikipedia Contribution Assistant
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Share your expertise and discover Wikipedia articles that need your contribution
          </p>
          {articles.length > 0 && (
            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
              Using AI embeddings for semantic search
            </div>
          )}
        </header>
        
        <InputForm onSubmit={handleExpertiseSubmit} isLoading={isLoading} />
        
        {error && (
          <div className="w-full max-w-4xl mx-auto my-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
            <p className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        )}
        
        {/* Show summary section above article list */}
        <SummarySection 
          articles={articles} 
          query={lastQuery}
          isVisible={showSummary && !isLoading} 
        />
        
        <ArticleList articles={articles} loading={isLoading} />
        
        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>This tool helps identify Wikipedia stub articles that need improvement.</p>
          <p className="mt-1">All edits should follow <a href="https://en.wikipedia.org/wiki/Wikipedia:Policies_and_guidelines" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Wikipedia's policies and guidelines</a>.</p>
          {articles.length > 0 && (
            <p className="mt-2">
              <span className="inline-flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Articles ranked using OpenAI embeddings for semantic similarity
              </span>
            </p>
          )}
        </footer>
      </div>
    </main>
  );
}
