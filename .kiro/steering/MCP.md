---
inclusion: always
---

# Model Context Protocol (MCP) Guidelines

## Supabase MCP Server Usage

### Database Operations

- **Always use the Supabase MCP server** for all database operations including schema changes, data manipulation, and RLS policy updates
- **Prefer `mcp_supabase_apply_migration`** for DDL operations (CREATE, ALTER, DROP statements)
- **Use `mcp_supabase_execute_sql`** for data queries and DML operations (SELECT, INSERT, UPDATE, DELETE)
- **Never hardcode generated IDs** in data migrations - use dynamic queries instead

### Schema Management

- **Apply migrations incrementally** using descriptive migration names in snake_case
- **Always check existing tables and extensions** before creating new ones using `mcp_supabase_list_tables` and `mcp_supabase_list_extensions`
- **Generate TypeScript types** after schema changes using `mcp_supabase_generate_typescript_types`

### Security & RLS

- **Enable Row Level Security (RLS)** on all user-facing tables
- **Test RLS policies** immediately after creation using appropriate user contexts
- **Use `mcp_supabase_get_advisors`** to check for security vulnerabilities and missing RLS policies

### Development Workflow

- **Check migration history** with `mcp_supabase_list_migrations` before applying new changes
- **Monitor logs** using `mcp_supabase_get_logs` when debugging database issues
- **Use branches** for experimental schema changes via `mcp_supabase_create_branch`

### Error Handling

- **Always validate SQL syntax** before applying migrations
- **Handle migration failures gracefully** and provide rollback instructions when possible
- **Log database errors** appropriately without exposing sensitive information

## Edge Functions

- **Deploy functions incrementally** using `mcp_supabase_deploy_edge_function`
- **Include proper TypeScript types** and error handling in all Edge Functions
- **Test function deployment** immediately after creation
