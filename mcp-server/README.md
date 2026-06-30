# mcp-local-tools

A standalone local [MCP](https://modelcontextprotocol.io) server (Node.js + TypeScript) exposing two tools over **STDIO**:

| Tool         | Description                                              |
| ------------ | -------------------------------------------------------- |
| `web_search` | Web search via the [Tavily](https://tavily.com) API      |
| `read_file`  | Read a UTF-8 file from disk, with strict path sandboxing |

Built on `@modelcontextprotocol/sdk` with `zod` for argument validation. No API keys live in the code — everything sensitive comes from environment variables.

## Setup

```bash
cd mcp-server
npm install
cp .env.example .env   # then edit and add TAVILY_API_KEY
npm run build
```

Sanity check:

```bash
npm start
# stderr: [mcp-local-tools] ready on stdio
```

## Security

- **`TAVILY_API_KEY`** is read from the environment only; never commit it.
- **`read_file`** sandbox:
  - Rejects `..` segments and NUL bytes before touching the filesystem.
  - Restricts reads to an allow-list of roots (`MCP_READ_ROOTS`, colon-separated absolute paths). Defaults to the user's home directory.
  - Resolves symlinks with `realpath` and re-checks that the final target is still inside the allow-list — so a symlink inside `~/` cannot exfiltrate `/etc/passwd`.
  - Caps file size at 1 MB (`MAX_BYTES` in `src/tools/readFile.ts`).

## Register with Claude Desktop

Edit `claude_desktop_config.json`:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "local-tools": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/mcp-server/dist/index.js"],
      "env": {
        "TAVILY_API_KEY": "tvly-...",
        "MCP_READ_ROOTS": "/Users/you/Documents:/Users/you/Projects"
      }
    }
  }
}
```

Replace the absolute path with the one on your machine. Restart Claude Desktop and the two tools appear in the picker.

## Scripts

| Script          | What it does                          |
| --------------- | ------------------------------------- |
| `npm run build` | Compile TypeScript to `dist/` (`tsc`) |
| `npm start`     | Run the compiled server               |
| `npm run dev`   | Run from source via `tsx`             |
| `npm run clean` | Delete `dist/`                        |

## Notes

- Logs go to **stderr** — stdout is reserved for MCP JSON-RPC framing.
- Tool errors are returned as `isError: true` results so the model can react.
