document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');
    const loaderLogo = document.getElementById('loaderLogo');

    if (loaderLogo) {
        loaderLogo.onerror = () => console.warn('Logo no encontrado en assets/logo.png');
    }

    // =====================================================
    // TRANSICIÓN UNIFICADA — FLIP ANIMATION
    //
    // Técnica: First → Last → Invert → Play
    // El mismo elemento del logo vuela desde el centro del
    // loader hasta su posición final en el hero.
    // No hay corte entre las dos "páginas", es una sola transición.
    // =====================================================
    setTimeout(() => {

        // STEP 1: Capturar la posición ACTUAL del logo en la pantalla (FIRST)
        const firstRect = loaderLogo.getBoundingClientRect();

        // STEP 2: Mostrar el main content (invisible aún)
        mainContent.style.display = 'block';
        mainContent.style.opacity = '0';

        // STEP 3: Preparar el wrapper del hero (lo dejamos invisible por ahora)
        const heroWrapper = document.getElementById('heroLogoWrapper');
        const heroLogo = document.createElement('img');
        heroLogo.src = 'assets/logo.png';
        heroLogo.alt = 'Cash & Flow';
        heroLogo.id = 'heroLogoImg';
        // Lo hacemos invisible para que el wrapper ocupe su espacio final
        heroLogo.style.visibility = 'hidden';
        heroWrapper.appendChild(heroLogo);

        // STEP 4: Obtener la posición FINAL del logo en el hero (LAST)
        // Forzamos un layout reflow para que el wrapper ya esté en su posición
        const lastRect = heroLogo.getBoundingClientRect();

        // STEP 5: Calcular el INVERT — cuánto hay que mover el logo para
        //         que visualmente empiece donde estaba en el loader
        const dx = firstRect.left + firstRect.width / 2 - (lastRect.left + lastRect.width / 2);
        const dy = firstRect.top + firstRect.height / 2 - (lastRect.top + lastRect.height / 2);
        const scaleX = firstRect.width / lastRect.width;
        const scaleY = firstRect.height / lastRect.height;
        const scale = Math.max(scaleX, scaleY);

        // STEP 6: Arrancar el logo en la posición del loader (con el transform invertido)
        loaderLogo.style.animation = 'none';          // Detener el spin
        loaderLogo.style.position = 'fixed';
        loaderLogo.style.top = `${firstRect.top}px`;
        loaderLogo.style.left = `${firstRect.left}px`;
        loaderLogo.style.width = `${firstRect.width}px`;
        loaderLogo.style.zIndex = '99999';
        loaderLogo.style.transition = 'none';
        loaderLogo.style.transform = 'none';
        loaderLogo.style.margin = '0';
        document.body.appendChild(loaderLogo); // Sacar del loader al body como overlay

        // STEP 7: Ocultar el logo original del loader y hacer fade out del fondo
        loader.style.transition = 'opacity 0.7s ease';
        loader.style.opacity = '0';

        // Fade in del main content simultáneo
        requestAnimationFrame(() => {
            mainContent.style.transition = 'opacity 0.7s ease';
            mainContent.style.opacity = '1';
        });

        // STEP 8: Calcular la posición FINAL exacta en píxeles para el overlay fijo
        const targetX = lastRect.left;
        const targetY = lastRect.top;
        const targetW = lastRect.width;

        // STEP 9: PLAY — animar el logo hacia su destino (con un pequeño delay para que el fade empiece)
        setTimeout(() => {
            loaderLogo.style.transition = `
                left   0.9s cubic-bezier(0.22, 1, 0.36, 1),
                top    0.9s cubic-bezier(0.22, 1, 0.36, 1),
                width  0.9s cubic-bezier(0.22, 1, 0.36, 1),
                filter 0.9s ease
            `;
            loaderLogo.style.left = `${targetX}px`;
            loaderLogo.style.top = `${targetY}px`;
            loaderLogo.style.width = `${targetW}px`;
            loaderLogo.style.filter = 'drop-shadow(0 0 18px rgba(102, 252, 241, 0.5)) drop-shadow(0 8px 20px rgba(0,0,0,0.8))';
        }, 80);

        // STEP 10: Al finalizar la animación, reemplazar el overlay con el logo del hero
        setTimeout(() => {
            heroLogo.style.visibility = 'visible';   // Mostrar el logo del hero
            heroLogo.style.opacity = '0';
            heroLogo.style.transition = 'opacity 0.2s ease';

            requestAnimationFrame(() => {
                heroLogo.style.opacity = '1';
            });

            loaderLogo.remove();  // Eliminar el overlay volador
            loader.remove();       // Eliminar el loader del DOM

            // ── Efecto tilt 3D al mover el mouse ──
            heroLogo.addEventListener('mousemove', (e) => {
                const rect = heroLogo.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = (e.clientX - cx) / (rect.width / 2);
                const dy = (e.clientY - cy) / (rect.height / 2);
                const maxT = 18;
                heroLogo.style.setProperty('--rx', `${-dy * maxT}deg`);
                heroLogo.style.setProperty('--ry', `${dx * maxT}deg`);
                heroLogo.style.setProperty('--sc', '1.08');
            });

            heroLogo.addEventListener('mouseleave', () => {
                heroLogo.style.setProperty('--rx', '0deg');
                heroLogo.style.setProperty('--ry', '0deg');
                heroLogo.style.setProperty('--sc', '1');
            });

        }, 1100); // Esperar que termine la animación de vuelo

    }, 3500);

    // =====================================================
    // VIDEO SCRUBBING BIDIRECCIONAL
    // → Adelante: playbackRate | ← Atrás: lerp currentTime
    // =====================================================
    const video = document.getElementById('scrollVideo');
    let targetTime = 0;
    let rafId = null;

    function initScrub() {
        video.pause();
        video.currentTime = 0;

        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(11, 12, 16, 0.92)';
                navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';
            } else {
                navbar.style.background = 'var(--glass-bg)';
                navbar.style.boxShadow = 'none';
            }

            if (video.duration) {
                const scrollMax = Math.max(1, document.body.scrollHeight - window.innerHeight);
                const fraction = Math.min(Math.max(window.scrollY / scrollMax, 0), 1);
                targetTime = video.duration * fraction;
            }
        }, { passive: true });

        function scrubLoop() {
            if (video.duration) {
                const diff = targetTime - video.currentTime;
                const absDiff = Math.abs(diff);

                if (absDiff > 0.05) {
                    if (diff > 0) {
                        video.playbackRate = Math.min(diff * 5, 8);
                        if (video.paused) video.play().catch(() => { });
                    } else {
                        if (!video.paused) { video.pause(); video.playbackRate = 1; }
                        video.currentTime = Math.max(0, video.currentTime + diff * 0.14);
                    }
                } else {
                    if (!video.paused) video.pause();
                    if (absDiff > 0.01) video.currentTime = targetTime;
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

    // Cargar inventario
    localStorage.removeItem('cash_flow_cars');
    loadInventory();
});

function loadInventory() {
    const carsGrid = document.getElementById('cars-grid');
    if (!carsGrid) return;

    const cars = window.CashFlowDB.getAllCars();
    carsGrid.innerHTML = '';

    if (cars.length === 0) {
        carsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #b0b0b0;">No hay carros disponibles.</p>';
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
                <div class="car-brand">${car.brand} <span style="color:#b0b0b0; font-size:0.8rem">- ${car.year}</span></div>
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
