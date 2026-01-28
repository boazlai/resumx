import { execSync } from 'node:child_process'

export interface DependencyStatus {
	name: string
	installed: boolean
	version?: string
	installHint?: string
}

/**
 * Check if a command exists in PATH
 */
function commandExists(cmd: string): boolean {
	try {
		execSync(`which ${cmd}`, { stdio: 'ignore' })
		return true
	} catch {
		return false
	}
}

/**
 * Get version of a command
 */
function getVersion(
	cmd: string,
	versionFlag = '--version',
): string | undefined {
	try {
		const output = execSync(`${cmd} ${versionFlag}`, {
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		})
		// Extract first line and clean it up
		const firstLine = output.split('\n')[0]?.trim()
		return firstLine
	} catch {
		return undefined
	}
}

/**
 * Check weasyprint installation
 */
export function checkWeasyprint(): DependencyStatus {
	const installed = commandExists('weasyprint')
	return {
		name: 'weasyprint',
		installed,
		version: installed ? getVersion('weasyprint') : undefined,
		installHint: 'brew install weasyprint',
	}
}

/**
 * Check pdf2docx installation
 */
export function checkPdf2docx(): DependencyStatus {
	const installed = commandExists('pdf2docx')
	return {
		name: 'pdf2docx',
		installed,
		version: installed ? getVersion('pdf2docx') : undefined,
		installHint: 'pip install pdf2docx',
	}
}

/**
 * Check all required dependencies
 */
export function checkDependencies(): {
	weasyprint: DependencyStatus
	pdf2docx: DependencyStatus
	allInstalled: boolean
} {
	const weasyprint = checkWeasyprint()
	const pdf2docx = checkPdf2docx()

	return {
		weasyprint,
		pdf2docx,
		allInstalled: weasyprint.installed && pdf2docx.installed,
	}
}

/**
 * Require dependencies or throw
 * WeasyPrint is required for PDF output
 * pdf2docx is required for DOCX output (converts PDF to DOCX for high fidelity)
 */
export function requireDependencies(
	options: { pdf?: boolean; docx?: boolean } = {},
): void {
	if (options.pdf !== false) {
		const weasyprint = checkWeasyprint()
		if (!weasyprint.installed) {
			throw new Error(
				`weasyprint is required for PDF output. Install with: ${weasyprint.installHint}`,
			)
		}
	}

	if (options.docx) {
		const pdf2docx = checkPdf2docx()
		if (!pdf2docx.installed) {
			throw new Error(
				`pdf2docx is required for DOCX output. Install with: ${pdf2docx.installHint}`,
			)
		}
	}
}
