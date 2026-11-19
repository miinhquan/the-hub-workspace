import {archiveStale} from '../lib/store';
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import {GET as loadWorkspace} from '../app/api/workspace/route';
import {GET as loadWhatsApp} from '../app/api/whatsapp/route';
import {GET as checkWhatsAppRevision} from '../app/api/whatsapp/events/route';

const worker = {
  async scheduled(_event: ScheduledController, _env: Cloudflare.Env, ctx: ExecutionContext) {ctx.waitUntil(archiveStale('owner'));},
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    if (request.method === 'GET') {
      const path = new URL(request.url).pathname;
      if (path === '/api/workspace') return loadWorkspace(request);
      if (path === '/api/whatsapp') return loadWhatsApp(request);
      if (path === '/api/whatsapp/events') return checkWhatsAppRevision(request);
    }
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};

export default worker;
