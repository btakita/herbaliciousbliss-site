import { Hono } from 'hono'
import { app_ctx, is_prod_ } from 'rebuildjs/server'
import { compression_middleware_, static_middleware_ } from 'rhonojs/server'
import { config__init } from '../config.js'
export default async ()=>{
	config__init()
	const app = new Hono()
	app.use(compression_middleware_())
	const static_app = await static_middleware_(
		is_prod_(app_ctx)
			? {
				headers_: ()=>({
					'Cache-Control': 'max-age=31536000, public'
				})
			}
			: {})
	app.route('/', static_app)
	app.onError((error, c)=>{
		console.error(c.req.url, error.message, error.stack)
		return c.text('Internal Server Error', 500)
	})
	return app
}
