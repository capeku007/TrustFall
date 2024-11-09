<template>
  <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>

  <!-- Error State -->
  <div v-else-if="error" class="flex items-center justify-center min-h-screen">
    <div class="text-center p-6 bg-white rounded-lg shadow-sm">
      <p class="text-red-600">{{ error }}</p>
      <button @click="fetchGameData" class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">
        Retry
      </button>
    </div>
  </div>

  <!-- Profile Content -->
  <template v-else>
    <div class="parent mx-auto p-4 max-w-4xl h-[90dvh] bg-[#6e4bb9] overflow-hidden">
      <!-- Profile Header Section -->
      <div class="div1 h-full">
        <div class="rounded-lg h-full w-full py-2">
          <div class="flex items-center gap-4">
            <!-- Avatar -->
            <div class="relative">
              <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <img v-if="authStore.user?.photoURL" :src="authStore.user.photoURL" alt="Profile" class="w-full h-full object-cover" />
                <i v-else class="bx bxs-camera h-8 w-8 text-gray-400"></i>
              </div>
              <div v-if="isEditing" class="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full cursor-pointer">
                <label class="cursor-pointer">
                  <i class="bx bxs-camera h-4 w-4"></i>
                  <input type="file" class="hidden" accept="image/*" @change="handleImageUpload" />
                </label>
              </div>
            </div>

            <!-- Greeting & Name -->
            <div class="flex-grow">
              <div class="text-sm text-gray-200">{{ greeting }}</div>
              <div v-if="isEditing" class="mt-1">
                <input v-model="editedName" class="w-full px-2 py-1 border rounded text-base" placeholder="Enter your name" @keyup.enter="saveProfile" />
              </div>
              <div v-else class="text-lg text-white font-medium">
                {{ authStore.user?.displayName || "Player" }}
              </div>
            </div>

            <!-- Edit Button -->
            <button @click="toggleEdit" class="w-10 h-10 rounded-full flex items-center justify-center" :class="isEditing ? 'bg-green-500 text-white' : 'bg-blue-500'">
              <i v-if="isEditing" class="bx bxs-save text-lg"></i>
              <i v-else class="bx bx-edit text-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="div2 h-full pb-4">
        <div class="flex gap-4 h-full py-2">
          <!-- Stats Card -->
          <div class="flex-basis-c min-w-[120px] text-white rounded-lg border border-2-gray p-4">
            <div class="flex flex-col justify-between text-center">
              <div class="space-y-1">
                <div class="text-xs text-gray-300">Games</div>
                <div class="text-lg font-bold">{{ stats.totalGames }}</div>
              </div>
              <div class="w-full h-px bg-gray-400 my-2"></div>
              <div class="space-y-1">
                <div class="text-xs text-gray-300">Rank</div>
                <div class="text-lg font-bold">#{{ stats.rank }}</div>
              </div>
            </div>
          </div>

          <!-- Achievement Card -->
          <div class="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 text-white p-4">
              <div class="text-center">
                <i class="i-lucide-award h-8 w-8 mb-2"></i>
                <div class="text-sm">
                  {{ userTitle }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Stats -->
      <div class="div3 h-full">
        <div class="flex justify-center items-center gap-4 sm:gap-8 rounded-lg w-full">
          <!-- Wins -->
          <div class="flex flex-col items-center">
            <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-1">
              <span class="text-2xl text-green-600">😎</span>
            </div>
            <div class="text-xs text-gray-300 font-medium">
              {{ stats.wins }} Wins
            </div>
          </div>

          <!-- Draws -->
          <div class="flex flex-col items-center">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-1">
              <span class="text-2xl text-blue-600">🤫</span>
            </div>
            <div class="text-xs text-gray-300 font-medium">
              {{ stats.draws }} Draws
            </div>
          </div>

          <!-- Losses -->
          <div class="flex flex-col items-center">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-1">
              <i class="bx bxs-sad text-3xl text-red-600"></i>
            </div>
            <div class="text-xs text-gray-300 font-medium">
              {{ stats.losses }} Loses
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Games -->
      <div class="div4 overflow-hidden">
        <div class="">
          <h2 class="text-lg text-white font-semibold mb-2">Recent Games</h2>
          <div class="overflow-x-auto flex gap-4 snap-x snap-mandatory pb-4">
            <div v-for="game in completedGames" :key="game.id" @click="viewGameSummary(game.id)"
              class="snap-center shrink-0 w-[calc(100%-2rem)] sm:w-48 bg-[#8e61ee] rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
              <!-- Game Image -->
              <div class="h-32 bg-gray-200 relative">
                <img :src="game.scenario?.imageUrl || '/api/placeholder/192/128'" :alt="game.scenario?.title"
                  class="w-full h-full object-cover" />
                <div class="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-50 rounded text-white text-xs">
                  Round {{ game.currentRound }}/5
                </div>
              </div>

              <!-- Game Info -->
              <div class="p-3 text-white">
                <h3 class="font-medium text-sm line-clamp-1">
                  {{ game.scenario?.title }}
                </h3>
                <div class="mt-1 flex justify-between items-center">
                  <span class="text-xs">Final Score</span>
                  <span class="text-sm font-semibold">{{
                    game.players?.[authStore.user?.uid]?.score || 0
                  }}</span>
                </div>
                <div class="mt-1 text-xs text-purple-300">
                  DM Points: {{ game.dmPoints }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="w-full flex justify-center items-center">
          <!-- Banner container with standard mobile dimensions -->
          <div class="banner-container w-[320px] h-[50px] bg-gray-200 rounded-lg flex items-center justify-center">
            <span class="text-sm text-gray-500">Advertisement</span>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useFirebase } from "@/composables/useFirebase";
import { useAuthStore } from "@/stores/authStore";
import {
  ref as dbRef,
  get,
  update,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { getAuth, updateProfile } from "firebase/auth";

const router = useRouter();
const { database } = useFirebase();
const authStore = useAuthStore();
const {updateProfileImage,loading,error} = useAuth();


// State
const isEditing = ref(false);
const editedName = ref("");
const completedGames = ref([]);
const isLoading = ref(true);
// const error = ref(null);

const stats = ref({
  totalGames: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  rank: 0,
});

// Computed
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
});

const userTitle = computed(() => {
  const totalGames = stats.value.totalGames;
  if (totalGames === 0) return "Rookie Player";
  if (totalGames < 5) return "Beginner";
  if (totalGames < 10) return "Amateur";
  if (totalGames < 20) return "Experienced";
  return "Veteran Player";
});

// Methods
const toggleEdit = () => {
  if (isEditing.value) {
    saveProfile();
    handleUpdateDisplayName();
  } else {
    editedName.value = authStore.user?.displayName || '';
    isEditing.value = true;
  }
};

const saveProfile = async () => {
  if (!authStore.user?.uid) return;

  try {
    const userRef = dbRef(database, `users/${authStore.user.uid}`);
    await update(userRef, {
      displayName: editedName.value,
    });

    // Update auth store
    authStore.setUser({
      ...authStore.user,
      displayName: editedName.value
    });
    
    isEditing.value = false;
  } catch (error) {
    console.error("Error saving profile:", error);
  }
};

const handleUpdateDisplayName = () => {
  const auth = getAuth();
  try {
  updateProfile(auth.currentUser, { displayName: editedName.value }).then(() => {
    console.log("Profile updated successfully");
  });
  } catch (error) {
    console.error("Error updating profile:", error);
  }
};


// const handleImageUpload = async (event) => {
//   const file = event.target.files[0];
//   if (!file) return;

//   updateProfileImage(file);
// };

// const handleImageUpload = async (event) => {
//   try {
//      const file = event.target.files[0];
//   if (!file) return;
    
//     const imageUrl = await firebase.updateProfileImage(file);

//     //   await firebase.updateProfile({ photoURL: imageUrl })
//     await firebase.updateProfile(firebase.auth.currentUser, {
//       photoURL: imageUrl,
//     });
    
//     alert("Profile image updated successfully");
//     firestore.getUserClaims();
//   } catch (error) {
//     console.error("Error uploading image:", error);
//     alert("An error occurred while updating the profile.");
//   }
// };

const currentPhotoURL = computed(() => user.value?.photoURL)

const handleImageUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // Reset error
  error.value = null
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image file'
    return
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'File size must be less than 5MB'
    return
  }

  try {
    // loading.value = true
    await updateProfileImage(file)
    // Optional: Show success message
    // toast.success('Profile photo updated successfully')
  } catch (e) {
    error.value = e.message || 'Error uploading image'
    console.error('Error uploading image:', e)
    // toast.error(error.value)
  } finally {
    // loading.value = false
  }
}

const fetchGameData = async () => {
  if (!authStore.user?.uid) return;

  try {
    isLoading.value = true;
    error.value = null;
    await fetchCompletedGames();
  } catch (err) {
    error.value = err.message;
    console.error("Error fetching game data:", err);
  } finally {
    isLoading.value = false;
  }
};

const fetchCompletedGames = async () => {
  if (!authStore.user?.uid) return;

  try {
    const gamesRef = dbRef(database, "games");
    const userGamesQuery = query(
      gamesRef,
      orderByChild("userId"),
      equalTo(authStore.user.uid)
    );

    const snapshot = await get(userGamesQuery);
    if (snapshot.exists()) {
      const games = [];
      let wins = 0;
      let draws = 0;
      let losses = 0;

      snapshot.forEach((childSnapshot) => {
        const game = childSnapshot.val();
        if (game.status === "completed") {
          games.push({
            id: childSnapshot.key,
            ...game,
          });

          const playerScore = game.players[authStore.user.uid]?.score || 0;
          const aiScore = game.players.ai?.score || 0;

          if (playerScore > aiScore) wins++;
          else if (playerScore === aiScore) draws++;
          else losses++;
        }
      });

      stats.value = {
        totalGames: games.length,
        wins,
        draws,
        losses,
        rank: calculateRank(wins, games.length),
      };

      completedGames.value = games.sort(
        (a, b) => b.completedAt - a.completedAt
      );
    }
  } catch (error) {
    console.error("Error fetching completed games:", error);
  }
};

const calculateRank = (wins, totalGames) => {
  if (totalGames === 0) return 0;
  const winRate = (wins / totalGames) * 100;
  return Math.max(1, Math.floor(100 - winRate));
};

const viewGameSummary = (gameId) => {
  router.push(`/game/${gameId}/summary`);
};

onMounted(async () => {
  if (!authStore.user?.uid) {
    error.value = "Please log in to view profile";
    return;
  }

  await fetchGameData();
});
</script>


<style scoped>
.parent {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 9dvh 21dvh 10dvh 50dvh;
  grid-column-gap: 0px;
  grid-row-gap: 0px;
  height: 90dvh;
  min-height: 90dvh;
}

.div1 {
  grid-area: 1 / 1 / 2 / 2;
}
.div2 {
  grid-area: 2 / 1 / 3 / 2;
}
.div3 {
  grid-area: 3 / 1 / 4 / 2;
}
.div4 {
  grid-area: 4 / 1 / 5 / 2;
}

/* Custom class for stats card width */
.flex-basis-c {
  flex-basis: 25%;
}

/* Hide scrollbars but keep functionality */
.overflow-x-auto {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.overflow-x-auto::-webkit-scrollbar {
  display: none;
}

/* Optional: Add responsive adjustments for smaller screens */
@media (max-width: 640px) {
  .parent {
    grid-template-rows: auto auto auto 1fr;
    height: auto;
    min-height: 90dvh;
  }
}
</style>