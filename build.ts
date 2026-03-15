import { preprocess } from '@ctx-core/preprocess'
import { object_store_asset_esbuild_plugin_ } from 'esbuild-plugin-object-store-asset'
import { rebuild_tailwind_plugin_ } from '@rebuildjs/tailwindcss'
import cssnano from 'cssnano'
import { import_meta_env_ } from 'ctx-core/env'
import { is_entry_file_ } from 'ctx-core/fs'
import { MAX_INT32 } from 'ctx-core/number'
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
	const object_store_asset = object_store_asset_esbuild_plugin_({
		asset_base_url: import_meta_env_().ASSET_BASE_URL,
		base_path: import_meta_env_().ASSET_BASE_PATH,
	})
	const preprocess_plugin = preprocess_plugin_()
	const build_promises:Promise<unknown>[] = [
		rhonojs_browser__build({
			...config ?? {},
			treeShaking: true,
			conditions: ['style'],
			plugins: [
				object_store_asset,
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
			conditions: ['style'],
			plugins: [
				object_store_asset,
				esmcss_esbuild_plugin,
				rebuild_tailwind_plugin,
				preprocess_plugin,
			],
		}),
	]
	build_promises.push(rhonojs__ready__wait(MAX_INT32))
	await Promise.all(build_promises)
}
async function server_external_() {
	const app_dir = dirname(new URL(import.meta.url).pathname)
	const root_nm = join(app_dir, '..', '..', 'node_modules')
	const local_nm = join(app_dir, 'node_modules')
	const [root_files, local_files] = await Promise.all([
		readdir(root_nm).catch(()=>[]),
		readdir(local_nm).catch(()=>[]),
	])
	const all_files = [...new Set([...root_files, ...local_files])]
	return [
		...all_files
			.filter(file=>file !== '@btakita' && file !== '@rappstack')
			.map(file=>file[0] === '@' ? file + '/*' : file),
		'bun',
		'bun:*'
	]
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
