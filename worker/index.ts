/**
 * Cloudflare Worker entry point for herbaliciousbliss.
 * Handles /login/google and /login/google/callback with D1 database.
 * Falls back to CF Pages static assets for all other routes.
 */
import { google_person_tbl, session_tbl } from '@rappstack/domain--server--auth/schema'
import { Google, generateCodeVerifier, generateState, OAuth2RequestError } from 'arctic'
import { eq, or } from 'drizzle-orm'
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'
import { createDate, TimeSpan } from 'oslo'
import { CookieController, parseCookies, serializeCookie } from 'oslo/cookie'
export interface Env {
	DB: D1Database
	AUTH_GOOGLE_ID: string
	AUTH_GOOGLE_SECRET: string
	AUTH_SECRET: string
	ASSETS: Fetcher
}
const SESSION_EXPIRE_TTL = new TimeSpan(30, 'd')
function session_cookie_controller_() {
	return new CookieController('auth_session', {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/',
	}, { expiresIn: SESSION_EXPIRE_TTL })
}
function id__generate(length: number) {
	const bytes = new Uint8Array(length)
	crypto.getRandomValues(bytes)
	return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').slice(0, length)
}
async function login_google__GET(request: Request, env: Env) {
	const url = new URL(request.url)
	const scheme = url.hostname === 'localhost' ? 'http://' : 'https://'
	const origin = url.hostname + (url.port ? ':' + url.port : '')
	const google = new Google(
		env.AUTH_GOOGLE_ID,
		env.AUTH_GOOGLE_SECRET,
		scheme + origin + '/login/google/callback')
	const state = generateState()
	const code_verifier = generateCodeVerifier()
	const auth_url = await google.createAuthorizationURL(state, code_verifier, {
		scopes: ['email', 'profile']
	})
	auth_url.searchParams.set('access_type', 'offline')
	const secure = scheme === 'https://'
	const headers = new Headers()
	headers.append('set-cookie', serializeCookie('state', state, {
		secure,
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10
	}))
	headers.append('set-cookie', serializeCookie('code_verifier', code_verifier, {
		secure,
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10
	}))
	headers.set('Location', auth_url.href)
	return new Response('Redirecting to ' + auth_url.href, { status: 302, headers })
}
async function login_google_callback__GET(request: Request, env: Env) {
	const request_url = new URL(request.url)
	const scheme = request_url.hostname === 'localhost' ? 'http://' : 'https://'
	const origin = request_url.hostname + (request_url.port ? ':' + request_url.port : '')
	const google = new Google(
		env.AUTH_GOOGLE_ID,
		env.AUTH_GOOGLE_SECRET,
		scheme + origin + '/login/google/callback')
	const code = request_url.searchParams.get('code')
	const state = request_url.searchParams.get('state')
	const cookie = parseCookies(request.headers.get('cookie') ?? '')
	const stored_state = cookie.get('state')
	const stored_code_verifier = cookie.get('code_verifier')
	if (!code || !stored_state || !stored_code_verifier || state !== stored_state) {
		return new Response('Invalid request', { status: 400 })
	}
	const db = drizzle(env.DB)
	try {
		const tokens = await google.validateAuthorizationCode(code, stored_code_verifier)
		const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: { Authorization: `Bearer ${tokens.accessToken}` }
		})
		const userinfo: google_userinfo_T = await response.json()
			let person = await db
			.select()
			.from(google_person_tbl)
			.where(
				or(
					eq(google_person_tbl.google_sub, userinfo.sub!),
					eq(google_person_tbl.email, userinfo.email!)))
			.get()
		if (person) {
			if (person.google_sub !== userinfo.sub || person.google_picture !== userinfo.picture) {
				await db.update(google_person_tbl)
					.set({ google_sub: userinfo.sub, google_picture: userinfo.picture ?? null })
					.where(eq(google_person_tbl.id, person.id))
					.run()
			}
		} else {
			const person_id = id__generate(15)
			person = await db
				.insert(google_person_tbl)
				.values({
					id: person_id,
					name: userinfo.name ?? null,
					email: userinfo.email!,
					image: userinfo.picture ?? null,
					google_sub: userinfo.sub,
					google_picture: userinfo.picture ?? null,
				})
				.returning()
				.get()
		}
		// Create session
		const session_id = id__generate(40)
		const expire_dts = createDate(SESSION_EXPIRE_TTL)
		await db.insert(session_tbl)
			.values({ id: session_id, person_id: person!.id, expire_dts })
			.run()
		const session_cookie = session_cookie_controller_().createCookie(session_id)
		const headers = new Headers()
		headers.append('Set-Cookie', session_cookie.serialize())
		// Set a non-httpOnly cookie so browser JS can detect logged-in state
		headers.append('Set-Cookie', serializeCookie('logged_in', '1', {
			secure: true,
			path: '/',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30, // 30 days
		}))
		headers.set('Location', '/')
		return new Response('Redirecting to /', { status: 302, headers })
	} catch (e) {
		if (e instanceof OAuth2RequestError) {
			const { message, description } = e
			return new Response('Redirecting to /?error=' + (description ?? message ?? 'OAuth Error'), {
				status: 302,
				headers: { Location: '/?error=' + encodeURIComponent(description ?? message ?? 'OAuth Error') }
			})
		}
		throw e
	}
}
type google_userinfo_T = {
	sub: string
	name?: string
	given_name?: string
	family_name?: string
	picture?: string
	email?: string
	email_verified?: boolean
	locale?: string
}
async function api_me__GET(request: Request, env: Env) {
	const cookie = parseCookies(request.headers.get('cookie') ?? '')
	const session_id = cookie.get('auth_session')
	if (!session_id) {
		return Response.json({ user: null })
	}
	const db = drizzle(env.DB)
	const session = await db
		.select()
		.from(session_tbl)
		.where(eq(session_tbl.id, session_id))
		.get()
	if (!session || session.expire_dts < Date.now()) {
		return Response.json({ user: null })
	}
	const person = await db
		.select()
		.from(google_person_tbl)
		.where(eq(google_person_tbl.id, session.person_id))
		.get()
	if (!person) {
		return Response.json({ user: null })
	}
	return Response.json({
		user: {
			name: person.name,
			email: person.email,
			image: person.google_picture ?? person.image,
		}
	})
}
async function api_logout__POST(request: Request, env: Env) {
	const cookie = parseCookies(request.headers.get('cookie') ?? '')
	const session_id = cookie.get('auth_session')
	if (session_id) {
		const db = drizzle(env.DB)
		await db.delete(session_tbl).where(eq(session_tbl.id, session_id)).run()
	}
	const blank_cookie = session_cookie_controller_().createBlankCookie()
	const headers = new Headers()
	headers.append('Set-Cookie', blank_cookie.serialize())
	headers.append('Set-Cookie', serializeCookie('logged_in', '', {
		secure: true,
		path: '/',
		sameSite: 'lax',
		maxAge: 0,
	}))
	headers.set('Location', '/')
	return new Response('Redirecting to /', { status: 302, headers })
}
const AUTH_SCRIPT = `<script>
(function(){
	var c = document.cookie.match(/logged_in=1/);
	if (!c) return;
	var login = document.getElementById('google_signin');
	if (login) login.outerHTML = '<a href="/logout" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;border-radius:0.5rem;background:#f3f4f6;color:#374151;font-size:0.875rem;">Sign out</a>';
	fetch('/api/me').then(function(r){return r.json()}).then(function(d){
		if (!d.user) return;
		var btns = document.querySelectorAll('.account__button');
		btns.forEach(function(b){
			if (d.user.image) {
				b.innerHTML = '<img src="'+d.user.image+'" style="width:1.5rem;height:1.5rem;border-radius:9999px;" alt="'+d.user.name+'">';
			}
		});
	});
})();
</script>
`;
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)
		if (url.pathname === '/login/google') {
			return login_google__GET(request, env)
		}
		if (url.pathname === '/login/google/callback') {
			return login_google_callback__GET(request, env)
		}
		if (url.pathname === '/api/me') {
			return api_me__GET(request, env)
		}
		if (url.pathname === '/api/logout' && request.method === 'POST') {
			return api_logout__POST(request, env)
		}
		if (url.pathname === '/logout') {
			return api_logout__POST(request, env)
		}
		// For HTML pages, inject auth UI script
		const asset_response = await env.ASSETS.fetch(request)
		const content_type = asset_response.headers.get('content-type') ?? ''
		if (content_type.includes('text/html')) {
			let html = await asset_response.text()
			html = html.replace('</body>', AUTH_SCRIPT + '</body>')
			return new Response(html, {
				status: asset_response.status,
				headers: asset_response.headers,
			})
		}
		return asset_response
	}
}
