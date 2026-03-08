// Place any global data in this file.
import { person_tbl__set, session_tbl__set } from '@btakita/domain--server--herbaliciousbliss/auth'
import { herbaliciousbliss_server_env_ } from '@btakita/domain--server--herbaliciousbliss/env'
import { person_tbl, session_tbl } from '@btakita/domain--server--herbaliciousbliss/schema'
import {
	bootstrap_substack_,
	fa_facebook_,
	fa_instagram_,
	fa_linkedin_,
	fa_x_twitter_
} from '@btakita/ui--any--herbaliciousbliss/icon'
import { auth_google_id__set, auth_google_secret__set } from '@rappstack/domain--server--auth/google'
import { type author_T, type site_T } from '@rappstack/domain--server/site'
import { sqlite_db__set } from '@rappstack/domain--server/sqlite'
import Database from 'bun:sqlite'
import { url__join } from 'ctx-core/all'
import { import_meta_env_ } from 'ctx-core/env'
import { class_, style_, style_url_ } from 'ctx-core/html'
import { relement__use } from 'relementjs'
import { div_ } from 'relementjs/html'
import { server__relement } from 'relementjs/server'
import { app_ctx, cwd__set, port__set, src_path__set } from 'rebuildjs/server'
import herbaliciousbliss_logo_webp from '../../public/asset/image/herbaliciousbliss-logo.webp'
// You can import this data from anywhere in your site by using the `import` keyword.
export const website = 'https://herbaliciousbliss.com'
export const lyra_star = <author_T>{
	'@type': 'Person',
	'@id': url__join(website, '#Person'),
	name: 'Lyra Star',
}
export const site:site_T = {
	website, // replace this with your deployed domain
	author_a1: [lyra_star],
	description: 'Find Your Herbal Bliss',
	title: 'Herbalicious Bliss',
	logo_image__new: ($p?:{ class?:string })=>
		div_({
			class: class_(
				'rounded-full',
				'bg-no-repeat',
				'bg-top',
				'bg-contain',
				$p?.class),
			style: style_({
				'background-image': style_url_(herbaliciousbliss_logo_webp)
			})
		}),
	favicon: {
		type: 'image/webp',
		href: herbaliciousbliss_logo_webp
	},
	social_image_url: herbaliciousbliss_logo_webp,
	font__meta_props_a1: [
		{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
		{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 1 },
		{
			href: 'https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700&display=swap',
			rel: 'stylesheet'
		}
	],
	color_scheme_vars: {
		light: {},
		dark: {},
	},
	social_a1: [
		{
			icon_: bootstrap_substack_,
			link_title: 'Substack',
			href: 'https://lyrastarmist.substack.com/',
			active: true,
		},
		{
			icon_: fa_facebook_,
			link_title: 'Facebook',
			href: 'https://www.facebook.com/HerbaliciousBliss',
			active: true,
		},
		{
			icon_: fa_instagram_,
			link_title: 'Instagram',
			href: 'https://www.instagram.com/lyra_prism/',
			active: true,
		},
		{
			icon_: fa_linkedin_,
			link_title: 'LinkedIn',
			href: 'https://www.linkedin.com/in/lyra-starmist/',
			active: true,
		},
		{
			icon_: fa_x_twitter_,
			link_title: 'X/Twitter',
			href: 'https://twitter.com/SoulSparkLove',
			active: true,
		},
	],
	gtag_id: '' // TODO: change
}
export function config__init() {
	const port = parseInt(import_meta_env_().HERBALACIOUSBLISS_PORT) || 4102
	port__set(app_ctx, port)
	cwd__set(app_ctx, process.cwd())
	src_path__set(app_ctx, process.cwd())
	relement__use(server__relement)
	const sqlite_db = new Database('./db/app.db')
	sqlite_db.exec('PRAGMA journal_mode = WAL;')
	sqlite_db__set(app_ctx, sqlite_db)
	person_tbl__set(app_ctx, person_tbl)
	session_tbl__set(app_ctx, session_tbl)
	const env = herbaliciousbliss_server_env_()
	auth_google_id__set(app_ctx, env.AUTH_GOOGLE_ID)
	auth_google_secret__set(app_ctx, env.AUTH_GOOGLE_SECRET)
}
