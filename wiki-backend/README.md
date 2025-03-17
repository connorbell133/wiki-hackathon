# Wikipedia API Backend

A FastAPI-based backend service that provides Wikipedia article search, categorization, and stub article recommendations using OpenAI embeddings for semantic similarity.

## Features

- Wikipedia article search
- Article category retrieval
- Detailed article information
- Stub article recommendations based on user expertise
- Semantic similarity using OpenAI embeddings

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory with your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

## Running the Server

Start the FastAPI server:
```bash
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`

## API Endpoints

- `POST /search`: Search Wikipedia articles
- `GET /categories/{title}`: Get categories for an article
- `GET /article/{title}`: Get detailed article information
- `GET /stub-categories`: Get list of stub categories
- `POST /relevant-stubs`: Find relevant stub articles based on user expertise

## API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative API docs: `http://localhost:8000/redoc` 