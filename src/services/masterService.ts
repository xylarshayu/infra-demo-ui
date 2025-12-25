import { createClient } from "../helpers/httpClient";
import type { IQueryOptions } from "../types/index.d.ts";
import type { IConnected, IServerHealth, ITenant } from "../types/service";

const masterClient = createClient("/master-ser");

export const getHealthCheck = () => {
	return masterClient<IServerHealth>("/health");
};

export const isConnected = () => {
	return masterClient<IConnected>("/connected");
};

export const getTenants = (queryOptions?: IQueryOptions) => {
	return masterClient<ITenant[], "success-paginated">("/tenants", {
		query: queryOptions,
	});
};

export const getTenantById = (id: string) => {
	return masterClient<ITenant>(`/tenants/${id}`);
};
