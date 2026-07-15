import createClient, { type Middleware } from 'openapi-fetch';

import type { paths } from './schema';

export interface GeneratedClientOptions {
  baseUrl: string;
  getAccessToken: () => string | null | Promise<string | null>;
  getDatabase: () => string | null | Promise<string | null>;
  fetch?: typeof globalThis.fetch;
}

/**
 * Contract-generated client for newly migrated endpoints. The compatibility
 * API remains available while feature slices move to this client.
 */
export function createGeneratedClient(options: GeneratedClientOptions) {
  const client = createClient<paths>({
    baseUrl: options.baseUrl,
    fetch: options.fetch,
  });

  const authenticationMiddleware: Middleware = {
    async onRequest({ request }) {
      const [token, database] = await Promise.all([
        options.getAccessToken(),
        options.getDatabase(),
      ]);
      if (token) request.headers.set('Authorization', `Bearer ${token}`);
      if (database) request.headers.set('X-Database', database);
      return request;
    },
  };

  client.use(authenticationMiddleware);
  return client;
}

export type BillManagerGeneratedClient = ReturnType<typeof createGeneratedClient>;
