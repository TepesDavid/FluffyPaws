// ============================================================
//  FluffyPaws — animals.js (Vue 3 + Firebase Firestore)
// ============================================================

const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

createApp({
    setup() {
        function refreshFadeIns() {
            if (typeof window.refreshScrollAnimations === 'function') {
                window.refreshScrollAnimations();
            }
            const cards = document.querySelectorAll('#animals-app .animal-card.fade-in');
            if (!cards.length) return;
            cards.forEach(card => card.classList.remove('visible'));
            requestAnimationFrame(() => {
                cards.forEach(card => card.classList.add('visible'));
            });
        }

        const animals     = ref([]);
        const loading     = ref(true);
        const errorMsg    = ref('');

        const filterSpecies = ref('');
        const filterAge     = ref('');
        const filterSex     = ref('');
        const filterSize    = ref('');
        const filterCity    = ref('');
        const sortBy        = ref('newest');

        const perPage     = 6;
        const currentPage = ref(1);

        const favorites = ref(new Set());
        const currentUserId = ref(null);

        const ageLabelMap    = { baby: 'Pui (0-1 an)', young: 'Tânăr (1-3 ani)', adult: 'Adult (3-7 ani)', senior: 'Senior (7+ ani)' };
        const statusLabelMap = { available: 'Disponibil', urgent: 'Urgent!', new: 'Nou' };
        const cityLabelMap   = { bucuresti: 'București', cluj: 'Cluj-Napoca', timisoara: 'Timișoara', iasi: 'Iași', brasov: 'Brașov', sibiu: 'Sibiu' };

        // ── Fetch din Firestore (fără where — filtrăm în JS) ─────
        onMounted(async () => {
            try {
                const snapshot = await db.collection('animals').get();
                animals.value = snapshot.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id:          doc.id,
                        name:        d.name        || 'Animal',
                        species:     d.species     || 'other',
                        breed:       d.breed       || 'Rasă necunoscută',
                        ageCategory: d.ageCategory || 'adult',
                        ageLabel:    ageLabelMap[d.ageCategory] || d.ageCategory || '-',
                        sex:         d.sex         || 'M',
                        size:        d.size        || 'medium',
                        city:        d.city        || '',
                        cityLabel:   cityLabelMap[d.city] || d.city || 'Necunoscut',
                        photo:       d.photo       || 'https://placedog.net/400/300',
                        description: d.description || '',
                        status:      d.status      || 'available',
                        statusLabel: statusLabelMap[d.status] || 'Disponibil',
                        available:   d.available   !== false,
                        createdAt:   d.createdAt   || null,
                    };
                });
            } catch (err) {
                console.error('Eroare la încărcarea animalelor:', err);
                errorMsg.value = 'Nu s-au putut încărca animalele. Verifică conexiunea.';
            } finally {
                loading.value = false;
                await nextTick();
                refreshFadeIns();
            }
        });

        const filteredAnimals = computed(() => {
            let list = animals.value.filter(a => {
                if (!a.available) return false;
                if (filterSpecies.value && a.species     !== filterSpecies.value) return false;
                if (filterAge.value     && a.ageCategory !== filterAge.value)     return false;
                if (filterSex.value     && a.sex         !== filterSex.value)     return false;
                if (filterSize.value    && a.size        !== filterSize.value)    return false;
                if (filterCity.value    && a.city        !== filterCity.value)    return false;
                return true;
            });

            if (sortBy.value === 'name') {
                list = [...list].sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortBy.value === 'age') {
                const order = { baby: 0, young: 1, adult: 2, senior: 3 };
                list = [...list].sort((a, b) => (order[a.ageCategory] || 0) - (order[b.ageCategory] || 0));
            } else {
                list = [...list].sort((a, b) => {
                    if (a.createdAt && b.createdAt) return b.createdAt.seconds - a.createdAt.seconds;
                    return 0;
                });
            }
            return list;
        });

        const totalPages   = computed(() => Math.max(1, Math.ceil(filteredAnimals.value.length / perPage)));
        const pagedAnimals = computed(() => {
            const start = (currentPage.value - 1) * perPage;
            return filteredAnimals.value.slice(start, start + perPage);
        });
        const pageNumbers  = computed(() => Array.from({ length: totalPages.value }, (_, i) => i + 1));

        watch(pagedAnimals, async () => {
            await nextTick();
            refreshFadeIns();
        });

        function applyFilters() { currentPage.value = 1; }

        function resetFilters() {
            filterSpecies.value = '';
            filterAge.value     = '';
            filterSex.value     = '';
            filterSize.value    = '';
            filterCity.value    = '';
            sortBy.value        = 'newest';
            currentPage.value   = 1;
        }

        function goToPage(page) {
            if (page >= 1 && page <= totalPages.value) {
                currentPage.value = page;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        function requireLogin(message) {
            if (typeof window.showToast === 'function') {
                window.showToast(message || 'Trebuie sa fii autentificat pentru aceasta actiune.', 'warning');
            } else {
                alert(message || 'Trebuie sa fii autentificat pentru aceasta actiune.');
            }
            localStorage.setItem('redirectAfterLogin', window.location.href);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }

        async function loadFavorites(uid) {
            try {
                const snap = await db.collection('users').doc(uid).collection('favorites').get();
                favorites.value = new Set(snap.docs.map(doc => doc.id));
            } catch (err) {
                console.error('Eroare la incarcarea favoritelor:', err);
                favorites.value = new Set();
            }
        }

        async function toggleFavorite(id) {
            if (!currentUserId.value) {
                requireLogin('Trebuie sa ai un cont pentru a salva la favorite.');
                return;
            }
            const favRef = db.collection('users').doc(currentUserId.value).collection('favorites').doc(id);
            try {
                if (favorites.value.has(id)) {
                    await favRef.delete();
                    favorites.value.delete(id);
                } else {
                    await favRef.set({
                        animalId: id,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    favorites.value.add(id);
                }
                favorites.value = new Set(favorites.value);
            } catch (err) {
                console.error('Eroare la actualizarea favoritelor:', err);
            }
        }

        function isFavorite(id) { return favorites.value.has(id); }

        function statusClass(status) {
            return {
                'badge-available': status === 'available',
                'badge-urgent':    status === 'urgent',
                'badge-new':       status === 'new'
            };
        }

        function speciesIcon(species) {
            const icons = { dog: 'fa-dog', cat: 'fa-cat', rabbit: 'fa-paw', bird: 'fa-dove', other: 'fa-paw' };
            return icons[species] || 'fa-paw';
        }

        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUserId.value = user.uid;
                await loadFavorites(user.uid);
            } else {
                currentUserId.value = null;
                favorites.value = new Set();
            }
        });

        return {
            animals, loading, errorMsg,
            filterSpecies, filterAge, filterSex, filterSize, filterCity, sortBy,
            currentPage, totalPages, pageNumbers, pagedAnimals, filteredAnimals,
            applyFilters, resetFilters, goToPage,
            toggleFavorite, isFavorite, statusClass, speciesIcon
        };
    }
}).mount('#animals-app');
