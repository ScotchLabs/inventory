import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./schema"; // Your generated types
import { API_URL } from '../environment'

export const fetchClient = createFetchClient<paths>({
  baseUrl: API_URL,
  credentials: "include",
});

export const client = createClient(fetchClient);
