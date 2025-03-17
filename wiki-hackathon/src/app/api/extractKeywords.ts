import nlp from 'compromise';

interface KeywordResult {
  word: string;
  count: number;
}

// Extract keywords from text using compromise.js
export function extractKeywords(text: string, limit: number = 10): string[] {
  if (!text || text.trim() === '') {
    return [];
  }
  
  // Process text with compromise
  const doc = nlp(text);
  
  // Extract nouns and adjectives as they're likely to be the most relevant
  const keywords: KeywordResult[] = [];
  
  // Get all nouns (singular and plural)
  const nouns = doc.nouns().out('array');
  for (const noun of nouns) {
    addKeyword(keywords, noun);
  }
  
  // Get all adjectives
  const adjectives = doc.adjectives().out('array');
  for (const adjective of adjectives) {
    addKeyword(keywords, adjective);
  }
  
  // Get specific entities like people, places, organizations
  const people = doc.people().out('array');
  for (const person of people) {
    addKeyword(keywords, person, 2); // Give person names higher weight
  }
  
  const places = doc.places().out('array');
  for (const place of places) {
    addKeyword(keywords, place, 1.5); // Give places slightly higher weight
  }
  
  const organizations = doc.organizations().out('array');
  for (const org of organizations) {
    addKeyword(keywords, org, 1.5); // Give organizations slightly higher weight
  }
  
  // Sort keywords by count (highest first)
  keywords.sort((a, b) => b.count - a.count);
  
  // Return top N keywords
  return keywords.slice(0, limit).map(k => k.word);
}

// Helper function to add keyword to result array or increment its count
function addKeyword(keywords: KeywordResult[], word: string, weight: number = 1): void {
  // Normalize and clean the word
  word = word.toLowerCase().trim();
  
  // Skip short words and common stop words
  if (word.length < 3 || isStopWord(word)) {
    return;
  }
  
  // Check if keyword already exists
  const existingKeyword = keywords.find(k => k.word === word);
  if (existingKeyword) {
    existingKeyword.count += weight;
  } else {
    keywords.push({ word, count: weight });
  }
}

// Check if a word is a stop word (common words that aren't useful as keywords)
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with',
    'about', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
    'had', 'having', 'do', 'does', 'did', 'doing', 'i', 'me', 'my', 'mine', 'myself',
    'you', 'your', 'yours', 'yourself', 'he', 'him', 'his', 'himself', 'she', 'her',
    'hers', 'herself', 'it', 'its', 'itself', 'we', 'us', 'our', 'ours', 'ourselves',
    'they', 'them', 'their', 'theirs', 'themselves', 'this', 'that', 'these', 'those',
    'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some', 'such',
    'no', 'not', 'only', 'same', 'so', 'than', 'too', 'very',
    'can', 'will', 'just', 'should', 'now'
  ]);
  
  return stopWords.has(word);
} 