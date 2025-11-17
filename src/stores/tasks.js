import { defineStore, acceptHMRUpdate } from 'pinia'
import { Notify } from 'quasar'
import axios from 'config/axios'

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    loading: false,
  }),

  getters: {
    completedTasks: (state) => state.tasks.filter(task => task.is_completed),
    pendingTasks: (state) => state.tasks.filter(task => !task.is_completed),
  },

  actions: {
    /**
     * Fetch all tasks for the current user
     */
    async fetchTasks() {
      this.loading = true
      try {
        const response = await axios.get('/tasks')
        if (response.data?.success) {
          this.tasks = response.data.tasks || []
          return true
        } else {
          this.showErrorNotification(response.data?.message || 'Failed to fetch tasks')
          return false
        }
      } catch (error) {
        return this.handleApiError(error, 'Failed to fetch tasks')
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new task
     */
    async createTask(title, description = '') {
      try {
        const response = await axios.post('/tasks', { title, description })
        if (response.data?.success) {
          const newTask = response.data.task
          this.tasks.push(newTask)
          Notify.create({
            message: 'Task created successfully!',
            color: 'positive',
            position: 'top',
            timeout: 3000,
          })
          return newTask
        } else {
          this.showErrorNotification(response.data?.message || 'Failed to create task')
          return null
        }
      } catch (error) {
        this.handleApiError(error, 'Failed to create task')
        return null
      }
    },

    /**
     * Update a task
     */
    async updateTask(taskId, updates) {
      try {
        const response = await axios.patch(`/tasks/${taskId}`, updates)
        if (response.data?.success) {
          const updatedTask = response.data.task
          const index = this.tasks.findIndex(t => t.entity_id === taskId)
          if (index !== -1) {
            this.tasks[index] = updatedTask
          }
          Notify.create({
            message: 'Task updated successfully!',
            color: 'positive',
            position: 'top',
            timeout: 3000,
          })
          return updatedTask
        } else {
          this.showErrorNotification(response.data?.message || 'Failed to update task')
          return null
        }
      } catch (error) {
        this.handleApiError(error, 'Failed to update task')
        return null
      }
    },

    /**
     * Toggle task completion status
     */
    async toggleTask(taskId) {
      try {
        const response = await axios.patch(`/tasks/${taskId}/toggle`)
        if (response.data?.success) {
          const updatedTask = response.data.task
          const index = this.tasks.findIndex(t => t.entity_id === taskId)
          if (index !== -1) {
            this.tasks[index] = updatedTask
          }
          return updatedTask
        } else {
          this.showErrorNotification(response.data?.message || 'Failed to update task')
          return null
        }
      } catch (error) {
        this.handleApiError(error, 'Failed to toggle task')
        return null
      }
    },

    /**
     * Delete a task
     */
    async deleteTask(taskId) {
      try {
        const response = await axios.delete(`/tasks/${taskId}`)
        if (response.data?.success) {
          this.tasks = this.tasks.filter(t => t.entity_id !== taskId)
          Notify.create({
            message: 'Task deleted successfully!',
            color: 'positive',
            position: 'top',
            timeout: 3000,
          })
          return true
        } else {
          this.showErrorNotification(response.data?.message || 'Failed to delete task')
          return false
        }
      } catch (error) {
        this.handleApiError(error, 'Failed to delete task')
        return false
      }
    },

    /**
     * Show error notification
     */
    showErrorNotification(message = 'An unknown error occurred') {
      Notify.create({
        message,
        color: 'negative',
        position: 'top',
        timeout: 5000,
      })
    },

    /**
     * Handle API errors consistently
     */
    handleApiError(error, defaultMessage = 'An unknown error occurred') {
      const message = error.response?.data?.message || error.message || defaultMessage
      this.showErrorNotification(message)
      return false
    },
  },
})

// Hot Module Replacement support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTasksStore, import.meta.hot))
}

