import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { env } from "./env.js";
import { createCrewioClient, type AuthContext } from "./lib/crewio.js";
import { COLLECTION_SCHEMA_CATALOG } from "./lib/schema-catalog.js";
import { registerCompanyTools } from "./tools/companies.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerContextTools, registerCustomFieldDefinitionTools } from "./tools/context.js";
import { registerContactTools } from "./tools/contacts.js";
import { registerDealTools } from "./tools/deals.js";
import { registerFeedTools } from "./tools/feed.js";
import { registerGroupTools } from "./tools/groups.js";
import { registerInvitationTools } from "./tools/invitations.js";
import { registerMemberTools } from "./tools/members.js";
import { registerNotificationTools } from "./tools/notifications.js";
import { registerPipelineTools } from "./tools/pipelines.js";
import { registerSearchTools } from "./tools/search.js";
import { registerTeamTools } from "./tools/teams.js";

const SCHEMA_RESOURCE_URI = "crewio://schema/collection-filters";

// Creates a fresh McpServer per request so each request gets its own auth
// context. Stateless by design — no session state shared between requests.
export function createMcpServer(auth: AuthContext): McpServer {
  const server = new McpServer({
    name: "crewio",
    version: "0.2.0",
  });

  const client = createCrewioClient(env.CREWIO_API_URL, auth);

  server.registerResource(
    "collection-filters",
    SCHEMA_RESOURCE_URI,
    {
      description:
        "Catalog of list endpoint filters, sort fields, and enum values for the Crewio API.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(COLLECTION_SCHEMA_CATALOG, null, 2),
        },
      ],
    }),
  );

  registerDealTools(server, client);
  registerContactTools(server, client);
  registerCompanyTools(server, client);
  registerCommentTools(server, client);
  registerPipelineTools(server, client);
  registerTeamTools(server, client);
  registerGroupTools(server, client);
  registerMemberTools(server, client);
  registerInvitationTools(server, client);
  registerFeedTools(server, client);
  registerNotificationTools(server, client);
  registerSearchTools(server, client);
  registerCustomFieldDefinitionTools(server, client);
  registerContextTools(server, client);

  return server;
}
