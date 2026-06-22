# crewio-mcp

Hosted HTTP [MCP](https://modelcontextprotocol.io) server that exposes your Crewio CRM as tools for AI assistants (Cursor, Claude Desktop, etc.).

## Capabilities

- **CRM core**: deals, contacts, companies — full CRUD, archive/restore, bulk actions, custom fields
- **Pipelines**: pipelines and stages CRUD, board view, deal creation via `POST /pipelines/:id/deals`
- **Relationships**: contact ↔ company links, comments, activity feed
- **Workspace**: members, teams, groups, invitations, notifications
- **Discovery**: `list_custom_field_definitions`, omnibox `search`, MCP resource `crewio://schema/collection-filters`
- **Analytics**: deal reports, calendar, recycle bin
- **Context**: `get_me`, `list_workspaces`

List tools support **filters**, **sort** (`sort` + `direction`), **custom field filters**, and return **pagination metadata** from response headers (`currentPage`, `totalCount`, `totalPages`, `pageLimit`).

## Setup

```bash
cp .env.example .env
# Edit .env and set CREWIO_API_URL
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

The server is **stateless** — each request is authenticated independently via the `Authorization` and `X-Workspace-Id` headers.

## Authentication

Requests must include:

- `Authorization: Bearer <token>` — your Crewio API token
- `X-Workspace-Id: <id>` — your workspace ID

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

## Docker

```bash
docker build -t crewio-mcp .
docker run -p 3002:3002 -e CREWIO_API_URL=http://host.docker.internal:3000 crewio-mcp
```

Coolify: expose port **3002**. Runtime env: `CREWIO_API_URL=https://api.yourapp.com` (no trailing slash).
