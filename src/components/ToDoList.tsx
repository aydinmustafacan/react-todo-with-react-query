import React, { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import ListItem from './ListItem'
import { be } from '../lib/constants/api.url'
import { Button } from '@mui/material'
import useDeleteAllPostsHook from '../lib/hooks/useDeleteAllPostsHook'
import useCreateTodoItemMutation from '../lib/hooks/useCreateTodoItemMutation'
import { makeStyles } from 'tss-react/mui'

export interface TodoItem {
  id: string
  description: string
  completed: boolean
}

interface Todos {
  items: TodoItem[]
  count: number
}
const useStyles = makeStyles()({
  root: {
    backgroundColor: "#f5f5f5", // Light gray
    color: "#333", // Almost black for text color
    padding: "8px 16px", // Padding for top/bottom and left/right
    border: "none",
    borderRadius: "4px", // Rounded edges
    cursor: "pointer", // Pointer cursor on hover
    transition: "all 0.3s ease-in-out", // Smooth transition effect
    '&:hover': {
      backgroundColor: "#e0e0e0", // Slightly darker gray on hover
      color: "#555" // Slightly lighter text on hover
    }
  },
  heading: {
    color: "#333",
    fontSize: "2rem",
    fontWeight: 500,
    margin: "16px 0",
    transition: "all 0.3s ease-in-out",
    '&:hover': {
      color: "#555",
    }
  },
  container: {
    marginLeft: '160px'
  }
});

export default function ToDoList() {
  const {classes} = useStyles();

  const queryClient = useQueryClient()
  const inputRef = useRef(null)
  const [isLocked, setIsLocked] = useState(false)
  const [lockedItemId, setLockedItemId] = useState<string | null>(null)
  const { isInitialLoading,
    error,
    isFetching,
    data,
    isSuccess,
    isLoading,
    refetch } = useQuery({
      queryKey: ['todos'],
      queryFn: fetchTodos,
      enabled: true,
      keepPreviousData: true,
      staleTime: 500000000,
    })
  const { mutate } = useCreateTodoItemMutation({ setLockedItemId })
  const { mutateAsync: deleteAllTodos} = useDeleteAllPostsHook()

  const addNewTodo = function(inputElement: HTMLInputElement): void {
    const text = inputElement.value.trim()
    if (text) {
      const optimisticId = Math.random().toString()
      setLockedItemId(optimisticId)
      mutate({id: optimisticId ,description: text})
      inputElement.value = ''
    }
  }

  async function handleDeleteAllTodos() {
    const previousData = queryClient.getQueryData<Todos>(['todos'])
    try {
      queryClient.setQueryData(['todos'], { count: 0, items: [] })
      await deleteAllTodos()
    } catch (e) {
      queryClient.setQueryData(['todos'], previousData)
      console.log(e)
    } finally {
      await refetch()
    }
  }

  async function fetchTodos(): Promise<Todos> {
    const res = await axios.get(`${be}/todos`)
    return res.data
  }

  async function handleRefetch() {
    console.log('refetching')
    await queryClient.invalidateQueries(['todos'])
    await refetch()
  }

  if (isInitialLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className={classes.container}>
      <section className="todoapp">
        <header className="header">
          <h1 className={classes.heading}>todos </h1>
          <input
            ref={inputRef}
            className={classes.root}
            placeholder={'Add a new task'}
            autoFocus
            onKeyDown={(e) => {
              const text = e.currentTarget.value.trim()
              if (e.key === 'Enter' && text) {
                addNewTodo(e.currentTarget)
              }
            }}
          />
          <Button
            className={classes.root}
            onClick={() => {
              if (inputRef.current) {
                addNewTodo(inputRef.current)
              }
            }}
          >
            {' '}
            Add{' '}
          </Button>
          <h2 className={classes.heading}>Number of todos : {data?.count}</h2>
          <Button className={classes.root} onClick={() => handleDeleteAllTodos()}>Delete All</Button>
        </header>
      </section>
      <br />
      {isSuccess && (
        <>
          <ul>
            {data.items.map((todo: TodoItem) => (
              <div className={classes.heading}>
                <ListItem key={todo.id} todo={todo} lockedItemId={lockedItemId} />
              </div>
            ))}
          </ul>
          {isFetching && <div>Updating in background...</div>}
        </>
      )}
      {isInitialLoading && 'Loading....'}
      {error instanceof Error && error.message}
      <Button className={classes.root} onClick={() => handleRefetch()}>Refetch </Button>
    </div>
  )
}
