export const SERVICE_TARGET_MAP = {
	master: "tenantService",
	tenant: "masterService",
} as const;

export const SERVICES: (keyof typeof SERVICE_TARGET_MAP)[] = [
	"master",
	"tenant",
];

export const SERVICE_TARGETS: (typeof SERVICE_TARGET_MAP)[keyof typeof SERVICE_TARGET_MAP][] =
	["tenantService", "masterService"];
