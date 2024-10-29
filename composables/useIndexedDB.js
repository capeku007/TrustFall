import { ref } from 'vue'

export function useIndexedDB() {
  const DB_NAME = "AudioProjectsDB"
  const STORE_NAME = "projects"
  const DB_VERSION = 1
  let db = null

  const projects = ref([])
  const currentProject = ref(null)

  const initDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error)
        reject("Error opening IndexedDB")
      }

      request.onsuccess = (event) => {
        db = event.target.result
        resolve(db)
      }

      request.onupgradeneeded = (event) => {
        db = event.target.result
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true })
        objectStore.createIndex("name", "name", { unique: true })
      }
    })
  }

  const createProject = async (name) => {
    if (!db) await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.add({
        name: name,
        uploads: [],
        trims: [],
        createdAt: new Date()
      })

      request.onerror = (event) => {
        console.error("Error creating project:", event.target.error)
        reject("Error creating project")
      }

      request.onsuccess = (event) => {
        refreshProjects()
        resolve(event.target.result)
      }
    })
  }

  const getProjects = () => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly")
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.getAll()

      request.onerror = (event) => {
        console.error("Error retrieving projects:", event.target.error)
        reject("Error retrieving projects")
      }

      request.onsuccess = (event) => {
        resolve(event.target.result)
      }
    })
  }

  const refreshProjects = async () => {
    projects.value = await getProjects()
  }

  const loadProject = async (id) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly")
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.get(id)

      request.onerror = (event) => {
        console.error("Error loading project:", event.target.error)
        reject("Error loading project")
      }

      request.onsuccess = (event) => {
        currentProject.value = event.target.result
        resolve(currentProject.value)
      }
    })
  }

  const addAudioToProject = async (projectId, audioFile, type) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const objectStore = transaction.objectStore(STORE_NAME)
      const getRequest = objectStore.get(projectId)

      getRequest.onerror = (event) => {
        console.error("Error retrieving project:", event.target.error)
        reject("Error retrieving project")
      }

      getRequest.onsuccess = (event) => {
        const project = event.target.result
        const audioEntry = {
          name: audioFile.name,
          file: audioFile,
          addedAt: new Date()
        }

        if (type === 'upload') {
          project.uploads.push(audioEntry)
        } else if (type === 'trim') {
          project.trims.push(audioEntry)
        }

        const updateRequest = objectStore.put(project)

        updateRequest.onerror = (event) => {
          console.error("Error updating project:", event.target.error)
          reject("Error updating project")
        }

        updateRequest.onsuccess = (event) => {
          refreshProjects()
          if (currentProject.value && currentProject.value.id === projectId) {
            currentProject.value = project
          }
          resolve(project)
        }
      }
    })
  }

  const getStoredAudio = async () => {
    if (!currentProject.value || currentProject.value.uploads.length === 0) {
      return null;
    }
    return currentProject.value.uploads[0].file;
  };

  return {
    projects,
    currentProject,
    initDB,
    createProject,
    refreshProjects,
    loadProject,
    getStoredAudio,
    addAudioToProject
  }
}