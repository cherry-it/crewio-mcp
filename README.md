# crewio-agent

AI agent + hosted HTTP [MCP](https://modelcontextprotocol.io) server for Crewio CRM.

Exposes two interfaces on a single Fastify process:

- **`POST /chat`** — conversational AI agent (OpenAI Agents SDK) backed by the Crewio API
- **`POST /mcp`** — Streamable HTTP MCP server for AI assistants (Cursor, Claude Desktop, etc.)

Both use the same Crewio auth headers; the agent calls its own `/mcp` endpoint over loopback.

## Capabilities

- **CRM core**: deals, contacts, companies — full CRUD, archive/restore, bulk actions, custom fields
- **Pipelines**: pipelines and stages CRUD, board view, deal creation via `POST /pipelines/:id/deals`
- **Relationships**: contact ↔ company links, comments, reactions, activity feed
- **Workspace**: members, teams, groups, invitations, notifications
- **Discovery**: `list_custom_field_definitions`, omnibox `search`, MCP resource `crewio://schema/collection-filters`
- **Analytics**: deal reports, calendar, recycle bin
- **Context**: `get_me`, `list_workspaces`

## POST /chat

Conversational endpoint for the AI agent. Maintains in-memory conversation threads keyed by `session_id`.

**Request headers:**

- `Authorization: Bearer <crewio_api_token>`
- `X-Workspace-Id: <workspace_id>`

**Request body:**

```json
{ "session_id": "unique-session-id", "message": "List my open deals" }
```

**Response:**

```json
{ "session_id": "unique-session-id", "reply": "Here are your open deals…" }
```

Sessions expire after 1 hour of inactivity. The agent uses a curated subset of tools by default (read + core writes) to control token cost — set `AGENT_TOOLS=all` to expose all 94 tools.

## POST /mcp (MCP server)

Connects AI assistants directly to Crewio tools. Stateless — each request is authenticated independently.

### Response contract

All tool responses use a uniform envelope:

```json
{ "data": <payload>, "pagination": { ... } }
```

- `pagination` is present only for paginated list endpoints
- Singleton reads (`get_deal`, `get_contact`, …) return `{ "data": { ... } }`
- Mutations that return `{ message, code }` wrap them as `{ "data": { message, code } }`
- Raw arrays (e.g. `list_custom_field_definitions`) return `{ "data": [ ... ] }`

## Setup

```bash
cp .env.example .env
# Edit .env: set CREWIO_API_URL and OPENAI_API_KEY at minimum
npm install
npm run dev
```

## Connecting to Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "crewio": {
      "url": "http://localhost:3002/mcp",
      "headers": {
        "Authorization": "Bearer <your_crewio_api_token>",
        "X-Workspace-Id": "<your_workspace_id>"
      }
    }
  }
}
```

## Authentication

All endpoints require:

- `Authorization: Bearer <token>` — Crewio API token
- `X-Workspace-Id: <id>` — workspace ID

## MCP resource

Read `crewio://schema/collection-filters` for filter allowlists, sort fields, and enum values per collection endpoint.

## Development

```bash
npm run dev          # Start with hot-reload
npm run typecheck    # TypeScript type check
npm run lint         # oxlint
npm run lint:fix     # oxlint --fix
npm run format       # oxfmt
npm run build        # Compile to dist/
```

Smoke test the agent (requires a running server + real Crewio credentials):

```bash
CREWIO_TOKEN=<token> WORKSPACE_ID=<id> npx tsx tmp/smoke-chat.ts
```

## Environment variables

| Variable          | Required | Default                     | Description                                   |
| ----------------- | -------- | --------------------------- | --------------------------------------------- |
| `CREWIO_API_URL`  | yes      | —                           | Crewio backend base URL                       |
| `OPENAI_API_KEY`  | yes      | —                           | OpenAI API key (for `/chat`)                  |
| `PORT`            | no       | `3002`                      | HTTP listen port                              |
| `NODE_ENV`        | no       | `development`               | `development` \| `production` \| `test`       |
| `AGENT_MODEL`     | no       | `gpt-4.1-mini`              | OpenAI model for the agent                    |
| `AGENT_MAX_TURNS` | no       | `20`                        | Max turns per agent run                       |
| `AGENT_TOOLS`     | no       | `curated`                   | `curated` (allowlist) or `all` (all 94 tools) |
| `MCP_SELF_URL`    | no       | `http://127.0.0.1:3002/mcp` | Loopback URL for agent→MCP calls              |

## Docker

```bash
docker build -t crewio-agent .
docker run -p 3002:3002 \
  -e CREWIO_API_URL=http://host.docker.internal:3000 \
  -e OPENAI_API_KEY=sk-... \
  crewio-agent
```

Coolify: expose port **3002**. Runtime env: `CREWIO_API_URL=https://api.yourapp.com` (no trailing slash).

## Future

See [docs/FUTURE.md](docs/FUTURE.md) for API capabilities not yet exposed as MCP tools.
