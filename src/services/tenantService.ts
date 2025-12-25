import { createClient } from "../helpers/httpClient";
import type { IConnected, IServerHealth } from "../types/service";

const tenantClient = createClient("/tenant-ser");

export const getHealthCheck = () => {
	return tenantClient<IServerHealth>("/health");
};

export const isConnected = () => {
	return tenantClient<IConnected>("/connected");
};
