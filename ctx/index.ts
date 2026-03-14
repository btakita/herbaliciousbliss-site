import type { site_T } from '@rappstack/domain--server/site'
import { site__set } from '@rappstack/domain--server/site'
import type { Context } from 'hono'
import type { middleware_ctx_T } from 'rebuildjs/server'
import { request_ctx__ensure } from 'rhonojs/server'
/**
 * Ensures a request context is created for Hono routes with site config.
 */
export function site_request_ctx__ensure(
	middleware_ctx:middleware_ctx_T,
	c:Context,
	{ site }:{ site:site_T }
) {
	const request_ctx = request_ctx__ensure(middleware_ctx, c)
	site__set(request_ctx, site)
	return request_ctx
}
