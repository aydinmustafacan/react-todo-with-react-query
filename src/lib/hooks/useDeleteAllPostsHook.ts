import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { be } from '../constants/api.url'


function deleteAllToDoItems() {
  return axios.delete(`${be}/todos`)
}

function useDeleteAllPostsHook() {

  return useMutation({
    mutationFn: deleteAllToDoItems,
  })
}

export default useDeleteAllPostsHook
