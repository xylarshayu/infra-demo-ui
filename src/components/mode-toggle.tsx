"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ModeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<Button variant="outline" size="sm">
				Theme
			</Button>
		);
	}

	const isDark = resolvedTheme === "dark";
	const label = isDark ? "LIGHT MODE" : "DARK MODE";
	const newTheme = isDark ? "light" : "dark";

	return (
		<Button
			variant="outline"
			size="xs"
			className="tracking-wider text-xs cursor-pointer"
			onClick={() => setTheme(newTheme)}
		>
			{label}
		</Button>
	);
}
