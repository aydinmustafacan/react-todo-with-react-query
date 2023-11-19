import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TodoItem } from '../../components/ToDoList'
import axios from 'axios'
import { be } from '../constants/api.url'
import { CheckBoxClickEventData } from '../../components/ListItem'
import { Todos } from './useCreateTodoItemMutation'

async function handleCheckBoxClickEvent(variables: CheckBoxClickEventData) {
  const { id, checked } = variables
  return axios.put(`${be}/todos/${id}`, { completed: checked })
}

type CheckTodoItemMutationPropsType = {
  setComplete: (status: Status) => void
}

export enum Status {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

function useCheckTodoItemMutation(props: CheckTodoItemMutationPropsType) {
  const queryClient = useQueryClient()
  const { setComplete: setOptimisticUpdateCompleted } = props

  return useMutation({
    mutationFn: handleCheckBoxClickEvent,
    onMutate: async (variables) => {
      setOptimisticUpdateCompleted(Status.PENDING)
      const { id, checked } = variables
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      const previousTodos = queryClient.getQueryData<Todos>(['todos'])
      if (previousTodos) {
        const updatedTodos = { ...previousTodos }
        const todoItem = updatedTodos.items.find(item => item.id === id)
        if (todoItem) {
          todoItem.completed = checked
          // this will update the cache as well since it is a reference
          // we dont need to set the query data again like queryClient.setQueryData()
        }
      }
      return { previousTodos }
    },
    onError: async (error, variables, context) => {
      // Rollback using the previously captured state
      // TODO: Create a some kind of toast to show the error
      await queryClient.invalidateQueries(['todos'])
    },
    onSuccess: async(data, variables, context) => {
      setOptimisticUpdateCompleted(Status.COMPLETED)
      console.log("On success")
    },
    // onSettled: async (data, error, variables, context) => {}
  })
}

export default useCheckTodoItemMutation
