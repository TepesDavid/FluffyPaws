// ============================================================
//  FluffyPaws - animal-details.js (Firestore)
// ============================================================

(function () {
    const ageLabelMap = { baby: 'Pui (0-1 an)', young: 'Tanar (1-3 ani)', adult: 'Adult (3-7 ani)', senior: 'Senior (7+ ani)' };
    const statusLabelMap = { available: 'Disponibil', urgent: 'Urgent!', new: 'Nou' };
    const cityLabelMap = { bucuresti: 'Bucuresti', cluj: 'Cluj-Napoca', timisoara: 'Timisoara', iasi: 'Iasi', brasov: 'Brasov', sibiu: 'Sibiu' };
    const sizeLabelMap = { small: 'Mica', medium: 'Medie', large: 'Mare' };
    const speciesIconMap = { dog: 'fa-dog', cat: 'fa-cat', rabbit: 'fa-paw', bird: 'fa-dove', other: 'fa-paw' };

    const els = {
        loading: document.getElementById('detailsLoading'),
        error: document.getElementById('detailsError'),
        content: document.getElementById('detailsContent'),
        mainImage: document.getElementById('mainImage'),
        statusBadges: document.getElementById('statusBadges'),
        breadcrumbName: document.getElementById('breadcrumbName'),
        animalName: document.getElementById('animalName'),
        animalNameInfo: document.getElementById('animalNameInfo'),
        detailName: document.getElementById('detailName'),
        detailDescription: document.getElementById('detailDescription'),
        speciesIcon: document.getElementById('speciesIcon'),
        detailBreed: document.getElementById('detailBreed'),
        detailAge: document.getElementById('detailAge'),
        detailSex: document.getElementById('detailSex'),
        sexIcon: document.getElementById('sexIcon'),
        detailSize: document.getElementById('detailSize'),
        detailCity: document.getElementById('detailCity'),
        adoptHeading: document.getElementById('adoptHeading'),
        adoptionLink: document.getElementById('adoptionLink'),
        favoriteButton: document.getElementById('favoriteToggleBtn'),
        favoriteIcon: document.getElementById('favoriteIcon'),
        temperamentSection: document.getElementById('temperamentSection'),
        temperamentTags: document.getElementById('temperamentTags'),
        healthVaccinated: document.getElementById('healthVaccinated'),
        healthSterilized: document.getElementById('healthSterilized'),
        healthMicrochipped: document.getElementById('healthMicrochipped'),
        healthDewormed: document.getElementById('healthDewormed')
    };

    function show(el, isVisible) {
        if (!el) return;
        el.style.display = isVisible ? '' : 'none';
    }

    function setText(el, text) {
        if (!el) return;
        el.textContent = text;
    }

    function toLabel(value, fallback) {
        if (value === true) return 'Da';
        if (value === false) return 'Nu';
        return fallback || 'Necunoscut';
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

    async function resolveUserRole(user) {
        if (!user) return null;
        const cached = localStorage.getItem('userRole');
        if (cached) return cached;
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            if (doc.exists) {
                const role = doc.data().role || 'user';
                localStorage.setItem('userRole', role);
                return role;
            }
        } catch (err) {
            console.error('Eroare la incarcare rol utilizator:', err);
        }
        return 'user';
    }

    function renderBadges(animal) {
        if (!els.statusBadges) return;
        els.statusBadges.innerHTML = '';

        const availability = document.createElement('span');
        availability.className = 'card-badge ' + (animal.available ? 'badge-available' : 'badge-urgent');
        availability.style.position = 'static';
        availability.textContent = animal.available ? 'DISPONIBIL' : 'INDISPONIBIL';
        els.statusBadges.appendChild(availability);

        if (animal.status === 'new') {
            const badge = document.createElement('span');
            badge.className = 'card-badge badge-new';
            badge.style.position = 'static';
            badge.textContent = 'NOU';
            els.statusBadges.appendChild(badge);
        } else if (animal.status === 'urgent') {
            const badge = document.createElement('span');
            badge.className = 'card-badge badge-urgent';
            badge.style.position = 'static';
            badge.textContent = 'URGENT!';
            els.statusBadges.appendChild(badge);
        }
    }

    function renderTemperament(temperament) {
        if (!els.temperamentSection || !els.temperamentTags) return;
        if (!temperament || temperament.length === 0) {
            els.temperamentSection.style.display = 'none';
            return;
        }
        els.temperamentSection.style.display = '';
        els.temperamentTags.innerHTML = '';
        temperament.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'detail-tag';
            span.textContent = tag;
            els.temperamentTags.appendChild(span);
        });
    }

    function renderMainImage(name, url) {
        if (!els.mainImage) return;
        els.mainImage.src = url;
        els.mainImage.alt = name + ' - Imagine principala';
    }

    let currentUser = null;
    let currentUserRole = null;
    let isFavorite = false;

    function updateFavoriteUI() {
        if (!els.favoriteIcon) return;
        els.favoriteIcon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
        if (els.favoriteButton) {
            els.favoriteButton.classList.toggle('is-favorite', isFavorite);
        }
    }

    async function loadFavoriteState(uid, animalId) {
        if (!uid || !animalId) return;
        try {
            const favDoc = await db.collection('users').doc(uid).collection('favorites').doc(animalId).get();
            isFavorite = favDoc.exists;
            updateFavoriteUI();
        } catch (err) {
            console.error('Eroare la incarcarea favoritelor:', err);
        }
    }

    async function toggleFavorite(animalId) {
        if (!currentUser) {
            requireLogin('Trebuie sa ai un cont pentru a salva la favorite.');
            return;
        }
        const favRef = db.collection('users').doc(currentUser.uid).collection('favorites').doc(animalId);
        try {
            if (isFavorite) {
                await favRef.delete();
                isFavorite = false;
            } else {
                await favRef.set({
                    animalId: animalId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                isFavorite = true;
            }
            updateFavoriteUI();
        } catch (err) {
            console.error('Eroare la actualizarea favoritelor:', err);
        }
    }

    async function loadAnimal() {
        show(els.loading, true);
        show(els.error, false);
        show(els.content, false);

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (!id) {
            setText(els.error, 'Lipseste ID-ul animalului.');
            show(els.loading, false);
            show(els.error, true);
            return;
        }

        try {
            const doc = await db.collection('animals').doc(id).get();
            if (!doc.exists) {
                setText(els.error, 'Animalul cautat nu a fost gasit.');
                show(els.loading, false);
                show(els.error, true);
                return;
            }

            const d = doc.data() || {};
            const animal = {
                id: doc.id,
                name: d.name || 'Animal',
                species: d.species || 'other',
                breed: d.breed || 'Rasa necunoscuta',
                ageCategory: d.ageCategory || 'adult',
                ageLabel: d.ageLabel || ageLabelMap[d.ageCategory] || d.ageCategory || '-',
                sex: d.sex || 'M',
                size: d.size || 'medium',
                city: d.city || '',
                cityLabel: cityLabelMap[d.city] || d.city || 'Necunoscut',
                photo: d.photo || 'https://placedog.net/800/600',
                description: d.description || 'Nu exista o descriere disponibila.',
                status: d.status || 'available',
                statusLabel: statusLabelMap[d.status] || 'Disponibil',
                available: d.available !== false,
                vaccinated: d.vaccinated ?? (d.health ? d.health.vaccinated : undefined),
                sterilized: d.sterilized ?? (d.health ? d.health.sterilized : undefined),
                microchipped: d.microchipped ?? (d.health ? d.health.microchipped : undefined),
                dewormed: d.dewormed ?? (d.health ? d.health.dewormed : undefined),
                temperament: d.temperament || d.traits || []
            };

            const sexLabel = animal.sex === 'F' ? 'Femela' : animal.sex === 'M' ? 'Mascul' : animal.sex || '-';
            const sizeLabel = sizeLabelMap[animal.size] || animal.size || '-';

            document.title = animal.name + ' - FluffyPaws';

            setText(els.breadcrumbName, animal.name);
            setText(els.animalName, animal.name);
            setText(els.animalNameInfo, animal.name);
            setText(els.detailName, animal.name);
            setText(els.detailDescription, animal.description);
            setText(els.detailBreed, animal.breed);
            setText(els.detailAge, animal.ageLabel);
            setText(els.detailSex, sexLabel);
            setText(els.detailSize, sizeLabel);
            currentAnimalId = animal.id;
            setText(els.detailCity, animal.cityLabel);
            setText(els.adoptHeading, 'Vrei sa-l adopti pe ' + animal.name + '?');
            if (els.adoptionLink) {
                els.adoptionLink.href = 'adoption-form.html?id=' + encodeURIComponent(animal.id);
            }

            if (els.speciesIcon) {
                els.speciesIcon.className = 'fas ' + (speciesIconMap[animal.species] || 'fa-paw');
            }
            if (els.sexIcon) {
                els.sexIcon.className = 'fas ' + (animal.sex === 'F' ? 'fa-venus' : 'fa-mars');
            }

            renderBadges(animal);

            renderMainImage(animal.name, animal.photo);

            const temperament = Array.isArray(animal.temperament)
                ? animal.temperament
                : typeof animal.temperament === 'string'
                    ? animal.temperament.split(',').map(s => s.trim()).filter(Boolean)
                    : [];
            renderTemperament(temperament);

            setText(els.healthVaccinated, toLabel(animal.vaccinated));
            setText(els.healthSterilized, toLabel(animal.sterilized));
            setText(els.healthMicrochipped, toLabel(animal.microchipped));
            setText(els.healthDewormed, toLabel(animal.dewormed));

            show(els.loading, false);
            show(els.content, true);

            if (currentUser) {
                await loadFavoriteState(currentUser.uid, animal.id);
            } else {
                isFavorite = false;
                updateFavoriteUI();
            }
        } catch (err) {
            console.error('Eroare la incarcarea detaliilor animalului:', err);
            setText(els.error, 'Nu s-au putut incarca detaliile. Incearca din nou.');
            show(els.loading, false);
            show(els.error, true);
        }
    }

    if (els.adoptionLink) {
        els.adoptionLink.addEventListener('click', (e) => {
            if (!currentUser) {
                e.preventDefault();
                requireLogin('Pentru a trimite o cerere, trebuie sa fii autentificat.');
                return;
            }
            if (currentUserRole === 'guest') {
                e.preventDefault();
                if (typeof window.showToast === 'function') {
                    window.showToast('Cont Guest. Pentru cereri, rolul trebuie schimbat de admin.', 'warning');
                } else {
                    alert('Cont Guest. Pentru cereri, rolul trebuie schimbat de admin.');
                }
            }
        });
    }

    if (els.favoriteButton) {
        els.favoriteButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentAnimalId) {
                toggleFavorite(currentAnimalId);
            }
        });
    }

    let currentAnimalId = null;

    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        currentUserRole = await resolveUserRole(user);
        if (!currentUser) {
            isFavorite = false;
            updateFavoriteUI();
        } else if (currentAnimalId) {
            loadFavoriteState(currentUser.uid, currentAnimalId);
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            loadAnimal().then(() => {
                if (currentAnimalId && currentUser) {
                    loadFavoriteState(currentUser.uid, currentAnimalId);
                }
            });
        });
    } else {
        loadAnimal().then(() => {
            if (currentAnimalId && currentUser) {
                loadFavoriteState(currentUser.uid, currentAnimalId);
            }
        });
    }
})();
