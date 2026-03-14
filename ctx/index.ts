import type { site_T } from '@rappstack/domain--server/site'
import { site__set } from '@rappstack/domain--server/site'
import type { Context } from 'hono'
import type { middleware_ctx_T } from 'rebuildjs/server'
import { elysia_context__set } from 'relysjs/server'
import { request_ctx__ensure } from 'rhonojs/server'
/**
 * Ensures a request context is created for Hono routes with site config.
 * Sets both hono_context (via rhonojs) and elysia_context (for relysjs-based
 * auth modules that read request_ from the elysia context).
 */
export function site_request_ctx__ensure(
	middleware_ctx:middleware_ctx_T,
	c:Context,
	{ site }:{ site:site_T }
) {
	const request_ctx = request_ctx__ensure(middleware_ctx, c)
	// Also set elysia_context so that relysjs-based modules (e.g. @rappstack/domain--server--auth)
	// can access request_ via elysia_context_(ctx)?.request
	elysia_context__set(request_ctx, { request: c.req.raw } as any)
	site__set(request_ctx, site)
	return request_ctx
}
