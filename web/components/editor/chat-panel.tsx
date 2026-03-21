'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
	Send,
	Check,
	X,
	Loader2,
	Sparkles,
	ChevronDown,
	Pencil,
	ListChecks,
	ScanSearch,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	registerDiffActions,
	unregisterDiffActions,
} from '@/lib/editor/diff-decoration'
import type { ChatActions } from './types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Suggestion {
	id: string
	findText: string
	replaceText: string
	/** null = pending, true = accepted, false = rejected */
	accepted: boolean | null
}

interface Message {
	id: string
	role: 'user' | 'assistant'
	content: string
	suggestions?: Suggestion[]
}

export interface ChatPanelProps {
	markdown: string
	chatActions: ChatActions
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAIR_RE =
	/\[FIND\]([\s\S]*?)\[\/FIND\]\s*\[REPLACE\]([\s\S]*?)\[\/REPLACE\]/g

/**
 * Strip YAML frontmatter so indexOf results match CodeMirror's body-only document.
 * The editor (MarkdownEditor) is initialised with just the body, so positions must
 * be relative to that substring — not to the full markdown string that includes the
 * `---\nfrontmatter\n---\n` prefix.
 */
function bodyOf(md: string): string {
	const match = md.match(/^---\n[\s\S]*?\n---\n?/)
	return match ? md.slice(match[0].length) : md
}

/** Backward-compat: extracts [SUGGESTION]…[/SUGGESTION] */
function parseSuggestion(content: string): {
	display: string
	suggestion: string | null
} {
	const match = content.match(/\[SUGGESTION\]([\s\S]*?)\[\/SUGGESTION\]/)
	if (!match) return { display: content, suggestion: null }
	const display = content
		.replace(/\[SUGGESTION\][\s\S]*?\[\/SUGGESTION\]/, '')
		.trim()
	return { display, suggestion: match[1].trim() }
}

/**
 * Parses streaming text to extract:
 * - complete [FIND]/[REPLACE] pairs
 * - the partial diff being typed right now (live preview)
 * - clean display text with all tag content stripped
 */
function parseStreamingState(
	fullText: string,
	markdown: string,
): {
	completePairs: { id: string; findText: string; replaceText: string }[]
	partialDiff: {
		id: string
		from: number
		to: number
		replacement: string
	} | null
	displayText: string
} {
	// Reset lastIndex since we reuse the module-level regex
	PAIR_RE.lastIndex = 0
	const completePairs: { id: string; findText: string; replaceText: string }[] =
		[]
	for (const m of fullText.matchAll(PAIR_RE)) {
		const findText = m[1].trim()
		completePairs.push({
			id: findText.slice(0, 40),
			findText,
			replaceText: m[2].trim(),
		})
	}

	// Strip complete pairs to get the display base
	let displayText = fullText.replace(PAIR_RE, '').trim()

	// Detect trailing incomplete block (a [FIND] without a closing [/REPLACE])
	let partialDiff: {
		id: string
		from: number
		to: number
		replacement: string
	} | null = null

	const trailingFindIdx = displayText.lastIndexOf('[FIND]')
	if (trailingFindIdx !== -1) {
		const tail = displayText.slice(trailingFindIdx)
		const findCloseIdx = tail.indexOf('[/FIND]')
		if (findCloseIdx !== -1) {
			const findText = tail.slice(6, findCloseIdx).trim() // '[FIND]' = 6 chars
			const replaceOpenIdx = tail.indexOf('[REPLACE]', findCloseIdx)
			if (replaceOpenIdx !== -1) {
				const partialReplacement = tail.slice(replaceOpenIdx + 9) // '[REPLACE]' = 9 chars
				const from = bodyOf(markdown).indexOf(findText)
				if (from !== -1) {
					partialDiff = {
						id: '__streaming__',
						from,
						to: from + findText.length,
						replacement: partialReplacement,
					}
				}
			}
		}
		// Strip the incomplete trailing block so it never shows in the bubble
		displayText = displayText.slice(0, trailingFindIdx).trim()
	}

	return { completePairs, partialDiff, displayText }
}

// ── TypedText: streams content word-by-word ─────────────────────────────────────

function TypedText({ text }: { text: string }) {
	const [displayed, setDisplayed] = useState('')
	const targetRef = useRef(text)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		targetRef.current = text
		// Split target into tokens (words + surrounding whitespace)
		const tokens = text.match(/(\S+|\s+)/g) ?? []
		let idx = 0

		const step = () => {
			if (idx >= tokens.length) return
			idx++
			setDisplayed(tokens.slice(0, idx).join(''))
			// Only keep animating if the target hasn't changed past what we display
			if (idx < tokens.length) {
				timerRef.current = setTimeout(step, 18)
			}
		}

		// Cancel previous animation
		if (timerRef.current) clearTimeout(timerRef.current)

		// If text shrank (shouldn't happen), just show it
		if (text.length < displayed.length) {
			setDisplayed(text)
			return
		}

		// Find how many tokens are already displayed and start from there
		let prefixIdx = 0
		let built = ''
		for (let i = 0; i < tokens.length; i++) {
			built += tokens[i]
			if (built.length >= displayed.length) {
				prefixIdx = i + 1
				break
			}
		}
		idx = prefixIdx
		timerRef.current = setTimeout(step, 18)

		return () => {
			if (timerRef.current) clearTimeout(timerRef.current)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [text])

	return <>{displayed}</>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatPanel({ markdown, chatActions }: ChatPanelProps) {
	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState('')
	const [isStreaming, setIsStreaming] = useState(false)
	const [mode, setMode] = useState<'plan' | 'edit' | 'evaluate'>('edit')
	const sessionId = useRef(crypto.randomUUID())
	const bottomRef = useRef<HTMLDivElement>(null)
	const abortRef = useRef<AbortController | null>(null)
	// Always-fresh reference so accept handlers see the latest document
	const markdownRef = useRef(markdown)
	useEffect(() => {
		markdownRef.current = markdown
	}, [markdown])

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	const handleSend = useCallback(async () => {
		const trimmed = input.trim()
		if (!trimmed || isStreaming) return

		const selection = chatActions.getSelection()

		const userMsg: Message = {
			id: crypto.randomUUID(),
			role: 'user',
			content: trimmed,
		}
		const assistantId = crypto.randomUUID()
		const assistantMsg: Message = {
			id: assistantId,
			role: 'assistant',
			content: '',
		}

		setMessages(prev => [...prev, userMsg, assistantMsg])
		setInput('')
		setIsStreaming(true)

		const controller = new AbortController()
		abortRef.current = controller

		try {
			const res = await fetch('/api/ai/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: trimmed,
					context: markdown,
					mode,
					sessionId: sessionId.current,
					selection:
						selection ?
							{ text: selection.text, from: selection.from, to: selection.to }
						:	null,
				}),
				signal: controller.signal,
			})

			if (!res.ok) {
				const err = await res.json().catch(() => ({}))
				setMessages(prev =>
					prev.map(m =>
						m.id === assistantId ?
							{ ...m, content: err.error ?? 'Something went wrong.' }
						:	m,
					),
				)
				return
			}

			const reader = res.body?.getReader()
			const decoder = new TextDecoder()
			let fullText = ''

			if (reader) {
				while (true) {
					const { done, value } = await reader.read()
					if (done) break
					const chunk = decoder.decode(value, { stream: true })
					for (const line of chunk.split('\n')) {
						if (!line.startsWith('data: ')) continue
						const data = line.slice(6)
						if (data === '[DONE]') continue
						let token = data
						try {
							const parsed = JSON.parse(data)
							token =
								parsed.choices?.[0]?.delta?.content
								?? parsed.delta
								?? parsed.output
								?? parsed.text
								?? parsed.content
								?? parsed.answer
								?? parsed.result
								?? ''
						} catch {
							// plain text token
						}
						if (token) {
							fullText += token

							const { completePairs, partialDiff, displayText } =
								parseStreamingState(fullText, markdownRef.current)

							// Build live diffs from resolved complete pairs + streaming partial
							const diffs = [
								...completePairs
									.map(p => {
										const from = bodyOf(markdownRef.current).indexOf(p.findText)
										if (from === -1) return null
										return {
											id: p.id,
											from,
											to: from + p.findText.length,
											replacement: p.replaceText,
										}
									})
									.filter((d): d is NonNullable<typeof d> => d !== null),
								...(partialDiff ? [partialDiff] : []),
							]

							chatActions.applyDiffs(diffs)

							// Only update the bubble when there is actual display text
							if (displayText) {
								setMessages(prev =>
									prev.map(m =>
										m.id === assistantId ? { ...m, content: displayText } : m,
									),
								)
							}
						}
					}
				}

				// ── Stream ended ────────────────────────────────────────────────
				const { completePairs, displayText } = parseStreamingState(
					fullText,
					markdownRef.current,
				)

				if (completePairs.length > 0) {
					// ── [FIND]/[REPLACE] protocol ────────────────────────────────
					const suggestions: Suggestion[] = completePairs.map(p => ({
						id: p.id,
						findText: p.findText,
						replaceText: p.replaceText,
						accepted: null,
					}))

					// Final resolved diffs (no partial)
					const diffs = completePairs
						.map(p => {
							const from = bodyOf(markdownRef.current).indexOf(p.findText)
							if (from === -1) return null
							return {
								id: p.id,
								from,
								to: from + p.findText.length,
								replacement: p.replaceText,
							}
						})
						.filter((d): d is NonNullable<typeof d> => d !== null)

					chatActions.applyDiffs(diffs)

					// Register inline editor callbacks for each suggestion
					for (const s of suggestions) {
						registerDiffActions(s.id, {
							onAccept: () =>
								setMessages(prev => {
									const msg = prev.find(m =>
										m.suggestions?.some(x => x.id === s.id),
									)
									if (msg) handleAcceptOne(msg, s.id)
									return prev
								}),
							onReject: () =>
								setMessages(prev => {
									const msg = prev.find(m =>
										m.suggestions?.some(x => x.id === s.id),
									)
									if (msg) handleRejectOne(msg, s.id)
									return prev
								}),
						})
					}

					setMessages(prev =>
						prev.map(m =>
							m.id === assistantId ?
								{ ...m, content: displayText || fullText, suggestions }
							:	m,
						),
					)
				} else {
					// ── [SUGGESTION] fallback (backward compat) ─────────────────
					const { display, suggestion } = parseSuggestion(fullText)
					if (suggestion) {
						const from = selection?.from ?? 0
						const to = selection?.to ?? markdown.length
						const findText = markdown.slice(from, to)
						chatActions.applyDiffs([
							{ id: '__suggestion__', from, to, replacement: suggestion },
						])
						registerDiffActions('__suggestion__', {
							onAccept: () =>
								setMessages(prev => {
									const msg = prev.find(m =>
										m.suggestions?.some(x => x.id === '__suggestion__'),
									)
									if (msg) handleAcceptOne(msg, '__suggestion__')
									return prev
								}),
							onReject: () =>
								setMessages(prev => {
									const msg = prev.find(m =>
										m.suggestions?.some(x => x.id === '__suggestion__'),
									)
									if (msg) handleRejectOne(msg, '__suggestion__')
									return prev
								}),
						})
						setMessages(prev =>
							prev.map(m =>
								m.id === assistantId ?
									{
										...m,
										content: display || fullText,
										suggestions: [
											{
												id: '__suggestion__',
												findText,
												replaceText: suggestion,
												accepted: null,
											},
										],
									}
								:	m,
							),
						)
					} else {
						setMessages(prev =>
							prev.map(m =>
								m.id === assistantId ? { ...m, content: fullText } : m,
							),
						)
					}
				}
			}
		} catch (err: unknown) {
			if ((err as Error)?.name === 'AbortError') return
			setMessages(prev =>
				prev.map(m =>
					m.id === assistantId ?
						{ ...m, content: 'Connection error. Please try again.' }
					:	m,
				),
			)
		} finally {
			setIsStreaming(false)
			abortRef.current = null
		}
	}, [input, isStreaming, markdown, chatActions, mode])

	// ── Accept / Reject handlers ─────────────────────────────────────────────

	const handleAcceptOne = useCallback(
		(msg: Message, suggestionId: string) => {
			const s = msg.suggestions?.find(s => s.id === suggestionId)
			if (!s || s.accepted !== null) return
			const from = bodyOf(markdownRef.current).indexOf(s.findText)
			if (from !== -1) {
				chatActions.applyEdit(from, from + s.findText.length, s.replaceText)
			}
			chatActions.clearDiffById(s.id)
			unregisterDiffActions(s.id)
			setMessages(prev =>
				prev.map(m =>
					m.id === msg.id ?
						{
							...m,
							suggestions: m.suggestions!.map(x =>
								x.id === suggestionId ? { ...x, accepted: true } : x,
							),
						}
					:	m,
				),
			)
		},
		[chatActions],
	)

	const handleRejectOne = useCallback(
		(msg: Message, suggestionId: string) => {
			const s = msg.suggestions?.find(s => s.id === suggestionId)
			if (!s || s.accepted !== null) return
			chatActions.clearDiffById(s.id)
			unregisterDiffActions(s.id)
			setMessages(prev =>
				prev.map(m =>
					m.id === msg.id ?
						{
							...m,
							suggestions: m.suggestions!.map(x =>
								x.id === suggestionId ? { ...x, accepted: false } : x,
							),
						}
					:	m,
				),
			)
		},
		[chatActions],
	)

	const handleAcceptAll = useCallback(
		(msg: Message) => {
			const pending = (msg.suggestions ?? []).filter(s => s.accepted === null)
			if (!pending.length) return
			const currentMd = bodyOf(markdownRef.current)
			// Resolve positions before applying any edits
			const resolved = pending
				.map(s => {
					const from = currentMd.indexOf(s.findText)
					return from === -1 ? null : { s, from, to: from + s.findText.length }
				})
				.filter((x): x is NonNullable<typeof x> => x !== null)
			// Apply back-to-front so earlier positions aren't shifted
			resolved.sort((a, b) => b.from - a.from)
			for (const { s, from, to } of resolved) {
				chatActions.applyEdit(from, to, s.replaceText)
				chatActions.clearDiffById(s.id)
				unregisterDiffActions(s.id)
			}
			setMessages(prev =>
				prev.map(m =>
					m.id === msg.id ?
						{
							...m,
							suggestions: m.suggestions!.map(s =>
								s.accepted === null ? { ...s, accepted: true } : s,
							),
						}
					:	m,
				),
			)
		},
		[chatActions],
	)

	const handleRejectAll = useCallback(
		(msg: Message) => {
			const pending = (msg.suggestions ?? []).filter(s => s.accepted === null)
			if (!pending.length) return
			for (const s of pending) {
				chatActions.clearDiffById(s.id)
				unregisterDiffActions(s.id)
			}
			setMessages(prev =>
				prev.map(m =>
					m.id === msg.id ?
						{
							...m,
							suggestions: m.suggestions!.map(s =>
								s.accepted === null ? { ...s, accepted: false } : s,
							),
						}
					:	m,
				),
			)
		},
		[chatActions],
	)

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	return (
		<div className='flex flex-col h-full'>
			{/* Message list */}
			<div className='flex-1 overflow-y-auto p-3 space-y-4 min-h-0'>
				{messages.length === 0 && (
					<div className='flex flex-col items-center justify-center min-h-full gap-3 text-center text-muted-foreground px-4'>
						<div className='rounded-full bg-muted p-3'>
							<Sparkles className='h-5 w-5' />
						</div>
						<div>
							<p className='text-sm font-medium text-foreground'>
								AI Resume Assistant
							</p>
							<p className='text-xs mt-1'>
								Select text and ask me to improve it, or ask anything about your
								resume.
							</p>
						</div>
					</div>
				)}

				{messages.map(msg => {
					const pending = (msg.suggestions ?? []).filter(
						s => s.accepted === null,
					)
					const hasPending = pending.length > 0

					return (
						<div
							key={msg.id}
							className={cn(
								'flex flex-col gap-1 max-w-[230px]',
								msg.role === 'user' ?
									'items-end self-end'
								:	'items-start self-start',
							)}
						>
							{/* Message bubble */}
							<div
								className={cn(
									'rounded-xl px-2.5 py-1.5 text-xs break-words whitespace-pre-wrap',
									msg.role === 'user' ?
										'bg-primary text-primary-foreground rounded-tr-sm'
									:	'bg-muted text-foreground rounded-tl-sm',
								)}
							>
								{msg.content === '' ?
									<span className='flex items-center gap-1.5 text-muted-foreground'>
										<Loader2 className='h-3 w-3 animate-spin' />
										<span>Thinking…</span>
									</span>
								: msg.role === 'assistant' ?
									<TypedText text={msg.content} />
								:	msg.content}
							</div>

							{/* ── Suggestion controls ── */}
							{msg.suggestions && msg.suggestions.length > 0 && (
								<div className='flex flex-col gap-1 w-full'>
									{/* Per-suggestion rows */}
									{msg.suggestions.map((s, i) => {
										const label = s.findText
											.split('\n')[0]
											.slice(0, 35)
											.trimEnd()
										const truncated =
											s.findText.split('\n')[0].length > 35
											|| s.findText.includes('\n')
										return (
											<div
												key={s.id}
												className='flex items-center gap-1 min-w-0'
											>
												<span className='flex-1 text-[10px] text-muted-foreground truncate'>
													{msg.suggestions!.length > 1 && (
														<span className='mr-0.5 text-muted-foreground/60'>
															{i + 1}.
														</span>
													)}
													{label}
													{truncated && '…'}
												</span>
												{s.accepted === true && (
													<span className='shrink-0 text-[10px] text-green-600 dark:text-green-400 flex items-center gap-0.5'>
														<Check className='h-2.5 w-2.5' /> Applied
													</span>
												)}
												{s.accepted === false && (
													<span className='shrink-0 text-[10px] text-muted-foreground'>
														Discarded
													</span>
												)}
											</div>
										)
									})}

									{/* Accept all / Reject all — visible while ≥1 is still pending */}
									{hasPending && (
										<div className='flex gap-1.5 mt-0.5'>
											<button
												type='button'
												onClick={() => handleAcceptAll(msg)}
												className='flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 transition-colors border border-green-500/20'
											>
												<Check className='h-3 w-3' />
												Accept all
											</button>
											<button
												type='button'
												onClick={() => {
													if (
														window.confirm('Discard all suggested changes?')
													) {
														handleRejectAll(msg)
													}
												}}
												className='flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20'
											>
												<X className='h-3 w-3' />
												Reject all
											</button>
										</div>
									)}
								</div>
							)}
						</div>
					)
				})}

				<div ref={bottomRef} />
			</div>

			{/* Input area */}
			<div className='border-t p-2 shrink-0'>
				<div className='relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring'>
					<textarea
						value={input}
						onChange={e => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder='Ask anything…'
						rows={2}
						disabled={isStreaming}
						className='w-full resize-none bg-transparent px-2.5 pt-2 pb-8 pr-9 text-xs placeholder:text-muted-foreground focus:outline-none disabled:opacity-50'
					/>
					<div className='absolute bottom-1.5 left-1.5 flex items-center'>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type='button'
									className='flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors focus:outline-none'
								>
									{mode === 'plan' && (
										<ListChecks className='h-3 w-3 shrink-0' />
									)}
									{mode === 'edit' && <Pencil className='h-3 w-3 shrink-0' />}
									{mode === 'evaluate' && (
										<ScanSearch className='h-3 w-3 shrink-0' />
									)}
									<span className='capitalize'>{mode}</span>
									<ChevronDown className='h-2.5 w-2.5 shrink-0' />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align='start'
								side='top'
								className='min-w-[120px] rounded-xl p-1'
							>
								<DropdownMenuItem
									onClick={() => setMode('plan')}
									className='flex items-center gap-2 text-xs rounded-lg cursor-pointer'
								>
									<ListChecks className='h-3.5 w-3.5 text-muted-foreground' />
									Plan
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setMode('edit')}
									className='flex items-center gap-2 text-xs rounded-lg cursor-pointer'
								>
									<Pencil className='h-3.5 w-3.5 text-muted-foreground' />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setMode('evaluate')}
									className='flex items-center gap-2 text-xs rounded-lg cursor-pointer'
								>
									<ScanSearch className='h-3.5 w-3.5 text-muted-foreground' />
									Evaluate
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<button
						type='button'
						onClick={handleSend}
						disabled={!input.trim() || isStreaming}
						className='absolute right-1.5 bottom-1.5 h-6 w-6 rounded flex items-center justify-center text-foreground hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors'
						aria-label='Send'
					>
						{isStreaming ?
							<Loader2 className='h-3 w-3 animate-spin' />
						:	<Send className='h-3 w-3' />}
					</button>
				</div>
			</div>
		</div>
	)
}
