// ============================================================
//  FluffyPaws - admin.js
//  Dashboard Admin: utilizatori, animale, cereri
// ============================================================

let __adminReloadAnimals = null;
let __adminReloadUsers = null;
let currentAdminUid = null;

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const snap = await db.collection('users').doc(user.uid).get();
        if (!snap.exists || snap.data().role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }

        currentAdminUid = user.uid;
        loadStats();
        loadUsers();
        loadAnimals();
        initRequestsInbox();
        initMessagesInbox();
        initSidebarNav();
    });

    const searchInput = document.getElementById('adminSearchInput');
    const roleFilter = document.getElementById('adminRoleFilter');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyUserFilters();
        });
    }
    if (roleFilter) {
        roleFilter.addEventListener('change', () => {
            applyUserFilters();
        });
    }

    const animalsSearchInput = document.getElementById('adminAnimalsSearchInput');
    if (animalsSearchInput) {
        animalsSearchInput.addEventListener('input', () => {
            const q = animalsSearchInput.value.toLowerCase().trim();
            if (!q) { renderAnimals(allAnimals); return; }
            renderAnimals(allAnimals.filter(a => {
                return (a.name || '').toLowerCase().includes(q) || (a.breed || '').toLowerCase().includes(q);
            }));
        });
    }

    const addAnimalForm = document.getElementById('addAnimalForm');
    const submitAnimalBtn = document.getElementById('submitAnimalBtn');
    const addUserForm = document.getElementById('addUserForm');
    const submitUserBtn = document.getElementById('submitUserBtn');
    if (addAnimalForm) {
        addAnimalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAddAnimal();
        });
    }
    if (submitAnimalBtn) {
        submitAnimalBtn.addEventListener('click', async () => {
            await handleAddAnimal();
        });
    }
    if (addUserForm) {
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAddUser();
        });
    }
    if (submitUserBtn) {
        submitUserBtn.addEventListener('click', async () => {
            await handleAddUser();
        });
    }

    async function handleAddUser() {
        const firstName = getVal('adminFirstName');
        const lastName = getVal('adminLastName');
        const email = getVal('adminEmail');
        const role = getVal('adminRole') || 'user';
        const tempPassword = getVal('adminTempPassword');

        if (!firstName || !lastName || !email || !tempPassword) {
            alert('Completeaza toate campurile obligatorii.');
            return;
        }
        if (tempPassword.length < 6) {
            alert('Parola trebuie sa aiba cel putin 6 caractere.');
            return;
        }

        let secondaryApp = null;
        try {
            secondaryApp = firebase.app('Secondary');
        } catch (_) {
            secondaryApp = firebase.initializeApp(firebaseConfig, 'Secondary');
        }

        const secondaryAuth = firebase.auth(secondaryApp);
        const secondaryDb = firebase.firestore(secondaryApp);

        try {
            const credential = await secondaryAuth.createUserWithEmailAndPassword(email, tempPassword);
            const uid = credential.user.uid;

            const initialRole = role === 'admin' ? 'user' : role;
            await secondaryDb.collection('users').doc(uid).set({
                firstName,
                lastName,
                email,
                phone: '',
                city: '',
                role: initialRole,
                photoURL: '',
                bio: '',
                address: '',
                disabled: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await secondaryAuth.signOut();

            if (role === 'admin') {
                await db.collection('users').doc(uid).update({ role: 'admin' });
            }

            closeModal('addUserModal');
            if (addUserForm) addUserForm.reset();
            await loadUsers();
        } catch (e) {
            console.error('Eroare creare utilizator:', e);
            alert('Nu s-a putut crea utilizatorul. Verifica datele sau emailul existent.');
        }
    }

    async function handleAddAnimal() {
        const name = getVal('animalNameInput');
        const species = getVal('animalSpeciesInput');
        const breed = getVal('animalBreedInput');
        const ageCategory = getVal('animalAgeInput');
        const sex = getVal('animalSexInput');
        const size = getVal('animalSizeInput');
        const city = getVal('animalCityInput');
        const status = getVal('animalStatusInput');
        const description = getVal('animalDescriptionInput');
        const photo = getVal('animalPhotoInput');
        const vaccinated = getVal('animalVaccinatedInput') === 'true';
        const sterilized = getVal('animalSterilizedInput') === 'true';
        const microchipped = getVal('animalMicrochippedInput') === 'true';
        const dewormed = getVal('animalDewormedInput') === 'true';
        const temperamentRaw = getVal('animalTemperamentInput');
        const available = getVal('animalAvailableInput') === 'true';

        if (!name || !species || !breed || !ageCategory || !sex || !size || !city || !status || !photo) {
            alert('Completeaza toate campurile obligatorii.');
            return;
        }

        const temperament = temperamentRaw
            ? temperamentRaw.split(',').map(t => t.trim()).filter(Boolean)
            : [];

        const payload = {
            name,
            species,
            breed,
            ageCategory,
            sex,
            size,
            city,
            description: description || '',
            photo,
            status,
            available,
            vaccinated,
            sterilized,
            microchipped,
            dewormed,
            temperament,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('animals').add(payload);
            closeModal('addAnimalModal');
            if (addAnimalForm) addAnimalForm.reset();
            await loadAnimals();
        } catch (e) {
            console.error('Eroare la adaugare animal:', e);
            alert('Nu s-a putut adauga animalul.');
        }
    }

    function getVal(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    function setBar(id, value, total) {
        const el = document.getElementById(id);
        if (!el) return;
        const pct = total > 0 ? (value / total) * 100 : 0;
        el.style.width = `${pct}%`;
        el.setAttribute('data-value', value);
    }

    function mapRequestStatusKey(raw) {
        const value = (raw || 'new').toString().toLowerCase();
        if (['approved', 'confirmed', 'accepted'].includes(value)) return 'approved';
        if (['rejected', 'declined', 'respinsa'].includes(value)) return 'rejected';
        return 'pending';
    }

    // Stats
    async function loadStats() {
        try {
            const [usersSnap, animalsSnap, requestsSnap] = await Promise.all([
                db.collection('users').get(),
                db.collection('animals').get(),
                db.collection('adoptionRequests').get()
            ]);

            const users = usersSnap.docs.map(d => d.data());
            const animals = animalsSnap.docs.map(d => d.data());
            const requests = requestsSnap.docs.map(d => d.data());

            const total = users.length;
            const admins = users.filter(u => u.role === 'admin').length;
            const disabled = users.filter(u => u.disabled === true).length;
            const active = total - disabled;

            setEl('statTotal', total);
            setEl('statActive', active);
            setEl('statDisabled', disabled);
            setEl('statAdmins', admins);

            const roleCounts = { admin: 0, user: 0, guest: 0 };
            users.forEach(u => {
                const role = (u.role || 'user').toString().toLowerCase();
                if (role === 'admin') roleCounts.admin += 1;
                else if (role === 'guest') roleCounts.guest += 1;
                else roleCounts.user += 1;
            });
            const rolesTotal = roleCounts.admin + roleCounts.user + roleCounts.guest;
            setEl('chartUsersAdminsValue', roleCounts.admin);
            setEl('chartUsersUsersValue', roleCounts.user);
            setEl('chartUsersGuestsValue', roleCounts.guest);
            setBar('chartUsersAdminsBar', roleCounts.admin, rolesTotal);
            setBar('chartUsersUsersBar', roleCounts.user, rolesTotal);
            setBar('chartUsersGuestsBar', roleCounts.guest, rolesTotal);

            const requestCounts = { pending: 0, approved: 0, rejected: 0 };
            requests.forEach(r => {
                const key = mapRequestStatusKey(r.status);
                requestCounts[key] += 1;
            });
            const requestsTotal = requestCounts.pending + requestCounts.approved + requestCounts.rejected;
            setEl('chartRequestsPendingValue', requestCounts.pending);
            setEl('chartRequestsApprovedValue', requestCounts.approved);
            setEl('chartRequestsRejectedValue', requestCounts.rejected);
            setBar('chartRequestsPendingBar', requestCounts.pending, requestsTotal);
            setBar('chartRequestsApprovedBar', requestCounts.approved, requestsTotal);
            setBar('chartRequestsRejectedBar', requestCounts.rejected, requestsTotal);

            const animalCounts = { available: 0, urgent: 0, new: 0, adopted: 0 };
            animals.forEach(a => {
                const status = (a.status || 'available').toString().toLowerCase();
                const isAdopted = status === 'adopted' || a.available === false;
                if (isAdopted) {
                    animalCounts.adopted += 1;
                    return;
                }
                if (status === 'urgent') animalCounts.urgent += 1;
                else if (status === 'new') animalCounts.new += 1;
                else animalCounts.available += 1;
            });
            const animalsTotal = animalCounts.available + animalCounts.urgent + animalCounts.new + animalCounts.adopted;
            setEl('chartAnimalsAvailableValue', animalCounts.available);
            setEl('chartAnimalsUrgentValue', animalCounts.urgent);
            setEl('chartAnimalsNewValue', animalCounts.new);
            setEl('chartAnimalsAdoptedValue', animalCounts.adopted);
            setBar('chartAnimalsAvailableBar', animalCounts.available, animalsTotal);
            setBar('chartAnimalsUrgentBar', animalCounts.urgent, animalsTotal);
            setBar('chartAnimalsNewBar', animalCounts.new, animalsTotal);
            setBar('chartAnimalsAdoptedBar', animalCounts.adopted, animalsTotal);
        } catch (e) {
            console.error('Eroare statistici:', e);
        }
    }

    // Users
    let allUsers = [];

    function applyUserFilters() {
        const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const role = roleFilter ? roleFilter.value : '';

        let filtered = allUsers;
        if (q) {
            filtered = filtered.filter(u => {
                const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
                return name.includes(q) || (u.email || '').toLowerCase().includes(q);
            });
        }
        if (role) {
            filtered = filtered.filter(u => (u.role || 'user') === role);
        }
        renderUsers(filtered);
    }

    async function loadUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem;">
            <i class="fas fa-spinner fa-spin"></i> Se incarca utilizatorii...
        </td></tr>`;

        try {
            const snap = await db.collection('users').orderBy('createdAt', 'desc').get();
            allUsers = snap.docs.map((doc, i) => ({
                uid: doc.id,
                index: i + 1,
                ...doc.data()
            }));
            applyUserFilters();
        } catch (e) {
            console.error('Eroare incarcare utilizatori:', e);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#ff4757;padding:2rem;">
                Eroare la incarcarea utilizatorilor.
            </td></tr>`;
        }
    }

    function renderUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-gray);">
                Niciun utilizator gasit.
            </td></tr>`;
            return;
        }

        tbody.innerHTML = users.map((u, i) => {
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Utilizator';
            const city = u.city || '-';
            const email = u.email || '-';
            const role = u.role || 'user';
            const disabled = u.disabled === true;
            const avatar = u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b6b&color=fff&size=60`;
            const date = u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('ro-RO') : '-';

            const roleBadge = role === 'admin'
                ? `<span class="status-badge" style="background:rgba(168,85,247,0.15);color:var(--accent-purple);">Admin</span>`
                : role === 'guest'
                    ? `<span class="status-badge" style="background:rgba(99,110,114,0.15);color:var(--text-gray);">Guest</span>`
                    : `<span class="status-badge" style="background:rgba(0,78,137,0.15);color:var(--secondary);">User</span>`;

            const statusBadge = disabled
                ? `<span class="status-badge status-disabled">Dezactivat</span>`
                : `<span class="status-badge status-active">Activ</span>`;

            const actionBtns = role !== 'admin'
                ? `<button class="btn btn-icon ${disabled ? 'btn-success' : 'btn-outline-light'}" title="${disabled ? 'Activare' : 'Dezactivare'}" onclick="toggleUser('${u.uid}', ${disabled})">
                       <i class="fas fa-${disabled ? 'check' : 'ban'}"></i></button>
                   <button class="btn btn-icon btn-danger" title="Sterge" onclick="deleteUser('${u.uid}')"><i class="fas fa-trash"></i></button>`
                : `<span style="color:var(--text-light);font-size:0.8rem;">-</span>`;

            const canEditRole = u.uid !== currentAdminUid;
            const roleSelect = `
                <select class="form-control" style="width: 120px; padding: 6px 32px 6px 10px;" ${canEditRole ? '' : 'disabled'}
                        onchange="changeUserRole('${u.uid}', this.value)">
                    <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="user" ${role === 'user' ? 'selected' : ''}>User</option>
                    <option value="guest" ${role === 'guest' ? 'selected' : ''}>Guest</option>
                </select>
            `;
            const roleHint = canEditRole ? '' : `<small style="color:var(--text-light);">Tu</small>`;

            return `
            <tr>
                <td><small style="color:var(--text-light);">#${String(i + 1).padStart(3,'0')}</small></td>
                <td>
                    <div class="table-user">
                        <img src="${avatar}" alt="${name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b6b&color=fff&size=60'">
                        <div>
                            <strong>${name}</strong>
                            <br><small style="color:var(--text-light);">${city}</small>
                        </div>
                    </div>
                </td>
                <td>${email}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        ${roleBadge}
                        ${roleSelect}
                        ${roleHint}
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td><small>${date}</small></td>
                <td><div class="table-actions">${actionBtns}</div></td>
            </tr>`;
        }).join('');
    }

    // Animals
    let allAnimals = [];

    async function loadAnimals() {
        const tbody = document.getElementById('animalsTableBody');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem;">
            <i class="fas fa-spinner fa-spin"></i> Se incarca animalele...
        </td></tr>`;

        try {
            let snap;
            try {
                snap = await db.collection('animals').orderBy('createdAt', 'desc').get();
            } catch (e) {
                snap = await db.collection('animals').get();
            }
            allAnimals = snap.docs.map((doc, i) => ({
                id: doc.id,
                index: i + 1,
                ...doc.data()
            }));
            renderAnimals(allAnimals);
        } catch (e) {
            console.error('Eroare incarcare animale:', e);
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#ff4757;padding:2rem;">
                Eroare la incarcarea animalelor.
            </td></tr>`;
        }
    }

    function renderAnimals(animals) {
        const tbody = document.getElementById('animalsTableBody');
        if (!tbody) return;

        if (animals.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--text-gray);">
                Niciun animal gasit.
            </td></tr>`;
            return;
        }

        tbody.innerHTML = animals.map((a, i) => {
            const name = a.name || 'Animal';
            const species = a.species || '-';
            const age = a.ageCategory || '-';
            const sex = a.sex || '-';
            const city = a.city || '-';
            const status = a.status || 'available';
            const available = a.available !== false;

            const statusBadge = status === 'urgent'
                ? `<span class="status-badge" style="background:rgba(255,71,87,0.15);color:var(--danger);">Urgent</span>`
                : status === 'new'
                    ? `<span class="status-badge" style="background:rgba(0,78,137,0.15);color:var(--secondary);">Nou</span>`
                    : status === 'adopted'
                        ? `<span class="status-badge" style="background:rgba(46,213,115,0.15);color:var(--accent-green-dark);">Adoptat</span>`
                        : `<span class="status-badge" style="background:rgba(46,213,115,0.15);color:var(--accent-green);">Disponibil</span>`;

            const availabilityBadge = available
                ? `<span class="status-badge status-active">Da</span>`
                : `<span class="status-badge status-disabled">Nu</span>`;

            return `
            <tr>
                <td><small style="color:var(--text-light);">#${String(i + 1).padStart(3,'0')}</small></td>
                <td><strong>${name}</strong></td>
                <td>${species}</td>
                <td>${age}</td>
                <td>${sex}</td>
                <td>${city}</td>
                <td>${statusBadge}</td>
                <td>${availabilityBadge}</td>
                <td>
                    <div class="admin-table-actions">
                        <button class="btn btn-icon btn-danger" title="Sterge" onclick="deleteAnimal('${a.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // Cereri adoptie (inbox real)
    let allRequests = [];
    let activeRequestId = null;
    let requestsListEl = null;
    let requestsPreviewEl = null;

    function initRequestsInbox() {
        requestsListEl = document.getElementById('requestsList');
        requestsPreviewEl = document.getElementById('requestsPreview');
        if (!requestsListEl || !requestsPreviewEl) return;

        requestsListEl.addEventListener('click', (e) => {
            const item = e.target.closest('.inbox-item');
            if (!item) return;
            const id = item.getAttribute('data-id');
            if (!id) return;
            setActiveRequest(id);
        });

        requestsPreviewEl.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn || !activeRequestId) return;
            const action = btn.getAttribute('data-action');
            if (!action) return;
            if (action === 'approve') {
                await updateRequestStatus(activeRequestId, 'approved');
            } else if (action === 'reject') {
                await updateRequestStatus(activeRequestId, 'rejected');
            }
        });

        loadRequests();
    }

    // Mesaje contact (inbox)
    let allMessages = [];
    let activeMessageId = null;
    let messagesListEl = null;
    let messagesPreviewEl = null;

    function initMessagesInbox() {
        messagesListEl = document.getElementById('messagesList');
        messagesPreviewEl = document.getElementById('messagesPreview');
        if (!messagesListEl || !messagesPreviewEl) return;

        messagesListEl.addEventListener('click', (e) => {
            const item = e.target.closest('.inbox-item');
            if (!item) return;
            const id = item.getAttribute('data-id');
            if (!id) return;
            setActiveMessage(id);
        });

        loadMessages();
    }

    async function loadMessages() {
        if (!messagesListEl || !messagesPreviewEl) return;

        messagesListEl.innerHTML = `<div class="inbox-empty"><i class="fas fa-spinner fa-spin"></i> Se incarca mesajele...</div>`;
        messagesPreviewEl.innerHTML = `<div class="inbox-empty">Selecteaza un mesaj pentru a vedea detaliile.</div>`;

        try {
            let snap;
            try {
                snap = await db.collection('messages').orderBy('createdAt', 'desc').get();
            } catch (err) {
                snap = await db.collection('messages').get();
            }

            allMessages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            allMessages.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

            if (allMessages.length === 0) {
                messagesListEl.innerHTML = `<div class="inbox-empty">Nu exista mesaje momentan.</div>`;
                return;
            }

            renderMessagesList();
            setActiveMessage(allMessages[0].id);
        } catch (err) {
            console.error('Eroare incarcare mesaje:', err);
            messagesListEl.innerHTML = `<div class="inbox-empty">Eroare la incarcarea mesajelor.</div>`;
        }
    }

    function renderMessagesList() {
        if (!messagesListEl) return;
        messagesListEl.innerHTML = allMessages.map(msg => {
            const subject = msg.subject || 'Mesaj de contact';
            const name = msg.name || 'Anonim';
            const email = msg.email || msg.userEmail || 'Email necunoscut';
            const dateLabel = formatDate(msg.createdAt);
            const meta = dateLabel ? `${name} · ${email} · ${dateLabel}` : `${name} · ${email}`;
            const snippet = buildSnippet(msg.message || '');

            return `
                <div class="inbox-item${msg.id === activeMessageId ? ' active' : ''}" data-id="${msg.id}">
                    <div class="subject">${escapeHtml(subject)}</div>
                    <div class="meta">${escapeHtml(meta)}</div>
                    ${snippet ? `<div class="meta" style="margin-top:6px;">${escapeHtml(snippet)}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    function setActiveMessage(id) {
        activeMessageId = id;
        if (messagesListEl) {
            messagesListEl.querySelectorAll('.inbox-item').forEach(item => {
                item.classList.toggle('active', item.getAttribute('data-id') === id);
            });
        }

        const msg = allMessages.find(m => m.id === id);
        if (msg) renderMessagePreview(msg);
    }

    function renderMessagePreview(msg) {
        if (!messagesPreviewEl) return;
        const subject = msg.subject || 'Mesaj de contact';
        const name = msg.name || 'Anonim';
        const email = msg.email || msg.userEmail || 'Email necunoscut';
        const dateLabel = formatDate(msg.createdAt);

        messagesPreviewEl.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap;">
                <div>
                    <h3 style="margin-bottom:6px;">${escapeHtml(subject)}</h3>
                    <div style="color:var(--text-gray); font-size:0.9rem;">
                        ${escapeHtml(name)} · ${escapeHtml(email)}${dateLabel ? ` · ${escapeHtml(dateLabel)}` : ''}
                    </div>
                </div>
                <span class="status-badge status-pending">Nou</span>
            </div>
            <div class="divider" style="height:1px; background:rgba(0,0,0,0.08); margin:16px 0;"></div>
            <p style="color:var(--text-gray); line-height:1.7;">${escapeHtml(msg.message || '-')}</p>
        `;
    }

    async function loadRequests() {
        if (!requestsListEl || !requestsPreviewEl) return;

        requestsListEl.innerHTML = `<div class="inbox-empty"><i class="fas fa-spinner fa-spin"></i> Se incarca cererile...</div>`;
        requestsPreviewEl.innerHTML = `<div class="inbox-empty">Selecteaza o cerere pentru a vedea detaliile.</div>`;

        try {
            let snap;
            try {
                snap = await db.collection('adoptionRequests').orderBy('createdAt', 'desc').get();
            } catch (err) {
                snap = await db.collection('adoptionRequests').get();
            }

            allRequests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            allRequests.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

            if (allRequests.length === 0) {
                requestsListEl.innerHTML = `<div class="inbox-empty">Nu exista cereri momentan.</div>`;
                return;
            }

            renderRequestsList();
            setActiveRequest(allRequests[0].id);
        } catch (err) {
            console.error('Eroare incarcare cereri:', err);
            requestsListEl.innerHTML = `<div class="inbox-empty">Eroare la incarcarea cererilor.</div>`;
        }
    }

    function renderRequestsList() {
        if (!requestsListEl) return;
        requestsListEl.innerHTML = allRequests.map(req => {
            const subject = buildRequestSubject(req);
            const meta = buildRequestMeta(req);
            const snippet = buildSnippet(req.motivation || req.experience || '');
            const status = normalizeRequestStatus(req.status);

            return `
                <div class="inbox-item${req.id === activeRequestId ? ' active' : ''}" data-id="${req.id}">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                        <div class="subject">${escapeHtml(subject)}</div>
                        <span class="status-badge ${status.className}">${status.label}</span>
                    </div>
                    <div class="meta">${escapeHtml(meta)}</div>
                    ${snippet ? `<div class="meta" style="margin-top:6px;">${escapeHtml(snippet)}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    function setActiveRequest(id) {
        activeRequestId = id;
        if (requestsListEl) {
            requestsListEl.querySelectorAll('.inbox-item').forEach(item => {
                item.classList.toggle('active', item.getAttribute('data-id') === id);
            });
        }

        const req = allRequests.find(r => r.id === id);
        if (req) renderRequestPreview(req);
    }

    function renderRequestPreview(req) {
        if (!requestsPreviewEl) return;
        const status = normalizeRequestStatus(req.status);
        const typeLabel = mapRequestType(req.requestType);
        const animalTitle = [req.animalName, req.animalBreed].filter(Boolean).join(' - ') || 'Animal';
        const dateLabel = formatDate(req.createdAt);
        const sexLabel = req.animalSex ? (req.animalSex === 'F' ? 'Femela' : 'Mascul') : '';
        const ageLabel = req.animalAgeCategory || '';
        const metaLine = [typeLabel, ageLabel, sexLabel, req.animalCity].filter(Boolean).join(' • ');

        const contactLine = [req.userEmail, req.userId].filter(Boolean).join(' • ');
        const photo = req.animalPhoto || '';

        requestsPreviewEl.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap;">
                <div>
                    <h3 style="margin-bottom:6px;">${escapeHtml(animalTitle)}</h3>
                    <div style="color:var(--text-gray); font-size:0.9rem;">
                        ${dateLabel ? `Trimisa la ${escapeHtml(dateLabel)}` : 'Cerere'}
                        ${contactLine ? ` · ${escapeHtml(contactLine)}` : ''}
                    </div>
                    ${metaLine ? `<div style="color:var(--text-gray); font-size:0.9rem; margin-top:4px;">${escapeHtml(metaLine)}</div>` : ''}
                </div>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <span class="status-badge ${status.className}">${status.label}</span>
                    <button class="btn btn-success btn-sm" data-action="approve">
                        <i class="fas fa-check"></i> Aproba
                    </button>
                    <button class="btn btn-danger btn-sm" data-action="reject">
                        <i class="fas fa-times"></i> Respinge
                    </button>
                </div>
            </div>
            <div class="divider" style="height:1px; background:rgba(0,0,0,0.08); margin:16px 0;"></div>
            <div style="display:grid; grid-template-columns: 140px 1fr; gap:10px 16px; font-size:0.95rem;">
                <div style="color:var(--text-gray);">Tip cerere</div>
                <div>${escapeHtml(typeLabel || '-')}</div>
                <div style="color:var(--text-gray);">Motivatie</div>
                <div>${escapeHtml(req.motivation || '-')}</div>
                <div style="color:var(--text-gray);">Experienta</div>
                <div>${escapeHtml(req.experience || '-')}</div>
                <div style="color:var(--text-gray);">Detalii experienta</div>
                <div>${escapeHtml(req.experienceDetails || '-')}</div>
                <div style="color:var(--text-gray);">Locuinta</div>
                <div>${escapeHtml(req.livingType || '-')}</div>
                <div style="color:var(--text-gray);">Membri familie</div>
                <div>${escapeHtml(req.familyMembers || '-')}</div>
                <div style="color:var(--text-gray);">Copii</div>
                <div>${escapeHtml(req.hasChildren || '-')}</div>
                <div style="color:var(--text-gray);">Alte animale</div>
                <div>${escapeHtml(req.hasOtherPets || '-')}</div>
            </div>
            ${photo ? `
                <div style="margin-top: 16px; display:flex; align-items:center; gap:12px;">
                    <img src="${escapeHtml(photo)}" alt="${escapeHtml(req.animalName || 'Animal')}"
                         style="width:80px; height:80px; object-fit:cover; border-radius:12px;">
                    <div style="color:var(--text-gray); font-size:0.9rem;">Poza animalului</div>
                </div>
            ` : ''}
        `;
    }

    async function updateRequestStatus(id, status) {
        const request = allRequests.find(r => r.id === id);
        try {
            await db.collection('adoptionRequests').doc(id).update({
                status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (status === 'approved' && request && request.animalId) {
                const animalRef = db.collection('animals').doc(request.animalId);
                await animalRef.update({
                    available: false,
                    status: 'adopted',
                    adoptedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    adoptedRequestId: id
                });

                const otherSnap = await db.collection('adoptionRequests')
                    .where('animalId', '==', request.animalId)
                    .get();

                const batch = db.batch();
                let hasBatchUpdates = false;
                otherSnap.docs.forEach(doc => {
                    if (doc.id === id) return;
                    batch.update(doc.ref, {
                        status: 'rejected',
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    hasBatchUpdates = true;
                });
                if (hasBatchUpdates) {
                    await batch.commit();
                }
            }

            allRequests = allRequests.map(r => {
                if (r.id === id) return { ...r, status };
                if (status === 'approved' && request && request.animalId && r.animalId === request.animalId && r.id !== id) {
                    return { ...r, status: 'rejected' };
                }
                return r;
            });

            renderRequestsList();
            const refreshed = allRequests.find(r => r.id === id);
            if (refreshed) renderRequestPreview(refreshed);

            if (status === 'approved' && typeof __adminReloadAnimals === 'function') {
                await __adminReloadAnimals();
            }
        } catch (err) {
            console.error('Eroare actualizare status:', err);
            alert('Nu s-a putut actualiza statusul cererii.');
        }
    }

    function normalizeRequestStatus(raw) {
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

    function buildRequestSubject(req) {
        const type = mapRequestType(req.requestType);
        const name = req.animalName || 'animal';
        if (type) return `Cerere ${type.toLowerCase()} - ${name}`;
        return `Cerere - ${name}`;
    }

    function buildRequestMeta(req) {
        const email = req.userEmail || 'Utilizator necunoscut';
        const dateLabel = formatDate(req.createdAt);
        return dateLabel ? `${email} · ${dateLabel}` : email;
    }

    function buildSnippet(text) {
        const cleaned = (text || '').toString().trim();
        if (!cleaned) return '';
        if (cleaned.length <= 70) return cleaned;
        return cleaned.slice(0, 70) + '...';
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

    function escapeHtml(value) {
        return (value || '')
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function setEl(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    __adminReloadAnimals = loadAnimals;
    __adminReloadUsers = loadUsers;

    function initSidebarNav() {
        const navLinks = Array.from(document.querySelectorAll('.admin-nav a[data-section]'));
        if (!navLinks.length) return;

        const sections = {
            users: document.getElementById('adminSectionUsers'),
            animals: document.getElementById('adminSectionAnimals'),
            requests: document.getElementById('adminSectionRequests'),
            messages: document.getElementById('adminSectionMessages'),
            stats: document.getElementById('adminSectionStats')
        };

        function setActiveSection(sectionKey) {
            Object.keys(sections).forEach(key => {
                const el = sections[key];
                if (el) el.style.display = key === sectionKey ? 'block' : 'none';
            });
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('data-section') === sectionKey);
            });
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-section');
                if (target) {
                    setActiveSection(target);
                    window.location.hash = target;
                }
            });
        });

        const hash = window.location.hash.replace('#', '');
        const initial = sections[hash] ? hash : 'users';
        setActiveSection(initial);
    }
});

// User actions
async function toggleUser(uid, currentlyDisabled) {
    await db.collection('users').doc(uid).update({ disabled: !currentlyDisabled });
    location.reload();
}

async function deleteUser(uid) {
    await db.collection('users').doc(uid).delete();
    location.reload();
}

async function deleteAnimal(id) {
    await db.collection('animals').doc(id).delete();
    if (typeof __adminReloadAnimals === 'function') {
        await __adminReloadAnimals();
    } else {
        location.reload();
    }
}

async function changeUserRole(uid, role) {
    try {
        await db.collection('users').doc(uid).update({ role });
        if (typeof __adminReloadUsers === 'function') {
            await __adminReloadUsers();
        } else {
            location.reload();
        }
    } catch (err) {
        console.error('Eroare schimbare rol:', err);
        alert('Nu s-a putut schimba rolul utilizatorului.');
    }
}

function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'flex';
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
}
