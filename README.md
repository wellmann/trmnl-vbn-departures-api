# TRMNL VBN Departures API

A Cloudflare Workers API that provides real-time public transportation departure information for the VBN (Verkehrsverbund Bremen/Niedersachsen) network. Built for integration with [TRMNL](https://usetrmnl.com/) e-ink displays.

## Features

- **Real-time Departures**: Fetch upcoming departures for any VBN stop
- **Location Search**: Search for stops and stations by name
- **TRMNL Templates**: Pre-built Liquid templates for various TRMNL display layouts
- **Preview Mode**: Preview templates with live data before deployment

## API Endpoints

### Get Locations
Search for stops and stations:
```
GET /api/v6/locations?query={stopName}
Authorization: Bearer YOUR_API_KEY
```

**Parameters:**
- `query` (required): Stop name

### Get Departures
Get departures for a specific stop:
```
GET /api/v6/departures/{stopId}
Authorization: Bearer YOUR_API_KEY
```

**Parameters:**
- `stopId` (required): The station/stop ID
- `duration` (optional): Show departures for the next *n* minutes (default: 30)
- `results` (optional): Maximum number of results (default: 7)

### Preview Templates
Preview the full-screen layout with live data:
```
GET /preview/{template}?stop={stopId}
Authorization: Bearer YOUR_API_KEY
```

**Templates for the TRMNL Plugin Markup Editor:**
- `views/partials/full` - Full screen layout (large)
- `views/partials/half_horizontal` - Half screen horizontal layout (small)
- `views/partials/half_vertical` - Half screen vertical layout (large and compact)
- `views/partials/uadrant` - Quarter screen layout (small and compact)
- `views/partials/shared` - Base layout and logic

## Setup

### Requirements
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Installation

```bash
git clone git@github.com:wellmann/trmnl-vbn-departures-api.git
cd trmnl-vbn-departures-api

npm install

cp .env.example .env
```

Edit `.env` and set:
- `API_KEY`: A key to secure your API endpoint
- `HAFAS_USER_AGENT`: User agent string for HAFAS client that identifies your application

Configure Wrangler secrets:
```bash
wrangler secret put API_KEY
wrangler secret put HAFAS_USER_AGENT
```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:8787`

Run tests:
```bash
npm test
```

Deploy to Cloudflare Workers:
```bash
npm run deploy # or deploy via GitHub Actions
```
