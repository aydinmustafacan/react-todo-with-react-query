import React, { createContext, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ToDoList from './components/ToDoList'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function App() {
  const [queryClient] = useState(() => new QueryClient())
  const ToDoContext = createContext({})
  const [todos, setTodos] = useState([])

  return (
    <QueryClientProvider client={queryClient}>
      <ToDoContext.Provider value={{ todos, setTodos }}>
        <ToDoList />
      </ToDoContext.Provider>
      <ReactQueryDevtools initialIsOpen={true} />
    </QueryClientProvider>
  )
}
