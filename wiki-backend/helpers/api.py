from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from helpers import wikipedia
from openai import OpenAI
import os

router = APIRouter()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 20

class StubArticleRequest(BaseModel):
    topics: List[str]
    text: str
    limit: Optional[int] = 10

async def extract_topics_with_gpt(text: str) -> List[str]:
    """Extract relevant topics from text using GPT."""
    if not text.strip():
        return []
        
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that extracts relevant Wikipedia topics from text. Extract 3-5 specific, focused topics that would be good for searching Wikipedia articles. Return only the topics as a comma-separated list, without any additional text or explanation."
                },
                {
                    "role": "user",
                    "content": text
                }
            ],
            temperature=0.7,
            max_tokens=100
        )
        
        # Extract topics from response
        topics_text = response.choices[0].message.content
        # Split by comma and clean up each topic
        topics = [topic.strip() for topic in topics_text.split(',')]
        return topics
        
    except Exception as e:
        print(f"Error extracting topics with GPT: {e}")
        return []

@router.post("/search")
async def search_wikipedia(request: SearchRequest):
    """Search Wikipedia articles."""
    try:
        results = await wikipedia.search_wikipedia(request.query, request.limit)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/{title}")
async def get_categories(title: str):
    """Get categories for a specific article."""
    try:
        categories = await wikipedia.get_article_categories(title)
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/article/{title}")
async def get_article_details(title: str):
    """Get detailed information about an article."""
    try:
        details = await wikipedia.get_article_details(title)
        if not details:
            raise HTTPException(status_code=404, detail="Article not found")
        return details
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stub-categories")
async def get_stub_categories():
    """Get list of stub categories."""
    try:
        categories = wikipedia.get_stub_categories()
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/relevant-stubs")
async def find_relevant_stubs(request: StubArticleRequest):
    """Find relevant stub articles based on user expertise."""
    try:
        # If no topics provided but text is available, extract topics using GPT
        topics = request.topics
        if not topics and request.text:
            topics = await extract_topics_with_gpt(request.text)
            
        results = await wikipedia.find_relevant_stub_articles(
            topics,
            request.text,
            request.limit
        )
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 