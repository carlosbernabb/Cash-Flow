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

        // Handle navigation hash jump after loader finishes
        if (window.location.hash) {
            setTimeout(() => {
                const target = document.querySelector(window.location.hash);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }

    }, 3500);



    // =====================================================
    // VIDEO SCRUB — Direct scroll position mapping, no lerp
    // =====================================================
    const video = document.getElementById('bgVideo');
    const VIDEO_OFFSET = 2;

    let targetTime = VIDEO_OFFSET;
    let isSeeking = false;
    let scrubRunning = false;

    function initScrub() {
        // Guard: only start one scrub loop
        if (scrubRunning) return;
        scrubRunning = true;

        video.currentTime = VIDEO_OFFSET;
        video.pause();
        video.addEventListener('seeked', () => { isSeeking = false; });

        window.addEventListener('scroll', () => {
            // Navbar styling
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(11, 12, 16, 0.92)';
                navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';
            } else {
                navbar.style.background = 'var(--glass-bg)';
                navbar.style.boxShadow = 'none';
            }

            // Map scroll position DIRECTLY to video time — no velocity, no lerp
            if (video.duration) {
                const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
                const fraction = Math.min(Math.max((window.scrollY / maxScroll) * 3.0, 0), 1);
                targetTime = VIDEO_OFFSET + (video.duration - VIDEO_OFFSET) * fraction;
            }
        }, { passive: true });

        function tick() {
            if (video.duration && !isSeeking) {
                const diff = targetTime - video.currentTime;
                const absDiff = Math.abs(diff);

                if (absDiff > 0.05) {
                    if (diff > 0) {
                        // Going FORWARD: play() with hardware acceleration
                        video.playbackRate = Math.min(absDiff * 3, 4);
                        if (video.paused) video.play().catch(() => { });
                    } else {
                        // Going BACKWARD: seek to nearest keyframe
                        if (!video.paused) { video.pause(); video.playbackRate = 1; }
                        isSeeking = true;
                        if (video.fastSeek) video.fastSeek(targetTime);
                        else video.currentTime = targetTime;
                    }
                } else {
                    // At target — stop cleanly
                    if (!video.paused) { video.pause(); video.playbackRate = 1; }
                }
            }
            requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    if (video) {
        if (video.readyState >= 1) initScrub();
        else video.addEventListener('loadedmetadata', initScrub, { once: true });
    }



    localStorage.removeItem('cash_flow_cars');

    loadSiteMedia();
    loadInventory();
    loadEvents();

});




// =====================================================
// EVENTS (Fetch from Supabase)
// =====================================================
async function loadEvents() {
    const upcomingGrid = document.getElementById('upcoming-events-grid');
    const pastGrid = document.getElementById('past-events-grid');

    if (!upcomingGrid || !pastGrid) return;

    try {
        const { data: events, error } = await window.supabaseClient
            .from('events')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching events:', error);
            return;
        }

        upcomingGrid.innerHTML = '';
        pastGrid.innerHTML = '';

        events.forEach(event => {
            const isUpcoming = event.is_upcoming;

            // Build the card HTML depending on if it's upcoming (expandable) or past (simple)
            const badgeLabel = isUpcoming ? "PRÓXIMO" : "PASADO";
            const badgeClass = isUpcoming ? "event-badge--upcoming" : "";

            let cardHTML = `
                <div class="event-card ${isUpcoming ? 'event-card--upcoming event-card--expandable' : ''}">
                    <!-- Foto -->
                    <div class="evc-carousel ${isUpcoming ? 'evc-carousel--full' : ''}" data-carousel>
                        <div class="evc-slides">
                            <img class="evc-slide active" src="${event.image_url}" alt="${event.title}">
                        </div>
                        ${!isUpcoming ? '<img class="photo-logo photo-logo--sm" src="assets/logo.png" alt="Cash & Flow">' : ''}
                        <span class="event-badge ${badgeClass}">${badgeLabel}</span>
                    </div>
                    <!-- Info -->
                    <div class="evc-body">
                        <div class="evc-date">
                            <span class="evc-day">${event.day}</span>
                            <span class="evc-month">${event.month}</span>
                        </div>
                        <div class="evc-details">
                            <h4>${event.title}</h4>
                            <p class="evc-preview">${isUpcoming ? event.location + ' · Ver detalles ↓' : event.description}</p>
                            ${isUpcoming ? '<span class="evc-expand-hint">Ver detalles ↓</span>' : ''}
                        </div>
                    </div>
            `;

            if (isUpcoming) {
                cardHTML += `
                    <!-- Detalles expandidos (ocultos por defecto) -->
                    <div class="evc-expanded">
                        <div class="evc-expanded-inner">
                            <div class="evc-detail-row">
                                <span class="evc-detail-icon">📍</span>
                                <span>${event.location}</span>
                            </div>
                            <div class="evc-detail-row">
                                <span class="evc-detail-icon">📅</span>
                                <span>${event.date}</span>
                            </div>
                            <div class="evc-detail-row">
                                <span class="evc-detail-icon">📝</span>
                                <span>${event.description}</span>
                            </div>
                            <a href="#contact" class="event-cta" style="margin-top:0.6rem; display:inline-block;">Registrarme →</a>
                        </div>
                    </div>
                `;
            }

            cardHTML += `</div>`;

            // Insert into the proper grid
            if (isUpcoming) {
                upcomingGrid.insertAdjacentHTML('beforeend', cardHTML);
            } else {
                pastGrid.insertAdjacentHTML('beforeend', cardHTML);
            }
        });

        // Re-initialize event listeners for new expandable cards
        document.querySelectorAll('.event-card--expandable').forEach(card => {
            card.addEventListener('click', () => {
                card.classList.toggle('expanded');
            });
        });

    } catch (err) {
        console.error('Unexpected error loading events:', err);
    }
}

// =====================================================
// SITE MEDIA (Fetch from Supabase)
// =====================================================
async function loadSiteMedia() {
    try {
        const { data: media, error } = await window.supabaseClient
            .from('site_media')
            .select('*');

        if (error) {
            console.error('Error fetching media:', error);
            return;
        }

        const bgVideoRecord = media.find(m => m.key_name === 'bg_video');
        if (bgVideoRecord) {
            const videoElem = document.getElementById('bgVideo');
            if (videoElem) {
                const source = videoElem.querySelector('source');
                // Only swap src if it's actually different (avoid resetting during scrubbing)
                if (source && source.src !== bgVideoRecord.media_url) {
                    source.src = bgVideoRecord.media_url;
                    videoElem.load();
                    // Re-connect the scrub system once the new video loads
                    scrubRunning = false;
                    videoElem.addEventListener('loadedmetadata', initScrub, { once: true });
                }
            }
        }
    } catch (err) {
        console.error('Unexpected error loading site media:', err);
    }
}

// =====================================================
// INVENTARIO (Fetch from Supabase)
// =====================================================
async function loadInventory() {
    const carsGrid = document.getElementById('cars-grid');
    if (!carsGrid) return;

    // Show a loading indicator while fetching
    carsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#b0b0b0;">Cargando inventario exclusivo...</p>';

    try {
        // Fetch only featured cars, max 4 for the homepage
        const { data: cars, error } = await window.supabaseClient
            .from('inventory_cars')
            .select('*')
            .eq('is_featured', true)
            .order('created_at', { ascending: true }) // Mantiene el orden de inserción original
            .limit(4);

        if (error) {
            console.error('Error fetching cars:', error);
            carsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#ff4444;">Error al cargar el inventario. Por favor intenta más tarde.</p>';
            return;
        }

        carsGrid.innerHTML = '';

        if (!cars || cars.length === 0) {
            carsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#b0b0b0;">No hay vehículos disponibles en este momento.</p>';
            return;
        }

        cars.forEach(car => {
            const card = document.createElement('div');
            card.className = 'car-card';

            const firstImage = car.image_url ? car.image_url.split(',')[0].trim() : 'inventario/imagenes_coches/coche_1.jpeg';

            // Note: columns from Supabase are lowercase (e.g., image_url rather than imageUrl)
            card.innerHTML = `
                <div class="car-image-container">
                    <img src="${firstImage}" alt="${car.brand} ${car.model}" loading="lazy">
                    <video class="hover-video" src="${car.preview_video_url || 'BMW BY Jm.mp4'}" muted loop playsinline preload="none"></video>
                </div>
                <div class="car-info">
                    <div class="car-brand">${car.brand} <span style="color:#b0b0b0;font-size:0.8rem">- ${car.year}</span></div>
                    <div class="car-model">${car.model}</div>
                    <div class="car-price">${car.price}</div>
                    <ul class="car-specs">
                        <li>Motor: ${car.engine}</li>
                        <li>HP: ${car.hp}</li>
                        <li>0-100: ${car.acceleration}</li>
                        <li>Kilometraje: ${car.mileage || 'N/A'}</li>
                        <li>Dueños: ${car.owners || 'N/A'}</li>
                    </ul>
                    <a href="#contact" class="btn-details">Me Interesa</a>
                </div>
            `;

            const videoElement = card.querySelector('video.hover-video');

            card.addEventListener('mouseenter', () => {
                if (videoElement.readyState === 0) {
                    videoElement.load();
                }
                videoElement.play().then(() => {
                    videoElement.classList.add('is-ready');
                }).catch(e => console.log('Reproducción del hover prevent', e));
            });

            card.addEventListener('mouseleave', () => {
                videoElement.pause();
                videoElement.classList.remove('is-ready');
            });

            carsGrid.appendChild(card);
        });
    } catch (err) {
        console.error('Unexpected error loading inventory:', err);
        carsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#ff4444;">Error de red al cargar el inventario.</p>';
    }
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

// EXPANDABLE EVENT CARDS  click para ver detalles

// =====================================================

document.querySelectorAll('.event-card--expandable').forEach(card => {

    card.addEventListener('click', e => {

        if (e.target.closest('a')) return;

        card.classList.toggle('expanded');

    });

});

