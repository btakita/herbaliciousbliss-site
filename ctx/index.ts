import type { site_T } from '@rappstack/domain--server/site'
import { site__set } from '@rappstack/domain--server/site'
import type { Context } from 'hono'
import type { middleware_ctx_T } from 'rebuildjs/server'
import { request_ctx__ensure, request_, request_url_ } from 'rhonojs/server'
/**
 * Ensures a request context is created for Hono routes with site config.
 *
 * Eagerly initializes request_ and request_url_ from rhonojs (external, Hono-based)
 * so the be entries exist before any bundled relysjs code (Elysia-based) can create them.
 * Both use the same be id ('request', 'request_url') — first caller wins.
 */
export function site_request_ctx__ensure(
	middleware_ctx:middleware_ctx_T,
	c:Context,
	{ site }:{ site:site_T }
) {
	const request_ctx = request_ctx__ensure(middleware_ctx, c)
	// Eagerly populate request bes with Hono-based implementations
	request_(request_ctx)
	request_url_(request_ctx)
	site__set(request_ctx, site)
	return request_ctx
}
