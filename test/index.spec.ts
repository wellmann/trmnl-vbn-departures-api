import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from '../src/index';
import { mockHafasClient, mockLocationsResponse, mockDeparturesResponse } from './mockHafasClient';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;
const API_KEY = 'test-api-key';

describe('TRMNL VBN departures API worker', () => {
  beforeEach(() => {
    env.API_KEY = API_KEY;
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('returns 401 when API key is missing', async () => {
      const request = new IncomingRequest('http://example.com/api/v6/locations?query=Bremen');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(401);
    });

    it('accepts requests with valid API key', async () => {
      const request = new IncomingRequest('http://example.com/api/v6/locations?query=Bremen', {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      expect(response.status).not.toBe(401);
    });
  });

  describe('locations endpoint', () => {
    it('returns 400 when query parameter is missing', async () => {
      const request = new IncomingRequest('http://example.com/api/v6/locations', {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(400);
    });

    it('returns JSON response for valid location query', async () => {
      const request = new IncomingRequest('http://example.com/api/v6/locations?query=Bremen', {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');

      const responseData = await response.json();
      expect(responseData).toEqual(mockLocationsResponse);
      expect(mockHafasClient.locations).toHaveBeenCalledWith('Bremen', { results: 5 });
    });
  });

  describe('departures endpoint', () => {
    it('returns JSON response for valid stop ID', async () => {
      const request = new IncomingRequest('http://example.com/api/v6/departures/12345', {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');

      const responseData = await response.json();
      expect(responseData).toEqual(mockDeparturesResponse);
      expect(mockHafasClient.departures).toHaveBeenCalledWith('12345', { duration: 30, results: 7 });
    });
  });

  describe('Invalid routes', () => {
    it('returns 404 for unknown paths', async () => {
      const request = new IncomingRequest('http://example.com/invalid-path', {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(404);
    });
  });

  describe('Error handling', () => {
    it('handles HAFAS client errors for locations', async () => {
      mockHafasClient.locations.mockRejectedValueOnce(new Error('HAFAS error'));

      const request = new IncomingRequest('http://example.com/api/v6/locations?query=Bremen', {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(500);
    });

    it('handles HAFAS client errors for departures', async () => {
      mockHafasClient.departures.mockRejectedValueOnce(new Error('HAFAS error'));

      const request = new IncomingRequest('http://example.com/api/v6/departures/12345', {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(500);
    });
  });
});
