import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	// Allow imports from the root resumx workspace (styles, src, etc.)
	transpilePackages: [],
	// Ensure Playwright/Chromium files are traced for the render API routes
	outputFileTracingIncludes: {
		'/api/render/preview': ['../styles/**', '../assets/icons/**'],
	},
	experimental: {
		// Allow imports from outside the web/ directory (monorepo root)
		externalDir: true,
	},
}

export default nextConfig
