import { NextRequest, NextResponse } from 'next/server';
import { findRelevantStubArticles } from '../wikipedia';
import { extractKeywords } from '../extractKeywords';
import { CohereClient } from 'cohere-ai';

// Initialize Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY || '', // You'll need to add this to your .env.local file
});

// Define an interface for our custom document properties
interface ArticleDocument {
  text: string;
  articleTitle: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { topics = [], text = '' } = body;
    
    // Validate input
    if (!topics.length && !text.trim()) {
      return NextResponse.json(
        { error: 'Please provide either topics or text to find relevant articles' },
        { status: 400 }
      );
    }
    
    // If we have text but no topics, extract keywords from text
    let processedTopics = [...topics];
    if (!topics.length && text.trim()) {
      const extractedKeywords = extractKeywords(text, 5);
      processedTopics = extractedKeywords;
    }
    
    // Find relevant stub articles using embeddings
    const articles = await findRelevantStubArticles(processedTopics, text);
    
    // If Cohere API key is not set, return results without reranking
    if (!process.env.COHERE_API_KEY) {
      console.warn('COHERE_API_KEY is not set. Skipping reranking.');
      return NextResponse.json({ 
        articles,
        usedEmbeddings: true,
        reranked: false,
        message: "Results found using OpenAI embeddings for semantic similarity"
      });
    }
    
    try {
      // Prepare data for Cohere reranker
      const query = processedTopics.join(", ") + (text ? ` ${text}` : "");
      
      // Ensure query isn't too long for Cohere
      const truncatedQuery = query.length > 512 ? query.substring(0, 512) : query;
      
      // Create documents with the required structure for Cohere
      const documents = articles.map(article => ({
        text: `${article.title}\n${article.extract}`.substring(0, 1024), // Limit text length
        // Store the article title as a custom property to identify it later
        articleTitle: article.title
      }));
      
      // Skip reranking if we have no documents
      if (documents.length === 0) {
        return NextResponse.json({ 
          articles: [],
          usedEmbeddings: true,
          reranked: false,
          message: "No relevant articles found"
        });
      }
      
      console.log(`Sending ${documents.length} documents to Cohere for reranking`);
      
      // Call Cohere rerank API
      const rerankedResults = await cohere.rerank({
        query: truncatedQuery,
        documents,
        model: 'rerank-english-v2.0',
        topN: Math.min(documents.length, 20) // Limit to reasonable number
      });
      
      console.log(`Received ${rerankedResults.results?.length || 0} results from Cohere`);
      
      // Log the first result to understand structure
      if (rerankedResults.results && rerankedResults.results.length > 0) {
        console.log('Cohere result structure:', JSON.stringify(rerankedResults.results[0], null, 2));
      } else {
        console.log('Empty results from Cohere:', JSON.stringify(rerankedResults, null, 2));
      }
      
      // Safety check - if no results, return the original articles
      if (!rerankedResults.results || rerankedResults.results.length === 0) {
        console.warn('No valid results from Cohere reranker, returning original articles');
        return NextResponse.json({ 
          articles,
          usedEmbeddings: true,
          reranked: false,
          message: "Results found using OpenAI embeddings (Cohere reranking returned no results)"
        });
      }
      
      // Map the reranked results back to our article format
      const rerankedArticles = rerankedResults.results.map(result => {
        // For Cohere API, the document is directly indexed from the original documents array
        const index = result.index;
        if (index === undefined || index < 0 || index >= documents.length) {
          console.warn(`Invalid index ${index} in rerank result`);
          return null;
        }
        
        // Get the original document by index
        const document = documents[index];
        const articleTitle = document.articleTitle;
        
        // Find original article
        const originalArticle = articles.find(a => a.title === articleTitle);
        
        if (!originalArticle) {
          console.warn(`Could not find original article for title: ${articleTitle}`);
          return null;
        }
        
        return {
          ...originalArticle,
          relevanceScore: result.relevanceScore
        };
      }).filter(Boolean); // Remove any null values
      
      // If we have no reranked articles, fall back to the original
      if (rerankedArticles.length === 0) {
        console.warn('No articles after reranking, returning original list');
        return NextResponse.json({ 
          articles,
          usedEmbeddings: true,
          reranked: false,
          message: "Results found using OpenAI embeddings (no valid articles after reranking)"
        });
      }
      
      return NextResponse.json({ 
        articles: rerankedArticles,
        usedEmbeddings: true,
        reranked: true,
        message: "Results enhanced using Cohere reranking for improved relevance"
      });
    } catch (cohereError) {
      console.error('Error with Cohere reranking:', cohereError);
      // Fallback to original results if reranking fails
      return NextResponse.json({ 
        articles,
        usedEmbeddings: true,
        reranked: false,
        message: "Results found using OpenAI embeddings (Cohere reranking failed)"
      });
    }
    
  } catch (error) {
    console.error('Error in stub-articles API:', error);
    return NextResponse.json(
      { error: 'Failed to find stub articles' },
      { status: 500 }
    );
  }
} 