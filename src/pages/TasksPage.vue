<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-md">
      <div class="col">
        <h4 class="q-ma-none">My Tasks</h4>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Add Task"
          @click="showAddDialog = true"
        />
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="row q-mb-md">
      <q-tabs
        v-model="filter"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="all" label="All" />
        <q-tab name="pending" label="Pending" />
        <q-tab name="completed" label="Completed" />
      </q-tabs>
    </div>

    <!-- Loading State -->
    <div v-if="tasksStore.loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
    </div>

    <!-- Tasks List -->
    <div v-else-if="sortedTasks.length > 0">
      <q-list bordered separator>
        <q-item
          v-for="task in sortedTasks"
          :key="task.entity_id"
          class="q-pa-md"
        >
          <q-item-section>
            <q-item-label :class="task.is_completed ? 'text-strike text-grey-7' : ''">
              {{ task.title }}
            </q-item-label>
            <q-item-label
              v-if="task.description"
              caption
              :class="task.is_completed ? 'text-strike text-grey-6' : ''"
            >
              {{ task.description }}
            </q-item-label>
            <q-item-label v-if="task.changed_on" caption class="text-grey-6 q-mt-xs">
              <q-icon name="schedule" size="xs" class="q-mr-xs" />
              Created: {{ formatDate(task.changed_on) }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row items-center no-wrap q-gutter-xs">
              <q-btn
                v-if="!task.is_completed"
                flat
                color="positive"
                icon="check_circle"
                label="Mark Complete"
                @click="toggleTask(task.entity_id)"
                size="sm"
                dense
              />
              <q-btn
                v-else
                flat
                color="grey-7"
                icon="undo"
                label="Mark Incomplete"
                @click="toggleTask(task.entity_id)"
                size="sm"
                dense
              />
              <q-btn
                flat
                round
                icon="edit"
                @click="editTask(task)"
                size="sm"
                dense
              />
              <q-btn
                flat
                round
                icon="delete"
                color="negative"
                @click="confirmDelete(task)"
                size="sm"
                dense
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-center column q-pa-xl">
      <q-icon name="task_alt" size="64px" color="grey-5" />
      <p class="text-grey-6 q-mt-md">
        <span v-if="filter === 'all'">No tasks yet. Create your first task!</span>
        <span v-else-if="filter === 'pending'">No pending tasks.</span>
        <span v-else-if="filter === 'completed'">No completed tasks.</span>
      </p>
    </div>

    <!-- Add/Edit Task Dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingTask ? 'Edit Task' : 'Add New Task' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="taskForm.title"
            label="Title *"
            outlined
            dense
            :rules="[val => !!val || 'Title is required']"
            class="q-mb-md"
          />
          <q-input
            v-model="taskForm.description"
            label="Description"
            outlined
            dense
            type="textarea"
            rows="3"
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" @click="closeDialog" />
          <q-btn
            flat
            label="Save"
            @click="saveTask"
            :loading="saving"
            :disable="!taskForm.title"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">Delete task "{{ taskToDelete?.title }}"?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="showDeleteDialog = false" />
          <q-btn
            flat
            label="Delete"
            color="negative"
            @click="deleteTask"
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTasksStore } from 'stores/tasks'

const tasksStore = useTasksStore()

const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingTask = ref(null)
const taskToDelete = ref(null)
const filter = ref('all')

const taskForm = ref({
  title: '',
  description: '',
})

// Filter and sort logic
const filteredTasks = computed(() => {
  let tasks = []
  
  if (filter.value === 'all') {
    tasks = [...tasksStore.tasks]
  } else if (filter.value === 'pending') {
    tasks = [...tasksStore.pendingTasks]
  } else if (filter.value === 'completed') {
    tasks = [...tasksStore.completedTasks]
  }
  
  return tasks
})

const sortedTasks = computed(() => {
  // Sort by creation date (changed_on) - newest first
  return [...filteredTasks.value].sort((a, b) => {
    const dateA = a.changed_on ? new Date(a.changed_on).getTime() : 0
    const dateB = b.changed_on ? new Date(b.changed_on).getTime() : 0
    return dateB - dateA // Descending order (newest first)
  })
})

function closeDialog() {
  showAddDialog.value = false
  editingTask.value = null
  taskForm.value = {
    title: '',
    description: '',
  }
}

function editTask(task) {
  editingTask.value = task
  taskForm.value = {
    title: task.title,
    description: task.description || '',
  }
  showAddDialog.value = true
}

async function saveTask() {
  if (!taskForm.value.title.trim()) {
    return
  }

  saving.value = true
  try {
    if (editingTask.value) {
      await tasksStore.updateTask(editingTask.value.entity_id, {
        title: taskForm.value.title.trim(),
        description: taskForm.value.description.trim(),
      })
    } else {
      await tasksStore.createTask(
        taskForm.value.title.trim(),
        taskForm.value.description.trim()
      )
    }
    closeDialog()
  } finally {
    saving.value = false
  }
}

function confirmDelete(task) {
  taskToDelete.value = task
  showDeleteDialog.value = true
}

async function deleteTask() {
  if (!taskToDelete.value) return

  deleting.value = true
  try {
    await tasksStore.deleteTask(taskToDelete.value.entity_id)
    showDeleteDialog.value = false
    taskToDelete.value = null
  } finally {
    deleting.value = false
  }
}

async function toggleTask(taskId) {
  await tasksStore.toggleTask(taskId)
}

function formatDate(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now - date
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  // If created today, show time only
  if (diffInDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
  
  // If created within last 7 days, show relative time
  if (diffInDays === 1) {
    return 'Yesterday'
  }
  
  if (diffInDays < 7) {
    return `${diffInDays} days ago`
  }
  
  // Otherwise show full date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(() => {
  tasksStore.fetchTasks()
})
</script>

