// ============================================================
//  FluffyPaws — auth.js
//  Gestionare completă: Register, Login, Logout, Auth State
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Preincarca datele din cache pentru a evita "flash"-ul in navbar
    const cachedName = localStorage.getItem('userDisplayName');
    const cachedEmail = localStorage.getItem('userEmail');
    const cachedPhoto = localStorage.getItem('userPhotoURL');
    const navNameCached = document.getElementById('navUserName');
    const navEmailCached = document.getElementById('navUserEmail');
    const navAvatarCached = document.getElementById('navUserAvatar');
    if (cachedName && navNameCached) navNameCached.textContent = cachedName;
    if (cachedEmail && navEmailCached) navEmailCached.textContent = cachedEmail;
    if (cachedPhoto && navAvatarCached) navAvatarCached.src = cachedPhoto;

    // ── ÎNREGISTRARE ──────────────────────────────────────────
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = btn.innerHTML;

            const firstName = document.getElementById('firstName').value.trim();
            const lastName  = document.getElementById('lastName').value.trim();
            const email     = document.getElementById('regEmail').value.trim();
            const phone     = document.getElementById('phone').value.trim();
            const city      = document.getElementById('city').value;
            const password  = document.getElementById('regPassword').value;
            const confirm   = document.getElementById('confirmPassword').value;

            if (password !== confirm) {
                showError(registerForm, 'Parolele nu coincid!');
                return;
            }
            if (password.length < 6) {
                showError(registerForm, 'Parola trebuie să aibă cel puțin 6 caractere!');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Se creează contul...';

            try {
                // 1. Creare cont în Firebase Authentication
                const credential = await auth.createUserWithEmailAndPassword(email, password);
                const uid = credential.user.uid;

                // 2. Salvare date extra în Firestore
                await db.collection('users').doc(uid).set({
                    firstName,
                    lastName,
                    email,
                    phone,
                    city,
                    role: 'user',
                    photoURL: '',
                    bio: '',
                    address: '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // 3. Redirecționare la profil
                const redirect = localStorage.getItem('redirectAfterLogin');
                if (redirect) {
                    localStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirect;
                } else {
                    window.location.href = 'profile.html';
                }

            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = originalBtnText;

                const msgs = {
                    'auth/email-already-in-use': 'Acest email este deja înregistrat.',
                    'auth/invalid-email':        'Adresa de email nu este validă.',
                    'auth/weak-password':        'Parola este prea slabă (min. 6 caractere).',
                    'auth/network-request-failed': 'Problemă de rețea. Verifică conexiunea.'
                };
                showError(registerForm, msgs[err.code] || err.message);
            }
        });
    }

    // ── LOGIN ──────────────────────────────────────────────────
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('disabled') === '1') {
            showError(loginForm, 'Contul tau a fost dezactivat. Contacteaza administratorul.');
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = btn.innerHTML;

            const email    = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Se autentifică...';

            try {
                await auth.signInWithEmailAndPassword(email, password);
                const redirect = localStorage.getItem('redirectAfterLogin');
                if (redirect) {
                    localStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirect;
                } else {
                    let userRole = 'user';
                    try {
                        const currentUser = auth.currentUser;
                        if (currentUser) {
                            const doc = await db.collection('users').doc(currentUser.uid).get();
                            if (doc.exists) {
                                userRole = (doc.data().role || 'user');
                            }
                        }
                    } catch (roleErr) {
                        console.warn('Eroare la preluarea rolului:', roleErr);
                    }
                    window.location.href = userRole === 'admin' ? 'admin-users.html' : 'index.html';
                }
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = originalBtnText;

                const msgs = {
                    'auth/user-not-found':   'Nu există un cont cu acest email.',
                    'auth/wrong-password':   'Parola este incorectă.',
                    'auth/invalid-email':    'Adresa de email nu este validă.',
                    'auth/too-many-requests':'Prea multe încercări. Încearcă mai târziu.',
                    'auth/network-request-failed': 'Problemă de rețea. Verifică conexiunea.'
                };
                showError(loginForm, msgs[err.code] || 'Autentificare eșuată. Verifică datele.');
            }
        });
    }

    // ── LOGOUT ─────────────────────────────────────────────────
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await auth.signOut();
            window.location.href = 'index.html';
        });
    }

    // ── AUTH STATE — actualizare UI navbar ────────────────────
    auth.onAuthStateChanged(async (user) => {
        const guestActions = document.getElementById('guestActions');
        const userActions  = document.getElementById('userActions');

        if (user) {
            document.documentElement.classList.add('is-logged-in');
            localStorage.setItem('isLoggedIn', 'true');

            // Actualizăm navbar-ul cu datele reale din Firestore
            let userRole = 'user';
            try {
                const doc = await db.collection('users').doc(user.uid).get();
                if (doc.exists) {
                    const data = doc.data();
                    if (data.disabled === true) {
                        await auth.signOut();
                        localStorage.removeItem('isLoggedIn');
                        localStorage.removeItem('userRole');
                        window.location.href = 'login.html?disabled=1';
                        return;
                    }
                    userRole = data.role || 'user';
                    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Utilizator';
                    const avatarUrl = data.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ff6b6b&color=fff&size=100`;

                    // Actualizare dropdown navbar
                    const navName  = document.getElementById('navUserName');
                    const navEmail = document.getElementById('navUserEmail');
                    const navAvatar = document.getElementById('navUserAvatar');
                    if (navName)  navName.textContent  = fullName;
                    if (navEmail) navEmail.textContent = data.email || user.email;
                    if (navAvatar) navAvatar.src = avatarUrl;

                    localStorage.setItem('userDisplayName', fullName);
                    localStorage.setItem('userEmail', data.email || user.email || '');
                    localStorage.setItem('userPhotoURL', avatarUrl);
                }
            } catch (_) { /* Ignorăm erorile de navbar pe pagini fără Firestore */ }

            if (guestActions) guestActions.style.display = 'none';
            if (userActions)  userActions.style.display  = 'flex';
            localStorage.setItem('userRole', userRole);

            const path = window.location.pathname;
            const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
            if (redirectAfterLogin) {
                localStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectAfterLogin;
                return;
            }

            // 1. Dacă e Admin, îi interzicem paginile normale (index, etc.)
            if (userRole === 'admin') {
                if (!path.includes('admin-') && !path.includes('login.html') && !path.includes('register.html')) {
                    window.location.href = 'admin-users.html';
                }
            }

            // Trimite la dashboard/index dacă e pe login/register
            if (path.includes('login.html') || path.includes('register.html')) {
                if (userRole === 'admin') {
                    window.location.href = 'admin-users.html';
                } else {
                    window.location.href = 'index.html';
                }
            }
        } else {
            document.documentElement.classList.remove('is-logged-in');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userDisplayName');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userPhotoURL');
            if (guestActions) guestActions.style.display = 'flex';
            if (userActions)  userActions.style.display  = 'none';
        }
    });

    // ── LOGOUT PENTRU ADMIN (Adăugare) ─────────────────────────
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await auth.signOut();
            window.location.href = 'index.html';
        });
    }

});

// ── Helper: afișare eroare sub formular ───────────────────────
function showError(form, message) {
    // Ștergem eroarea anterioară dacă există
    const old = form.querySelector('.auth-error-msg');
    if (old) old.remove();

    const div = document.createElement('div');
    div.className = 'auth-error-msg';
    div.style.cssText = `
        background: rgba(255,71,87,0.12);
        border: 1px solid rgba(255,71,87,0.4);
        color: #ff4757;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 0.9rem;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    div.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

    const submitBtn = form.querySelector('button[type="submit"]');
    form.insertBefore(div, submitBtn);
}
