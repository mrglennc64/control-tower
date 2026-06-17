// Base-path-aware API helpers. When deployed under a subpath (e.g. /crm),
// set NEXT_PUBLIC_BASE_PATH at build time; locally it is "" and all URLs
// resolve at the root as before.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const api = (path: string) => `${BASE_PATH}${path}`;
export const fetcher = (url: string) => fetch(api(url)).then((r) => r.json());
