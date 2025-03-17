from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from helpers import wikipedia

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 20

class StubArticleRequest(BaseModel):
    topics: List[str]
    text: str
    limit: Optional[int] = 10

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
        results = await wikipedia.find_relevant_stub_articles(
            request.topics,
            request.text,
            request.limit
        )
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 