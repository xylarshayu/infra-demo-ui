import type { IApiResponse, ResponseType } from "../types/index";

type QueryParams = Record<
	string,
	string | number | boolean | null | undefined | (string | number | boolean)[]
>;

type FetchOptions = RequestInit & {
	query?: QueryParams;
};

export const createClient = (
	baseUrl: string = "",
	defaultHeaders: Record<string, string> = {},
) => {
	const cleanedBaseUrl = baseUrl.replace(/\/$/, ""); // no trailing slash
	const isRelative =
		!cleanedBaseUrl.startsWith("http://") &&
		!cleanedBaseUrl.startsWith("https://");

	return async <T = null, R extends ResponseType = "success-regular">(
		path: string,
		options: FetchOptions = {},
	): Promise<IApiResponse<T, R>> => {
		const { query, ...initRequest } = options;

		let url: URL;
		if (isRelative || cleanedBaseUrl === "") {
			// Use window.location.origin for relative URLs
			const origin =
				typeof window !== "undefined"
					? window.location.origin
					: "http://localhost:3000";
			const fullPath = cleanedBaseUrl ? `${cleanedBaseUrl}${path}` : path;
			url = new URL(fullPath, origin);
		} else {
			url = new URL(`${cleanedBaseUrl}${path}`);
		}
		if (query) {
			Object.entries(query).forEach(([key, value]) => {
				if (value === undefined || value === null) return;

				if (Array.isArray(value)) {
					value.forEach((v) => {
						url.searchParams.append(key, String(v));
					});
				} else {
					url.searchParams.append(key, String(value));
				}
			});
		}

		const response = await fetch(url.toString(), {
			...initRequest,
			headers: {
				...defaultHeaders,
				...initRequest.headers,
			},
		});

		if (!response.ok) {
			const errorResponse = await response.json().catch(() => ({}));
			throw new Error(
				errorResponse.message || "An error occurred while fetching the data",
			);
		}

		return response.json() as Promise<IApiResponse<T, R>>;
	};
};
