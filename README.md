# Harvest MCP

The Beyond Group's hosted Harvest MCP server. Lets TBG teammates query and manage their Harvest time tracking from Claude via the same claude.ai Connectors flow as Linear, Notion, Slack, and Figma.

**Status:** v1 deploy in progress ([TBG-230](https://linear.app/the-beyond-group/issue/TBG-230)). Endpoint URL TBA.

Forked from [southleft/harvest-mcp](https://github.com/southleft/harvest-mcp) so TBG owns the data path: TBG-registered Harvest OAuth app, TBG Cloudflare account, TBG-controlled token storage. MIT, both copyrights retained in [LICENSE](LICENSE).

---

## For TBG teammates (using it)

Once the v1 deploy lands, add it as a claude.ai Connector:

1. claude.ai → **Settings** → **Connectors** → **Add custom connector**
2. URL: `https://harvest-mcp.thebeyondgroup.la/mcp`
3. Authorize with your TBG Harvest login.

Works the same in claude.ai web, Claude Desktop, and Claude Code — the Connector is account-level.

### Example prompts

**Time tracking**
> "What did I work on today?"
> "Show me all my time entries from last week"
> "How many hours did I log on Hiya this month?"
> "Start a timer for the Design task on Bloom"
> "Stop my running timer"

**Team & client analysis**
> "Who on my team logged the most hours last month?"
> "Show me all time entries for Mudwtr"
> "What projects is Sarah working on?"
> "List all active clients"

**Profitability & utilization**
> "What's our profitability on Hiya this quarter?"
> "What's our team utilization rate this month?"
> "Which projects are most profitable?"

**Budget performance**
> "Which employees went over their project budgets this quarter?"
> "Show me top performers who came in under budget"

**Invoicing & expenses**
> "Show me all unpaid invoices"
> "What invoices are open for Our Place?"
> "List all expenses for the Auri project"

**Aggregation & reporting**
> "Sum up hours by project for November"
> "Break down time by client and user for Q4"
> "Show me time trends by month for 2026"

---

## Available tools (21)

### Time tracking
| Tool | Description |
|------|-------------|
| `harvest_list_time_entries` | List and filter time entries by user, client, project, date range |
| `harvest_get_time_entry` | Get a specific time entry by ID |
| `harvest_create_time_entry` | Create new time entries with optional timer |
| `harvest_stop_timer` | Stop a running timer |
| `harvest_delete_time_entry` | Delete a time entry |

### Company & team
| Tool | Description |
|------|-------------|
| `harvest_get_company` | Get company/account information |
| `harvest_get_current_user` | Get current user info |
| `harvest_list_users` | List all users with filters |

### Clients & contacts
| Tool | Description |
|------|-------------|
| `harvest_list_clients` | List all clients |
| `harvest_list_contacts` | List client contacts |

### Projects & tasks
| Tool | Description |
|------|-------------|
| `harvest_list_projects` | List all projects with filters |
| `harvest_list_tasks` | List all tasks |

### Invoicing & expenses
| Tool | Description |
|------|-------------|
| `harvest_list_invoices` | List invoices with state/date filters |
| `harvest_list_expenses` | List expenses with filters |

### Analytics & compute
| Tool | Description |
|------|-------------|
| `harvest_compute_profitability` | Profitability (time-based, invoice-based, or hybrid) |
| `harvest_compute_utilization` | Utilization with capacity tracking |
| `harvest_aggregate_time` | Aggregate time by client, project, user, date, week, or month |
| `harvest_compute_budget_performance` | Employee performance by budget adherence per project |

### Utilities
| Tool | Description |
|------|-------------|
| `harvest_get_rates` | Cost and billable rates with fallback support |
| `harvest_resolve_entities` | Fuzzy search for entities by name |
| `harvest_get_schema` | Schema definitions and enum values (no auth) |

---

## For developers (maintaining the service)

### Prerequisites

- Node 18+
- `wrangler` CLI (`npm i -g wrangler` or use `npx wrangler`)
- Access to TBG's Cloudflare account (for deploy + secrets)
- TBG-registered Harvest OAuth app (client ID + secret) — register at https://id.getharvest.com/developers

### First-time setup

```bash
git clone git@github.com:TheBeyondGroup/harvest-mcp.git
cd harvest-mcp
npm install

# Create KV namespaces (one-time, against TBG Cloudflare account)
npx wrangler kv:namespace create SESSIONS
npx wrangler kv:namespace create RATES_CONFIG
# → copy the returned IDs into wrangler.toml

# Set secrets
echo "<harvest oauth client id>" | npx wrangler secret put HARVEST_CLIENT_ID
echo "<harvest oauth client secret>" | npx wrangler secret put HARVEST_CLIENT_SECRET
echo "$(openssl rand -hex 32)" | npx wrangler secret put SESSION_SECRET
```

### Local dev

```bash
npm run dev:workers   # wrangler dev — local Workers runtime
npm test              # vitest
npm run lint
```

For local OAuth testing, register a second Harvest OAuth app with `http://localhost:8787/callback` as the redirect URI; production uses the live domain.

### Deploy

```bash
npm run deploy           # production
npm run deploy:staging   # staging env (defined in wrangler.toml)
```

Custom domain is wired in `wrangler.toml`'s `[[routes]]` block once the DNS for `harvest-mcp.thebeyondgroup.la` is provisioned.

### Environment variables

| Variable | Description | Required |
|----------|-------------|----------|
| `HARVEST_CLIENT_ID` | Harvest OAuth Client ID (TBG-registered) | Yes (secret) |
| `HARVEST_CLIENT_SECRET` | Harvest OAuth Client Secret | Yes (secret) |
| `SESSION_SECRET` | Random key for session encryption | Yes (secret) |
| `SESSION_TTL_HOURS` | Session lifetime (default 24) | No |
| `ALLOWED_ORIGINS` | CORS allowlist (default claude.ai) | No |
| `DEFAULT_COST_RATE` | Fallback cost rate for users without configured rate | No |

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Claude / MCP   │────▶│  Cloudflare      │────▶│  Harvest        │
│  Client         │◀────│  Workers (TBG)   │◀────│  API            │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Cloudflare KV   │
                        │  (Sessions)      │
                        └──────────────────┘
```

**Stack:** [Hono](https://hono.dev/) · [MCP SDK](https://github.com/modelcontextprotocol/sdk) · [Cloudflare KV](https://developers.cloudflare.com/kv/) · [Harvest API v2](https://help.getharvest.com/api-v2/)

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Landing page |
| `/health` | GET | Health check |
| `/mcp` | POST | MCP protocol endpoint |
| `/authorize` | GET | OAuth authorization (RFC 8414) |
| `/token` | POST | OAuth token exchange (S256 PKCE enforced when challenge present) |
| `/callback` | GET | Harvest OAuth callback |
| `/register` | POST | Dynamic Client Registration (RFC 7591) |
| `/.well-known/oauth-protected-resource` | GET | RFC 9728 metadata |
| `/.well-known/oauth-authorization-server` | GET | RFC 8414 metadata |

### Project layout

```
src/
├── workers/          # Cloudflare Workers entry point + Hono app
├── tools/            # MCP tool implementations (21 tools)
├── harvest/          # Harvest API client (cache, rate limiter, types)
├── compute/          # Analytics: profitability, utilization, aggregation
├── auth/             # OAuth2 client for Harvest
├── session/          # Session storage interfaces
├── rates/            # Cost/billable rate resolution
├── entities/         # Fuzzy entity resolution
└── schema/           # Tool schema documentation
```

---

## Keeping in sync with upstream

The fork tracks `southleft/harvest-mcp` as `upstream`. To pick up bug fixes or new tools from there:

```bash
git fetch upstream
git log upstream/main --oneline ^main      # see what's new
git cherry-pick <sha>                       # pull in specific commits
# or, less commonly:
git merge upstream/main                     # full merge
```

Don't blindly pull — the upstream may add features incompatible with TBG's deploy (e.g., changes to the OAuth flow, KV schema, or branding).

---

## License & attribution

MIT. See [LICENSE](LICENSE).

Forked from [southleft/harvest-mcp](https://github.com/southleft/harvest-mcp) (© 2025 Southleft). TBG additions © 2026 The Beyond Group.
