import './index.css'
import { relement__use } from 'relementjs'
import { server__relement } from 'relementjs/server'
relement__use(server__relement)
import { home__doc_html_ } from '@btakita/ui--server--herbaliciousbliss/home'
import { csrf_403_response_, person__wait, session_headers__wait } from '@rappstack/domain--server--auth/auth'
import { login_google__GET, login_google_callback__GET } from '@rappstack/domain--server--auth/google'
import { site_request_ctx__ensure } from '@rappstack/domain--server/ctx'
import { Hono } from 'hono'
import { middleware_ } from 'rebuildjs/server'
import { html_response__new, request_ctx__ensure } from 'rhonojs/server'
import { site } from '../config.js'
export default middleware_(middleware_ctx=>
	new Hono()
		.get('/', async c=>{
			const ctx = site_request_ctx__ensure(middleware_ctx, c, { site })
			if (csrf_403_response_(ctx)) {
				return csrf_403_response_(ctx)
			}
			const headers = await session_headers__wait(ctx)
			await person__wait(ctx)
			return html_response__new(
				home__doc_html_({
					ctx: site_request_ctx__ensure(
						middleware_ctx,
						c,
						{ site })
				}), { headers })
		})
		.get('/login/google', async c=>
			login_google__GET(request_ctx__ensure(middleware_ctx, c)))
		.get('/login/google/callback', async c=>
			login_google_callback__GET(request_ctx__ensure(middleware_ctx, c))))
