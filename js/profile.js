// ============================================================
//  FluffyPaws - profile.js
//  Fetch date utilizator din Firestore + Salvare modificari + Favorite
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // Elemente UI
    const sidebarAvatar  = document.getElementById('sidebarAvatar');
    const sidebarName    = document.getElementById('sidebarName');
    const sidebarEmail   = document.getElementById('sidebarEmail');
    const sidebarRole    = document.getElementById('sidebarRole');

    const inputFirstName = document.getElementById('profFirstName');
    const inputLastName  = document.getElementById('profLastName');
    const inputEmail     = document.getElementById('profEmail');
    const inputPhone     = document.getElementById('profPhone');
    const inputCity      = document.getElementById('profCity');
    const inputAddress   = document.getElementById('profAddress');
    const inputBio       = document.getElementById('profBio');
    const inputPhotoURL  = document.getElementById('profPhotoURL');

    const profileForm    = document.getElementById('profileForm');
    const saveStatus     = document.getElementById('saveStatus');
    const favoritesList  = document.getElementById('favoritesList');
    const favoritesEmpty = document.getElementById('favoritesEmpty');
    const requestsList   = document.getElementById('requestsList');
    const requestsEmpty  = document.getElementById('requestsEmpty');

    const profileSection = document.getElementById('profileSection');
    const favoritesSection = document.getElementById('favoritesSection');
    const requestsSection = document.getElementById('requestsSection');
    const profileNavLinks = document.querySelectorAll('.profile-nav a[data-section]');
    const dropdownFavoritesLink = document.getElementById('navFavoritesLink');

    function setActiveSection(section) {
        if (profileSection) profileSection.style.display = section === 'profile' ? 'block' : 'none';
        if (favoritesSection) favoritesSection.style.display = section === 'favorites' ? 'block' : 'none';
        if (requestsSection) requestsSection.style.display = section === 'requests' ? 'block' : 'none';

        profileNavLinks.forEach(link => {
            const target = link.getAttribute('data-section');
            link.classList.toggle('active', target === section);
        });
    }

    if (profileNavLinks.length > 0) {
        profileNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                if (section) setActiveSection(section);
            });
        });
    }

    if (dropdownFavoritesLink) {
        dropdownFavoritesLink.addEventListener('click', (e) => {
            const onProfile = window.location.pathname.endsWith('profile.html');
            if (onProfile) {
                e.preventDefault();
                setActiveSection('favorites');
                window.location.hash = '#favoritesSection';
                return;
            }
            dropdownFavoritesLink.setAttribute('href', 'profile.html#favoritesSection');
        });
    }

    // Fetch date la incarcarea paginii
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            let snap = await db.collection('users').doc(user.uid).get();

            if (!snap.exists) {
                await db.collection('users').doc(user.uid).set({
                    firstName: '',
                    lastName: '',
                    email: user.email,
                    phone: '',
                    city: '',
                    role: 'user',
                    photoURL: '',
                    bio: '',
                    address: '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                snap = await db.collection('users').doc(user.uid).get();
            }

            const d = snap.data();
            const fullName = `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Utilizator';

            if (sidebarName)  sidebarName.textContent  = fullName;
            if (sidebarEmail) sidebarEmail.textContent = d.email || user.email;
            if (sidebarRole) {
                sidebarRole.textContent = d.role === 'admin'
                    ? 'Administrator'
                    : d.role === 'guest'
                        ? 'Guest'
                        : 'Utilizator';
            }
            if (sidebarAvatar) {
                sidebarAvatar.src = d.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ff6b6b&color=fff&size=200`;
            }

            if (inputFirstName) inputFirstName.value = d.firstName || '';
            if (inputLastName)  inputLastName.value  = d.lastName  || '';
            if (inputEmail)   { inputEmail.value = d.email || user.email; inputEmail.readOnly = true; }
            if (inputPhone)     inputPhone.value     = d.phone    || '';
            if (inputCity)      inputCity.value      = d.city     || '';
            if (inputAddress)   inputAddress.value   = d.address  || '';
            if (inputBio)       inputBio.value       = d.bio      || '';
            if (inputPhotoURL)  inputPhotoURL.value  = d.photoURL || '';

            await loadFavorites(user.uid);
            await loadRequests(user);

        } catch (err) {
            console.error('Eroare la incarcare profil:', err);
        }
    });

    async function loadFavorites(uid) {
        if (!favoritesList || !favoritesEmpty) return;

        favoritesList.innerHTML = '';
        favoritesEmpty.style.display = 'none';

        try {
            const favSnap = await db.collection('users').doc(uid).collection('favorites').orderBy('createdAt', 'desc').get();
            if (favSnap.empty) {
                favoritesEmpty.style.display = 'block';
                return;
            }

            const animalDocs = await Promise.all(
                favSnap.docs.map(doc => db.collection('animals').doc(doc.id).get())
            );

            const animals = animalDocs
                .filter(doc => doc.exists)
                .map(doc => ({ id: doc.id, ...doc.data() }));

            if (animals.length === 0) {
                favoritesEmpty.style.display = 'block';
                return;
            }

            favoritesList.innerHTML = animals.map(a => {
                const name = a.name || 'Animal';
                const breed = a.breed || 'Rasa necunoscuta';
                const photo = a.photo || 'https://placedog.net/400/300';
                return `
                <div class="card animal-card">
                    <div class="card-img-wrapper">
                        <img src="${photo}" alt="${name}" class="card-img">
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">${name}</h3>
                        <p class="card-text">${breed}</p>
                    </div>
                    <div class="card-footer">
                        <a href="animal-details.html?id=${encodeURIComponent(a.id)}" class="btn btn-primary btn-sm">
                            <i class="fas fa-eye"></i> Detalii
                        </a>
                    </div>
                </div>`;
            }).join('');
        } catch (err) {
            console.error('Eroare la incarcare favorite:', err);
            favoritesEmpty.style.display = 'block';
        }
    }

    function normalizeStatus(raw) {
        const value = (raw || 'new').toString().toLowerCase();
        if (['approved', 'confirmed', 'accepted'].includes(value)) {
            return { label: 'Confirmata', className: 'status-approved' };
        }
        if (['rejected', 'declined', 'respinsa'].includes(value)) {
            return { label: 'Respinsa', className: 'status-rejected' };
        }
        return { label: 'In asteptare', className: 'status-pending' };
    }

    function mapRequestType(raw) {
        const value = (raw || '').toString().toLowerCase();
        if (value === 'foster') return 'Foster';
        if (value === 'adoption') return 'Adoptie';
        return raw ? raw.toString() : '';
    }

    function getTimestampMs(ts) {
        if (!ts) return 0;
        if (typeof ts.toDate === 'function') return ts.toDate().getTime();
        if (typeof ts.seconds === 'number') return ts.seconds * 1000;
        if (ts instanceof Date) return ts.getTime();
        return 0;
    }

    function formatDate(ts) {
        const ms = getTimestampMs(ts);
        if (!ms) return '';
        return new Date(ms).toLocaleDateString('ro-RO');
    }

    async function loadRequests(user) {
        if (!requestsList || !requestsEmpty) return;

        requestsList.innerHTML = '';
        requestsEmpty.style.display = 'none';

        try {
            const uid = user ? user.uid : null;
            const email = user ? user.email : null;

            const requestsMap = new Map();
            if (uid) {
                const reqSnap = await db.collection('adoptionRequests').where('userId', '==', uid).get();
                reqSnap.docs.forEach(doc => requestsMap.set(doc.id, { id: doc.id, ...doc.data() }));
            }
            if (email) {
                const emailSnap = await db.collection('adoptionRequests').where('userEmail', '==', email).get();
                emailSnap.docs.forEach(doc => requestsMap.set(doc.id, { id: doc.id, ...doc.data() }));
            }

            const requests = Array.from(requestsMap.values());
            if (requests.length === 0) {
                requestsEmpty.style.display = 'block';
                return;
            }

            requests.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

            requestsList.innerHTML = requests.map(req => {
                const name = req.animalName || 'Animal';
                const breed = req.animalBreed || 'Rasa necunoscuta';
                const photo = req.animalPhoto || 'https://placedog.net/400/300';
                const typeLabel = mapRequestType(req.requestType);
                const status = normalizeStatus(req.status);
                const dateLabel = formatDate(req.createdAt);
                const meta = [breed, typeLabel].filter(Boolean).join(' • ');
                const dateLine = dateLabel
                    ? `<p class="card-text" style="color: var(--text-gray); font-size: 0.9rem;">Trimisa la ${dateLabel}</p>`
                    : '';
                const detailsLink = req.animalId
                    ? `<a href="animal-details.html?id=${encodeURIComponent(req.animalId)}" class="btn btn-primary btn-sm">
                            <i class="fas fa-eye"></i> Vezi animalul
                       </a>`
                    : '';

                return `
                <div class="card animal-card">
                    <div class="card-img-wrapper">
                        <img src="${photo}" alt="${name}" class="card-img">
                    </div>
                    <div class="card-body">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-sm);">
                            <h3 class="card-title" style="margin: 0;">${name}</h3>
                            <span class="status-badge ${status.className}">${status.label}</span>
                        </div>
                        <p class="card-text">${meta || 'Cerere trimisa'}</p>
                        ${dateLine}
                    </div>
                    <div class="card-footer">
                        ${detailsLink}
                    </div>
                </div>`;
            }).join('');
        } catch (err) {
            console.error('Eroare la incarcare cereri:', err);
            requestsEmpty.style.display = 'block';
        }
    }

    if (inputPhotoURL) {
        inputPhotoURL.addEventListener('input', () => {
            const url = inputPhotoURL.value.trim();
            if (sidebarAvatar && url) {
                sidebarAvatar.src = url;
            }
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const user = auth.currentUser;
            if (!user) return;

            const btn = profileForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Se salveaza...';

            const photoURL  = inputPhotoURL ? inputPhotoURL.value.trim() : '';
            const firstName = inputFirstName ? inputFirstName.value.trim() : '';
            const lastName  = inputLastName  ? inputLastName.value.trim()  : '';

            try {
                await db.collection('users').doc(user.uid).update({
                    firstName,
                    lastName,
                    phone:   inputPhone   ? inputPhone.value.trim()   : '',
                    city:    inputCity    ? inputCity.value            : '',
                    address: inputAddress ? inputAddress.value.trim() : '',
                    bio:     inputBio     ? inputBio.value.trim()      : '',
                    photoURL,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                const fullName = `${firstName} ${lastName}`.trim();
                if (sidebarName)  sidebarName.textContent = fullName || 'Utilizator';
                if (sidebarAvatar && photoURL) sidebarAvatar.src = photoURL;
                else if (sidebarAvatar) {
                    sidebarAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ff6b6b&color=fff&size=200`;
                }

                const cachedAvatar = photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ff6b6b&color=fff&size=100`;
                localStorage.setItem('userDisplayName', fullName || 'Utilizator');
                localStorage.setItem('userPhotoURL', cachedAvatar);

                showSaveStatus('Profilul a fost salvat cu succes!', 'success');

            } catch (err) {
                console.error('Eroare salvare profil:', err);
                showSaveStatus('Eroare la salvare: ' + err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }

    function showSaveStatus(msg, type) {
        if (!saveStatus) return;
        saveStatus.textContent = msg;
        saveStatus.style.color  = type === 'success' ? '#2ed573' : '#ff4757';
        saveStatus.style.display = 'block';
        setTimeout(() => { saveStatus.style.display = 'none'; }, 4000);
    }

    const hash = window.location.hash;
    if (hash === '#favoritesSection') {
        setActiveSection('favorites');
    } else if (hash === '#requestsSection') {
        setActiveSection('requests');
    } else {
        setActiveSection('profile');
    }
});
