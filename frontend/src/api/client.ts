import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./schema"; // Your generated types

// 1. Create the underlying openapi-fetch client
export const fetchClient = createFetchClient<paths>({
  baseUrl: "http://localhost:8000",
});

// 2. Wrap it with openapi-react-query
export const client = createClient(fetchClient);
