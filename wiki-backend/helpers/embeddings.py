from openai import OpenAI
import os
from typing import Dict, List
import numpy as np

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Default embedding model
EMBEDDING_MODEL = 'text-embedding-3-small'

async def generate_embedding(text: str) -> List[float]:
    """Generate embeddings for a given text using OpenAI's embedding model."""
    try:
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embeddings: {e}")
        raise e

def calculate_cosine_similarity(embedding_a: List[float], embedding_b: List[float]) -> float:
    """Calculate cosine similarity between two embedding vectors."""
    if len(embedding_a) != len(embedding_b):
        raise ValueError('Embedding vectors must have the same dimensions')

    # Convert to numpy arrays for efficient computation
    a = np.array(embedding_a)
    b = np.array(embedding_b)
    
    # Calculate cosine similarity
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def combine_texts_for_embedding(texts: Dict[str, str]) -> str:
    """Combines multiple text fields into a single text for embedding."""
    return "\n\n".join(
        f"{key}: {value}"
        for key, value in texts.items()
        if value and value.strip()
    ) 