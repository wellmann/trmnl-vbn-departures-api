import { vi } from 'vitest';

export const mockLocationsResponse = [
  {
    type: 'stop',
    id: '12345',
    name: 'Bremen Hauptbahnhof',
    location: {
      type: 'location',
      latitude: 53.083,
      longitude: 8.814
    }
  }
];

export const mockDeparturesResponse = [
  {
    tripId: 'trip-1',
    stop: {
      type: 'stop',
      id: '12345',
      name: 'Bremen Hauptbahnhof'
    },
    when: '2025-10-20T14:00:00+02:00',
    direction: 'Hamburg Hauptbahnhof',
    line: {
      type: 'line',
      id: 'RE1',
      name: 'RE 1'
    }
  }
];

export const mockHafasClient = {
  locations: vi.fn().mockResolvedValue(mockLocationsResponse),
  departures: vi.fn().mockResolvedValue(mockDeparturesResponse)
};

vi.mock('hafas-client', () => ({
  createClient: () => mockHafasClient
}));

vi.mock('hafas-client/p/vbn/index.js', () => ({
  profile: {}
}));
