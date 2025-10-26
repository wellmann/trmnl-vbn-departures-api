const DEPARTURES_STOP_ID_REGEX = /^\/departures\/(\d+)$/;

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.headers.get('Authorization') !== `Bearer ${env.API_KEY}`) {
			return errorResponse('Unauthorized', 401);
		}

		try {
			const { pathname } = new URL(request.url);
			switch (true) {
				case pathname === '/locations':
					return await handleLocations(request, env);
				case DEPARTURES_STOP_ID_REGEX.test(pathname):
					return await handleDepartures(request, env);
				default:
					return errorResponse('Not found', 404);
			}
		} catch (error) {
			console.error('Worker error:', error);

			return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
		}
	},
} satisfies ExportedHandler<Env>;

async function handleLocations(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const query = url.searchParams.get('query');
	if (!query) {
		return errorResponse('Missing query parameter', 400);
	}

	try {
		const client = await getClient(env);
		const locations = await client.locations(query, { results: 5 });

		return jsonResponse(locations);
	} catch (error) {
		throw new Error(`Failed to fetch locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

async function handleDepartures(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const stopId = url.pathname.match(DEPARTURES_STOP_ID_REGEX)?.[1];
	if (!stopId) {
		return errorResponse('Missing or invalid stopId', 400);
	}

	try {
		const client = await getClient(env);

		const defaultDuration = 30;
		let duration = parseInt(url.searchParams.get('duration') || '') || defaultDuration;
		duration = Math.min(defaultDuration, duration);

		const defaultResults = 7;
		let results = parseInt(url.searchParams.get('results') || '') || defaultResults;
		results = Math.min(defaultResults, results);

		const departures = await client.departures(stopId, { duration, results });

		return jsonResponse(departures);
	} catch (error) {
		throw new Error(`Failed to fetch departures: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

let clientPromise: Promise<any> | null = null;

async function getClient(env: Env) {
	try {
		if (!clientPromise) {
			clientPromise = (async () => {
				const { createClient } = await import('hafas-client');
				const { profile: vbnProfile } = await import('hafas-client/p/vbn/index.js');

				return createClient(vbnProfile, env.HAFAS_USER_AGENT);
			})();
		}

		return clientPromise;
	} catch (error) {
		throw new Error(`Failed to initialize HAFAS client: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json; charset=utf-8' }
	});
}

function errorResponse(message: string, status = 500): Response {
	return jsonResponse({ error: message }, status);
}
