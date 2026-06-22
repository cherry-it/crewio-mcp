# Future MCP improvements

These API capabilities exist in Crewio but are not yet exposed as MCP tools. They are tracked here for prioritization.

## Planned tool coverage

- **Subscriptions** — subscribe/unsubscribe, list subscribers
- **Attachments** — upload, list, download
- **Reactions** — on deals and comments
- **Saved reports** — CRUD
- **Dashboards + widgets**
- **Billing** — read-only subscription/usage info
- **Webhooks** — list and manage outbound webhooks
- **Sample data** — seed/remove workspace sample data
- **Profile** — `update_me` and user settings
- **Notification preferences**
- **Cable token** — realtime Action Cable authentication

## Contributing

When adding a new tool, follow the existing patterns in `src/tools/` and update this list.
