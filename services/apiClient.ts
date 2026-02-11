
import { handleInsightsRequest, handleGenerationRequest, handleKPIRecommendationRequest } from '../api/handler';

/**
 * World-class API client that routes requests.
 * In a real production environment, this would call actual backend endpoints.
 * Here, it simulates the backend by calling isolated handlers directly.
 */
export const apiClient = {
  async post(url: string, body: any): Promise<Response> {
    console.log(`[API Client] Routing request to: ${url}`);
    
    try {
      if (url === '/api/insights') {
        const data = await handleInsightsRequest(body);
        return new Response(JSON.stringify(data), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      if (url === '/api/recommend-kpis') {
        const data = await handleKPIRecommendationRequest(body);
        return new Response(JSON.stringify(data), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
      
      if (url === '/api/generate-dashboard') {
        const data = await handleGenerationRequest(body.text || body);
        return new Response(JSON.stringify(data), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      // Fallback for non-mocked internal API routes
      if (url.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
      }

      // Fallback to real fetch for external URLs
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch (err) {
      console.error(`[API Client] Error handling ${url}:`, err);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
  }
};
