from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from typing import List, Optional
from pydantic import BaseModel
from helpers.api import router

# Load environment variables
load_dotenv()

app = FastAPI(title="Wikipedia API Backend")

# Configure CORS
if os.getenv("NODE_ENV") == "production":
    # In production, use specific origins
    origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
else:
    # In development, allow all origins
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include the API router
app.include_router(router, prefix="/api")

# Models
class WikipediaSearchResult(BaseModel):
    title: str
    pageid: int
    snippet: str

class ArticleWithEmbedding(BaseModel):
    title: str
    extract: str
    categories: List[str]
    thumbnailUrl: Optional[str] = None
    viewUrl: str
    editUrl: str
    embedding: Optional[List[float]] = None
    missingInfo: List[str]
    relevanceScore: float

@app.get("/")
async def root():
    return {"message": "Wikipedia API Backend is running"} 