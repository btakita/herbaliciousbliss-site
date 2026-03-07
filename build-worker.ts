/**
 * Build the CF Worker entry point.
 * Bundles worker/index.ts → dist/browser/_worker.js
 */
import { build } from 'esbuild'
await build({
	entryPoints: ['worker/index.ts'],
	bundle: true,
	format: 'esm',
	target: 'es2022',
	platform: 'browser',
	outfile: 'dist/browser/_worker.js',
	minify: true,
	sourcemap: true,
	conditions: ['workerd', 'worker', 'browser'],
	external: ['node:*', '__STATIC_CONTENT_MANIFEST'],
})
console.info('[build-worker] dist/browser/_worker.js')
