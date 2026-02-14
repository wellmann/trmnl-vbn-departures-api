import { error, IRequestStrict, json } from 'itty-router';
import HafasClientFactory from './HafasClientFactory';

const DEFAULT_DURATION = 30; // Show departures for the next n minutes
const DEFAULT_RESULTS = 7;

export default class ApiController {
	protected clientFactory: HafasClientFactory;

	public constructor(clientFactory: HafasClientFactory) {
		this.clientFactory = clientFactory;
	}

	public auth = (request: IRequestStrict, env: Env) => {
		if (request.headers.get('Authorization') !== 'Bearer ' + env.API_KEY) {
			return error(401, 'Unauthorized');
		}
	};

	public getLocations = async (request: IRequestStrict, env: Env): Promise<Response> => {
		const url = new URL(request.url);
		const query = url.searchParams.get('query');
		if (!query) {
			return error(400, 'Missing or invalid query');
		}

		try {
			const client = await this.clientFactory.create(env);
			const locations = await client.locations(query, { results: 5 });

			return json(locations);
		} catch (err) {
			return error(500, `Failed to fetch locations: ${err instanceof Error ? err.message : 'Unknown error'}`);
		}
	};

	public getDepartures = async (request: IRequestStrict, env: Env): Promise<Response> => {
		const stopId = request?.params?.stopId;
		if (!stopId) {
			return error(400, 'Missing or invalid stopId');
		}

		try {
			const client = await this.clientFactory.create(env);
			const url = new URL(request.url);
			const duration = this.parseQueryParam(url, 'duration', DEFAULT_DURATION);
			const results = this.parseQueryParam(url, 'results', DEFAULT_RESULTS);
			const departures = await client.departures(stopId, { duration, results });

			return json(departures);
		} catch (err) {
			return error(500, `Failed to fetch departures: ${err instanceof Error ? err.message : 'Unknown error'}`);
		}
	};

	private parseQueryParam(url: URL, key: string, defaultValue: number): number {
		const value = parseInt(url.searchParams.get(key) || '');
		return value > 0 ? Math.min(defaultValue, value) : defaultValue;
	};
}
