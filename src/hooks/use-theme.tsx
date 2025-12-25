"use client";

import * as React from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
}

interface ThemeProviderState {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	// We can treat this as a derived value
	resolvedTheme: "dark" | "light" | undefined;
}

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
	resolvedTheme: "light",
};

export const ThemeContext =
	React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
	// 1. Initialize state.
	// We use a lazy initializer to avoid accessing localStorage on the server (Next.js SSR).
	const [theme, setTheme] = React.useState<Theme>(() => {
		// Only access window/localStorage if we are in the browser
		if (typeof window !== "undefined") {
			return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
		}
		return defaultTheme;
	});

	// 2. This state tracks the actual active color scheme (dark/light)
	// We need this in state to trigger re-renders if the System preference changes
	const [resolvedTheme, setResolvedTheme] = React.useState<
		"dark" | "light" | undefined
	>(undefined);

	React.useEffect(() => {
		const root = window.document.documentElement;

		// Remove old classes
		root.classList.remove("light", "dark");

		if (theme === "system") {
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
				.matches
				? "dark"
				: "light";

			root.classList.add(systemTheme);
			setResolvedTheme(systemTheme);
			return;
		}

		// If explicit 'dark' or 'light'
		root.classList.add(theme);
		setResolvedTheme(theme);
	}, [theme]);

	// 3. Listener for System changes
	// This is only active if the current theme is 'system'
	React.useEffect(() => {
		if (theme !== "system") return;

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const handleChange = () => {
			const newTheme = mediaQuery.matches ? "dark" : "light";
			const root = window.document.documentElement;

			root.classList.remove("light", "dark");
			root.classList.add(newTheme);
			setResolvedTheme(newTheme);
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [theme]);

	const value = React.useMemo(
		() => ({
			theme,
			setTheme: (newTheme: Theme) => {
				localStorage.setItem(storageKey, newTheme);
				setTheme(newTheme);
			},
			resolvedTheme,
		}),
		[theme, resolvedTheme, storageKey],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = React.useContext(ThemeContext);

	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");

	return context;
}
