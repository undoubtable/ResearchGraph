declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
  };
}

interface D1PreparedStatement {
  run(): Promise<unknown>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  bind(...values: unknown[]): D1PreparedStatement;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}
