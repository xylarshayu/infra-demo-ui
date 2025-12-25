import { IconArrowBarRight, IconLoader2 } from "@tabler/icons-react";
import { useEffect, useState } from "react";
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
import { isConnected as isMasterConnected } from "@/services/masterService";
import { isConnected as isTenantConnected } from "@/services/tenantService";
import { SERVICE_TARGET_MAP, SERVICES } from "./constants/server.constants";
import type { IConnected } from "./types/service";

type StatusState = {
	connected: boolean;
	data: IConnected | null;
	ping: number;
	pingHistory: number[];
};

type StatusesMap = Record<keyof typeof SERVICE_TARGET_MAP, StatusState>;

export function App() {
	const [isLoading, setIsLoading] = useState(true);
	const [statuses, setStatuses] = useState<StatusesMap>({
		master: { connected: false, data: null, ping: Infinity, pingHistory: [] },
		tenant: { connected: false, data: null, ping: Infinity, pingHistory: [] },
	});

	useEffect(() => {
		const loadService = async (service: keyof typeof SERVICE_TARGET_MAP) => {
			const start = performance.now();
			let serviceData: StatusState = {
				connected: false,
				data: null,
				ping: Infinity,
				pingHistory: [],
			};
			try {
				const serviceResponse = await (service === "master"
					? isMasterConnected()
					: isTenantConnected());
				const end = performance.now();
				const ping = Math.round(end - start);
				const newPingHistory = [ping];
				serviceData = {
					connected: true,
					data: serviceResponse.data,
					ping,
					pingHistory: newPingHistory,
				};
			} catch (error) {
				const errorText =
					error instanceof Error ? error.message : "Unknown error";
				console.error(`Error loading ${service} service:`, errorText);
			}

			setStatuses((prev) => ({
				...prev,
				[service]: {
					...serviceData,
					pingHistory: serviceData.connected
						? [...(prev[service].pingHistory || []), serviceData.ping].slice(-5)
						: prev[service].pingHistory,
				},
			}));
		};
		const fetchStatus = async () => {
			await Promise.all([loadService("master"), loadService("tenant")]);
			setIsLoading(false);
		};

		fetchStatus();

		const interval = setInterval(fetchStatus, 1000);
		return () => clearInterval(interval);
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
							const isOffline = serviceStatus.ping === Infinity;
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
								ping: { label: "Ping (ms)", color: chartColor },
							};
							const chartData = serviceStatus.pingHistory.map(
								(ping, index) => ({ index, ping }),
							);

							return (
								<Card
									key={service}
									className={cn(
										"relative",
										serviceStatus.connected ? bgColor : "bg-red-50",
									)}
								>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="tracking-wide">
											{capitalizeFirstLetter(service)} Service
										</CardTitle>
										<Badge
											className="tracking-wider w-24"
											variant={isOffline ? "destructive" : "default"}
										>
											{isOffline
												? "Offline"
												: `PING ${String(serviceStatus.ping).padStart(3, " ")}ms`}
										</Badge>
									</CardHeader>
									<CardContent>
										{serviceStatus.pingHistory.length > 0 && (
											<div className="h-16 mb-2">
												<ChartContainer
													config={chartConfig}
													className="w-full h-full"
												>
													<AreaChart data={chartData}>
														<Area
															type="monotone"
															dataKey="ping"
															fill="var(--color-ping)"
															stroke="var(--color-ping)"
															fillOpacity={0.2}
															strokeWidth={2}
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
