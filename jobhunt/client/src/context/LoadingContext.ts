import React from "react"

export type LoadingContextState = {
  setLoading: (b: boolean) => void,
  setSuccess: (b: boolean) => void,
  setError: (b: boolean) => void
}

const defaultState: LoadingContextState = {
  setLoading: (_) => { },
  setSuccess: (_) => { },
  setError: (_) => { }
}

const LoadingContext = React.createContext(defaultState)

export default LoadingContext;