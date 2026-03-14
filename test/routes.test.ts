import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import type { Subprocess } from 'bun'

const PORT = 4102
const BASE_URL = `http://localhost:${PORT}`

let server: Subprocess

beforeAll(async () => {
	server = Bun.spawn(['bun', './start.ts'], {
		cwd: import.meta.dir + '/..',
		env: {
			...process.env,
			NODE_ENV: 'production',
		},
		stdout: 'pipe',
		stderr: 'pipe',
	})
	// Wait for the server to be ready
	const maxAttempts = 30
	for (let i = 0; i < maxAttempts; i++) {
		try {
			await fetch(BASE_URL)
			return
		} catch {
			await Bun.sleep(500)
		}
	}
	throw new Error(`Server did not start within ${maxAttempts * 500}ms`)
})

afterAll(() => {
	server?.kill()
})

const routes = ['/', '/lyra'] as const

describe('routes return 200', () => {
	for (const route of routes) {
		test(`GET ${route}`, async () => {
			const res = await fetch(`${BASE_URL}${route}`)
			expect(res.status).toBe(200)
		})
	}
})

describe('HTML content', () => {
	test('/ contains Herbalicious Bliss', async () => {
		const res = await fetch(`${BASE_URL}/`)
		const html = await res.text()
		expect(html).toContain('<!DOCTYPE html>')
		expect(html).toContain('Herbalicious Bliss')
	})

	test('/lyra contains Lyra', async () => {
		const res = await fetch(`${BASE_URL}/lyra`)
		const html = await res.text()
		expect(html).toContain('<!DOCTYPE html>')
		expect(html).toContain('Lyra')
	})
})
