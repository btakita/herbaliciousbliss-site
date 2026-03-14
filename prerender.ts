/**
 * Static site export for Cloudflare Pages deployment.
 * Expects the server to already be running.
 * Usage: bun build.ts && bun start.ts & sleep 3 && bun prerender.ts
 */
import { static_export_ } from 'rhonojs/server/export'
const { exported, errors } = await static_export_({
	base_url: process.env.PRERENDER_BASE || 'http://localhost:4102',
	site_url: 'https://hb.briantakita.me',
	out_dir: 'dist/browser',
	routes: ['/', '/lyra'],
	sitemap: true,
})
console.info(`Exported ${exported.length} files`)
if (errors.length > 0) {
	console.error(`${errors.length} errors:`, errors)
	process.exit(1)
}
