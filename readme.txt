FluffyPaws - Readme (Proiect Tehnologii Web)

1) Arhitectura proiectului
- Frontend static: HTML + CSS + JavaScript (fisiere in radacina si in /css, /js).
- Backend/DB: Firebase Authentication + Firestore (persistenta pentru utilizatori, animale, cereri).
- Roluri: guest (vizitator / cont limitat), user (utilizator normal), admin (administrator).
- Flux principal: listare animale -> detalii -> cerere de adoptie -> aprobare admin.

Structura baza de date (Firestore):
- users/{uid}
  - firstName, lastName, email, phone, city, role (admin/user/guest), disabled, photoURL, bio, address, createdAt
- animals/{id}
  - name, species, breed, ageCategory, sex, size, city, photo, description, status, available, health fields, temperament
- adoptionRequests/{id}
  - animalId, animalName, animalBreed, requestType, userId, userEmail, status, createdAt, etc.
- users/{uid}/favorites/{animalId}

2) Pagini principale
- index.html (Homepage)
- login.html (Autentificare)
- register.html (Creare cont)
- animals.html (Lista animale)
- animal-details.html (Detalii animal)
- adoption-form.html (Formular cerere)
- profile.html (Editare profil + favorite + cereri)
- admin-users.html (Administrare utilizatori, animale, cereri)
- about.html, contact.html, success-stories.html

3) Roluri si drepturi
- Guest (neautentificat): poate naviga, vede animale/detalii, NU poate trimite cereri sau salva la favorite.
- Guest (rol in DB): cont limitat; poate salva favorite, NU poate trimite cereri.
- User: poate salva favorite, poate trimite cereri.
- Admin: acces la admin-users.html, poate gestiona utilizatori/animale/cereri.

4) Flux de test (scenariu principal)
1. Inregistrare cont -> logare.
2. Vizualizeaza animale -> intra pe detalii -> trimite cerere.
3. Admin: intra in admin-users.html -> cereri -> aproba.
4. Dupa aprobare: cererea devine "approved", celelalte cereri pentru acelasi animal devin "rejected".
5. Animalul este marcat ca unavailable/adopted si nu mai apare in lista de animale disponibile.

5) Instructiuni rulare / testare
- Deschide index.html in browser (Chrome/Firefox).
- Configurarea Firebase trebuie sa fie in js/firebase-config.js.
- Pentru testare completa, foloseste un cont de admin si unul de user.

6) Observatii
- Design responsive: CSS in css/style.css si css/responsive.css.
- Navigarea intre pagini functioneaza si fara server dedicat (template-uri statice).
