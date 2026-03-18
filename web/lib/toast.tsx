'use client'

import * as React from 'react'

type ToastData = {
	id: string
	title?: string
	description?: string
	variant?: 'default' | 'destructive'
}

type ToastContextValue = {
	toasts: ToastData[]
	toast: (data: Omit<ToastData, 'id'>) => void
	dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastContextProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [toasts, setToasts] = React.useState<ToastData[]>([])

	const toast = React.useCallback((data: Omit<ToastData, 'id'>) => {
		const id = Math.random().toString(36).slice(2)
		setToasts(prev => [...prev, { ...data, id }])
		setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
	}, [])

	const dismiss = React.useCallback((id: string) => {
		setToasts(prev => prev.filter(t => t.id !== id))
	}, [])

	return (
		<ToastContext.Provider value={{ toasts, toast, dismiss }}>
			{children}
		</ToastContext.Provider>
	)
}

export function useToast() {
	const ctx = React.useContext(ToastContext)
	if (!ctx) throw new Error('useToast must be used within ToastContextProvider')
	return ctx
}
