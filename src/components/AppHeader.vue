<template>
  <q-header elevated>
    <q-toolbar>
      <q-btn
        flat
        dense
        round
        icon="menu"
        aria-label="Menu"
        @click="toggleLeftDrawer"
        v-if="authStore.isAuthenticated"
      />

      <q-toolbar-title> ToDo App </q-toolbar-title>

      <div class="q-mr-md text-caption text-grey-5">v{{ version }}</div>

      <div v-if="authStore.isAuthenticated" class="cursor-pointer">
        Logged in as
        <b>{{ authStore.user.first_name }} {{ authStore.user.last_name }}</b>
        <q-icon size="xs" name="arrow_drop_down" />
        <q-menu fir anchor="bottom right" self="top right">
          <q-list style="min-width: 150px">
            <q-item clickable v-close-popup @click="openEditProfileDialog">
              <q-item-section avatar>
                <q-icon name="edit" />
              </q-item-section>
              <q-item-section>Edit Profile</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup @click="authStore.logout()">
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>Logout</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </div>
    </q-toolbar>
  </q-header>

  <q-drawer v-if="authStore.isAuthenticated" v-model="leftDrawerOpen" show-if-above bordered>
    <q-list>
      <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
    </q-list>
  </q-drawer>

  <!-- Edit Profile Dialog -->
  <q-dialog v-model="editProfileDialog" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Edit Profile</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-model="editingFirstName"
          label="First Name"
          dense
          outlined
          :rules="[val => !!val || 'First name is required']"
          class="q-mb-md"
        />
        <q-input
          v-model="editingLastName"
          label="Last Name"
          dense
          outlined
          :rules="[val => !!val || 'Last name is required']"
        />
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="closeEditProfileDialog" />
        <q-btn flat label="Save" @click="saveProfile" :loading="isSaving" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>


<script setup>
import { ref } from 'vue'
import { useAuthStore } from 'stores/auth'
import versionData from '@/version.json'
import EssentialLink from 'components/EssentialLink.vue'

const linksList = [
  {
    title: 'Dashboard',
    icon: 'dashboard',
    link: '/dashboard',
  },
  {
    title: 'Tasks',
    icon: 'task_alt',
    link: '/tasks',
  },
]

const authStore = useAuthStore()
const version = versionData.version

const leftDrawerOpen = ref(false)
const editProfileDialog = ref(false)
const editingFirstName = ref('')
const editingLastName = ref('')
const isSaving = ref(false)


function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function openEditProfileDialog() {
  editingFirstName.value = authStore.user?.first_name || ''
  editingLastName.value = authStore.user?.last_name || ''
  editProfileDialog.value = true
}

function closeEditProfileDialog() {
  editProfileDialog.value = false
  editingFirstName.value = ''
  editingLastName.value = ''
}

async function saveProfile() {
  if (!editingFirstName.value.trim() || !editingLastName.value.trim()) {
    return
  }

  isSaving.value = true
  try {
    const success = await authStore.updateProfile({
      first_name: editingFirstName.value.trim(),
      last_name: editingLastName.value.trim(),
    })
    if (success) {
      closeEditProfileDialog()
    }
  } finally {
    isSaving.value = false
  }
}

</script>