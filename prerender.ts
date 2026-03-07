/**
 * Static site export for Cloudflare Pages deployment.
 * Usage: bun build.ts && bun start.ts & sleep 3 && bun prerender.ts
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
const base_url = (process.env.PRERENDER_BASE || 'http://localhost:4102').replace(/\/$/, '')
const site_origin = 'https://hb.briantakita.me'
const out_dir = 'dist/browser'
const extra_routes: string[] = []
const exported: string[] = []
const errors: string[] = []
// Discover routes from sitemap
let routes: string[] = []
try {
	const res = await fetch(`${base_url}/sitemap.xml`)
	if (res.ok) {
		const xml = await res.text()
		for (const m of xml.matchAll(/<loc>https?:\/\/[^<]+<\/loc>/g)) {
			const url = m[0].replace(/<\/?loc>/g, '')
			const path = new URL(url).pathname
			const route = path === '' ? '/' : path
			if (!routes.includes(route)) routes.push(route)
		}
		console.info(`Discovered ${routes.length} routes from sitemap`)
	} else {
		console.warn('No sitemap, using fallback routes')
		routes = ['/', '/lyra']
	}
} catch {
	console.warn('Sitemap fetch failed, using fallback routes')
	routes = ['/', '/lyra']
}
const all_routes = [...routes, ...extra_routes]
for (const route of all_routes) {
	const url = base_url + route
	try {
		const res = await fetch(url)
		if (!res.ok) {
			console.error(`${route} -> ${res.status} ${res.statusText}`)
			errors.push(route)
			continue
		}
		let body = await res.text()
		body = body.replaceAll(base_url, site_origin)
		const ext = extname(route)
		const file_path = (ext && ext !== '.html')
			? join(out_dir, route)
			: route === '/'
				? join(out_dir, 'index.html')
				: join(out_dir, route, 'index.html')
		await mkdir(dirname(file_path), { recursive: true })
		await writeFile(file_path, body)
		exported.push(file_path)
		console.info(`${route} -> ${file_path} (${body.length} bytes)`)
	} catch (err: any) {
		console.error(`${route} -> ${err.message}`)
		errors.push(route)
	}
}
console.info(`Exported ${exported.length} files`)
if (errors.length > 0) {
	console.error(`${errors.length} errors:`, errors)
	process.exit(1)
}
