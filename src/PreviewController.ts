import { error, html, IRequestStrict } from 'itty-router';
import ApiController from './ApiController';
import htmlLayout from '../views/html.liquid';
import trmnlLayout from '../views/trmnl.liquid';
import fullPartial from '../views/partials/full.liquid';
import sharedPartial from '../views/partials/shared.liquid';
import TrmnlLiquid from './TrmnlLiquid';

const LIQUID_INCLUDE_REGEX = /\{%\s*include\s+["']([^"']+)["']\s*%}/g;
const PARTIALS = {
	'partials/full': fullPartial,
	'partials/shared': sharedPartial
};
const LAYOUTS = {
	html: htmlLayout,
	trmnl: trmnlLayout
};

export default class PreviewController {
	protected apiController: ApiController;

	public constructor(apiController: ApiController) {
		this.apiController = apiController;
	}

	public auth = (request: IRequestStrict, env: Env) => {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Basic')) {
			return new Response('Unauthorized', {
				status: 401,
				headers: {
					'WWW-Authenticate': 'Basic'
				}
			});
		}

		const base64Credentials = authHeader.slice(6);
		const credentials = atob(base64Credentials);
		const [username, password] = credentials.split(':');

		if (username !== env.API_KEY || password !== env.API_KEY) {
			return error(401, 'Unauthorized');
		}
	};

	public renderPreview = async (request: IRequestStrict, env: Env) => {
		const templateName = request?.params?.template;
		if (!templateName) {
			return error(400, 'Template name is required');
		}

		if (!(templateName in LAYOUTS)) {
			return error(404, `Template "${templateName}" not found`);
		}

		const layout = LAYOUTS[templateName as keyof typeof LAYOUTS];

		const url = new URL(request.url);
		const stopId = url.searchParams.get('stopId');
		if (!stopId) {
			return error(400, 'stopId query parameter is required');
		}

		const departuresUrl = new URL(`/api/v6/departures/${stopId}`, url.origin);

		const departuresRequest = new Request(departuresUrl.toString()) as IRequestStrict;
		departuresRequest.params = { stopId };
		const departuresResponse = await this.apiController.getDepartures(departuresRequest, env);

		if (!departuresResponse.ok) {
			return departuresResponse;
		}

		const { departures, realtimeDataUpdatedAt } = await departuresResponse.json() as DeparturesResponse;

		try {
			const engine = new TrmnlLiquid();
			const processedLayout = this.resolvePartials(layout);
			const rendered = await engine.parseAndRender(processedLayout, {
				departures,
				realtimeDataUpdatedAt,
				trmnl: {
					plugin_settings: {
						custom_fields_values: {
							minutesToStation: 3,
							provider: 'BSAG'
						}
					},
					user: {
						utc_offset: new Date().getTimezoneOffset() / -60
					}
				}
			});

			return html(rendered);
		} catch (err) {
			return error(500, `Failed to render template: ${err instanceof Error ? err.message : 'Unknown error'}`);
		}
	};

	private resolvePartials(template: string): string {
		return template.replace(
			LIQUID_INCLUDE_REGEX,
			(match, partialPath: keyof typeof PARTIALS) => PARTIALS[partialPath] || match
		);
	};
}
