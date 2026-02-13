/**
 * Heuristic tightness test for page-fit.
 *
 * Starts with a resume that overflows 1 page, then removes one content
 * line at a time from the bottom. After each removal, fitToPages must
 * produce a single-page result with less than MAX_BLANK pixels of
 * unused space. If any step exceeds the threshold, the algorithm
 * needs fixing, not the threshold.
 */

import { describe, it, expect, afterAll } from 'vitest'
import { generateHtml } from '../html-generator.js'
import { getBundledThemePath, DEFAULT_THEME } from '../themes.js'
import { fitToPages } from './index.js'
import { getContentHeight, readComputedValues } from './measure.js'
import { A4_HEIGHT_PX, A4_WIDTH_PX, IN_TO_PX } from './types.js'
import { browserPool } from '../browser-pool.js'

// ── Constants ──────────────────────────────────────────────────────────────

const REMOVALS = 30
const MAX_BLANK = 10 // px
const CSS_PATH = getBundledThemePath(DEFAULT_THEME)!

// ── Test resume ────────────────────────────────────────────────────────────
//
// Realistic resume with mixed content: headings, bullets, definition lists.
// Must overflow 1 page at default zurich theme settings (~1.3 pages).

const RESUME_MD = `
# Jordan Mitchell

jordan.mitchell@email.com | +1 555-234-5678 | linkedin.com/in/jordanmitchell | github.com/jordanmitchell

## Education

### Massachusetts Institute of Technology

_Bachelor of Science in Computer Science, Minor in Mathematics_

- Cumulative GPA: 3.89, Dean's List all semesters, Phi Beta Kappa Honor Society
- Relevant coursework: Distributed Systems, Machine Learning, Computer Networks, Database Systems
- Teaching Assistant for Introduction to Algorithms (6.006) for three consecutive semesters

## Work Experience

### Stripe

_Senior Software Engineer, Payments Infrastructure_

- Designed and implemented high-throughput payment processing pipeline handling 10M+ daily transactions
- Reduced payment processing latency by 45% through architectural redesign of the settlement engine
- Led migration of legacy monolith to event-driven microservices architecture serving 200+ internal clients
- Mentored team of 5 junior engineers through code reviews, pair programming, and technical design sessions
- Implemented comprehensive observability stack with distributed tracing, metrics dashboards, and alerting

### Dropbox

_Software Engineering Intern, Storage Platform_

- Built automated data integrity verification system scanning 500TB+ of distributed storage daily
- Developed internal CLI tool for storage cluster diagnostics adopted by 50+ engineers across the organization
- Optimized block deduplication algorithm reducing storage costs by 12% across production clusters
- Contributed to open-source sync engine improving conflict resolution for collaborative editing workflows

### Amazon Web Services

_Software Development Engineer Intern, EC2 Networking_

- Implemented network packet tracing tool for debugging VPC connectivity issues in production environments
- Created automated regression test suite covering 200+ network configuration edge cases
- Presented technical design review to senior leadership resulting in project adoption across three teams

### Palantir Technologies

_Software Engineering Intern, Forward Deployed Engineering_

- Developed data pipeline processing 2TB+ daily for government intelligence analytics platform
- Built interactive geospatial visualization dashboard using D3.js and MapboxGL for mission-critical operations
- Implemented role-based access control system with fine-grained permissions across 50+ data sources
- Reduced query response time by 70% through query optimization and materialized view strategies

## Projects

### DistributedKV: Fault-Tolerant Key-Value Store

- Built Raft consensus implementation in Go with automatic leader election and log replication
- Achieved 99.99% availability under network partition scenarios with linearizable read consistency
- Implemented snapshot-based compaction reducing log storage overhead by 80% in long-running clusters

### StreamQL: Real-Time Analytics Query Engine

- Developed streaming SQL engine processing 100K+ events per second with sub-millisecond latency
- Built custom query optimizer with cost-based join reordering and predicate pushdown optimizations
- Integrated with Apache Kafka and PostgreSQL for hybrid real-time and historical data analysis

### SecureChat: End-to-End Encrypted Messaging

- Implemented Signal Protocol with double ratchet algorithm for forward secrecy and post-compromise security
- Built cross-platform client with React Native supporting offline message queuing and group conversations
- Deployed on AWS with auto-scaling infrastructure handling 10K+ concurrent WebSocket connections

### PacketScope: Network Traffic Analyzer

- Built real-time packet capture and analysis tool processing 10Gbps traffic with BPF filters
- Implemented protocol dissectors for HTTP/2, gRPC, and WebSocket with automatic flow reconstruction
- Created anomaly detection engine using statistical models to identify network intrusions

## Technical Skills

Languages
: TypeScript, JavaScript, Python, Go, Java, Rust, SQL, GraphQL

Frameworks
: React, Node.js, Express.js, FastAPI, Spring Boot, Next.js, gRPC

Cloud and DevOps
: AWS, GCP, Docker, Kubernetes, Terraform, GitHub Actions, CircleCI

Databases
: PostgreSQL, MongoDB, Redis, DynamoDB, Elasticsearch, Apache Kafka

Testing and Observability
: Jest, Vitest, Playwright, Prometheus, Grafana, OpenTelemetry, Datadog

## Awards and Recognition

### Winner, MIT HackMIT Hackathon

- Built AI-powered accessibility tool generating alt text for web images using computer vision
- Awarded first place among 200+ teams for technical innovation and social impact

### Dean's Undergraduate Research Award

- Received funding for research on Byzantine fault-tolerant consensus in heterogeneous networks
- Published findings at ACM Symposium on Principles of Distributed Computing

`.trim()

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Remove `count` content lines from the bottom of the markdown.
 * Blank lines are skipped (removing them doesn't change content height).
 */
function removeContentLines(md: string, count: number): string {
	if (count === 0) return md
	const lines = md.split('\n')
	const contentIndices: number[] = []
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].trim() !== '') contentIndices.push(i)
	}
	const toRemove = new Set(contentIndices.slice(-count))
	return lines.filter((_, i) => !toRemove.has(i)).join('\n')
}

/**
 * Measure blank space (px) at the bottom of a fitted single-page resume.
 * Loads the HTML in a browser, reads content height and page margins,
 * then returns: usable page height - content height.
 */
async function measureBlank(html: string): Promise<number> {
	const browser = await browserPool.acquire()
	try {
		const page = await browser.newPage()
		try {
			await page.setViewportSize({ width: A4_WIDTH_PX, height: A4_HEIGHT_PX })
			await page.setContent(html, { waitUntil: 'networkidle' })
			const contentHeight = await getContentHeight(page)
			const values = await readComputedValues(page)
			const capacity = A4_HEIGHT_PX - 2 * values['page-margin-y'] * IN_TO_PX
			return capacity - contentHeight
		} finally {
			await page.close()
		}
	} finally {
		browserPool.release(browser)
	}
}

// ── Test ────────────────────────────────────────────────────────────────────

describe('page-fit heuristic: tightness', () => {
	afterAll(async () => {
		await browserPool.closeAll()
	})

	it(
		'produces a tight fit as content is progressively removed',
		async () => {
			const results: { removal: number; blank: number }[] = []

			for (let i = 0; i < REMOVALS; i++) {
				const md = removeContentLines(RESUME_MD, i)
				const html = await generateHtml(md, { cssPath: CSS_PATH })
				const result = await fitToPages(html, 1)

				expect(result.finalPages).toBe(1)

				const blank = await measureBlank(result.html)
				results.push({ removal: i, blank })
			}

			// Log all results for debugging before asserting
			console.table(results)

			for (const { removal, blank } of results) {
				expect(
					blank,
					`removal ${removal}: blank ${blank.toFixed(1)}px exceeds ${MAX_BLANK}px`,
				).toBeLessThan(MAX_BLANK)
			}
		},
		{ timeout: 300_000 },
	)
})
