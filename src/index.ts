import { AutoRouter } from 'itty-router';
import ApiController from './ApiController';
import PreviewController from './PreviewController';
import HafasClientFactory from './HafasClientFactory';

const router = AutoRouter();
const hafasClientFactory = new HafasClientFactory();
const apiController = new ApiController(hafasClientFactory);
const previewController = new PreviewController(apiController);

router.all('/api/*', apiController.auth);
router.get('/api/v6/locations', apiController.getLocations);
router.get('/api/v6/departures/:stopId', apiController.getDepartures);
router.all('/preview/*', previewController.auth);
router.get('/preview/:template', previewController.renderPreview);

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return router.fetch(request, env, ctx);
	}
} satisfies ExportedHandler<Env>;
