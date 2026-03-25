
function ensureToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

window.showToast = function (message, type = 'info', duration = 3000) {
    if (!message) return;
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : type === 'warning' ? 'warning' : ''}`.trim();
    toast.innerHTML = `
        <i class="fas fa-info-circle" style="color: var(--primary);"></i>
        <div style="flex: 1;">${message}</div>
    `;

    if (type === 'error') {
        toast.querySelector('i').className = 'fas fa-times-circle';
        toast.querySelector('i').style.color = 'var(--danger)';
    } else if (type === 'warning') {
        toast.querySelector('i').className = 'fas fa-exclamation-triangle';
        toast.querySelector('i').style.color = 'var(--warning)';
    }

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

if (document.querySelector(".typing")) {
    var typed = new Typed(".typing", {
        strings: ["unui cățeluș", "unei pisicuțe", "unui hamster", "unui papagal", "unui iepuraș"],
        typeSpeed: 50,
        backSpeed: 80,
        loop: true
    });
}

// Navbar Scroll Effect
window.addEventListener('scroll', function () {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }
});

// Animation Observer
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

function observeAnimatedElements(root = document) {
    root.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
        if (el.dataset.fadeObserved === 'true') return;
        el.dataset.fadeObserved = 'true';
        observer.observe(el);
    });
}

observeAnimatedElements();
window.refreshScrollAnimations = function (root) {
    observeAnimatedElements(root || document);
};

// Counter Animation
function animateCounter(counter) {
    const target = +counter.getAttribute('data-target');
    const suffix = counter.getAttribute('data-suffix') || '';
    const duration = 800; // ms total - modifică aici pentru viteză
    const startTime = performance.now();

    function updateCount(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutQuad pentru efect smooth
        const eased = 1 - (1 - progress) * (1 - progress);
        counter.innerText = Math.ceil(eased * target) + suffix;

        if (progress < 1) {
            requestAnimationFrame(updateCount);
        } else {
            counter.innerText = target + suffix;
        }
    }
    requestAnimationFrame(updateCount);
}

// Observăm fiecare .stat-number și pornim animația când intră în viewport
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(counter => {
    counterObserver.observe(counter);
});

if (document.querySelector(".mySwiper")) {
    var swiper = new Swiper(".mySwiper", {
        slidesPerView: 1,
        spaceBetween: 30,
        autoplay: {
            delay: 2500,
        },
        loop: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
    });
}

function actualizeazaStatusOrar() {
    const acum = new Date();
    const ora = acum.getHours();
    const ziua = acum.getDay(); // 0=Dum, 1=Lun, ..., 6=Sam
    const statusElement = document.getElementById('status-program');

    let esteDeschis = false;

    // LUNI - VINERI (ziua 1 până la 5)
    if (ziua >= 1 && ziua <= 5) {
        if (ora >= 8 && ora < 16) {
            esteDeschis = true;
        }
    }
    // SÂMBĂTĂ - DUMINICĂ (ziua 6 sau 0)
    else {
        if (ora >= 8 && ora < 12) {
            esteDeschis = true;
        }
    }

    // Afișare text și aplicare culoare
    if (esteDeschis) {
        statusElement.textContent = " DESCHIS";
        statusElement.style.color = "#2ed573"; // Verde
        statusElement.style.fontWeight = "bold";
    } else {
        statusElement.textContent = " ÎNCHIS";
        statusElement.style.color = "#ff4757"; // Roșu
        statusElement.style.fontWeight = "bold";
    }
}

// Execută verificarea imediat ce se încarcă pagina
window.onload = actualizeazaStatusOrar;

// Funcționalitate Autentificare & Meniu Utilizator
document.addEventListener("DOMContentLoaded", function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const guestActions = document.getElementById('guestActions');
    const userActions = document.getElementById('userActions');

    // Afisare corecta in functie de starea de autentificare
    if (guestActions && userActions) {
        if (isLoggedIn) {
            guestActions.style.display = 'none';
            userActions.style.display = 'block';
        } else {
            guestActions.style.display = 'flex';
            userActions.style.display = 'none';
        }
    }

    // Toggle Dropdown
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        // Inchide dropdown-ul cand dai click in afara
        document.addEventListener('click', function(e) {
            if (!userActions.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    // Deconectare
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            window.location.reload();
        });
    }

    // Logica reală de Auth este acum în js/auth.js
});
