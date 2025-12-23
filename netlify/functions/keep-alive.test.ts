import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from './keep-alive';
import type { HandlerEvent, HandlerContext } from '@netlify/functions';

// Mock timers for instant test execution
vi.useFakeTimers();

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      const mockCounts = {
        apartments: 42,
        votes: 128,
      };

      const mockData = {
        voting_issues: [{ id: '1', title: 'Test Issue', active: true, created_at: '2025-01-01' }],
        health_checks: { id: 'test-id', checked_at: new Date().toISOString() },
      };
      
      return {
        select: vi.fn((selection: string, options?: { count?: string; head?: boolean }) => {
          // Handle count queries (apartments, votes)
          if (options?.count === 'exact' && options?.head === true) {
            return Promise.resolve({
              count: mockCounts[table as keyof typeof mockCounts] || 0,
              error: null,
            });
          }

          // Handle regular select queries
          const chain = {
            order: vi.fn(() => ({
              limit: vi.fn(() => 
                Promise.resolve({
                  data: mockData[table as keyof typeof mockData] || [],
                  error: null,
                })
              ),
            })),
            eq: vi.fn(() => ({
              single: vi.fn(() => 
                Promise.resolve({
                  data: mockData[table as keyof typeof mockData],
                  error: null,
                })
              ),
            })),
            single: vi.fn(() => 
              Promise.resolve({
                data: mockData[table as keyof typeof mockData],
                error: null,
              })
            ),
          };

          return chain;
        }),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => 
              Promise.resolve({
                data: mockData.health_checks,
                error: null,
              })
            ),
          })),
        })),
      };
    }),
  })),
}));

// Helper to create mock event
const createMockEvent = (overrides: Partial<HandlerEvent> = {}): HandlerEvent => ({
  httpMethod: 'POST',
  headers: {
    'x-keep-alive-secret': 'test-secret-token',
  },
  body: null,
  isBase64Encoded: false,
  rawUrl: 'http://localhost/.netlify/functions/keep-alive',
  rawQuery: '',
  path: '/.netlify/functions/keep-alive',
  queryStringParameters: {},
  multiValueQueryStringParameters: {},
  ...overrides,
});

const mockContext: HandlerContext = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'keep-alive',
  functionVersion: '1',
  invokedFunctionArn: 'arn',
  memoryLimitInMB: '128',
  awsRequestId: 'test-id',
  logGroupName: 'test-log-group',
  logStreamName: 'test-log-stream',
  getRemainingTimeInMillis: () => 3000,
  done: vi.fn(),
  fail: vi.fn(),
  succeed: vi.fn(),
  clientContext: undefined,
  identity: undefined,
};

describe('Keep-Alive Netlify Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    // Set up environment variables
    process.env.KEEP_ALIVE_SECRET = 'test-secret-token';
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  describe('Authentication', () => {
    it('should return 401 when secret is missing', async () => {
      const event = createMockEvent({ headers: {} });
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body)).toEqual({
        error: 'Unauthorized. Invalid secret token.',
      });
    });

    it('should return 401 when secret is invalid', async () => {
      const event = createMockEvent({
        headers: { 'x-keep-alive-secret': 'wrong-secret' },
      });
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body)).toEqual({
        error: 'Unauthorized. Invalid secret token.',
      });
    });

    it('should return 500 when KEEP_ALIVE_SECRET env var is missing', async () => {
      delete process.env.KEEP_ALIVE_SECRET;
      const event = createMockEvent();
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        error: 'Server configuration error',
      });
    });
  });

  describe('HTTP Method Validation', () => {
    it('should return 405 for GET requests', async () => {
      const event = createMockEvent({ httpMethod: 'GET' });
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(405);
      expect(JSON.parse(response.body)).toEqual({
        error: 'Method not allowed. Use POST.',
      });
    });

    it('should return 405 for PUT requests', async () => {
      const event = createMockEvent({ httpMethod: 'PUT' });
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(405);
    });
  });

  describe('Environment Configuration', () => {
    it('should return 500 when Supabase URL is missing', async () => {
      delete process.env.VITE_SUPABASE_URL;
      const event = createMockEvent();
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        error: 'Database configuration error',
      });
    });

    it('should return 500 when Supabase anon key is missing', async () => {
      delete process.env.VITE_SUPABASE_ANON_KEY;
      const event = createMockEvent();
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        error: 'Database configuration error',
      });
    });
  });

  describe('Successful Execution', () => {
    it('should return 200 with stats on successful execution', async () => {
      const event = createMockEvent();
      const responsePromise = handler(event, mockContext);
      
      // Fast-forward through all delays
      await vi.runAllTimersAsync();
      
      const response = await responsePromise;

      expect(response.statusCode).toBe(200);
      expect(response.headers?.['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.stats).toEqual({
        apartments: 42,
        issues: 1,
        votes: 128,
      });
      expect(body.performance).toHaveProperty('totalTimeMs');
      expect(body.performance).toHaveProperty('operationsCompleted', 5);
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('healthCheckId');
    });

    it('should include valid timestamp in ISO format', async () => {
      const event = createMockEvent();
      const responsePromise = handler(event, mockContext);
      
      // Fast-forward through all delays
      await vi.runAllTimersAsync();
      
      const response = await responsePromise;

      const body = JSON.parse(response.body);
      expect(() => new Date(body.timestamp)).not.toThrow();
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should complete all 5 database operations', async () => {
      const event = createMockEvent();
      const responsePromise = handler(event, mockContext);
      
      // Fast-forward through all delays
      await vi.runAllTimersAsync();
      
      const response = await responsePromise;

      const body = JSON.parse(response.body);
      expect(body.performance.operationsCompleted).toBe(5);
      expect(body.performance).toHaveProperty('totalTimeMs');
    });
  });

  describe('Response Format', () => {
    it('should include all required fields in success response', async () => {
      const event = createMockEvent();
      const responsePromise = handler(event, mockContext);
      
      // Fast-forward through all delays
      await vi.runAllTimersAsync();
      
      const response = await responsePromise;

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('stats');
      expect(body).toHaveProperty('performance');
      expect(body).toHaveProperty('healthCheckId');
    });

    it('should have correct stats structure', async () => {
      const event = createMockEvent();
      const responsePromise = handler(event, mockContext);
      
      // Fast-forward through all delays
      await vi.runAllTimersAsync();
      
      const response = await responsePromise;

      const body = JSON.parse(response.body);
      expect(body.stats).toHaveProperty('apartments');
      expect(body.stats).toHaveProperty('issues');
      expect(body.stats).toHaveProperty('votes');
      expect(typeof body.stats.apartments).toBe('number');
      expect(typeof body.stats.issues).toBe('number');
      expect(typeof body.stats.votes).toBe('number');
    });

    it('should have correct performance structure', async () => {
      const event = createMockEvent();
      const responsePromise = handler(event, mockContext);
      
      // Fast-forward through all delays
      await vi.runAllTimersAsync();
      
      const response = await responsePromise;

      const body = JSON.parse(response.body);
      expect(body.performance).toHaveProperty('totalTimeMs');
      expect(body.performance).toHaveProperty('operationsCompleted');
      expect(typeof body.performance.totalTimeMs).toBe('number');
      expect(body.performance.operationsCompleted).toBe(5);
    });
  });
});

