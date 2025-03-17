# Wikipedia Contribution Assistant

A tool that helps users find Wikipedia articles to contribute to based on their areas of expertise. The application identifies stub articles (incomplete articles) that match users' knowledge domains and provides guidance on what information is missing.

## Features

- **User Expertise Input**: Share your expertise through topic selection, free text, or by uploading a resume
- **Smart Topic Extraction**: Uses NLP to identify key topics from your input
- **Semantic Search with OpenAI Embeddings**: Leverages AI to provide highly relevant article recommendations
- **Wikipedia API Integration**: Finds relevant stub articles that need contributions
- **Article Recommendations**: Displays personalized article recommendations with contribution opportunities
- **Contribution Guidance**: Suggests specific content that could be added to improve articles

## Technologies Used

- **Next.js 15** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **OpenAI Embeddings** for semantic similarity search
- **Compromise.js** for NLP and keyword extraction
- **Wikipedia API** for article data retrieval

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/wikipedia-contribution-assistant.git
cd wikipedia-contribution-assistant
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add your OpenAI API key: `OPENAI_API_KEY=your_api_key_here`

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## How to Use

1. **Input Your Expertise**:
   - Select topics from predefined categories
   - Or describe your expertise in the free text field
   - Or upload your resume to extract expertise areas

2. **View Recommendations**: The application will identify Wikipedia stub articles related to your expertise that need improvement using semantic search with OpenAI embeddings.

3. **Contribute to Wikipedia**: Each article card shows specific areas where the article needs improvement. Click the "Edit on Wikipedia" button to contribute directly on Wikipedia.

## API Routes

- `POST /api/stub-articles`: Takes user topics or text and returns relevant stub articles using OpenAI embeddings for semantic matching

## Implementation Details

- The application uses OpenAI embeddings to understand the semantic meaning of both user expertise and Wikipedia articles.
- Vector similarity (cosine similarity) is used to rank articles by relevance to the user's expertise.
- The Wikipedia API is used to search for articles, retrieve categories, and find stub articles.
- Compromise.js is used for natural language processing to extract keywords from user input.
- Tailwind CSS is used for responsive design that works well on all device sizes.

## Semantic Search Process

1. User expertise (topics and text) is converted to an embedding vector using OpenAI's API
2. Potential Wikipedia articles are retrieved and converted to embedding vectors
3. Cosine similarity between user expertise and article vectors determines relevance
4. Articles are ranked by similarity score and presented to the user

## Future Enhancements

- Advanced text analysis for more accurate keyword extraction
- User authentication to save preferences and track contributions
- PDF and DOCX parsing for better resume extraction
- Integration with Wikipedia's edit API (requires OAuth)
- Expanded contribution guidance with AI-powered suggestions
- Caching of embeddings to improve performance and reduce API costs

## License

MIT
