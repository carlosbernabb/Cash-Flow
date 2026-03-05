document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');
    const loaderLogo = document.getElementById('loaderLogo');

    if (loaderLogo) {
        loaderLogo.onerror = () => console.warn('Logo no encontrado en assets/logo.png');
    }

    // =====================================================
    // LOADER → HERO LOGO: Vuelo FLIP animation
    // =====================================================
    setTimeout(() => {
        mainContent.style.display = 'block';
        mainContent.style.opacity = '0';
        requestAnimationFrame(() => {
            mainContent.style.transition = 'opacity 1s ease-in-out';
            mainContent.style.opacity = '1';
        });

        loader.style.transition = 'opacity 0.8s ease';
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';


        const heroWrapper = document.getElementById('heroLogoWrapper');
        if (heroWrapper) {
            const firstRect = loaderLogo.getBoundingClientRect();

            const heroLogo = document.createElement('img');
            heroLogo.src = 'assets/logo.png';
            heroLogo.alt = 'Cash & Flow';
            heroLogo.id = 'heroLogoImg';
            heroLogo.style.visibility = 'hidden';
            heroWrapper.appendChild(heroLogo);

            const lastRect = heroLogo.getBoundingClientRect();

            loaderLogo.style.animation = 'none';
            loaderLogo.style.position = 'fixed';
            loaderLogo.style.top = `${firstRect.top}px`;
            loaderLogo.style.left = `${firstRect.left}px`;
            loaderLogo.style.width = `${firstRect.width}px`;
            loaderLogo.style.zIndex = '99999';
            loaderLogo.style.transition = 'none';
            loaderLogo.style.transform = 'none';
            loaderLogo.style.margin = '0';
            document.body.appendChild(loaderLogo);

            setTimeout(() => {
                loaderLogo.style.transition = `
                    left 0.9s cubic-bezier(0.22,1,0.36,1),
                    top  0.9s cubic-bezier(0.22,1,0.36,1),
                    width 0.9s cubic-bezier(0.22,1,0.36,1),
                    filter 0.9s ease`;
                loaderLogo.style.left = `${lastRect.left}px`;
                loaderLogo.style.top = `${lastRect.top}px`;
                loaderLogo.style.width = `${lastRect.width}px`;
                loaderLogo.style.filter = 'drop-shadow(0 0 18px rgba(102,252,241,0.5)) drop-shadow(0 8px 20px rgba(0,0,0,0.8))';
            }, 80);

            setTimeout(() => {
                heroLogo.style.visibility = 'visible';
                heroLogo.style.opacity = '0';
                heroLogo.style.transition = 'opacity 0.2s ease';
                requestAnimationFrame(() => { heroLogo.style.opacity = '1'; });
                loaderLogo.remove();
                loader.remove();

                heroLogo.addEventListener('mousemove', (e) => {
                    const r = heroLogo.getBoundingClientRect();
                    const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
                    const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
                    heroLogo.style.setProperty('--rx', `${-dy * 18}deg`);
                    heroLogo.style.setProperty('--ry', `${dx * 18}deg`);
                    heroLogo.style.setProperty('--sc', '1.08');
                });
                heroLogo.addEventListener('mouseleave', () => {
                    heroLogo.style.setProperty('--rx', '0deg');
                    heroLogo.style.setProperty('--ry', '0deg');
                    heroLogo.style.setProperty('--sc', '1');
                });
            }, 1100);
        }
    }, 3500);

    // =====================================================
    // VIDEO SCRUBBING — adelante playbackRate, atrás seek suave
    // VIDEO_OFFSET: salta los primeros 2 segundos del video
    // =====================================================
    const video = document.getElementById('scrollVideo');
    const VIDEO_OFFSET = 2;
    let targetTime = VIDEO_OFFSET;
    let rafId = null;
    let backTick = 0;
    let goingBack = false;

    function initScrub() {
        video.currentTime = VIDEO_OFFSET;
        video.pause();

        window.addEventListener('scroll', () => {
            // Navbar
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(11, 12, 16, 0.92)';
                navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';
            } else {
                navbar.style.background = 'var(--glass-bg)';
                navbar.style.boxShadow = 'none';
            }

            // Target del video: mapea scroll desde VIDEO_OFFSET hasta el final
            if (video.duration) {
                const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
                const fraction = Math.min(Math.max(window.scrollY / max, 0), 1);
                targetTime = VIDEO_OFFSET + (video.duration - VIDEO_OFFSET) * fraction;
            }
        }, { passive: true });

        function scrubLoop() {
            if (video.duration) {
                const diff = targetTime - video.currentTime;
                const absDiff = Math.abs(diff);

                if (absDiff > 0.04) {

                    if (diff > 0) {
                        // ── ADELANTE: playbackRate nativo, siempre suave ──
                        if (goingBack) {
                            // Salir del estado de retroceso — restaurar video
                            video.style.transition = 'opacity 0.4s ease, filter 0.4s ease';
                            video.style.opacity = '1';
                            video.style.filter = 'none';
                            goingBack = false;
                        }
                        video.playbackRate = Math.min(diff * 5, 8);
                        if (video.paused) video.play().catch(() => { });
                        backTick = 0;

                    } else {
                        // ── ATRÁS: seek throttleado + transición visual suave ──
                        if (!video.paused) {
                            video.pause();
                            video.playbackRate = 1;
                        }

                        // Primer frame del retroceso: activar efecto visual
                        if (!goingBack) {
                            video.style.transition = 'opacity 0.15s ease, filter 0.15s ease';
                            goingBack = true;
                        }
                        // Blur y dim sutiles — ocultan el stutter del codec H.264
                        video.style.opacity = '0.88';
                        video.style.filter = 'blur(0.6px) brightness(0.92)';

                        // Seek cada 3 frames de rAF = 20fps efectivos al decoder
                        backTick = (backTick + 1) % 3;
                        if (backTick === 0) {
                            const next = Math.max(VIDEO_OFFSET, video.currentTime + diff * 0.30);
                            video.currentTime = next;
                        }
                    }

                } else {
                    // ── LLEGAMOS AL FRAME CORRECTO ──
                    if (goingBack) {
                        video.style.transition = 'opacity 0.4s ease, filter 0.4s ease';
                        video.style.opacity = '1';
                        video.style.filter = 'none';
                        goingBack = false;
                    }
                    if (!video.paused) {
                        video.pause();
                        video.playbackRate = 1;
                    }
                    const snap = Math.max(VIDEO_OFFSET, targetTime);
                    if (Math.abs(video.currentTime - snap) > 0.01) {
                        video.currentTime = snap;
                    }
                }
            }

            rafId = requestAnimationFrame(scrubLoop);
        }

        if (rafId) cancelAnimationFrame(rafId);
        scrubLoop();
    }

    if (video) {
        if (video.readyState >= 1) initScrub();
        else video.addEventListener('loadedmetadata', initScrub, { once: true });
    }

    localStorage.removeItem('cash_flow_cars');
    loadInventory();
});

// =====================================================
// INVENTARIO
// =====================================================
function loadInventory() {
    const carsGrid = document.getElementById('cars-grid');
    if (!carsGrid) return;

    const cars = window.CashFlowDB.getAllCars();
    carsGrid.innerHTML = '';

    if (cars.length === 0) {
        carsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#b0b0b0;">No hay carros disponibles.</p>';
        return;
    }

    cars.forEach(car => {
        const card = document.createElement('div');
        card.className = 'car-card';
        card.innerHTML = `
            <div class="car-image-container">
                <img src="${car.imageUrl}" alt="${car.brand} ${car.model}" loading="lazy">
            </div>
            <div class="car-info">
                <div class="car-brand">${car.brand} <span style="color:#b0b0b0;font-size:0.8rem">- ${car.year}</span></div>
                <div class="car-model">${car.model}</div>
                <div class="car-price">${car.price}</div>
                <ul class="car-specs">
                    <li>Motor: ${car.engine}</li>
                    <li>HP: ${car.hp}</li>
                    <li>0-100: ${car.acceleration}</li>
                </ul>
                <a href="#contact" class="btn-details">Me Interesa</a>
            </div>
        `;
        carsGrid.appendChild(card);
    });
}

// =====================================================
// FLIPBOOK — auto-avance cada 7 segundos
// =====================================================
(function initFlipbook() {
    const pages = document.querySelectorAll('.flip-page');
    const dots = document.querySelectorAll('.flip-dot');
    const btnPrev = document.getElementById('flipPrev');
    const btnNext = document.getElementById('flipNext');
    if (!pages.length) return;

    let current = 0;
    let timer = null;

    function goTo(idx) {
        pages[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = (idx + pages.length) % pages.length;
        pages[current].classList.add('active');
        dots[current].classList.add('active');
    }

    function startTimer() {
        clearInterval(timer);
        timer = setInterval(() => goTo(current + 1), 7000);
    }


    // Botones
    if (btnNext) btnNext.addEventListener('click', () => { goTo(current + 1); startTimer(); });
    if (btnPrev) btnPrev.addEventListener('click', () => { goTo(current - 1); startTimer(); });

    // Dots
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            goTo(parseInt(dot.dataset.idx));
            startTimer();
        });
    });

    startTimer(); // Arrancar el timer automático
})();

// =====================================================
// CARRUSEL POR TARJETA DE EVENTO
// Cada [data-carousel] es independiente
// =====================================================
document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const slides = carousel.querySelectorAll('.evc-slide');
    const dots = carousel.querySelectorAll('.evc-dot');
    const prev = carousel.querySelector('.evc-prev');
    const next = carousel.querySelector('.evc-next');
    if (slides.length < 2) return;

    let cur = 0;

    function moveTo(idx) {
        slides[cur].classList.remove('active');
        dots[cur] && dots[cur].classList.remove('active');
        cur = (idx + slides.length) % slides.length;
        slides[cur].classList.add('active');
        dots[cur] && dots[cur].classList.add('active');
    }

    prev && prev.addEventListener('click', e => { e.stopPropagation(); moveTo(cur - 1); });
    next && next.addEventListener('click', e => { e.stopPropagation(); moveTo(cur + 1); });
    dots.forEach((d, i) => d.addEventListener('click', () => moveTo(i)));
});


// =====================================================
// EXPANDABLE EVENT CARDS � click para ver detalles
// =====================================================
document.querySelectorAll('.event-card--expandable').forEach(card => {
    card.addEventListener('click', e => {
        if (e.target.closest('a')) return;
        card.classList.toggle('expanded');
    });
});
