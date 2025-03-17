import { NextRequest } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { articles, query } = body;
    
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Please provide valid articles to summarize' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare article info for the prompt
    const articlesInfo = articles.map((article: any, index: number) => {
      return `Article ${index + 1}: "${article.title}"
Description: ${article.extract.slice(0, 300)}${article.extract.length > 300 ? '...' : ''}
Categories: ${article.categories.slice(0, 5).join(', ')}${article.categories.length > 5 ? '...' : ''}`;
    }).join('\n\n');
    
    // Determine if we're using Cohere reranker
    const reranked = body.reranked === true;
    
    // Create the prompt
    const prompt = `You are a helpful assistant that provides summaries of Wikipedia article recommendations.
    
The user is interested in: ${query || 'various topics'}

Here are ${articles.length} Wikipedia stub articles that match their interests:

${articlesInfo}

Please provide a brief summary (maximum 3 paragraphs) explaining:
1. What types of articles were found
2. How they relate to the user's interests
3. Why these articles might need contributions

Keep your tone helpful and encouraging. Focus on motivating the user to contribute to these articles.

Note: These are stub articles, which means they are incomplete and need expansion.
${reranked ? 'These results have been enhanced using a Cohere reranker for better relevance.' : 'These results were found using OpenAI embeddings for semantic search.'}`;

    // Create a streaming response with GPT-3.5
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.7,
      max_tokens: 400,
    });

    // Create a new Stream
    const textEncoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(textEncoder.encode(content));
          }
        }
        controller.close();
      },
    });

    // Return the streaming response
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate summary' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 