import { IconArrowBarRight, IconLoader2 } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardContainer } from "@/components/ui/card-container";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { ThemeProvider } from "@/hooks/use-theme";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { isConnectedSSE as isMasterConnectedSSE } from "@/services/masterService";
import { isConnectedSSE as isTenantConnectedSSE } from "@/services/tenantService";
import { SERVICE_TARGET_MAP, SERVICES } from "./constants/server.constants";
import type { IConnected } from "./types/service";

type StatusState = {
	connected: boolean;
	data: IConnected | null;
	latency: number;
	latencyHistory: number[];
};

type StatusesMap = Record<keyof typeof SERVICE_TARGET_MAP, StatusState>;

export function App() {
	const [isLoading, setIsLoading] = useState(true);
	const [statuses, setStatuses] = useState<StatusesMap>({
		master: {
			connected: false,
			data: null,
			latency: Infinity,
			latencyHistory: [],
		},
		tenant: {
			connected: false,
			data: null,
			latency: Infinity,
			latencyHistory: [],
		},
	});
	// Use Refs to track timeouts so we can clear them on unmount
	const retryTimeouts = useRef<{
		master: ReturnType<typeof setInterval> | null;
		tenant: ReturnType<typeof setInterval> | null;
	}>({
		master: null,
		tenant: null,
	});
	const heartbeatTimeouts = useRef<{
		master: ReturnType<typeof setInterval> | null;
		tenant: ReturnType<typeof setInterval> | null;
	}>({
		master: null,
		tenant: null,
	});

	useEffect(() => {
		let masterSSE: EventSource | null = null;
		let tenantSSE: EventSource | null = null;

		// Generic function to handle connection logic
		const connect = (service: "master" | "tenant") => {
			// 1. Clear any pending retries for this service
			if (retryTimeouts.current[service]) {
				clearTimeout(retryTimeouts.current[service]);
				retryTimeouts.current[service] = null;
			}

			// 2. Instantiate the EventSource
			const source =
				service === "master" ? isMasterConnectedSSE() : isTenantConnectedSSE();

			if (service === "master") masterSSE = source;
			else tenantSSE = source;

			const handleDisconnect = () => {
				// if (source.readyState === EventSource.CLOSED) return;
				console.error(`${service} connection lost (or heartbeat missed).`);
				setStatuses((prev) => ({
					...prev,
					[service]: {
						...prev[service],
						connected: false,
						latency: Infinity,
					},
				}));
				source.close();
				if (heartbeatTimeouts.current[service]) {
					clearTimeout(heartbeatTimeouts.current[service]);
				}
				if (!retryTimeouts.current[service]) {
					retryTimeouts.current[service] = setTimeout(() => {
						connect(service);
					}, 3000);
				}
			};

			const resetHeartbeatCheck = () => {
				if (heartbeatTimeouts.current[service]) {
					clearTimeout(heartbeatTimeouts.current[service]);
				}
				heartbeatTimeouts.current[service] = setTimeout(() => {
					console.warn(`${service} heartbeat timeout.`);
					handleDisconnect();
				}, 1000);
			};

			// 3. Handle Messages (Success)
			source.onmessage = (event) => {
				resetHeartbeatCheck();
				const start = Date.now();
				const { data } = JSON.parse(event.data) as { data: IConnected };
				const latency = Math.max(0, start - data.health.now);

				setStatuses((prev) => ({
					...prev,
					[service]: {
						connected: true,
						data,
						latency,
						latencyHistory: [...prev[service].latencyHistory, latency].slice(
							-5,
						),
					},
				}));
			};

			// 4. Handle Errors (Disconnect & Retry)
			source.onerror = () => {
				handleDisconnect();
			};

			resetHeartbeatCheck();
		};

		// Initial Connections
		connect("master");
		connect("tenant");

		setIsLoading(false); // Regardless of connection success

		// Cleanup on Component Unmount
		return () => {
			if (masterSSE) masterSSE.close();
			if (tenantSSE) tenantSSE.close();
			if (retryTimeouts.current.master)
				clearTimeout(retryTimeouts.current.master);
			if (retryTimeouts.current.tenant)
				clearTimeout(retryTimeouts.current.tenant);
		};
	}, []);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
				<IconLoader2 className="w-8 h-8 animate-spin opacity-50" />
				<p className="mt-4 text-sm font-medium opacity-70">
					Checking service status...
				</p>
			</div>
		);
	}

	return (
		<ThemeProvider>
			<div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
				<div className="absolute top-4 right-4">
					<ModeToggle />
				</div>
				<h1 className="tracking-wide text-sm uppercase mb-8 opacity-75">
					Services this web-app is connected to
				</h1>

				<CardContainer title="Service Status" className="w-full">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
						{SERVICES.map((service) => {
							const serviceStatus = statuses[service];
							const bgColor =
								service === "master"
									? "bg-cyan-50 dark:bg-cyan-950"
									: "bg-teal-50 dark:bg-teal-950";
							const isOffline =
								serviceStatus.latency === Infinity ||
								serviceStatus.connected === false;
							const serviceConnectedTo = SERVICE_TARGET_MAP[service];
							const serviceConnectedTo_readable = capitalizeFirstLetter(
								serviceConnectedTo.replace("Service", " Service"),
							);
							const isInternalServiceConnected =
								serviceStatus.data?.servicesConnected[
									SERVICE_TARGET_MAP[service]
								].status === "UP";
							const chartColor = service === "master" ? "cyan" : "teal";
							const chartConfig: Record<
								string,
								{ label: string; color: string }
							> = {
								latency: { label: "Latency (ms)", color: chartColor },
							};
							const chartData = serviceStatus.latencyHistory.map(
								(latency, index) => ({ index, latency }),
							);

							return (
								<Card
									key={service}
									className={cn(
										"relative",
										serviceStatus.connected
											? bgColor
											: "bg-red-50 dark:bg-red-950",
									)}
								>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="tracking-wide">
											{capitalizeFirstLetter(service)} Service
										</CardTitle>
										<Badge
											className="tracking-wider w-28"
											variant={isOffline ? "destructive" : "default"}
										>
											{isOffline
												? "Offline"
												: `LATENCY ${String(serviceStatus.latency).padStart(3, " ")}ms`}
										</Badge>
									</CardHeader>
									<CardContent>
										{serviceStatus.latencyHistory.length > 0 &&
											serviceStatus.connected && (
												<div className="h-16 mb-2">
													<ChartContainer
														config={chartConfig}
														className="w-full h-full"
													>
														<AreaChart data={chartData}>
															<Area
																type="monotone"
																dataKey="latency"
																fill="var(--color-latency)"
																stroke="var(--color-latency)"
																fillOpacity={0.2}
																strokeWidth={2}
																animationDuration={500}
															/>
															<XAxis hide />
															<YAxis
																hide
																domain={["dataMin - 10", "dataMax + 10"]}
															/>
															<ChartTooltip content={<ChartTooltipContent />} />
														</AreaChart>
													</ChartContainer>
												</div>
											)}
										{serviceStatus.connected && (
											<div className="flex flex-col gap-2">
												<div className="flex items-center gap-2 text-sm font-medium">
													<IconArrowBarRight size={18} className="opacity-80" />
													<span className="text-xs tracking-wide">
														{serviceConnectedTo_readable}
													</span>
													<div
														className={cn(
															"w-2 h-2 rounded-full",
															isInternalServiceConnected
																? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
																: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
														)}
													/>
												</div>
											</div>
										)}
									</CardContent>
								</Card>
							);
						})}
					</div>
				</CardContainer>
			</div>
		</ThemeProvider>
	);
}

export default App;
