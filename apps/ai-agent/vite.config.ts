import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { handleApi } from "./worker/api";
import { devStorage } from "./scripts/dev-storage";
import { readFileSync } from "node:fs";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "local-preview-api",
      configureServer(server) {
        const env = {
          CONFIG: devStorage(".local/kv"),
          ADMIN_PASSWORD: readFileSync(
            ".local/admin-password.txt",
            "utf8",
          ).trim(),
          SESSION_SECRET: readFileSync(
            ".local/session-secret.txt",
            "utf8",
          ).trim(),
        };
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith("/api/")) return next();
          try {
            const chunks: Buffer[] = [];
            let bytes = 0;
            for await (const chunk of req) {
              bytes += chunk.length;
              if (bytes > 64000) {
                res.statusCode = 413;
                res.end("Request too large");
                return;
              }
              chunks.push(chunk);
            }
            const data = Buffer.concat(chunks);
            const response = await handleApi(
              new Request(`http://${req.headers.host}${req.url}`, {
                method: req.method,
                headers: new Headers(req.headers as Record<string, string>),
                body: data.length ? data : undefined,
              }),
              env,
            );
            res.statusCode = response.status;
            response.headers.forEach((value, key) => res.setHeader(key, value));
            res.end(await response.text());
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Local preview error" }));
          }
        });
      },
    },
  ],
  server: { port: 4173, strictPort: true },
  build: { target: "es2022", chunkSizeWarningLimit: 650 },
});
