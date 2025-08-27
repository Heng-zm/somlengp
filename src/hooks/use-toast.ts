"use client"

// Inspired by react-hot-toast library
import * as React from "react"
import { safeSync, ValidationError, errorHandler } from '@/lib/error-utils'

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 5000
const MAX_TOAST_TITLE_LENGTH = 100
const MAX_TOAST_DESCRIPTION_LENGTH = 500
const MAX_CONCURRENT_TOASTS = 10

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

type ActionType = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
}

let count = 0
const MAX_TOAST_ID = 999999

function genId(): string {
  const { data, error } = safeSync(
    () => {
      count = (count + 1) % MAX_TOAST_ID
      return count.toString()
    },
    null,
    { operation: 'generateToastId' }
  )
  
  if (error || !data) {
    // Fallback ID generation
    const fallbackId = `toast_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    console.warn('Toast ID generation fallback used:', fallbackId)
    return fallbackId
  }
  
  return data
}

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  const { error } = safeSync(
    () => {
      // Validate toastId
      if (!toastId || typeof toastId !== 'string' || toastId.trim().length === 0) {
        throw new ValidationError('Invalid toast ID for removal queue', { toastId })
      }
      
      // Check if timeout already exists
      if (toastTimeouts.has(toastId)) {
        return
      }
      
      // Limit the number of concurrent timeouts to prevent memory issues
      if (toastTimeouts.size >= MAX_CONCURRENT_TOASTS) {
        console.warn('Maximum concurrent toast timeouts reached, clearing oldest')
        const oldestKey = toastTimeouts.keys().next().value
        if (oldestKey) {
          const oldTimeout = toastTimeouts.get(oldestKey)
          if (oldTimeout) clearTimeout(oldTimeout)
          toastTimeouts.delete(oldestKey)
        }
      }

      const timeout = setTimeout(() => {
        try {
          toastTimeouts.delete(toastId)
          dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId,
          })
        } catch (removeError) {
          errorHandler.handle(removeError, { function: 'removeToastTimeout', toastId })
        }
      }, TOAST_REMOVE_DELAY)

      toastTimeouts.set(toastId, timeout)
    },
    undefined,
    { operation: 'addToRemoveQueue', toastId }
  )
  
  if (error) {
    console.error('Failed to add toast to removal queue:', error.message)
  }
}

export const reducer = (state: State, action: Action): State => {
  const { data: newState, error } = safeSync(
    () => {
      // Validate state and action
      if (!state || typeof state !== 'object') {
        throw new ValidationError('Invalid state provided to reducer', { state: typeof state })
      }
      
      if (!action || typeof action !== 'object' || !action.type) {
        throw new ValidationError('Invalid action provided to reducer', { action: action })
      }
      
      // Ensure toasts array exists and is valid
      const currentToasts = Array.isArray(state.toasts) ? state.toasts : []
      
      switch (action.type) {
        case "ADD_TOAST": {
          if (!action.toast || typeof action.toast !== 'object') {
            throw new ValidationError('Invalid toast data for ADD_TOAST action', { toast: action.toast })
          }
          
          // Validate toast properties
          if (!action.toast.id || typeof action.toast.id !== 'string') {
            throw new ValidationError('Toast must have a valid ID', { id: action.toast.id })
          }
          
          // Check for duplicate IDs
          const existingToast = currentToasts.find(t => t.id === action.toast.id)
          if (existingToast) {
            console.warn(`Duplicate toast ID detected: ${action.toast.id}`)
            return state // Don't add duplicate
          }
          
          // Limit total toasts to prevent memory issues
          const newToasts = [action.toast, ...currentToasts].slice(0, TOAST_LIMIT)
          
          return {
            ...state,
            toasts: newToasts
          }
        }

        case "UPDATE_TOAST": {
          if (!action.toast || typeof action.toast !== 'object' || !action.toast.id) {
            throw new ValidationError('Invalid toast data for UPDATE_TOAST action', { toast: action.toast })
          }
          
          const toastExists = currentToasts.some(t => t.id === action.toast.id)
          if (!toastExists) {
            console.warn(`Attempted to update non-existent toast: ${action.toast.id}`)
            return state
          }
          
          return {
            ...state,
            toasts: currentToasts.map((t) =>
              t.id === action.toast.id ? { ...t, ...action.toast } : t
            ),
          }
        }

        case "DISMISS_TOAST": {
          const { toastId } = action
          
          // Validate toastId if provided
          if (toastId && (typeof toastId !== 'string' || toastId.trim().length === 0)) {
            throw new ValidationError('Invalid toastId for DISMISS_TOAST action', { toastId })
          }

          // Add toasts to removal queue with error handling
          if (toastId) {
            addToRemoveQueue(toastId)
          } else {
            // Dismiss all toasts
            currentToasts.forEach((toast) => {
              if (toast.id) {
                addToRemoveQueue(toast.id)
              }
            })
          }

          return {
            ...state,
            toasts: currentToasts.map((t) =>
              t.id === toastId || toastId === undefined
                ? {
                    ...t,
                    open: false,
                  }
                : t
            ),
          }
        }
        
        case "REMOVE_TOAST": {
          if (action.toastId === undefined) {
            // Clear all toasts
            return {
              ...state,
              toasts: [],
            }
          }
          
          if (typeof action.toastId !== 'string') {
            throw new ValidationError('Invalid toastId for REMOVE_TOAST action', { toastId: action.toastId })
          }
          
          return {
            ...state,
            toasts: currentToasts.filter((t) => t.id !== action.toastId),
          }
        }
        
        default:
          console.warn(`Unknown toast action type: ${(action as any).type}`)
          return state
      }
    },
    state,
    { operation: 'toastReducer', actionType: action.type }
  )
  
  if (error) {
    errorHandler.handle(error, { function: 'reducer', actionType: action.type })
    return state // Return original state on error
  }
  
  return newState || state
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  const { error } = safeSync(
    () => {
      memoryState = reducer(memoryState, action)
      
      // Safely notify all listeners
      listeners.forEach((listener) => {
        try {
          listener(memoryState)
        } catch (listenerError) {
          console.error('Toast listener error:', listenerError)
          errorHandler.handle(listenerError, { function: 'dispatch-listener' })
        }
      })
    },
    undefined,
    { operation: 'dispatchToastAction', actionType: action.type }
  )
  
  if (error) {
    errorHandler.handle(error, { function: 'dispatch', actionType: action.type })
  }
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const { data: toastResult, error } = safeSync(
    () => {
      // Validate toast props
      if (!props || typeof props !== 'object') {
        throw new ValidationError('Toast props must be a valid object', { props })
      }
      
      // Validate title length
      if (props.title && typeof props.title === 'string' && props.title.length > MAX_TOAST_TITLE_LENGTH) {
        console.warn(`Toast title truncated (max ${MAX_TOAST_TITLE_LENGTH} chars)`)
        props.title = props.title.substring(0, MAX_TOAST_TITLE_LENGTH) + '...'
      }
      
      // Validate description length
      if (props.description && typeof props.description === 'string' && props.description.length > MAX_TOAST_DESCRIPTION_LENGTH) {
        console.warn(`Toast description truncated (max ${MAX_TOAST_DESCRIPTION_LENGTH} chars)`)
        props.description = props.description.substring(0, MAX_TOAST_DESCRIPTION_LENGTH) + '...'
      }
      
      // Check if we're exceeding maximum concurrent toasts
      if (memoryState.toasts.length >= MAX_CONCURRENT_TOASTS) {
        console.warn('Maximum concurrent toasts reached, dismissing oldest')
        const oldestToast = memoryState.toasts[memoryState.toasts.length - 1]
        if (oldestToast?.id) {
          dispatch({ type: "REMOVE_TOAST", toastId: oldestToast.id })
        }
      }
      
      const id = genId()
      
      const update = (updateProps: ToasterToast) => {
        const { error: updateError } = safeSync(
          () => {
            if (!updateProps || typeof updateProps !== 'object') {
              throw new ValidationError('Update props must be a valid object')
            }
            
            dispatch({
              type: "UPDATE_TOAST",
              toast: { ...updateProps, id },
            })
          },
          undefined,
          { operation: 'updateToast', toastId: id }
        )
        
        if (updateError) {
          console.error('Failed to update toast:', updateError.message)
        }
      }
      
      const dismiss = () => {
        const { error: dismissError } = safeSync(
          () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
          undefined,
          { operation: 'dismissToast', toastId: id }
        )
        
        if (dismissError) {
          console.error('Failed to dismiss toast:', dismissError.message)
        }
      }

      dispatch({
        type: "ADD_TOAST",
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open) => {
            try {
              if (!open) dismiss()
            } catch (changeError) {
              errorHandler.handle(changeError, { function: 'onOpenChange', toastId: id })
            }
          },
        },
      })

      return {
        id: id,
        dismiss,
        update,
      }
    },
    null,
    { operation: 'createToast' }
  )
  
  if (error) {
    errorHandler.handle(error, { function: 'toast' })
    
    // Return emergency fallback toast controls
    const fallbackId = `fallback_${Date.now()}`
    return {
      id: fallbackId,
      dismiss: () => console.warn('Fallback toast dismiss called'),
      update: () => console.warn('Fallback toast update called'),
    }
  }
  
  return toastResult || {
    id: 'error',
    dismiss: () => {},
    update: () => {},
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    const { error } = safeSync(
      () => {
        listeners.push(setState)
      },
      undefined,
      { operation: 'addToastListener' }
    )
    
    if (error) {
      errorHandler.handle(error, { function: 'useToast-effect' })
    }
    
    return () => {
      const { error: cleanupError } = safeSync(
        () => {
          const index = listeners.indexOf(setState)
          if (index > -1) {
            listeners.splice(index, 1)
          }
        },
        undefined,
        { operation: 'removeToastListener' }
      )
      
      if (cleanupError) {
        console.error('Error during toast listener cleanup:', cleanupError.message)
      }
    }
  }, [])

  const safeDismiss = (toastId?: string) => {
    const { error } = safeSync(
      () => {
        if (toastId && typeof toastId !== 'string') {
          throw new ValidationError('Toast ID must be a string', { toastId })
        }
        
        dispatch({ type: "DISMISS_TOAST", toastId })
      },
      undefined,
      { operation: 'dismissToastFromHook', toastId }
    )
    
    if (error) {
      console.error('Failed to dismiss toast:', error.message)
    }
  }

  return {
    ...state,
    toast,
    dismiss: safeDismiss,
  }
}

/**
 * Cleans up all toast timeouts and resets state
 * Useful for cleanup in tests or when unmounting the app
 */
export function cleanupToasts(): void {
  const { error } = safeSync(
    () => {
      // Clear all timeouts
      for (const [toastId, timeout] of toastTimeouts.entries()) {
        try {
          clearTimeout(timeout)
        } catch (timeoutError) {
          console.error(`Failed to clear timeout for toast ${toastId}:`, timeoutError)
        }
      }
      
      toastTimeouts.clear()
      
      // Reset state
      memoryState = { toasts: [] }
      count = 0
      
      // Notify all listeners of the reset
      listeners.forEach((listener) => {
        try {
          listener(memoryState)
        } catch (listenerError) {
          console.error('Error notifying listener during cleanup:', listenerError)
        }
      })
    },
    undefined,
    { operation: 'cleanupToasts' }
  )
  
  if (error) {
    errorHandler.handle(error, { function: 'cleanupToasts' })
  }
}

/**
 * Gets current toast statistics
 * Useful for debugging and monitoring
 */
export function getToastStats(): {
  activeToasts: number;
  pendingTimeouts: number;
  listeners: number;
  currentCounter: number;
} {
  return {
    activeToasts: memoryState.toasts.length,
    pendingTimeouts: toastTimeouts.size,
    listeners: listeners.length,
    currentCounter: count,
  }
}

export { useToast, toast }
