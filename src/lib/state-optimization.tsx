'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
  memo
} from 'react';

// ============================================================================
// OPTIMIZED STATE CONTEXT PATTERN
// ============================================================================

/**
 * Creates an optimized context with split state and actions
 * Prevents unnecessary re-renders by separating state and dispatch
 */
export function createOptimizedContext<TState, TActions>() {
  const StateContext = createContext<TState | undefined>(undefined);
  const ActionsContext = createContext<TActions | undefined>(undefined);

  function useStateContext(): TState {
    const context = useContext(StateContext);
    if (!context) {
      throw new Error('useStateContext must be used within StateProvider');
    }
    return context;
  }

  function useActionsContext(): TActions {
    const context = useContext(ActionsContext);
    if (!context) {
      throw new Error('useActionsContext must be used within StateProvider');
    }
    return context;
  }

  function Provider({ 
    children, 
    state, 
    actions 
  }: { 
    children: React.ReactNode; 
    state: TState; 
    actions: TActions; 
  }) {
    return (
      <StateContext.Provider value={state}>
        <ActionsContext.Provider value={actions}>
          {children}
        </ActionsContext.Provider>
      </StateContext.Provider>
    );
  }

  return {
    StateContext,
    ActionsContext,
    Provider,
    useStateContext,
    useActionsContext
  };
}

// ============================================================================
// SELECTOR-BASED STATE ACCESS
// ============================================================================

/**
 * Selector-based state access to prevent unnecessary re-renders
 */
export function createSelectorContext<TState>() {
  const Context = createContext<{
    state: TState;
    subscribe: (selector: (state: TState) => any, callback: () => void) => () => void;
  } | undefined>(undefined);

  function Provider({ children, initialState }: { children: React.ReactNode; initialState: TState }) {
    const [state, setState] = useState(initialState);
    const subscribersRef = useRef<Map<Function, Set<() => void>>>(new Map());

    const subscribe = useCallback((selector: (state: TState) => any, callback: () => void) => {
      const subscribers = subscribersRef.current;
      if (!subscribers.has(selector)) {
        subscribers.set(selector, new Set());
      }
      subscribers.get(selector)!.add(callback);

      return () => {
        const selectorSubscribers = subscribers.get(selector);
        if (selectorSubscribers) {
          selectorSubscribers.delete(callback);
          if (selectorSubscribers.size === 0) {
            subscribers.delete(selector);
          }
        }
      };
    }, []);

    const contextValue = useMemo(() => ({
      state,
      subscribe
    }), [state, subscribe]);

    return (
      <Context.Provider value={contextValue}>
        {children}
      </Context.Provider>
    );
  }

  function useSelector<TSelected>(selector: (state: TState) => TSelected): TSelected {
    const context = useContext(Context);
    if (!context) {
      throw new Error('useSelector must be used within SelectorProvider');
    }

    const [selectedValue, setSelectedValue] = useState(() => selector(context.state));
    const selectorRef = useRef(selector);
    const valueRef = useRef(selectedValue);

    useEffect(() => {
      selectorRef.current = selector;
    }, [selector]);

    useEffect(() => {
      const unsubscribe = context.subscribe(selectorRef.current, () => {
        const newValue = selectorRef.current(context.state);
        if (newValue !== valueRef.current) {
          valueRef.current = newValue;
          setSelectedValue(newValue);
        }
      });

      return unsubscribe;
    }, [context]);

    return selectedValue;
  }

  return {
    Provider,
    useSelector,
    Context
  };
}

// ============================================================================
// OPTIMIZED REDUCER PATTERN
// ============================================================================

/**
 * Enhanced reducer with performance optimizations
 */
export function createOptimizedReducer<TState, TAction>(
  initialState: TState,
  reducer: (state: TState, action: TAction) => TState,
  options: {
    stateComparison?: (prev: TState, next: TState) => boolean;
    middleware?: Array<(state: TState, action: TAction) => void>;
  } = {}
) {
  const { stateComparison, middleware = [] } = options;

  return function useOptimizedReducer() {
    const [state, dispatch] = useReducer((prevState: TState, action: TAction) => {
      // Apply middleware
      middleware.forEach(mw => mw(prevState, action));

      const nextState = reducer(prevState, action);

      // Custom state comparison
      if (stateComparison && stateComparison(prevState, nextState)) {
        return prevState; // Prevent re-render if states are equivalent
      }

      return nextState;
    }, initialState);

    // Memoize dispatch to prevent unnecessary re-renders
    const memoizedDispatch = useCallback(dispatch, []);

    return [state, memoizedDispatch] as const;
  };
}

// ============================================================================
// COMPONENT STATE OPTIMIZATION
// ============================================================================

/**
 * Optimized state management for components
 */
export function useOptimizedState<T>(initialState: T | (() => T)) {
  const [state, setState] = useState(initialState);

  // Memoized setter that prevents unnecessary updates
  const optimizedSetState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prev => {
      const nextState = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState;
      
      // Shallow comparison for objects and arrays
      if (typeof nextState === 'object' && nextState !== null && typeof prev === 'object' && prev !== null) {
        if (Array.isArray(nextState) && Array.isArray(prev)) {
          if (nextState.length === prev.length && nextState.every((item, index) => item === prev[index])) {
            return prev;
          }
        } else {
          const nextKeys = Object.keys(nextState as any);
          const prevKeys = Object.keys(prev as any);
          if (
            nextKeys.length === prevKeys.length &&
            nextKeys.every(key => (nextState as any)[key] === (prev as any)[key])
          ) {
            return prev;
          }
        }
      } else if (nextState === prev) {
        return prev;
      }
      
      return nextState;
    });
  }, []);

  return [state, optimizedSetState] as const;
}

// ============================================================================
// PROP DRILLING PREVENTION
// ============================================================================

/**
 * Higher-order component to provide props without drilling
 */
export function withPropsProvider<TProps extends Record<string, any>>(
  WrappedComponent: React.ComponentType<TProps>,
  propsProvider: () => Partial<TProps>
) {
  const PropsProvider = memo(function PropsProvider(props: Omit<TProps, keyof ReturnType<typeof propsProvider>>) {
    const providedProps = useMemo(() => propsProvider(), []);
    
    return <WrappedComponent {...(props as TProps)} {...providedProps} />;
  });

  PropsProvider.displayName = `withPropsProvider(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return PropsProvider;
}

/**
 * Hook for dependency injection pattern
 */
export function createDependencyContext<TDependencies>() {
  const Context = createContext<TDependencies | undefined>(undefined);

  function Provider({ children, dependencies }: { children: React.ReactNode; dependencies: TDependencies }) {
    const memoizedDependencies = useMemo(() => dependencies, [dependencies]);
    
    return (
      <Context.Provider value={memoizedDependencies}>
        {children}
      </Context.Provider>
    );
  }

  function useDependencies(): TDependencies {
    const context = useContext(Context);
    if (!context) {
      throw new Error('useDependencies must be used within DependencyProvider');
    }
    return context;
  }

  return {
    Provider,
    useDependencies,
    Context
  };
}

// ============================================================================
// FORM STATE OPTIMIZATION
// ============================================================================

/**
 * Optimized form state management
 */
export function useOptimizedForm<TFormData extends Record<string, any>>(
  initialData: TFormData,
  options: {
    validation?: Partial<Record<keyof TFormData, (value: any) => string | undefined>>;
    debounceMs?: number;
  } = {}
) {
  const { validation = {} as Partial<Record<keyof TFormData, (value: any) => string | undefined>>, debounceMs = 300 } = options;
  
  const [formData, setFormData] = useOptimizedState(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof TFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof TFormData, boolean>>>({});

  const validateField = useCallback((name: keyof TFormData, value: any) => {
    const validator = validation[name];
    return validator ? validator(value) : undefined;
  }, [validation]);

  const updateField = useCallback((name: keyof TFormData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Debounced validation
    const timeoutId = setTimeout(() => {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [validateField, debounceMs, setFormData]);

  const touchField = useCallback((name: keyof TFormData) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Partial<Record<keyof TFormData, string>> = {};
    let hasErrors = false;

    Object.keys(formData).forEach((key) => {
      const error = validateField(key as keyof TFormData, formData[key as keyof TFormData]);
      if (error) {
        newErrors[key as keyof TFormData] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [formData, validateField]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData, setFormData]);

  return {
    formData,
    errors,
    touched,
    updateField,
    touchField,
    validateForm,
    resetForm,
    isValid: Object.values(errors).every(error => !error)
  };
}

// ============================================================================
// APPLICATION STATE EXAMPLE
// ============================================================================

/**
 * Example application-level state management
 */
interface AppState {
  user: { id: string; name: string } | null;
  theme: 'light' | 'dark';
  settings: Record<string, any>;
  ui: {
    isLoading: boolean;
    notifications: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  };
}

type AppAction =
  | { type: 'SET_USER'; payload: AppState['user'] }
  | { type: 'SET_THEME'; payload: AppState['theme'] }
  | { type: 'UPDATE_SETTING'; payload: { key: string; value: any } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<AppState['ui']['notifications'][0], 'id'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

const initialAppState: AppState = {
  user: null,
  theme: 'light',
  settings: {},
  ui: {
    isLoading: false,
    notifications: []
  }
};

function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'UPDATE_SETTING':
      return {
        ...state,
        settings: { ...state.settings, [action.payload.key]: action.payload.value }
      };
    
    case 'SET_LOADING':
      return { ...state, ui: { ...state.ui, isLoading: action.payload } };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [
            ...state.ui.notifications,
            { ...action.payload, id: Date.now().toString() }
          ]
        }
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== action.payload)
        }
      };
    
    default:
      return state;
  }
}

// Create optimized app context
export const {
  StateContext: AppStateContext,
  ActionsContext: AppActionsContext,
  Provider: AppProvider,
  useStateContext: useAppState,
  useActionsContext: useAppActions
} = createOptimizedContext<AppState, {
  setUser: (user: AppState['user']) => void;
  setTheme: (theme: AppState['theme']) => void;
  updateSetting: (key: string, value: any) => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<AppState['ui']['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
}>();

// App provider component
export const OptimizedAppProvider = memo(function OptimizedAppProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const useOptimizedAppReducer = createOptimizedReducer(
    initialAppState,
    appStateReducer,
    {
      middleware: [
        (state, action) => {
          if (process.env.NODE_ENV === 'development') {
            void 0;
          }
        }
      ]
    }
  );

  const [state, dispatch] = useOptimizedAppReducer();

  const actions = useMemo(() => ({
    setUser: (user: AppState['user']) => dispatch({ type: 'SET_USER', payload: user }),
    setTheme: (theme: AppState['theme']) => dispatch({ type: 'SET_THEME', payload: theme }),
    updateSetting: (key: string, value: any) => dispatch({ type: 'UPDATE_SETTING', payload: { key, value } }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    addNotification: (notification: Omit<AppState['ui']['notifications'][0], 'id'>) =>
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    removeNotification: (id: string) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }), [dispatch]);

  return (
    <AppProvider state={state} actions={actions}>
      {children}
    </AppProvider>
  );
});

// ============================================================================
// EXPORT STATE OPTIMIZATION UTILITIES
// ============================================================================

export const StateOptimization = {
  createOptimizedContext,
  createSelectorContext,
  createOptimizedReducer,
  useOptimizedState,
  withPropsProvider,
  createDependencyContext,
  useOptimizedForm,
  OptimizedAppProvider,
  useAppState,
  useAppActions
};

export default StateOptimization;