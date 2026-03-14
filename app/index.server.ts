import './index.css'
import { relement__use } from 'relementjs'
import { server__relement } from 'relementjs/server'
relement__use(server__relement)
import { home__doc_html_ } from '@btakita/ui--server--herbaliciousbliss/home'
import { Hono } from 'hono'
import { middleware_ } from 'rebuildjs/server'
import { html_response__new } from 'rhonojs/server'
import { site } from '../config.js'
import { site_request_ctx__ensure } from '../ctx/index.js'
export default middleware_(middleware_ctx=>
	new Hono()
		.get('/', async c=>{
			const ctx = site_request_ctx__ensure(middleware_ctx, c, { site })
			return html_response__new(
				home__doc_html_({ ctx }))
		}))
