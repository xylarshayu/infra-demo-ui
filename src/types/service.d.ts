import { SERVICE_TARGETS } from "@/constants/server.constants";

export interface ITenant {
	id: string;
	tenantId: number;
	name: string;
	description: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
	isActive: boolean;
	__x_db_uri?: string;
}

export type IServerHealth = {
	status: "UP" | null;
	uptime: number | null;
	timestamp: string | null;
};

export type IConnected = {
	servicesConnected: Record<(typeof SERVICE_TARGETS)[number], IServerHealth>;
};
