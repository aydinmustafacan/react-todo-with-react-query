import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { be } from '../constants/api.url'
import { DeleteEventData } from '../../components/ListItem'

async function handleDeleteClickEvent(variables: DeleteEventData) {
  const { id } = variables
  return axios.delete(`${be}/todos/${id}`)
}

function useDeleteTodoItemMutation() {
  return useMutation({
    mutationFn: handleDeleteClickEvent,
  })
}

export default useDeleteTodoItemMutation