import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type AuthContext, createCrewioClient } from "./lib/crewio.js";
import { registerDealTools } from "./tools/deals.js";
import { registerContactTools } from "./tools/contacts.js";
import { registerCompanyTools } from "./tools/companies.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerPipelineTools } from "./tools/pipelines.js";
import { registerTeamTools } from "./tools/teams.js";
import { registerGroupTools } from "./tools/groups.js";
import { registerMemberTools } from "./tools/members.js";
import { registerInvitationTools } from "./tools/invitations.js";
import { registerFeedTools } from "./tools/feed.js";
import { registerNotificationTools } from "./tools/notifications.js";
import { registerSearchTools } from "./tools/search.js";
import { env } from "./env.js";

// Creates a fresh McpServer per request so each request gets its own auth
// context. Stateless by design — no session state shared between requests.
export function createMcpServer(auth: AuthContext): McpServer {
  const server = new McpServer({
    name: "crewio",
    version: "0.1.0",
  });

  const client = createCrewioClient(env.CREWIO_API_URL, auth);

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

  return server;
}
