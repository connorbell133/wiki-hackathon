import httpx
import asyncio
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

async def process_search_result(result: Dict[str, Any], topic: str, user_embedding: List[float]) -> Optional[Dict[str, Any]]:
    """Process a single search result and return article details if it's a valid stub."""
    try:
        categories = await get_article_categories(result['title'])
        is_stub = any(
            'stub' in cat.lower() or 
            ('article' in cat.lower() and 'quality' in cat.lower())
            for cat in categories
        )
        
        if is_stub:
            details = await get_article_details(result['title'])
            if details:
                article_text = combine_texts_for_embedding({
                    'title': details['title'],
                    'content': details['extract'],
                    'categories': ', '.join(details['categories'])
                })
                
                article_embedding = await generate_embedding(article_text)
                similarity = calculate_cosine_similarity(user_embedding, article_embedding)
                
                return {
                    **details,
                    'embedding': article_embedding,
                    'relevanceScore': similarity,
                    'missingInfo': generate_missing_info_suggestions(details, topic),
                }
    except Exception as e:
        print(f"Error processing search result {result['title']}: {e}")
    return None

async def process_topic(topic: str, user_embedding: List[float]) -> List[Dict[str, Any]]:
    """Process a single topic and return its search results."""
    try:
        search_results = await search_wikipedia(f"{topic} stub", 5)
        # Process all search results for this topic in parallel
        results = await asyncio.gather(
            *[process_search_result(result, topic, user_embedding) for result in search_results]
        )
        # Filter out None results
        return [r for r in results if r is not None]
    except Exception as e:
        print(f"Error processing topic {topic}: {e}")
        return []

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
    
    # Process all topics in parallel
    all_results_nested = await asyncio.gather(
        *[process_topic(topic, user_embedding) for topic in topics]
    )
    
    # Flatten results and remove duplicates based on title
    seen_titles = set()
    all_results = []
    for results in all_results_nested:
        for result in results:
            if result['title'] not in seen_titles:
                seen_titles.add(result['title'])
                all_results.append(result)
    
    # Sort by relevance (similarity score) and take the top results
    all_results.sort(key=lambda x: x['relevanceScore'], reverse=True)
    
    # Remove embeddings before returning
    return [{k: v for k, v in result.items() if k != 'embedding'} 
            for result in all_results[:limit]] 