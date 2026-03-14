import { preprocess } from '@ctx-core/preprocess'
import { rebuild_tailwind_plugin_ } from '@rebuildjs/tailwindcss'
import cssnano from 'cssnano'
import { import_meta_env_ } from 'ctx-core/env'
import { is_entry_file_ } from 'ctx-core/fs'
import { type Plugin } from 'esbuild'
import { esmcss_esbuild_plugin_ } from 'esmcss'
import { readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import {
	type rhonojs__build_config_T,
	rhonojs__ready__wait,
	rhonojs_browser__build,
	rhonojs_server__build
} from 'rhonojs/server'
import { config__init } from './config.js'
export async function build(config?:rhonojs__build_config_T) {
	config__init()
	const esmcss_esbuild_plugin = esmcss_esbuild_plugin_()
	const rebuild_tailwind_plugin = rebuild_tailwind_plugin_({
		postcss_plugin_a1_: tailwindcss_plugin=>[
			tailwindcss_plugin,
			cssnano({ preset: 'default' })
		],
	})
	const preprocess_plugin = preprocess_plugin_()
	await Promise.all([
		rhonojs_browser__build({
			...config ?? {},
			treeShaking: true,
			plugins: [
				esmcss_esbuild_plugin,
				rebuild_tailwind_plugin,
				preprocess_plugin,
			],
		}),
		rhonojs_server__build({
			...config ?? {},
			target: 'es2022',
			external: await server_external_(),
			treeShaking: true,
			plugins: [
				esmcss_esbuild_plugin,
				rebuild_tailwind_plugin,
				preprocess_plugin,
			],
		}),
		rhonojs__ready__wait(10_000)
	])
}
function server_external_() {
	return readdir(join(
		dirname(new URL(import.meta.url).pathname),
		'..',
		'..',
		'node_modules'
	)).then(file_a1=>[
		...file_a1
			.filter(file=>file !== '@btakita' && file !== '@rappstack')
			.map(file=>file[0] === '@' ? file + '/*' : file),
		'bun',
		'bun:*'
	])
}
if (is_entry_file_(import.meta.url, process.argv[1])) {
	build({
		rebuildjs: { watch: false },
		rhonojs: { app__start: false }
	}).then(()=>process.exit(0))
		.catch(err=>{
			console.error(err)
			process.exit(1)
		})
}
function preprocess_plugin_():Plugin {
	return {
		name: 'preprocess',
		setup(build) {
			if (import_meta_env_().NODE_ENV !== 'production') {
				build.onLoad({ filter: /(\/ctx-core\/?.*|\/hyop\/?.*)$/ }, async ({ path })=>{
					const source = await Bun.file(path).text()
					return {
						contents: preprocess(
							source,
							{ DEBUG: '1' },
							{ type: 'js' }),
						loader: 'ts'
					}
				})
			}
		}
	}
}
