import axios from 'axios';
import { generateEmbedding, calculateCosineSimilarity, combineTextsForEmbedding } from './embeddings';

const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';

interface WikipediaSearchResult {
  title: string;
  pageid: number;
  snippet: string;
}

interface WikipediaCategory {
  title: string;
}

interface ArticleWithEmbedding {
  title: string;
  extract: string;
  categories: string[];
  thumbnailUrl?: string;
  viewUrl: string;
  editUrl: string;
  embedding?: number[];
  missingInfo: string[];
  relevanceScore: number;
}

// Function to search for Wikipedia articles based on a query
export async function searchWikipedia(query: string, limit = 20) {
  const params = {
    action: 'query',
    list: 'search',
    srsearch: query,
    format: 'json',
    srlimit: limit,
    origin: '*',
  };

  try {
    const response = await axios.get(WIKIPEDIA_API_URL, { params });
    return response.data.query.search as WikipediaSearchResult[];
  } catch (error) {
    console.error('Error searching Wikipedia:', error);
    return [];
  }
}

// Function to get categories for a specific article by title
export async function getArticleCategories(title: string) {
  const params = {
    action: 'query',
    prop: 'categories',
    titles: title,
    format: 'json',
    cllimit: 50,
    origin: '*',
  };

  try {
    const response = await axios.get(WIKIPEDIA_API_URL, { params });
    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];
    
    // Article might not have categories
    if (pageId === '-1' || !pages[pageId].categories) {
      return [];
    }
    
    return pages[pageId].categories.map((cat: { title: string }) => cat.title);
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
}

// Get a list of stub articles for a specific category
export async function getStubArticlesForCategory(category: string, limit = 20) {
  const params = {
    action: 'query',
    list: 'categorymembers',
    cmtitle: category,
    cmlimit: limit,
    format: 'json',
    origin: '*',
  };

  try {
    const response = await axios.get(WIKIPEDIA_API_URL, { params });
    return response.data.query.categorymembers;
  } catch (error) {
    console.error(`Error getting stub articles for category ${category}:`, error);
    return [];
  }
}

// Get detailed information about an article by title
export async function getArticleDetails(title: string) {
  const params = {
    action: 'query',
    prop: 'extracts|pageimages|categories',
    exintro: true,
    explaintext: true,
    titles: title,
    format: 'json',
    piprop: 'thumbnail',
    pithumbsize: 200,
    pilimit: 1,
    cllimit: 50,
    origin: '*',
  };

  try {
    const response = await axios.get(WIKIPEDIA_API_URL, { params });
    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];
    
    if (pageId === '-1') {
      return null;
    }
    
    const page = pages[pageId];
    return {
      title: page.title,
      extract: page.extract || '',
      categories: page.categories ? page.categories.map((cat: { title: string }) => cat.title) : [],
      thumbnailUrl: page.thumbnail ? page.thumbnail.source : null,
      viewUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      editUrl: `https://en.wikipedia.org/wiki/Edit:${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
    };
  } catch (error) {
    console.error('Error getting article details:', error);
    return null;
  }
}

// Get stub categories
export async function getStubCategories() {
  // We could fetch a list of all stub categories, but there are thousands
  // So we're using a predefined list of common stub categories
  return [
    'Category:Stub categories',
    'Category:Geography stubs',
    'Category:History stubs',
    'Category:Science stubs',
    'Category:Technology stubs',
    'Category:Arts stubs',
    'Category:Biography stubs',
    'Category:Philosophy stubs',
    'Category:Politics stubs',
    'Category:Society stubs',
    'Category:Sports stubs',
  ];
}

// Find most relevant stub articles based on user expertise using embeddings
export async function findRelevantStubArticles(topics: string[], text: string, limit = 10) {
  // Prepare user expertise text for embedding
  let userExpertiseText = '';
  if (topics.length > 0) {
    userExpertiseText += `Topics: ${topics.join(', ')}\n\n`;
  }
  if (text && text.trim().length > 0) {
    userExpertiseText += `Expertise description: ${text}`;
  }
  
  // Generate embedding for user expertise
  const userEmbedding = await generateEmbedding(userExpertiseText);
  
  let allResults: ArticleWithEmbedding[] = [];
  
  // Search by topics
  for (const topic of topics) {
    const searchResults = await searchWikipedia(`${topic} stub`, 5);
    
    for (const result of searchResults) {
      const categories = await getArticleCategories(result.title);
      const isStub = categories.some((cat: string) => 
        cat.toLowerCase().includes('stub') || 
        cat.toLowerCase().includes('article') && 
        cat.toLowerCase().includes('quality')
      );
      
      if (isStub) {
        const details = await getArticleDetails(result.title);
        if (details) {
          // Get article embedding using combined text
          const articleText = combineTextsForEmbedding({
            title: details.title,
            content: details.extract,
            categories: details.categories.join(', ')
          });
          
          const articleEmbedding = await generateEmbedding(articleText);
          
          // Calculate semantic similarity
          const similarity = calculateCosineSimilarity(userEmbedding, articleEmbedding);
          
          allResults.push({
            ...details,
            embedding: articleEmbedding,
            relevanceScore: similarity,
            missingInfo: generateMissingInfoSuggestions(details, topic),
          });
        }
      }
    }
  }
  
  // If user provided text, use it for search as well
  if (text && text.trim().length > 0) {
    const extractedKeywords = extractKeywords(text, 3);
    for (const keyword of extractedKeywords) {
      const searchResults = await searchWikipedia(`${keyword} stub`, 3);
      
      for (const result of searchResults) {
        // Skip if we already have this result
        if (allResults.some(r => r.title === result.title)) {
          continue;
        }
        
        const categories = await getArticleCategories(result.title);
        const isStub = categories.some((cat: string) => 
          cat.toLowerCase().includes('stub') || 
          cat.toLowerCase().includes('article') && 
          cat.toLowerCase().includes('quality')
        );
        
        if (isStub) {
          const details = await getArticleDetails(result.title);
          if (details) {
            // Get article embedding
            const articleText = combineTextsForEmbedding({
              title: details.title,
              content: details.extract,
              categories: details.categories.join(', ')
            });
            
            const articleEmbedding = await generateEmbedding(articleText);
            
            // Calculate semantic similarity
            const similarity = calculateCosineSimilarity(userEmbedding, articleEmbedding);
            
            allResults.push({
              ...details,
              embedding: articleEmbedding,
              relevanceScore: similarity,
              missingInfo: generateMissingInfoSuggestions(details, keyword),
            });
          }
        }
      }
    }
  }
  
  // Sort by relevance (similarity score) and take the top results
  allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Remove the embeddings before returning (to reduce payload size)
  return allResults.slice(0, limit).map(result => {
    const { embedding, ...rest } = result;
    return rest;
  });
}

// Extract keywords from text
function extractKeywords(text: string, count: number): string[] {
  // Simple keyword extraction based on word frequency
  // In a real app, you would use a more sophisticated NLP approach
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  const wordCounts: Record<string, number> = {};
  
  // Stopwords to exclude
  const stopwords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with',
    'about', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
    'had', 'having', 'do', 'does', 'did', 'doing', 'i', 'me', 'my', 'mine', 
    'myself', 'you', 'your', 'yours', 'yourself', 'he', 'him', 'his', 'she', 
    'her', 'hers', 'it', 'its', 'we', 'us', 'our', 'ours', 'they', 'them', 
    'their', 'theirs', 'this', 'that', 'these', 'those', 'of', 'by', 'from'
  ]);
  
  for (const word of words) {
    if (word.length < 3 || stopwords.has(word)) continue;
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  }
  
  // Convert to array, sort by frequency, and take top N
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(entry => entry[0]);
}

// Generate missing information suggestions based on article and topic
function generateMissingInfoSuggestions(article: any, topic: string): string[] {
  const missingInfo: string[] = [];
  const extract = article.extract.toLowerCase();
  
  // Common sections that might be missing from stub articles
  const commonMissingSections = [
    { section: 'history', suggestion: 'Add historical background or development' },
    { section: 'usage', suggestion: 'Describe common applications or usage' },
    { section: 'examples', suggestion: 'Provide specific examples or case studies' },
    { section: 'reference', suggestion: 'Add references and citations' },
    { section: 'image', suggestion: 'Include relevant images or diagrams' },
  ];
  
  // Check if extract is very short
  if (extract.length < 500) {
    missingInfo.push('Expand the basic description with more details');
  }
  
  // Check for missing common sections
  for (const { section, suggestion } of commonMissingSections) {
    if (!extract.includes(section)) {
      missingInfo.push(suggestion);
    }
  }
  
  // Add topic-specific suggestions
  if (topic.toLowerCase() === 'science' || topic.toLowerCase() === 'technology') {
    if (!extract.includes('technical') && !extract.includes('specification')) {
      missingInfo.push('Add technical specifications or scientific details');
    }
  } else if (topic.toLowerCase() === 'history') {
    if (!extract.includes('year') && !extract.includes('century') && !extract.includes('date')) {
      missingInfo.push('Include important dates and time periods');
    }
  } else if (topic.toLowerCase() === 'biography' || article.categories.some((c: string) => c.includes('people'))) {
    if (!extract.includes('born') && !extract.includes('birth')) {
      missingInfo.push('Add biographical information such as birth date, education');
    }
  }
  
  return missingInfo.slice(0, 5); // Limit to 5 suggestions
} 