import { NextRequest } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { content, articleTitle } = await request.json();

    if (!content || typeof content !== 'string' || !content.trim()) {
      return new Response(
        JSON.stringify({ error: 'Please provide content to validate' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create the prompt for content policy validation
    const prompt = `You are a Wikipedia content policy expert. Review the following proposed content addition for the article "${articleTitle}" and evaluate it against Wikipedia's core content policies:

1. Neutral Point of View (NPOV)
2. Verifiability
3. No Original Research
4. Notability
5. Style and Formatting

Proposed content:
${content}

Analyze the content and provide structured feedback in markdown format:

## Overall Assessment
[Whether the content generally aligns with Wikipedia policies]

## Policy Compliance
- **NPOV**: [Does it maintain a neutral point of view?]
- **Verifiability**: [Can the information be verified through reliable sources?]
- **Original Research**: [Does it avoid original research and synthesis?]
- **Style**: [Does it follow Wikipedia's style guidelines?]

## Specific Issues
[List any specific issues that need to be addressed]

## Improvement Suggestions
[Concrete suggestions for making the content policy-compliant]

Keep the tone constructive and helpful.
we render markdown, so use markdown formatting for better readability.
Keep the response to 300 tokens or less.`;

    // Create a streaming response with GPT-4
    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.7,
      max_tokens: 300,
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
    console.error('Error validating content:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to validate content' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 