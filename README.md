# crewio-mcp

Hosted HTTP [MCP](https://modelcontextprotocol.io) server that exposes your Crewio CRM as tools for AI assistants (Cursor, Claude Desktop, etc.).

## Tools

| Tool             | Description                                                    |
| ---------------- | -------------------------------------------------------------- |
| `list_deals`     | List deals with optional search, status filter, and pagination |
| `get_deal`       | Get full deal details by ID                                    |
| `create_deal`    | Create a new deal                                              |
| `update_deal`    | Update an existing deal                                        |
| `list_contacts`  | List contacts with optional search and pagination              |
| `get_contact`    | Get full contact details by ID                                 |
| `create_contact` | Create a new contact                                           |
| `update_contact` | Update an existing contact                                     |
| `list_companies` | List companies with optional search and pagination             |
| `get_company`    | Get full company details by ID                                 |
| `create_company` | Create a new company                                           |
| `update_company` | Update an existing company                                     |
| `list_comments`  | List comments on a deal, contact, or company                   |
| `create_comment` | Post a comment on a deal, contact, or company                  |
| `search`         | Full-text search across deals, contacts, and companies         |

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

The server is **stateless** — each request is authenticated independently via the `Authorization` and `X-Workspace-Id` headers, so multiple users can share a single hosted instance with their own tokens.

## Authentication

Requests must include two headers:

- `Authorization: Bearer <token>` — your Crewio API token
- `X-Workspace-Id: <id>` — your workspace ID

These are forwarded as-is to the Crewio backend on every tool call.

## Development

```bash
npm run dev          # Start with hot-reload
npm run typecheck    # TypeScript type check
npm run lint         # oxlint
npm run lint:fix     # oxlint --fix
npm run format       # oxfmt
npm run format:check # oxfmt --check
npm run build        # Compile to dist/
```

## Docker

```bash
docker build -t crewio-mcp .
docker run -p 3002:3002 --env-file .env crewio-mcp
```

Coolify: Dockerfile at repo root, expose port **3002**. Runtime env: `CREWIO_API_URL=https://api.yourapp.com` (no trailing slash).
