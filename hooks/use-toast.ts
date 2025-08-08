/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'

export type ToastProps = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  duration?: number
  variant?: 'default' | 'destructive'
}

export type Toast = ToastProps & { id: string }

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type State = {
  toasts: Toast[]
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function genId() {
  return Math.random().toString(36).slice(2)
}

function setState(state: State) {
  memoryState = state
  listeners.forEach((l) => l(state))
}

function addToast(toast: ToastProps) {
  const id = toast.id ?? genId()

  const newToast: Toast = {
    id,
    duration: toast.duration ?? TOAST_REMOVE_DELAY,
    variant: toast.variant ?? 'default',
    ...toast
  }

  const toasts = [newToast, ...memoryState.toasts].slice(0, TOAST_LIMIT)
  setState({ toasts })

  // Auto remove after duration unless user closes manually
  if (newToast.duration && newToast.duration > 0) {
    window.setTimeout(() => dismissToast(id), newToast.duration)
  }

  return id
}

function updateToast(id: string, props: Partial<ToastProps>) {
  setState({
    toasts: memoryState.toasts.map((t) =>
      t.id === id ? { ...t, ...props } : t
    )
  })
}

function dismissToast(id?: string) {
  if (!id) {
    setState({ toasts: [] })
    return
  }
  setState({ toasts: memoryState.toasts.filter((t) => t.id !== id) })
}

export function useToast() {
  const [state, setLocalState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setLocalState)
    return () => {
      const idx = listeners.indexOf(setLocalState)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return {
    ...state,
    toast: addToast,
    dismiss: dismissToast,
    update: updateToast
  }
}
