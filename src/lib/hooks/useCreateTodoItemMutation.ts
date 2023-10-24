import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { TodoItem } from '../../components/ToDoList'
import { be } from '../constants/api.url'

interface AddNewToDoItemType {
  description: string
  id: string
}

async function addNewToDoItem(variables: AddNewToDoItemType) {
  const {id, description} = variables
  return axios.post(`${be}/todos`, { description: description })
}

export interface Todos {
  items: TodoItem[]
  count: number
}

type CreatePostMutationProps = {
  setLockedItemId: (_: string | null) => void
}

function useCreateTodoItemMutation(props: CreatePostMutationProps) {
  const { setLockedItemId } = props
  const queryClient = useQueryClient()
  // @ts-ignore
  return useMutation(
    addNewToDoItem, {
    onMutate: async (variables) => {
      const {id: randomId, description: newTodoDescription} = variables
      setLockedItemId(randomId)
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData<Todos>(['todos'])

      // Optimistically update to the new value
      if (previousTodos) {
        const incrementedCount = +previousTodos.count + 1
        console.log(`incrementedCount is ${incrementedCount}`)
        queryClient.setQueryData<Todos>(['todos'], {
          count: incrementedCount,
          items: [
            ...previousTodos.items,
            {
              id: randomId,
              description: newTodoDescription,
              completed: false,
            },
          ],
        })
      }

      return { previousTodos }
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (err: Error, variables: string, context: any) => {
      if (context?.previousTodos) {
        // Maybe it is better to simply refetch on error instead of rolling back???
        // Rolling back is better for performance but it is more complex to implement
        queryClient.setQueryData<Todos>(['todos'], context.previousTodos)
      }
    },
    onSuccess: async (data, variables, context) => {
      setLockedItemId(null)
      // const newId = undefined // open this line if you wanna test error cases
      const newId = (data?.data[0] as any)?.insertedId;
      if (newId) {
        const previousTodos = queryClient.getQueryData<Todos>(['todos']);
        if (previousTodos) {
          const updatedTodos = previousTodos.items.map((item) =>
            item.id === variables.id ? { ...item, id: newId } : item
          );
          queryClient.setQueryData<Todos>(['todos'], {
            ...previousTodos,
            items: updatedTodos,
          });
        }
      }
    },
  })
}

export default useCreateTodoItemMutation
