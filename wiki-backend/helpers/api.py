from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel
from helpers import wikipedia
from openai import OpenAI
import os
import io
import pdfplumber
from docx import Document

router = APIRouter()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Constants
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB limit
SUPPORTED_TYPES = {
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
}

class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 20

class StubArticleRequest(BaseModel):
    topics: List[str]
    text: str
    limit: Optional[int] = 10

class FileResponse(BaseModel):
    text: str
    preview: str  # First 500 characters
    total_length: int
    file_type: str

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

async def process_pdf(file_content: bytes) -> str:
    """Extract text from PDF file."""
    try:
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
        return text.strip()
    except Exception as e:
        print(f"Error processing PDF: {e}")
        raise HTTPException(status_code=400, detail="Error processing PDF file")

async def process_docx(file_content: bytes) -> str:
    """Extract text from DOCX file."""
    try:
        doc = Document(io.BytesIO(file_content))
        text = '\n'.join(paragraph.text for paragraph in doc.paragraphs)
        return text.strip()
    except Exception as e:
        print(f"Error processing DOCX: {e}")
        raise HTTPException(status_code=400, detail="Error processing DOCX file")

def clean_text(text: str) -> str:
    """Clean and normalize text content."""
    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Remove extra whitespace while preserving paragraph breaks
    paragraphs = text.split('\n')
    cleaned_paragraphs = [' '.join(p.split()) for p in paragraphs if p.strip()]
    
    # Join paragraphs with single line breaks
    return '\n'.join(cleaned_paragraphs)

@router.post("/process-file")
async def process_file(file: UploadFile = File(...)):
    """Process uploaded file and extract text content."""
    try:
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset position
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE/1024/1024:.1f}MB"
            )
        
        # Check file type
        if file.content_type not in SUPPORTED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Supported types: {', '.join(SUPPORTED_TYPES.keys())}"
            )
            
        content = await file.read()
        
        # Process based on file type
        if file.content_type == "application/pdf":
            text = await process_pdf(content)
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            text = await process_docx(content)
        else:  # text/plain
            text = content.decode('utf-8')
            
        # Clean up the extracted text
        cleaned_text = clean_text(text)
        
        # Create preview (first 500 characters, respecting word boundaries)
        preview = cleaned_text[:500]
        if len(cleaned_text) > 500:
            # Find last space within first 500 chars
            last_space = preview.rfind(' ')
            if last_space > 0:
                preview = preview[:last_space] + '...'
            else:
                preview = preview + '...'
        
        return FileResponse(
            text=cleaned_text,
            preview=preview,
            total_length=len(cleaned_text),
            file_type=SUPPORTED_TYPES[file.content_type]
        )
        
    except Exception as e:
        print(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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