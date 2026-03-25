// ============================================================
//  FluffyPaws - contact.js
//  Stocare mesaje contact in Firestore
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = (document.getElementById('name')?.value || '').trim();
        const email = (document.getElementById('email')?.value || '').trim();
        const subject = (document.getElementById('subject')?.value || '').trim();
        const message = (document.getElementById('message')?.value || '').trim();

        if (!name || !email || !message) {
            if (typeof window.showToast === 'function') {
                window.showToast('Completeaza campurile obligatorii.', 'warning');
            } else {
                alert('Completeaza campurile obligatorii.');
            }
            return;
        }

        const user = auth.currentUser;
        const payload = {
            name,
            email,
            subject: subject || '',
            message,
            userId: user ? user.uid : null,
            userEmail: user ? user.email : email,
            status: 'new',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('messages').add(payload);
            form.reset();
            if (typeof window.showToast === 'function') {
                window.showToast('Mesajul a fost trimis cu succes!', 'success');
            } else {
                alert('Mesajul a fost trimis cu succes!');
            }
        } catch (err) {
            console.error('Eroare la trimiterea mesajului:', err);
            if (typeof window.showToast === 'function') {
                window.showToast('Nu s-a putut trimite mesajul. Incearca din nou.', 'error');
            } else {
                alert('Nu s-a putut trimite mesajul. Incearca din nou.');
            }
        }
    });
});
