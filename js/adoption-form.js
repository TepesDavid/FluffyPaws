// ============================================================
//  FluffyPaws - adoption-form.js
//  Dynamic adoption form binding + Firestore submit
// ============================================================

(function () {
    const ageLabelMap = { baby: 'Pui (0-1 an)', young: 'Tanar (1-3 ani)', adult: 'Adult (3-7 ani)', senior: 'Senior (7+ ani)' };
    const cityLabelMap = { bucuresti: 'Bucuresti', cluj: 'Cluj-Napoca', timisoara: 'Timisoara', iasi: 'Iasi', brasov: 'Brasov', sibiu: 'Sibiu' };

    const els = {
        form: document.getElementById('adoptionForm'),
        success: document.getElementById('adoptionSuccess'),
        successBackLink: document.getElementById('successBackLink'),
        loginRequired: document.getElementById('loginRequiredMessage'),
        loginRequiredLink: document.getElementById('loginRequiredLink'),
        loginRequiredTitle: document.querySelector('#loginRequiredMessage strong'),
        loginRequiredText: document.querySelector('#loginRequiredMessage p'),
        adoptionAnimalName: document.getElementById('adoptionAnimalName'),
        breadcrumbAnimalLink: document.getElementById('breadcrumbAnimalLink'),
        animalSummaryImage: document.getElementById('animalSummaryImage'),
        animalSummaryTitle: document.getElementById('animalSummaryTitle'),
        animalSummaryMeta: document.getElementById('animalSummaryMeta'),
        backToAnimalLink: document.getElementById('backToAnimalLink'),
        confirmInfo: document.getElementById('confirmInfo'),
        acceptTerms: document.getElementById('acceptTerms'),
        allowContact: document.getElementById('allowContact')
    };

    const params = new URLSearchParams(window.location.search);
    const animalId = params.get('id');
    let currentAnimal = null;
    let currentUserRole = null;

    function setText(el, text) {
        if (el) el.textContent = text;
    }

    function setAttr(el, attr, value) {
        if (el) el.setAttribute(attr, value);
    }

    function disableForm(message) {
        if (!els.form) return;
        Array.from(els.form.elements).forEach(el => {
            el.disabled = true;
        });
        if (message) {
            alert(message);
        }
    }

    function setAccessState(options) {
        const config = options || {};
        const show = config.show === true;
        if (els.loginRequired) {
            els.loginRequired.style.display = show ? 'block' : 'none';
        }
        if (els.form) {
            els.form.style.display = show ? 'none' : 'block';
        }
        if (!show) return;
        if (els.loginRequiredTitle && config.title) {
            els.loginRequiredTitle.textContent = config.title;
        }
        if (els.loginRequiredText && config.text) {
            els.loginRequiredText.textContent = config.text;
        }
        if (els.loginRequiredLink) {
            if (config.linkText) els.loginRequiredLink.textContent = config.linkText;
            if (config.linkHref) els.loginRequiredLink.href = config.linkHref;
            els.loginRequiredLink.style.display = config.hideLink ? 'none' : '';
        }
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

    async function loadAnimal() {
        if (!animalId) {
            disableForm('Lipseste ID-ul animalului.');
            return;
        }

        try {
            const doc = await db.collection('animals').doc(animalId).get();
            if (!doc.exists) {
                disableForm('Animalul selectat nu a fost gasit.');
                return;
            }

            const d = doc.data() || {};
            currentAnimal = {
                id: doc.id,
                name: d.name || 'Animal',
                breed: d.breed || 'Rasa necunoscuta',
                ageCategory: d.ageCategory || 'adult',
                ageLabel: d.ageLabel || ageLabelMap[d.ageCategory] || d.ageCategory || '-',
                sex: d.sex || 'M',
                city: d.city || '',
                cityLabel: cityLabelMap[d.city] || d.city || 'Necunoscut',
                photo: d.photo || 'https://placedog.net/120/120'
            };

            document.title = 'Cerere de Adoptie - ' + currentAnimal.name + ' - FluffyPaws';
            setText(els.adoptionAnimalName, currentAnimal.name);
            setText(els.breadcrumbAnimalLink, currentAnimal.name);
            setAttr(els.breadcrumbAnimalLink, 'href', 'animal-details.html?id=' + encodeURIComponent(currentAnimal.id));
            setAttr(els.backToAnimalLink, 'href', 'animal-details.html?id=' + encodeURIComponent(currentAnimal.id));
            setAttr(els.successBackLink, 'href', 'animal-details.html?id=' + encodeURIComponent(currentAnimal.id));
            if (els.loginRequiredLink) {
                els.loginRequiredLink.href = 'login.html';
            }

            setAttr(els.animalSummaryImage, 'src', currentAnimal.photo);
            setAttr(els.animalSummaryImage, 'alt', currentAnimal.name);
            setText(els.animalSummaryTitle, currentAnimal.name + ' - ' + currentAnimal.breed);
            setText(els.animalSummaryMeta, currentAnimal.ageLabel + ' • ' + (currentAnimal.sex === 'F' ? 'Femela' : 'Mascul') + ' • ' + currentAnimal.cityLabel);
        } catch (err) {
            console.error('Eroare la incarcarea animalului:', err);
            disableForm('Nu s-au putut incarca detaliile animalului.');
        }
    }

    function getChecked(name, fallback) {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : fallback;
    }

    function getValue(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    async function submitRequest(e) {
        e.preventDefault();
        if (!currentAnimal || !animalId) {
            alert('Nu exista un animal selectat.');
            return;
        }
        if (currentUserRole === 'guest') {
            if (typeof window.showToast === 'function') {
                window.showToast('Cont Guest. Pentru cereri, rolul trebuie schimbat de admin.', 'warning');
            } else {
                alert('Cont Guest. Pentru cereri, rolul trebuie schimbat de admin.');
            }
            return;
        }

        const requestType = getChecked('requestType', 'adoption');
        const motivation = getValue('motivation');
        const experience = getValue('experience');
        const experienceDetails = getValue('experienceDetails');
        const livingType = getValue('livingType');
        const familyMembers = getValue('familyMembers');
        const hasChildren = getChecked('hasChildren', 'no');
        const hasOtherPets = getChecked('hasOtherPets', 'no');

        if (!motivation || !experience || !livingType || !familyMembers) {
            alert('Te rog completeaza toate campurile obligatorii.');
            return;
        }
        if (els.confirmInfo && !els.confirmInfo.checked) {
            alert('Trebuie sa confirmi ca informatiile sunt corecte.');
            return;
        }
        if (els.acceptTerms && !els.acceptTerms.checked) {
            alert('Trebuie sa accepti conditiile de adoptie.');
            return;
        }

        const user = auth.currentUser;
        const payload = {
            animalId: currentAnimal.id,
            animalName: currentAnimal.name,
            animalBreed: currentAnimal.breed,
            animalAgeCategory: currentAnimal.ageCategory,
            animalSex: currentAnimal.sex,
            animalCity: currentAnimal.city,
            animalPhoto: currentAnimal.photo,
            requestType,
            motivation,
            experience,
            experienceDetails,
            livingType,
            familyMembers,
            hasChildren,
            hasOtherPets,
            consentInfoAccurate: els.confirmInfo ? els.confirmInfo.checked : false,
            consentTerms: els.acceptTerms ? els.acceptTerms.checked : false,
            consentContact: els.allowContact ? els.allowContact.checked : false,
            status: 'new',
            userId: user ? user.uid : null,
            userEmail: user ? user.email : null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('adoptionRequests').add(payload);
            if (els.form) {
                els.form.reset();
                els.form.style.display = 'none';
            }
            if (els.success) {
                els.success.style.display = 'block';
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Eroare la trimiterea cererii:', err);
            alert('Nu s-a putut trimite cererea. Incearca din nou.');
        }
    }

    if (els.form) {
        els.form.addEventListener('submit', submitRequest);
    }

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            currentUserRole = null;
            localStorage.setItem('redirectAfterLogin', window.location.href);
            setAccessState({
                show: true,
                title: 'Este nevoie de cont.',
                text: 'Pentru a trimite o cerere de adoptie trebuie sa fii autentificat.',
                linkText: 'Autentifica-te',
                linkHref: 'login.html'
            });
            return;
        }

        currentUserRole = await resolveUserRole(user);
        if (currentUserRole === 'guest') {
            setAccessState({
                show: true,
                title: 'Cont Guest.',
                text: 'Cont Guest. Pentru cereri, rolul trebuie schimbat de admin.',
                hideLink: true
            });
            return;
        }

        setAccessState({ show: false });
    });

    if (els.loginRequiredLink) {
        els.loginRequiredLink.addEventListener('click', () => {
            const href = els.loginRequiredLink.getAttribute('href') || '';
            if (href.includes('login.html')) {
                localStorage.setItem('redirectAfterLogin', window.location.href);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAnimal);
    } else {
        loadAnimal();
    }
})();
