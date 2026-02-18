declare module "*.liquid" {
	const value: string;
	export default value;
}

interface DeparturesResponse {
	departures: any[];
	realtimeDataUpdatedAt: number;
}
