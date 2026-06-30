# mcp-local-tools

A minimal local [MCP](https://modelcontextprotocol.io) server exposing two tools over STDIO:

| Tool         | Description                                         |
| ------------ | --------------------------------------------------- |
| `web_search` | Web search via the [Tavily](https://tavily.com) API |
| `read_file`  | Read a UTF-8 text file from the local filesystem    |

## Setup

```bash
cd mcp-server
npm install
cp .env.example .env   # then edit and add your TAVILY_API_KEY
npm run build
```

Quick sanity check:

```bash
npm start
# stderr: [mcp-local-tools] ready on stdio
# (Ctrl+C to exit)
```

## Add to Claude Desktop

Edit `claude_desktop_config.json`:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add an `mcpServers` entry pointing at the built `dist/index.js`:

```json
{
  "mcpServers": {
    "local-tools": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/mcp-server/dist/index.js"],
      "env": {
        "TAVILY_API_KEY": "tvly-..."
      }
    }
  }
}
```

Replace `/ABSOLUTE/PATH/TO/mcp-server` with the absolute path on your machine. Restart Claude Desktop — the `web_search` and `read_file` tools will appear in the tools picker.

## Scripts

| Script          | What it does                          |
| --------------- | ------------------------------------- |
| `npm run build` | Compile TypeScript to `dist/`         |
| `npm start`     | Run the compiled server (`dist/`)     |
| `npm run dev`   | Run from source with `tsx` (no build) |
| `npm run clean` | Delete `dist/`                        |

## Notes

- All logs go to **stderr** — `stdout` is reserved for MCP JSON-RPC framing.
- `read_file` refuses files larger than 1 MB; tweak `MAX_BYTES` in `src/tools/readFile.ts` if needed.
- Errors are returned as `isError: true` tool results so the model can react to them.
