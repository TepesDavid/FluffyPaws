// ============================================================
//  FluffyPaws - index-animals.js
//  Load first 3 animals on homepage
// ============================================================

(function () {
    const container = document.getElementById('featuredAnimals');
    if (!container) return;

    const ageLabelMap = { baby: 'Pui (0-1 an)', young: 'Tanar (1-3 ani)', adult: 'Adult (3-7 ani)', senior: 'Senior (7+ ani)' };
    const cityLabelMap = { bucuresti: 'Bucuresti', cluj: 'Cluj-Napoca', timisoara: 'Timisoara', iasi: 'Iasi', brasov: 'Brasov', sibiu: 'Sibiu' };
    const statusLabelMap = { available: 'DISPONIBIL', urgent: 'URGENT', new: 'NOU' };
    const speciesIconMap = { dog: 'fa-dog', cat: 'fa-cat', rabbit: 'fa-paw', bird: 'fa-dove', other: 'fa-paw' };

    function renderEmpty(message) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-gray); padding: 2rem 0;">
                ${message || 'Nu exista animale disponibile.'}
            </div>`;
    }

    function getStatusClass(status) {
        if (status === 'urgent') return 'badge-urgent';
        if (status === 'new') return 'badge-new';
        return 'badge-available';
    }

    function renderAnimals(list) {
        if (!list.length) {
            renderEmpty('Nu exista animale disponibile.');
            return;
        }

        container.innerHTML = list.map(animal => {
            const name = animal.name || 'Animal';
            const breed = animal.breed || 'Rasa necunoscuta';
            const ageLabel = animal.ageLabel || ageLabelMap[animal.ageCategory] || animal.ageCategory || '-';
            const sexLabel = animal.sex === 'F' ? 'Femela' : animal.sex === 'M' ? 'Mascul' : animal.sex || '-';
            const cityLabel = animal.cityLabel || cityLabelMap[animal.city] || animal.city || 'Necunoscut';
            const status = animal.status || 'available';
            const statusLabel = statusLabelMap[status] || 'DISPONIBIL';
            const photo = animal.photo || 'https://placedog.net/400/300';
            const description = animal.description || '';
            const icon = speciesIconMap[animal.species] || 'fa-paw';

            return `
            <div class="card animal-card fade-in">
                <div class="card-img-wrapper">
                    <img src="${photo}" alt="${name}" class="card-img">
                    <span class="card-badge ${getStatusClass(status)}">${statusLabel}</span>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${name}</h3>
                    <div class="card-info">
                        <span class="info-tag"><i class="fas ${icon}"></i> ${breed}</span>
                        <span class="info-tag"><i class="fas fa-birthday-cake"></i> ${ageLabel}</span>
                        <span class="info-tag"><i class="fas ${animal.sex === 'F' ? 'fa-venus' : 'fa-mars'}"></i> ${sexLabel}</span>
                    </div>
                    <p class="card-text">${description}</p>
                </div>
                <div class="card-footer">
                    <span class="info-tag"><i class="fas fa-map-marker-alt"></i> ${cityLabel}</span>
                    <a href="animal-details.html?id=${encodeURIComponent(animal.id)}" class="btn btn-primary btn-sm">
                        <i class="fas fa-eye"></i> Detalii
                    </a>
                </div>
            </div>`;
        }).join('');

        // Ensure cards are visible even if IntersectionObserver does not pick up new elements
        requestAnimationFrame(() => {
            container.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
        });
    }

    async function loadAnimals() {
        try {
            let snap;
            try {
                snap = await db.collection('animals').orderBy('createdAt', 'desc').limit(3).get();
            } catch (e) {
                snap = await db.collection('animals').limit(3).get();
            }

            const animals = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            renderAnimals(animals);
        } catch (err) {
            console.error('Eroare la incarcarea animalelor:', err);
            renderEmpty('Nu s-au putut incarca animalele.');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAnimals);
    } else {
        loadAnimals();
    }
})();
