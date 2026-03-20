/**
 * Generate a JSON manifest of built-in icons from assets/icons/.
 * Run: npx tsx scripts/generate-icon-manifest.ts
 * Output: web/lib/icons-manifest.json
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ICONS_DIR = path.resolve(__dirname, '..', 'assets', 'icons')
const OUT_PATH = path.resolve(
	__dirname,
	'..',
	'web',
	'lib',
	'icons-manifest.json',
)

// Simple category heuristics based on icon name
const CATEGORIES: [string, RegExp][] = [
	[
		'company',
		/^(google|meta|apple|amazon|microsoft|netflix|spotify|uber|airbnb|stripe|shopify|salesforce|oracle|ibm|intel|nvidia|amd|cisco|dell|hp|sap|adobe|atlassian|slack|zoom|twitter|x$|linkedin|github|gitlab|bitbucket|vercel|netlify|heroku|digitalocean|cloudflare|fastly|twilio|sendgrid|mailchimp|hubspot|zendesk|intercom|segment|mixpanel|amplitude|datadog|newrelic|pagerduty|jira|confluence|figma|sketch|canva|notion|asana|trello|monday|linear|discord|telegram|whatsapp|signal|reddit|pinterest|tiktok|snap|snapchat|wechat|weibo|alibaba|tencent|baidu|bytedance|samsung|sony|xiaomi|huawei|siemens|bosch|toyota|tesla|ford|volkswagen|bmw|mercedez|deloitte|mckinsey|bain|bcg|accenture|kpmg|ey$|pwc|jp-?morgan|goldman|morgan-stanley|blackrock|citadel|bridgewater|palantir|snowflake|databricks|crowdstrike|elastic|grafana|mongo|supabase|firebase|2sigma|anduril|anthropic|openai)/,
	],
	[
		'cloud',
		/^(aws|azure|gcp|cloud|docker|kubernetes|k8s|terraform|pulumi|ansible|jenkins|circleci|travis|github-actions|argocd|helm|istio|consul|vault|nomad|packer)/,
	],
	[
		'database',
		/^(postgres|mysql|mariadb|sqlite|redis|mongo|dynamo|cassandra|couchdb|neo4j|elasticsearch|clickhouse|cockroach|planetscale|neon|drizzle|prisma|sequelize|typeorm|knex|sql)/,
	],
	[
		'language',
		/^(javascript|typescript|python|rust|go$|golang|java$|kotlin|swift|dart|ruby|php|csharp|c\+\+|cpp|c$|lua|perl|r$|julia|elixir|erlang|haskell|scala|clojure|zig|nim|crystal|ocaml|fsharp|assembly|bash|zsh|powershell|fish)/,
	],
	[
		'framework',
		/^(react|vue|angular|svelte|next|nuxt|remix|gatsby|astro|solid|qwik|ember|backbone|express|fastify|nest|django|flask|fastapi|spring|rails|laravel|phoenix|gin|fiber|actix|rocket|tower|axum|deno|bun|node)/,
	],
	[
		'tool',
		/^(git$|npm|yarn|pnpm|bun|vite|webpack|esbuild|rollup|parcel|babel|eslint|prettier|jest|vitest|cypress|playwright|selenium|storybook|chromatic|vs-?code|vim|neovim|emacs|intellij|webstorm|xcode|android-studio|postman|insomnia|curl)/,
	],
	[
		'design',
		/^(figma|sketch|photoshop|illustrator|after-effects|premiere|lightroom|xd|invision|zeplin|framer|canva|blender|maya|cinema4d|css|sass|less|tailwind|bootstrap|material|chakra|styled|emotion|radix)/,
	],
	[
		'platform',
		/^(linux|ubuntu|debian|fedora|centos|arch|alpine|windows|macos|ios|android|chrome|firefox|safari|edge|opera|brave)/,
	],
]

function categorize(name: string): string {
	for (const [cat, regex] of CATEGORIES) {
		if (regex.test(name)) return cat
	}
	return 'other'
}

const files = fs
	.readdirSync(ICONS_DIR)
	.filter(f => f.endsWith('.svg'))
	.sort()

const manifest = files.map(f => {
	const name = f.replace(/\.svg$/, '')
	return { name, category: categorize(name) }
})

fs.writeFileSync(OUT_PATH, JSON.stringify(manifest, null, '\t') + '\n')
console.log(`Generated ${manifest.length} icons → ${OUT_PATH}`)
