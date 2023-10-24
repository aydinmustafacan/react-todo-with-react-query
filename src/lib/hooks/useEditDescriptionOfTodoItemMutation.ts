import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TodoItem } from '../../components/ToDoList'
import axios from 'axios'
import { be } from '../constants/api.url'
import { EditDescriptionEventData } from '../../components/ListItem'

async function handleEditDescriptionClickEvent(variables: EditDescriptionEventData) {
  const { id, description } = variables
  return axios.put(`${be}/todos/${id}`, { description: description })
}

type EditDescriptionMutationPropsType = {
  setComplete: (isCompleted: boolean) => void
}

function useEditDescriptionOfTodoItemMutation(props: EditDescriptionMutationPropsType) {
  const queryClient = useQueryClient()
  const { setComplete: setOptimisticUpdateCompleted } = props

  return useMutation({
    mutationFn: handleEditDescriptionClickEvent,
    onMutate: async (variables) => {
      setOptimisticUpdateCompleted(false)
      const { id, description } = variables
      await queryClient.cancelQueries({ queryKey: ['todos', { id }] })
      const previousTodo = queryClient.getQueryData<TodoItem>(['todos', { id }])
      if (previousTodo) {
        queryClient.setQueryData<TodoItem>(['todos', { id }], {
          ...previousTodo,
          description: description,
        })
      }
      return { previousTodo }
    },
    onError: async (error, variables, context) => {
      if (context?.previousTodo) {
        const { id } = variables
        queryClient.setQueryData<TodoItem>(['todos', { id }], context.previousTodo)
      }
    },
    onSettled: async (data, error, variables) => {
      const { id } = variables
      await queryClient.invalidateQueries(['todos', { id }])
      console.log('------SETTLED-------')
      setOptimisticUpdateCompleted(true)
    },
  })
}

export default useEditDescriptionOfTodoItemMutation
