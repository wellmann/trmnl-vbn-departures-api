export default class HafasClientFactory {
	private clientPromise: Promise<any> | null = null;

	public async create(env: Env) {
		try {
			if (!this.clientPromise) {
				this.clientPromise = (async () => {
					const { createClient } = await import('hafas-client');
					const { profile: vbnProfile } = await import('hafas-client/p/vbn/index.js');

					return createClient(vbnProfile, env.HAFAS_USER_AGENT);
				})();
			}

			return this.clientPromise;
		} catch (error) {
			throw new Error(`Failed to initialize HAFAS client: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	};
}
