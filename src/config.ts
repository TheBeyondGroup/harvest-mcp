/**
 * Shared Config type for the Harvest MCP Server.
 *
 * Loader implementations live next to their runtime — `workers/config.ts`
 * builds a Config from Cloudflare Workers env bindings.
 */

export interface Config {
  harvest: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    apiBaseUrl: string;
    authBaseUrl: string;
  };
  security: {
    allowedOrigins: string[];
    sessionSecret: string;
    sessionTtlHours: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}
