import React, { useEffect, useRef, useState } from 'react'
import { TodoItem } from './ToDoList'
import { Box, Checkbox, CircularProgress, IconButton, TextField, Typography } from '@mui/material'
import { Delete } from '@mui/icons-material'
import { useQueryClient } from '@tanstack/react-query'
import useCheckTodoItemMutation, { Status } from '../lib/hooks/useCheckTodoItemMutation'
import useEditDescriptionOfTodoItemMutation from '../lib/hooks/useEditDescriptionOfTodoItemMutation'
import useDeleteTodoItemMutation from '../lib/hooks/useDeleteTodoItemMutation'
import { makeStyles } from 'tss-react/mui'

interface ListItemProps {
  item: TodoItem
  isLocked: boolean
  onCompleteUpdate: (status: Status) => void
}
export interface CheckBoxClickEventData {
  id: string
  checked: boolean
}

export interface EditDescriptionEventData {
  id: string
  description: string
}

export interface DeleteEventData {
  id: string
}

const useStyles = makeStyles()({
  heading: {
    color: "#333",
    fontSize: "1.5rem",   // Setting a specific font size
    fontWeight: 500,
    margin: "8px 0",
    transition: "all 0.3s ease-in-out",
    '&:hover': {
      color: "#555",
    }
  },
  inputField: {
    '& .MuiInputBase-input': {
      color: "#333",
      fontSize: "1.5rem",  // Matching the Typography font size
      backgroundColor: "#f5f5f5",
      padding: "8px 16px",
      borderRadius: "4px",
      transition: "all 0.3s ease-in-out",
      '&:hover': {
        backgroundColor: "#e0e0e0",
        color: "#555"
      },
      '&.Mui-focused': {
        backgroundColor: "#e0e0e0",
        color: "#555"
      }
    }
  }
});

const ListItem = ({ item: { description, completed, id }, isLocked, onCompleteUpdate }: ListItemProps) => {
  const {classes} = useStyles();

  const queryClient = useQueryClient()

  const [editing, setEditing] = useState(false)
  const wrapperRef = useRef<HTMLLIElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isAbleToUpdateDesc = useRef(false)

  const [text, setText] = useState(description)
  const [isCompleted, setIsCompleted] = useState(completed)
  const {
    mutate: checkAsCompleteMutate,
  } = useCheckTodoItemMutation({ setComplete: onCompleteUpdate })

  const {
    mutateAsync: editDescriptionMutate,
  } = useEditDescriptionOfTodoItemMutation({ setComplete: onCompleteUpdate })

  const { mutateAsync: deleteToDoItem} = useDeleteTodoItemMutation()

  async function handleDeleteById(todo: DeleteEventData) {
    await deleteToDoItem(todo)
    await queryClient.invalidateQueries(['todos'])
  }

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (wrapperRef.current && !(wrapperRef.current as Node).contains(event.target as Node)) {
        if (isAbleToUpdateDesc.current) {
          handleEditDescription({ id, description: text })
        }
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [text])

  async function handleEditDescription(variables: EditDescriptionEventData) {
    isAbleToUpdateDesc.current = false
    const { id, description } = variables
    setEditing(false)
    await editDescriptionMutate({ id, description: description })
    setText(description)
  }

  return (
    <Box component="li" key={id} display="flex" alignItems="center" ref={wrapperRef}>
      <Checkbox
        checked={isCompleted}
        disabled={isLocked}
        onChange={(e) => {
          const checked = e.currentTarget.checked
          setIsCompleted(checked)
          console.log('set is as checked')
          checkAsCompleteMutate({ id, checked })
        }}
        autoFocus={editing}
      />
      {!editing ? (
        <Typography
          className={classes.heading}
          style={isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          onClick={() => {
            if (!isLocked) {
              setEditing(true)
            }
          }}
        >
          {text}
        </Typography>
      ) : (
        <TextField
          className={classes.inputField}
          value={text}
          ref={inputRef}
          onChange={(e) => {
            const newText = e.currentTarget.value
            setText(newText)
            isAbleToUpdateDesc.current = true
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleEditDescription({ id, description: text })
            }
          }}
          autoFocus
        />
      )}
      <IconButton onClick={() => handleDeleteById({ id })}>
        <Delete />
      </IconButton>
      {isLocked && <CircularProgress size={20} />}
    </Box>
  )
}

export default ListItem
