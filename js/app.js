const VIDEO_OFFSET = 2;
let scrubVideo = null;
let targetTime = VIDEO_OFFSET;
let isSeeking = false;
let scrubRunning = false;
let scrubScrollAttached = false;

function initScrub(videoElement = document.getElementById('bgVideo')) {
    if (!videoElement) return;
    scrubVideo = videoElement;
    targetTime = VIDEO_OFFSET;
    isSeeking = false;

    scrubVideo.currentTime = Math.min(VIDEO_OFFSET, scrubVideo.duration || VIDEO_OFFSET);
    scrubVideo.pause();
    scrubVideo.addEventListener('seeked', () => { isSeeking = false; });

    if (!scrubScrollAttached) {
        scrubScrollAttached = true;
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                if (window.scrollY > 50) {
                    navbar.style.background = 'rgba(11, 12, 16, 0.92)';
                    navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';
                } else {
                    navbar.style.background = 'var(--glass-bg)';
                    navbar.style.boxShadow = 'none';
                }
            }

            if (scrubVideo?.duration) {
                const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
                const fraction = Math.min(Math.max((window.scrollY / maxScroll) * 3.0, 0), 1);
                targetTime = VIDEO_OFFSET + (scrubVideo.duration - VIDEO_OFFSET) * fraction;
            }
        }, { passive: true });
    }

    if (scrubRunning) return;
    scrubRunning = true;

    function tick() {
        if (scrubVideo?.duration && !isSeeking) {
            const diff = targetTime - scrubVideo.currentTime;
            const absDiff = Math.abs(diff);

            if (absDiff > 0.05) {
                if (diff > 0) {
                    scrubVideo.playbackRate = Math.min(absDiff * 3, 4);
                    if (scrubVideo.paused) scrubVideo.play().catch(() => { });
                } else {
                    if (!scrubVideo.paused) {
                        scrubVideo.pause();
                        scrubVideo.playbackRate = 1;
                    }
                    isSeeking = true;
                    if (scrubVideo.fastSeek) scrubVideo.fastSeek(targetTime);
                    else scrubVideo.currentTime = targetTime;
                }
            } else if (!scrubVideo.paused) {
                scrubVideo.pause();
                scrubVideo.playbackRate = 1;
            }
        }
        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

window.initScrub = initScrub;

document.addEventListener('DOMContentLoaded', () => {

    const loader = document.getElementById('loader');

    const mainContent = document.getElementById('main-content');

    const loaderLogo = document.getElementById('loaderLogo');



    if (loaderLogo) {

        loaderLogo.onerror = () => console.warn('Logo no encontrado en assets/logo.png');

    }



    // =====================================================

    // LOADER â†’ HERO LOGO: Vuelo FLIP animation

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
            loaderLogo.style.transformStyle = 'flat';

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

                loaderLogo.style.filter = 'drop-shadow(0 0 18px rgba(212, 175, 55,0.5)) drop-shadow(0 8px 20px rgba(0,0,0,0.8))';

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
    // VIDEO SCRUB â€” Direct scroll position mapping, no lerp
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

            // Map scroll position DIRECTLY to video time â€” no velocity, no lerp
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
                    // At target â€” stop cleanly
                    if (!video.paused) { video.pause(); video.playbackRate = 1; }
                }
            }
            requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    if (video) {
        if (video.readyState >= 1) window.initScrub(video);
        else video.addEventListener('loadedmetadata', () => window.initScrub(video), { once: true });
    }



    localStorage.removeItem('cash_flow_cars');

    loadSiteMedia();
    loadInventory();
    loadStoryGallery();
    loadEvents();

});

// =====================================================
// STORY GALLERY (Fetch from Supabase)
// =====================================================
const fallbackGalleryItems = [
    {
        tag: 'NUESTRA HISTORIA',
        title: '¿Qué es Cash & Flow?',
        description: 'Nacimos en Querétaro con una misión simple: acercar los vehículos de la pantalla al pavimento. Somos el punto de encuentro entre quienes viven rápido y los coches que lo hacen posible.',
        image_url: 'multimedia_cash/flipbook_garage.png'
    },
    {
        tag: 'EVENTOS',
        title: 'Noches que no se olvidan',
        description: 'Cada reunión de Cash & Flow es una experiencia: motores que encienden conversaciones, modelos que detienen el tiempo y una comunidad que comparte la misma pasión.',
        image_url: 'multimedia_cash/flipbook_event.png'
    },
    {
        tag: 'COMUNIDAD',
        title: 'Más que clientes, somos familia',
        description: 'El verdadero motor de Cash & Flow está en cada persona que confía en nosotros para encontrar su próximo vehículo.',
        image_url: 'multimedia_cash/cash0403.png'
    }
];

let storyGalleryItems = [];
let storyGalleryIndex = 0;
let storyGalleryTimer = null;

async function loadStoryGallery() {
    const gallery = document.getElementById('story-gallery');
    if (!gallery) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('gallery_items')
            .select('id, tag, title, description, image_url, created_at')
            .order('created_at', { ascending: true });

        if (error) throw error;
        storyGalleryItems = data?.length ? data : fallbackGalleryItems;
    } catch (err) {
        console.error('Error loading story gallery:', err);
        storyGalleryItems = fallbackGalleryItems;
    }

    renderStoryGalleryControls();
    showStoryGalleryItem(0);
    startStoryGalleryAutoplay();
}

function renderStoryGalleryControls() {
    const controls = document.getElementById('story-gallery-controls');
    if (!controls) return;

    controls.innerHTML = storyGalleryItems.map((_, index) => (
        `<button type="button" class="story-gallery-dot" data-gallery-index="${index}" aria-label="Ver foto ${index + 1}"></button>`
    )).join('');

    controls.querySelectorAll('[data-gallery-index]').forEach((button) => {
        button.addEventListener('click', () => {
            showStoryGalleryItem(Number(button.dataset.galleryIndex));
            startStoryGalleryAutoplay();
        });
    });
}

function showStoryGalleryItem(index) {
    if (!storyGalleryItems.length) return;

    storyGalleryIndex = (index + storyGalleryItems.length) % storyGalleryItems.length;
    const item = storyGalleryItems[storyGalleryIndex];
    const image = document.getElementById('story-gallery-image');
    const tag = document.getElementById('story-gallery-tag');
    const title = document.getElementById('story-gallery-title');
    const description = document.getElementById('story-gallery-description');

    if (image) {
        image.src = item.image_url || 'multimedia_cash/flipbook_garage.png';
        image.alt = item.title || 'Cash & Flow';
    }
    if (tag) tag.textContent = item.tag || 'Cash & Flow';
    if (title) title.textContent = item.title || 'Cash & Flow';
    if (description) description.textContent = item.description || '';

    document.querySelectorAll('.story-gallery-dot').forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === storyGalleryIndex);
    });
}

function startStoryGalleryAutoplay() {
    if (storyGalleryTimer) clearInterval(storyGalleryTimer);
    storyGalleryTimer = setInterval(() => showStoryGalleryItem(storyGalleryIndex + 1), 5000);
}




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

        const sortedEvents = [...(events || [])].sort(sortPublicEvents);

        sortedEvents.forEach(event => {
            const cardHTML = buildEventCardHTML(event);
            if (event.is_upcoming) upcomingGrid.insertAdjacentHTML('beforeend', cardHTML);
            else pastGrid.insertAdjacentHTML('beforeend', cardHTML);
        });

        if (!upcomingGrid.children.length) {
            upcomingGrid.innerHTML = '<p class="events-empty">No hay eventos proximos por ahora.</p>';
        }

        if (!pastGrid.children.length) {
            pastGrid.innerHTML = '<p class="events-empty">No hay eventos pasados por ahora.</p>';
        }

        document.querySelectorAll('.event-card--expandable').forEach(card => {
            card.addEventListener('click', (event) => {
                if (event.target.closest('a')) return;
                card.classList.toggle('expanded');
            });
        });

        startCountdowns();
    } catch (err) {
        console.error('Unexpected error loading events:', err);
    }
}

function buildEventCardHTML(event) {
    const isUpcoming = !!event.is_upcoming;
    const eventDate = getEventDate(event);
    const readableDate = eventDate ? formatEventDate(eventDate) : event.date || 'Fecha por confirmar';
    const imageUrl = event.image_url || 'multimedia_cash/event_upcoming.png';
    const description = event.description || 'Detalles disponibles proximamente.';
    const ctaLink = event.cta_link || '#contact';
    const badgeLabel = isUpcoming ? 'PROXIMO' : 'PASADO';
    const badgeClass = isUpcoming ? 'event-badge--upcoming' : '';
    const countdown = isUpcoming && eventDate ? buildCountdownHTML(eventDate) : '';

    return `
        <div class="event-card ${isUpcoming ? 'event-card--upcoming event-card--expandable' : ''}">
            <div class="evc-carousel ${isUpcoming ? 'evc-carousel--full' : ''}" data-carousel>
                <div class="evc-slides">
                    <img class="evc-slide active" src="${escapeAttr(imageUrl)}" alt="${escapeAttr(event.title || 'Evento')}">
                </div>
                <img class="photo-logo photo-logo--sm" src="assets/logo.png" alt="Cash & Flow">
                <span class="event-badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="evc-body">
                <div class="evc-date">
                    <span class="evc-day">${escapeHtml(event.day || eventDate?.getDate() || '--')}</span>
                    <span class="evc-month">${escapeHtml(event.month || getShortMonth(eventDate))}</span>
                </div>
                <div class="evc-details">
                    <h4>${escapeHtml(event.title || 'Evento Cash & Flow')}</h4>
                    <p class="evc-preview">${escapeHtml(isUpcoming ? `${event.location || 'Lugar por confirmar'} · ${readableDate}` : description)}</p>
                    ${isUpcoming ? '<span class="evc-expand-hint">Ver detalles</span>' : ''}
                </div>
            </div>
            ${countdown}
            <div class="evc-expanded">
                <div class="evc-expanded-inner">
                    <div class="evc-detail-row"><strong>Lugar</strong><span>${escapeHtml(event.location || 'Por confirmar')}</span></div>
                    <div class="evc-detail-row"><strong>Fecha</strong><span>${escapeHtml(readableDate)}</span></div>
                    <div class="evc-detail-row"><strong>Descripcion</strong><span>${escapeHtml(description)}</span></div>
                    ${isUpcoming ? `<a href="${escapeAttr(ctaLink)}" class="event-cta">Registrarme</a>` : ''}
                </div>
            </div>
        </div>
    `;
}

function buildCountdownHTML(date) {
    return `
        <div class="event-countdown" data-countdown="${escapeAttr(date.toISOString())}">
            <div><strong data-unit="days">--</strong><span>Dias</span></div>
            <div><strong data-unit="hours">--</strong><span>Hrs</span></div>
            <div><strong data-unit="minutes">--</strong><span>Min</span></div>
            <div><strong data-unit="seconds">--</strong><span>Seg</span></div>
        </div>
    `;
}

let countdownTimer = null;

function startCountdowns() {
    if (countdownTimer) clearInterval(countdownTimer);
    updateCountdowns();
    countdownTimer = setInterval(updateCountdowns, 1000);
}

function updateCountdowns() {
    document.querySelectorAll('[data-countdown]').forEach((countdown) => {
        const target = new Date(countdown.dataset.countdown).getTime();
        const diff = target - Date.now();

        if (!Number.isFinite(target) || diff <= 0) {
            countdown.innerHTML = '<div class="event-countdown-live">El evento ya inicio</div>';
            return;
        }

        const totalSeconds = Math.floor(diff / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        setCountdownUnit(countdown, 'days', days);
        setCountdownUnit(countdown, 'hours', hours);
        setCountdownUnit(countdown, 'minutes', minutes);
        setCountdownUnit(countdown, 'seconds', seconds);
    });
}

function setCountdownUnit(root, unit, value) {
    const node = root.querySelector(`[data-unit="${unit}"]`);
    if (node) node.textContent = String(value).padStart(2, '0');
}

function getEventDate(event) {
    if (!event?.event_datetime) return null;
    const date = new Date(event.event_datetime);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatEventDate(date) {
    return date.toLocaleString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getShortMonth(date) {
    if (!date) return '';
    return date.toLocaleString('es-MX', { month: 'short' }).replace('.', '').toUpperCase();
}

function sortPublicEvents(a, b) {
    if (a.is_upcoming !== b.is_upcoming) return a.is_upcoming ? -1 : 1;
    const aTime = getEventDate(a)?.getTime() || 0;
    const bTime = getEventDate(b)?.getTime() || 0;
    return a.is_upcoming ? aTime - bTime : bTime - aTime;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
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
                    // Re-connect the scrub system once the new video loads.
                    videoElem.addEventListener('loadedmetadata', () => initScrub(videoElem), { once: true });
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
            .order('created_at', { ascending: true }) // Mantiene el orden de inserciÃ³n original
            .limit(4);

        if (error) {
            console.error('Error fetching cars:', error);
            carsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#ff4444;">Error al cargar el inventario. Por favor intenta mÃ¡s tarde.</p>';
            return;
        }

        carsGrid.innerHTML = '';

        if (!cars || cars.length === 0) {
            carsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#b0b0b0;">No hay vehÃ­culos disponibles en este momento.</p>';
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
                        <li>Due&ntilde;os: ${car.owners || 'N/A'}</li>
                    </ul>
                    <button type="button" class="btn-details btn-me-interesa">Me Interesa</button>
                </div>
            `;

            const videoElement = card.querySelector('video.hover-video');

            card.addEventListener('mouseenter', () => {
                if (videoElement.readyState === 0) {
                    videoElement.load();
                }
                videoElement.play().then(() => {
                    videoElement.classList.add('is-ready');
                }).catch(e => console.log('ReproducciÃ³n del hover prevent', e));
            });

            card.addEventListener('mouseleave', () => {
                videoElement.pause();
                videoElement.classList.remove('is-ready');
            });

            card.querySelector('.btn-me-interesa').addEventListener('click', () => {
                window.openAdvisorWithCar({
                    id: car.id,
                    brand: car.brand,
                    model: car.model,
                    year: car.year,
                    price: car.price
                });
            });

            carsGrid.appendChild(card);
        });
    } catch (err) {
        console.error('Unexpected error loading inventory:', err);
        carsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#ff4444;">Error de red al cargar el inventario.</p>';
    }
}

// =====================================================
// FLIPBOOK â€” auto-avance cada 7 segundos
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



    startTimer(); // Arrancar el timer automÃ¡tico

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


// =====================================================
// MODAL: HABLAR CON UN ASESOR
// =====================================================
(function initAdvisorModal() {
    const EMAILJS_PUBLIC_KEY       = 'gVteD6q6M90d2-wTBbp5K';
    const EMAILJS_SERVICE_ID       = 'service_x6hvqrv';
    const EMAILJS_CONFIRM_TEMPLATE = 'xcsuknr';   // Confirmación al cliente
    const EMAILJS_REPLY_TEMPLATE   = 'xq9oagk';   // Respuesta del admin al cliente

    if (typeof emailjs !== 'undefined') emailjs.init(EMAILJS_PUBLIC_KEY);

    const overlay  = document.getElementById('advisor-overlay');
    const closeBtn = document.getElementById('advisor-close-btn');
    const doneBtn  = document.getElementById('advisor-done-btn');

    if (!overlay) return;

    function showScreen(id) {
        overlay.querySelectorAll('.advisor-screen').forEach(s => s.style.display = 'none');
        const screen = document.getElementById(id);
        if (screen) screen.style.display = '';
    }

    function openAdvisor(defaultType, carData) {
        showScreen('advisor-screen-type');
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        if (carData) {
            const label = [carData.brand, carData.model, carData.year].filter(Boolean).join(' ');
            avVehicleInput.value = label;
            avCarIdInput.value   = carData.id || '';
            avVehicleInput.dataset.selectedSnapshot = JSON.stringify({
                brand: carData.brand, model: carData.model,
                year: carData.year,   price: carData.price
            });
            avVehicleInput.readOnly = true;
            avVehicleInput.style.opacity = '0.7';
            showScreen('advisor-screen-vehicle');
        } else if (defaultType) {
            const card = overlay.querySelector(`[data-type="${defaultType}"]`);
            if (card) card.click();
        }
    }

    // Exponer para que loadInventory() pueda llamarlo
    window.openAdvisorWithCar = (carData) => openAdvisor(null, carData);

    function closeAdvisor() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        avVehicleInput.readOnly = false;
        avVehicleInput.style.opacity = '';
    }

    async function sendConfirmationEmail(name, email, title, requestId) {
        if (!email || typeof emailjs === 'undefined') return;
        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CONFIRM_TEMPLATE, {
                to_email:   email,
                name:       name,
                title:      title,
                request_id: requestId
            });
        } catch (err) {
            console.warn('Email de confirmación no enviado:', err);
        }
    }

    // Exponer función de email de respuesta para admin.js
    window.sendAdminReplyEmail = async function(customerEmail, customerName, carTitle, adminMessage, leadId) {
        if (!customerEmail || typeof emailjs === 'undefined') return;
        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_REPLY_TEMPLATE, {
                to_email:  customerEmail,
                name:      customerName,
                car_title: carTitle,
                message:   adminMessage,
                reply_to:  'cahs.flow.10@gmail.com'
            });
        } catch (err) {
            console.warn('Email de respuesta no enviado:', err);
        }
    };

    // Abrir desde botones del homepage
    document.getElementById('hero-advisor-btn')?.addEventListener('click', () => openAdvisor());
    document.getElementById('inventory-advisor-btn')?.addEventListener('click', () => openAdvisor());

    // Cerrar
    closeBtn.addEventListener('click', closeAdvisor);
    doneBtn?.addEventListener('click', closeAdvisor);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeAdvisor(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAdvisor(); });

    // Selección de tipo
    overlay.querySelectorAll('[data-type]').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            showScreen(type === 'vehicle_quote' ? 'advisor-screen-vehicle' : 'advisor-screen-general');
        });
    });

    // Botones "Regresar"
    overlay.querySelectorAll('[data-back]').forEach(btn => {
        btn.addEventListener('click', () => showScreen(`advisor-screen-${btn.dataset.back}`));
    });

    // Generar ID legible: CF-XXXXXX (6 chars alfanuméricos en mayúsculas)
    function generateRequestId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let id = 'CF-';
        for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
        return id;
    }

    function setSubmitLoading(btn, loading) {
        btn.disabled = loading;
        btn.textContent = loading ? 'Enviando...' : btn.dataset.originalText || 'Enviar';
    }

    async function submitLead(payload) {
        if (!window.supabaseClient) throw new Error('Supabase no disponible');
        const { data, error } = await window.supabaseClient
            .from('vehicle_leads')
            .insert([payload])
            .select('id')
            .single();
        if (error) throw error;
        return data;
    }

    function showSuccess(requestId) {
        document.getElementById('advisor-request-id').textContent = requestId;
        showScreen('advisor-screen-success');
    }

    // ── Autocomplete de vehículos ──────────────────────────────────────────
    const avVehicleInput  = document.getElementById('av-vehicle');
    const avCarIdInput    = document.getElementById('av-car-id');
    const avDropdown      = document.getElementById('av-car-dropdown');
    let avDebounce        = null;
    let avCars            = [];      // cache de búsqueda actual
    let avFocusedIndex    = -1;

    function renderDropdown(cars) {
        avCars = cars;
        avFocusedIndex = -1;
        if (!cars.length) {
            avDropdown.innerHTML = '<div class="av-car-none">Sin resultados en inventario</div>';
            avDropdown.classList.add('open');
            return;
        }
        avDropdown.innerHTML = cars.map((car, i) => `
            <div class="av-car-option" data-index="${i}" data-id="${car.id}">
                <strong>${car.brand} ${car.model} ${car.year || ''}</strong>
                <span>${car.price ? car.price : ''}</span>
            </div>
        `).join('');
        avDropdown.querySelectorAll('.av-car-option').forEach(opt => {
            opt.addEventListener('mousedown', (e) => {
                e.preventDefault();
                selectCar(avCars[parseInt(opt.dataset.index)]);
            });
        });
        avDropdown.classList.add('open');
    }

    function selectCar(car) {
        avVehicleInput.value = `${car.brand} ${car.model} ${car.year || ''}`.trim();
        avCarIdInput.value   = car.id;
        avDropdown.classList.remove('open');
        avDropdown.innerHTML = '';
        avVehicleInput.dataset.selectedSnapshot = JSON.stringify({ brand: car.brand, model: car.model, year: car.year, price: car.price });
    }

    function closeDropdown() {
        avDropdown.classList.remove('open');
    }

    avVehicleInput?.addEventListener('input', () => {
        avCarIdInput.value = '';
        delete avVehicleInput.dataset.selectedSnapshot;
        const q = avVehicleInput.value.trim();
        clearTimeout(avDebounce);
        if (q.length < 2) { closeDropdown(); return; }
        avDebounce = setTimeout(async () => {
            try {
                const { data } = await window.supabaseClient
                    .from('inventory_cars')
                    .select('id, brand, model, year, price')
                    .or(`brand.ilike.%${q}%,model.ilike.%${q}%`)
                    .order('brand')
                    .limit(8);
                renderDropdown(data || []);
            } catch { closeDropdown(); }
        }, 220);
    });

    avVehicleInput?.addEventListener('keydown', (e) => {
        const opts = avDropdown.querySelectorAll('.av-car-option');
        if (!opts.length) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            avFocusedIndex = Math.min(avFocusedIndex + 1, opts.length - 1);
            opts.forEach((o, i) => o.classList.toggle('focused', i === avFocusedIndex));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            avFocusedIndex = Math.max(avFocusedIndex - 1, 0);
            opts.forEach((o, i) => o.classList.toggle('focused', i === avFocusedIndex));
        } else if (e.key === 'Enter' && avFocusedIndex >= 0) {
            e.preventDefault();
            selectCar(avCars[avFocusedIndex]);
        } else if (e.key === 'Escape') {
            closeDropdown();
        }
    });

    avVehicleInput?.addEventListener('blur', () => setTimeout(closeDropdown, 150));

    // Submit: cotización de vehículo
    document.getElementById('advisor-form-vehicle')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('advisor-submit-vehicle');
        if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;

        const name  = document.getElementById('av-name').value.trim();
        const phone = document.getElementById('av-phone').value.trim();
        if (!name || !phone) {
            if (!name) document.getElementById('av-name').classList.add('invalid');
            if (!phone) document.getElementById('av-phone').classList.add('invalid');
            return;
        }
        document.getElementById('av-name').classList.remove('invalid');
        document.getElementById('av-phone').classList.remove('invalid');

        const requestId = generateRequestId();
        setSubmitLoading(btn, true);

        try {
            const vehicle    = avVehicleInput.value.trim();
            const carId      = avCarIdInput.value || null;
            const snapshot   = avVehicleInput.dataset.selectedSnapshot
                ? JSON.parse(avVehicleInput.dataset.selectedSnapshot)
                : (vehicle ? { vehicle_interest: vehicle } : null);
            const budgetRaw  = document.getElementById('av-budget').value.replace(/[^0-9.]/g, '');

            const email = document.getElementById('av-email').value.trim() || null;
            await submitLead({
                lead_type: 'vehicle_quote',
                car_id: carId,
                customer_name: name,
                customer_phone: phone,
                customer_email: email,
                subject: vehicle || null,
                budget_mxn: budgetRaw ? parseFloat(budgetRaw) : null,
                message: document.getElementById('av-message').value.trim() || vehicle || 'Sin mensaje',
                source: 'homepage_advisor',
                status: 'nuevo',
                car_snapshot: snapshot
            });
            sendConfirmationEmail(name, email, vehicle || 'Cotización de vehículo', requestId);
            showSuccess(requestId);
        } catch (err) {
            console.error('Error enviando cotización:', err);
            showSuccess(requestId);
        } finally {
            setSubmitLoading(btn, false);
        }
    });

    // Submit: consulta general
    document.getElementById('advisor-form-general')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('advisor-submit-general');
        if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;

        const name    = document.getElementById('ag-name').value.trim();
        const phone   = document.getElementById('ag-phone').value.trim();
        const message = document.getElementById('ag-message').value.trim();
        if (!name || !phone || !message) {
            if (!name)    document.getElementById('ag-name').classList.add('invalid');
            if (!phone)   document.getElementById('ag-phone').classList.add('invalid');
            if (!message) document.getElementById('ag-message').classList.add('invalid');
            return;
        }
        ['ag-name','ag-phone','ag-message'].forEach(id =>
            document.getElementById(id).classList.remove('invalid'));

        const requestId = generateRequestId();
        setSubmitLoading(btn, true);

        try {
            const emailGen = document.getElementById('ag-email').value.trim() || null;
            const subjectGen = document.getElementById('ag-subject').value.trim() || 'Consulta general';
            await submitLead({
                lead_type: 'general',
                customer_name: name,
                customer_phone: phone,
                customer_email: emailGen,
                subject: subjectGen,
                message,
                source: 'homepage_advisor',
                status: 'nuevo'
            });
            sendConfirmationEmail(name, emailGen, subjectGen, requestId);
            showSuccess(requestId);
        } catch (err) {
            console.error('Error enviando consulta:', err);
            showSuccess(requestId);
        } finally {
            setSubmitLoading(btn, false);
        }
    });

    // Limpiar clase invalid al escribir
    overlay.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', () => el.classList.remove('invalid'));
    });
})();

