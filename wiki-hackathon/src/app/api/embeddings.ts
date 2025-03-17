import OpenAI from 'openai';

// Initialize OpenAI client
// You should use environment variables for the API key in production
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default embedding model
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Generate embeddings for a given text using OpenAI's embedding model
 * @param text The text to generate embeddings for
 * @returns A vector of embeddings
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * @param embeddingA First embedding vector
 * @param embeddingB Second embedding vector
 * @returns Similarity score between 0 and 1 (higher means more similar)
 */
export function calculateCosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
  if (embeddingA.length !== embeddingB.length) {
    throw new Error('Embedding vectors must have the same dimensions');
  }

  // Calculate dot product
  let dotProduct = 0;
  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i];
  }

  // Calculate magnitudes
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < embeddingA.length; i++) {
    magnitudeA += embeddingA[i] * embeddingA[i];
    magnitudeB += embeddingB[i] * embeddingB[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  // Return cosine similarity
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find the most relevant items using embeddings-based semantic search
 * @param queryEmbedding The embedding of the search query
 * @param items Array of items to search through
 * @param getItemEmbedding Function to extract embedding from an item
 * @param limit Maximum number of results to return
 * @returns Array of items sorted by relevance with similarity scores
 */
export function findMostRelevantItems<T>(
  queryEmbedding: number[],
  items: T[],
  getItemEmbedding: (item: T) => number[],
  limit: number = 10
): Array<{ item: T; similarity: number }> {
  // Calculate similarity scores for all items
  const scoredItems = items.map(item => {
    const itemEmbedding = getItemEmbedding(item);
    const similarity = calculateCosineSimilarity(queryEmbedding, itemEmbedding);
    return { item, similarity };
  });

  // Sort by similarity (highest first) and limit results
  return scoredItems
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Combines multiple text fields into a single text for embedding
 * @param texts Object containing different text fields
 * @returns Combined text with field labels
 */
export function combineTextsForEmbedding(texts: { [key: string]: string }): string {
  return Object.entries(texts)
    .filter(([_, value]) => value && value.trim())
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n\n");
} 