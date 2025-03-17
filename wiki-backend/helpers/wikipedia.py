import httpx
from typing import List, Optional, Dict, Any
import os
from helpers.embeddings import generate_embedding, calculate_cosine_similarity, combine_texts_for_embedding

WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php'

async def search_wikipedia(query: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Search for Wikipedia articles based on a query."""
    params = {
        'action': 'query',
        'list': 'search',
        'srsearch': query,
        'format': 'json',
        'srlimit': limit,
        'origin': '*',
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(WIKIPEDIA_API_URL, params=params)
            response.raise_for_status()
            data = response.json()
            return data['query']['search']
        except Exception as e:
            print(f"Error searching Wikipedia: {e}")
            return []

async def get_article_categories(title: str) -> List[str]:
    """Get categories for a specific article by title."""
    params = {
        'action': 'query',
        'prop': 'categories',
        'titles': title,
        'format': 'json',
        'cllimit': 50,
        'origin': '*',
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(WIKIPEDIA_API_URL, params=params)
            response.raise_for_status()
            data = response.json()
            pages = data['query']['pages']
            page_id = list(pages.keys())[0]
            
            if page_id == '-1' or 'categories' not in pages[page_id]:
                return []
            
            return [cat['title'] for cat in pages[page_id]['categories']]
        except Exception as e:
            print(f"Error getting categories: {e}")
            return []

async def get_article_details(title: str) -> Optional[Dict[str, Any]]:
    """Get detailed information about an article by title."""
    params = {
        'action': 'query',
        'prop': 'extracts|pageimages|categories',
        'exintro': True,
        'explaintext': True,
        'titles': title,
        'format': 'json',
        'piprop': 'thumbnail',
        'pithumbsize': 200,
        'pilimit': 1,
        'cllimit': 50,
        'origin': '*',
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(WIKIPEDIA_API_URL, params=params)
            response.raise_for_status()
            data = response.json()
            pages = data['query']['pages']
            page_id = list(pages.keys())[0]
            
            if page_id == '-1':
                return None
            
            page = pages[page_id]
            return {
                'title': page['title'],
                'extract': page.get('extract', ''),
                'categories': [cat['title'] for cat in page.get('categories', [])],
                'thumbnailUrl': page.get('thumbnail', {}).get('source'),
                'viewUrl': f"https://en.wikipedia.org/wiki/{page['title'].replace(' ', '_')}",
                'editUrl': f"https://en.wikipedia.org/wiki/Edit:{page['title'].replace(' ', '_')}",
            }
        except Exception as e:
            print(f"Error getting article details: {e}")
            return None

def get_stub_categories() -> List[str]:
    """Get a predefined list of stub categories."""
    return [
        'Category:Stub categories',
        'Category:Geography stubs',
        'Category:History stubs',
        'Category:Science stubs',
        'Category:Technology stubs',
        'Category:Arts stubs',
        'Category:Biography stubs',
        'Category:Philosophy stubs',
        'Category:Politics stubs',
        'Category:Society stubs',
        'Category:Sports stubs',
    ]

def generate_missing_info_suggestions(article: Dict[str, Any], topic: str) -> List[str]:
    """Generate suggestions for missing information in an article."""
    missing_info = []
    extract = article.get('extract', '').lower()
    
    # Basic checks for common missing information
    if len(extract) < 500:
        missing_info.append("Article needs expansion with more detailed information")
    
    if not any(word in extract for word in ['born', 'founded', 'established', 'created']):
        missing_info.append("Missing origin/creation/founding information")
        
    if not any(word in extract for word in ['notable', 'known for', 'famous']):
        missing_info.append("Missing significance or notable achievements")
        
    if topic.lower() not in extract:
        missing_info.append(f"Could use more specific information about {topic}")
        
    return missing_info

async def find_relevant_stub_articles(topics: List[str], text: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Find most relevant stub articles based on user expertise using embeddings."""
    # Prepare user expertise text for embedding
    user_expertise_text = ''
    if topics:
        user_expertise_text += f"Topics: {', '.join(topics)}\n\n"
    if text and text.strip():
        user_expertise_text += f"Expertise description: {text}"
    
    # Generate embedding for user expertise
    user_embedding = await generate_embedding(user_expertise_text)
    
    all_results = []
    
    # Search by topics
    for topic in topics:
        search_results = await search_wikipedia(f"{topic} stub", 5)
        
        for result in search_results:
            categories = await get_article_categories(result['title'])
            is_stub = any(
                'stub' in cat.lower() or 
                ('article' in cat.lower() and 'quality' in cat.lower())
                for cat in categories
            )
            
            if is_stub:
                details = await get_article_details(result['title'])
                if details:
                    # Get article embedding using combined text
                    article_text = combine_texts_for_embedding({
                        'title': details['title'],
                        'content': details['extract'],
                        'categories': ', '.join(details['categories'])
                    })
                    
                    article_embedding = await generate_embedding(article_text)
                    similarity = calculate_cosine_similarity(user_embedding, article_embedding)
                    
                    all_results.append({
                        **details,
                        'embedding': article_embedding,
                        'relevanceScore': similarity,
                        'missingInfo': generate_missing_info_suggestions(details, topic),
                    })
    
    # Sort results by relevance score and return top results
    return sorted(all_results, key=lambda x: x['relevanceScore'], reverse=True)[:limit] 