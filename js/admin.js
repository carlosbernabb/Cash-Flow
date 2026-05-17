document.addEventListener('DOMContentLoaded', () => {
    const BUCKET = 'car_media';

    const state = {
        cars: [],
        events: [],
        galleryItems: [],
        leads: [],
        carColumns: new Set(),
        eventColumns: new Set(),
        galleryColumns: new Set(),
        editingCarId: null,
        editingEventId: null,
        editingGalleryId: null,
        activeLeadId: null,
        activeTab: 'cars',
        profile: null
    };

    const $ = (id) => document.getElementById(id);

    const els = {
        lock: $('admin-lock'),
        shell: $('admin-shell'),
        loginForm: $('admin-login-form'),
        logoutBtn: $('logout-btn'),
        tabs: document.querySelectorAll('.admin-tab'),
        panels: {
            cars: $('cars-panel'),
            events: $('events-panel'),
            gallery: $('gallery-panel'),
            leads: $('leads-panel')
        },
        carList: $('admin-cars-list'),
        upcomingEventsSection: $('admin-upcoming-events-section'),
        pastEventsSection: $('admin-past-events-section'),
        upcomingEventList: $('admin-upcoming-events-list'),
        pastEventList: $('admin-past-events-list'),
        carCount: $('car-count'),
        eventCount: $('event-count'),
        galleryList: $('admin-gallery-list'),
        galleryCount: $('gallery-count'),
        leadsList: $('admin-leads-list'),
        leadCount: $('lead-count'),
        upcomingEventCount: $('upcoming-event-count'),
        pastEventCount: $('past-event-count'),
        carSearch: $('admin-car-search'),
        brandFilter: $('admin-brand-filter'),
        yearFilter: $('admin-year-filter'),
        featureFilter: $('admin-feature-filter'),
        eventSearch: $('admin-event-search'),
        eventFilter: $('admin-event-filter'),
        gallerySearch: $('admin-gallery-search'),
        galleryFilter: $('admin-gallery-filter'),
        leadSearch: $('admin-lead-search'),
        leadFilter: $('admin-lead-filter'),
        leadTypeFilter: $('admin-lead-type-filter'),
        carModal: $('car-modal'),
        eventModal: $('event-modal'),
        galleryModal: $('gallery-modal'),
        leadModal: $('lead-modal-admin'),
        carForm: $('car-form'),
        eventForm: $('event-form'),
        galleryForm: $('gallery-form'),
        leadMessageForm: $('lead-message-form'),
        carPreviewStrip: $('car-preview-strip'),
        eventPreviewStrip: $('event-preview-strip'),
        galleryPreviewStrip: $('gallery-preview-strip')
    };

    if (!window.supabaseClient) {
        showToast('No se encontro Supabase');
        return;
    }

    initAuth();
    bindShell();
    bindForms();
    bindPreviews();

    async function initAuth() {
        setLocked(true);

        els.loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            await signInAdmin();
        });

        els.logoutBtn.addEventListener('click', async () => {
            await window.supabaseClient.auth.signOut();
            state.profile = null;
            setLocked(true);
        });

        const { data } = await window.supabaseClient.auth.getSession();
        if (data.session) await unlockIfAdmin(data.session.user);
    }

    async function signInAdmin() {
        const email = $('admin-user').value.trim();
        const password = $('admin-pass').value;
        const submit = els.loginForm.querySelector('button[type="submit"]');
        const oldText = submit.textContent;
        submit.disabled = true;
        submit.textContent = 'Validando...';

        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            await unlockIfAdmin(data.user);
        } catch (err) {
            console.error('Login error:', err);
            showToast('Credenciales invalidas o usuario sin acceso');
            await window.supabaseClient.auth.signOut();
            setLocked(true);
        } finally {
            submit.disabled = false;
            submit.textContent = oldText;
        }
    }

    async function unlockIfAdmin(user) {
        if (!user) return;

        const { data: profile, error } = await window.supabaseClient
            .from('user_profiles')
            .select('id, username, role')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Profile error:', error);
            showToast('No se pudo validar el rol en Supabase');
            await window.supabaseClient.auth.signOut();
            setLocked(true);
            return;
        }

        if (profile?.role !== 'admin') {
            showToast('Este usuario no tiene rol de admin');
            await window.supabaseClient.auth.signOut();
            setLocked(true);
            return;
        }

        state.profile = profile;
        setLocked(false);
        await bootstrap();
    }

    function setLocked(locked) {
        els.lock.classList.toggle('active', locked);
        els.shell.hidden = locked;
    }

    async function bootstrap() {
        await Promise.all([fetchCars(), fetchEvents(), fetchGallery(), fetchLeads()]);
        renderAll();
    }

    function bindShell() {
        $('add-car-btn').addEventListener('click', () => openCarModal());
        $('add-event-btn').addEventListener('click', () => openEventModal());
        $('add-gallery-btn').addEventListener('click', () => openGalleryModal());

        document.querySelectorAll('[data-close-modal]').forEach((button) => {
            button.addEventListener('click', () => closeModal(button.dataset.closeModal));
        });

        [els.carModal, els.eventModal, els.galleryModal, els.leadModal].forEach((modal) => {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) closeModal(modal.id);
            });
        });

        els.tabs.forEach((tab) => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });

        [els.carSearch, els.brandFilter, els.yearFilter, els.featureFilter].forEach((control) => {
            control.addEventListener('input', renderCars);
            control.addEventListener('change', renderCars);
        });

        [els.eventSearch, els.eventFilter].forEach((control) => {
            control.addEventListener('input', renderEvents);
            control.addEventListener('change', renderEvents);
        });

        [els.gallerySearch, els.galleryFilter].forEach((control) => {
            control.addEventListener('input', renderGallery);
            control.addEventListener('change', renderGallery);
        });

        [els.leadSearch, els.leadFilter, els.leadTypeFilter].forEach((control) => {
            if (!control) return;
            control.addEventListener('input', renderLeads);
            control.addEventListener('change', renderLeads);
        });

        $('save-appointment-btn')?.addEventListener('click', saveLeadAppointment);
        $('mark-contacted-btn')?.addEventListener('click', () => {
            if (state.activeLeadId) updateLeadStatus(state.activeLeadId, 'contactado', { keepModalOpen: true });
        });
    }

    function bindForms() {
        els.carForm.addEventListener('submit', saveCar);
        els.eventForm.addEventListener('submit', saveEvent);
        els.galleryForm.addEventListener('submit', saveGallery);
        els.leadMessageForm?.addEventListener('submit', saveLeadMessage);
        $('event-datetime').addEventListener('change', syncEventDateFields);
    }

    function bindPreviews() {
        $('car-image-files').addEventListener('change', () => {
            renderImagePreview(els.carPreviewStrip, [...$('car-image-files').files].slice(0, 8).map(URL.createObjectURL));
        });

        $('event-image-file').addEventListener('change', () => {
            const file = $('event-image-file').files[0];
            renderImagePreview(els.eventPreviewStrip, file ? [URL.createObjectURL(file)] : []);
        });

        $('gallery-image-file').addEventListener('change', () => {
            const file = $('gallery-image-file').files[0];
            renderImagePreview(els.galleryPreviewStrip, file ? [URL.createObjectURL(file)] : []);
        });
    }

    function switchTab(tabName) {
        state.activeTab = tabName;
        els.tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === tabName));
        Object.entries(els.panels).forEach(([name, panel]) => panel.classList.toggle('active', name === tabName));
    }

    async function fetchCars() {
        const { data, error } = await window.supabaseClient
            .from('inventory_cars')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error cargando carros:', error);
            showToast('Error al cargar inventario');
            state.cars = [];
            return;
        }

        state.cars = data || [];
        state.carColumns = collectColumns(state.cars, [
            'id', 'brand', 'model', 'year', 'color', 'transmission', 'price', 'old_price',
            'engine', 'hp', 'acceleration', 'image_url', 'preview_video_url', 'mileage',
            'owners', 'is_featured', 'doors', 'body_type', 'invoice', 'keys_count',
            'plates_status', 'description'
        ]);
        populateCarFilters();
    }

    async function fetchEvents() {
        const { data, error } = await window.supabaseClient
            .from('events')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error cargando eventos:', error);
            showToast('Error al cargar eventos');
            state.events = [];
            return;
        }

        state.events = data || [];
        state.eventColumns = collectColumns(state.events, [
            'id', 'title', 'date', 'month', 'day', 'location', 'description',
            'is_upcoming', 'image_url', 'event_datetime', 'cta_link'
        ]);
    }

    async function fetchGallery() {
        const { data, error } = await window.supabaseClient
            .from('gallery_items')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error cargando galeria:', error);
            showToast('Error al cargar galeria');
            state.galleryItems = [];
            return;
        }

        state.galleryItems = data || [];
        state.galleryColumns = collectColumns(state.galleryItems, [
            'id', 'tag', 'title', 'description', 'image_url', 'is_active', 'sort_order', 'created_at'
        ]);
    }

    async function fetchLeads() {
        const { data, error } = await window.supabaseClient
            .from('vehicle_leads')
            .select('*, inventory_cars(id, brand, model, year, price, image_url)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error cargando interesados:', error);
            state.leads = [];
            return;
        }

        state.leads = data || [];
        // Ensure lead_type defaults for legacy rows missing the column
        state.leads.forEach(l => { if (!l.lead_type) l.lead_type = 'vehicle_quote'; });
    }

    function collectColumns(rows, fallback) {
        const columns = new Set(fallback);
        rows.forEach((row) => Object.keys(row || {}).forEach((key) => columns.add(key)));
        return columns;
    }

    function renderAll() {
        renderCars();
        renderEvents();
        renderGallery();
        renderLeads();
    }

    function populateCarFilters() {
        const brands = unique(state.cars.map((car) => car.brand).filter(Boolean));
        const years = unique(state.cars.map((car) => car.year).filter(Boolean)).sort((a, b) => b - a);

        fillSelect(els.brandFilter, 'Todas las marcas', brands);
        fillSelect(els.yearFilter, 'Todos los anos', years);
    }

    function fillSelect(select, label, values) {
        const current = select.value;
        select.innerHTML = `<option value="">${label}</option>`;
        values.forEach((value) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
        if ([...select.options].some((option) => option.value === current)) select.value = current;
    }

    function renderCars() {
        const query = normalize(els.carSearch.value);
        const brand = els.brandFilter.value;
        const year = els.yearFilter.value;
        const feature = els.featureFilter.value;

        const cars = state.cars.filter((car) => {
            const haystack = normalize([
                car.brand, car.model, car.color, car.engine, car.transmission,
                car.body_type, car.invoice, car.plates_status, car.description
            ].join(' '));
            const matchesQuery = !query || haystack.includes(query);
            const matchesBrand = !brand || car.brand === brand;
            const matchesYear = !year || String(car.year) === String(year);
            const matchesFeature = !feature ||
                (feature === 'featured' && car.is_featured) ||
                (feature === 'regular' && !car.is_featured);
            return matchesQuery && matchesBrand && matchesYear && matchesFeature;
        });

        els.carCount.textContent = `${cars.length} vehiculo${cars.length === 1 ? '' : 's'}`;
        els.carList.innerHTML = '';

        if (!cars.length) {
            els.carList.innerHTML = '<div class="empty-state">No hay vehiculos con esos filtros.</div>';
            return;
        }

        cars.forEach((car) => {
            const card = document.createElement('article');
            card.className = 'admin-card';

            const firstImage = getImages(car.image_url)[0] || 'inventario/imagenes_coches/coche_1.jpeg';
            const videoUrl = car.preview_video_url || '';
            const specs = [
                car.year,
                car.color,
                car.mileage,
                car.engine,
                car.transmission
            ].filter(Boolean).slice(0, 5);

            card.innerHTML = `
                <div class="admin-card-media">
                    <img src="${escapeAttr(firstImage)}" alt="${escapeAttr(car.brand || 'Vehiculo')} ${escapeAttr(car.model || '')}">
                    ${videoUrl ? `<video muted loop playsinline preload="none" src="${escapeAttr(videoUrl)}"></video>` : ''}
                    ${car.is_featured ? '<span class="admin-badge">DESTACADO</span>' : ''}
                </div>
                <div class="admin-card-body">
                    <div class="admin-card-brand">${escapeHtml(car.brand || 'Sin marca')}</div>
                    <h3 class="admin-card-title">${escapeHtml(car.model || 'Sin modelo')}</h3>
                    <div class="admin-card-price">${escapeHtml(car.price || 'Sin precio')}</div>
                    <div class="admin-card-meta">
                        ${specs.map((spec) => `<span class="admin-pill">${escapeHtml(spec)}</span>`).join('')}
                    </div>
                    <div class="admin-card-actions">
                        <button type="button" data-edit-car="${car.id}">Editar</button>
                        <button type="button" class="danger" data-delete-car="${car.id}">Eliminar</button>
                    </div>
                </div>
            `;

            const video = card.querySelector('video');
            if (video) {
                card.addEventListener('mouseenter', () => {
                    video.play().then(() => video.classList.add('is-ready')).catch(() => { });
                });
                card.addEventListener('mouseleave', () => {
                    video.pause();
                    video.currentTime = 0;
                    video.classList.remove('is-ready');
                });
            }

            card.querySelector('[data-edit-car]').addEventListener('click', () => openCarModal(car));
            card.querySelector('[data-delete-car]').addEventListener('click', () => deleteCar(car.id));
            els.carList.appendChild(card);
        });
    }

    function renderEvents() {
        const query = normalize(els.eventSearch.value);
        const filter = els.eventFilter.value;

        const events = state.events.filter((event) => {
            const haystack = normalize([event.title, event.location, event.description, event.date].join(' '));
            const matchesQuery = !query || haystack.includes(query);
            const matchesFilter = !filter ||
                (filter === 'upcoming' && event.is_upcoming) ||
                (filter === 'past' && !event.is_upcoming);
            return matchesQuery && matchesFilter;
        }).sort(sortEventsForAdmin);

        els.eventCount.textContent = `${events.length} evento${events.length === 1 ? '' : 's'}`;

        const upcoming = events.filter((event) => event.is_upcoming);
        const past = events.filter((event) => !event.is_upcoming);

        els.upcomingEventsSection.hidden = filter === 'past';
        els.pastEventsSection.hidden = filter === 'upcoming';
        els.upcomingEventCount.textContent = `${upcoming.length} evento${upcoming.length === 1 ? '' : 's'}`;
        els.pastEventCount.textContent = `${past.length} evento${past.length === 1 ? '' : 's'}`;

        renderEventGroup(els.upcomingEventList, upcoming, 'No hay eventos proximos con esos filtros.');
        renderEventGroup(els.pastEventList, past, 'No hay eventos pasados con esos filtros.');
    }

    function renderEventGroup(container, events, emptyMessage) {
        container.innerHTML = '';

        if (!events.length) {
            container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
            return;
        }

        events.forEach((event) => container.appendChild(buildEventCard(event)));
    }

    function buildEventCard(event) {
        const card = document.createElement('article');
        card.className = 'admin-card';
        const readableDate = event.event_datetime ? formatAdminDate(event.event_datetime) : event.date || '';

        card.innerHTML = `
            <div class="admin-card-media">
                <img src="${escapeAttr(event.image_url || 'multimedia_cash/event_upcoming.png')}" alt="${escapeAttr(event.title || 'Evento')}">
                <span class="admin-badge">${event.is_upcoming ? 'PROXIMO' : 'PASADO'}</span>
            </div>
            <div class="admin-card-body">
                <div class="admin-card-brand">${escapeHtml(event.location || 'Sin lugar')}</div>
                <h3 class="admin-card-title">${escapeHtml(event.title || 'Sin titulo')}</h3>
                <div class="admin-card-price">${escapeHtml(event.date || readableDate)}</div>
                <div class="admin-card-meta">
                    <span class="admin-pill">${escapeHtml(event.day || '--')} ${escapeHtml(event.month || '')}</span>
                    ${event.event_datetime ? `<span class="admin-pill">${escapeHtml(readableDate)}</span>` : ''}
                </div>
                <div class="admin-card-actions">
                    <button type="button" data-edit-event="${event.id}">Editar</button>
                    <button type="button" class="danger" data-delete-event="${event.id}">Eliminar</button>
                </div>
            </div>
        `;

        card.querySelector('[data-edit-event]').addEventListener('click', () => openEventModal(event));
        card.querySelector('[data-delete-event]').addEventListener('click', () => deleteEvent(event.id));
        return card;
    }

    function renderGallery() {
        const query = normalize(els.gallerySearch.value);
        const filter = els.galleryFilter.value;

        const items = state.galleryItems.filter((item) => {
            const haystack = normalize([item.title, item.tag, item.description].join(' '));
            const matchesQuery = !query || haystack.includes(query);
            const matchesFilter = !filter || (filter === 'with-image' && item.image_url);
            return matchesQuery && matchesFilter;
        });

        els.galleryCount.textContent = `${items.length} foto${items.length === 1 ? '' : 's'}`;
        els.galleryList.innerHTML = '';

        if (!items.length) {
            els.galleryList.innerHTML = '<div class="empty-state">No hay fotos de galeria con esos filtros.</div>';
            return;
        }

        items.forEach((item) => {
            const card = document.createElement('article');
            card.className = 'admin-card';
            card.innerHTML = `
                <div class="admin-card-media">
                    <img src="${escapeAttr(item.image_url || 'multimedia_cash/flipbook_garage.png')}" alt="${escapeAttr(item.title || 'Galeria')}">
                    <span class="admin-badge">${escapeHtml(item.tag || 'GALERIA')}</span>
                </div>
                <div class="admin-card-body">
                    <div class="admin-card-brand">${escapeHtml(item.tag || 'Cash & Flow')}</div>
                    <h3 class="admin-card-title">${escapeHtml(item.title || 'Sin titulo')}</h3>
                    <div class="admin-card-price">${escapeHtml(item.description || 'Sin descripcion')}</div>
                    <div class="admin-card-actions">
                        <button type="button" data-edit-gallery="${item.id}">Editar</button>
                        <button type="button" class="danger" data-delete-gallery="${item.id}">Eliminar</button>
                    </div>
                </div>
            `;
            card.querySelector('[data-edit-gallery]').addEventListener('click', () => openGalleryModal(item));
            card.querySelector('[data-delete-gallery]').addEventListener('click', () => deleteGalleryItem(item.id));
            els.galleryList.appendChild(card);
        });
    }

    function renderLeads() {
        const query      = normalize(els.leadSearch?.value || '');
        const filter     = els.leadFilter?.value || '';
        const typeFilter = els.leadTypeFilter?.value || '';

        const leads = state.leads.filter((lead) => {
            const car = lead.inventory_cars || lead.car_snapshot || {};
            const haystack = normalize([
                lead.customer_name, lead.customer_phone, lead.customer_email,
                lead.message, lead.status, lead.subject,
                car.brand, car.model, car.year, car.price
            ].join(' '));
            const matchesQuery  = !query      || haystack.includes(query);
            const matchesFilter = !filter     || lead.status === filter;
            const matchesType   = !typeFilter || (lead.lead_type || 'vehicle_quote') === typeFilter;
            return matchesQuery && matchesFilter && matchesType;
        });

        els.leadCount.textContent = `${leads.length} solicitud${leads.length === 1 ? '' : 'es'}`;
        els.leadsList.innerHTML = '';

        if (!leads.length) {
            els.leadsList.innerHTML = '<div class="empty-state">No hay solicitudes con esos filtros.</div>';
            return;
        }

        leads.forEach((lead) => {
            const isGeneral = (lead.lead_type || 'vehicle_quote') === 'general';
            const car   = lead.inventory_cars || lead.car_snapshot || {};
            const title = isGeneral
                ? (lead.subject || 'Consulta general')
                : ([car.brand, car.model, car.year].filter(Boolean).join(' ') || 'Unidad no disponible');
            const image = isGeneral
                ? 'assets/logo.png'
                : (getImages(car.image_url)[0] || 'inventario/imagenes_coches/coche_1.jpeg');
            const typeBadgeClass = isGeneral ? 'admin-badge-general' : 'admin-badge-quote';
            const typeLabel      = isGeneral ? 'Consulta' : 'Cotización';

            const card = document.createElement('article');
            card.className = 'admin-card';
            card.innerHTML = `
                <div class="admin-card-media">
                    <img src="${escapeAttr(image)}" alt="${escapeAttr(title)}" ${isGeneral ? 'style="object-fit:contain;padding:1rem;background:#1a1a1a"' : ''}>
                    <span class="admin-badge">${escapeHtml(lead.status || 'nuevo')}</span>
                    <span class="admin-badge-type ${typeBadgeClass}">${typeLabel}</span>
                </div>
                <div class="admin-card-body">
                    <div class="admin-card-brand">${escapeHtml(lead.customer_name || 'Sin nombre')}</div>
                    <h3 class="admin-card-title">${escapeHtml(title)}</h3>
                    ${!isGeneral && (car.price || lead.car_snapshot?.price)
                        ? `<div class="admin-card-price">${escapeHtml(car.price || lead.car_snapshot?.price)}</div>`
                        : ''}
                    <div class="admin-card-meta">
                        ${lead.customer_phone ? `<span class="admin-pill">${escapeHtml(lead.customer_phone)}</span>` : ''}
                        ${lead.customer_email ? `<span class="admin-pill">${escapeHtml(lead.customer_email)}</span>` : ''}
                        ${!isGeneral && lead.budget_mxn ? `<span class="admin-pill">${formatMoney(lead.budget_mxn)}</span>` : ''}
                    </div>
                    <p class="admin-lead-message">${escapeHtml(lead.message || 'Sin mensaje')}</p>
                    ${lead.appointment_at ? `<p class="admin-lead-message"><strong>Cita:</strong> ${escapeHtml(formatAdminDate(lead.appointment_at))}</p>` : ''}
                    <div class="admin-card-actions">
                        <button type="button" class="gold" data-open-lead="${lead.id}">Ver conversacion</button>
                        <button type="button" data-lead-status="${lead.id}" data-status="contactado">Contactado</button>
                        <button type="button" data-lead-status="${lead.id}" data-status="cerrado">Cerrar</button>
                        <button type="button" class="danger" data-delete-lead="${lead.id}">Eliminar</button>
                    </div>
                </div>
            `;

            card.querySelector('[data-open-lead]').addEventListener('click', () => openLeadWorkspace(lead.id));
            card.querySelectorAll('[data-lead-status]').forEach((button) => {
                button.addEventListener('click', () => updateLeadStatus(button.dataset.leadStatus, button.dataset.status));
            });
            card.querySelector('[data-delete-lead]')?.addEventListener('click', () => deleteLead(lead.id, lead.customer_name));
            els.leadsList.appendChild(card);
        });
    }

    function openCarModal(car = null) {
        state.editingCarId = car?.id || null;
        $('car-modal-title').textContent = car ? 'Editar carro' : 'Agregar carro';
        els.carForm.reset();
        els.carPreviewStrip.innerHTML = '';

        setValue('car-brand', car?.brand);
        setValue('car-model', car?.model);
        setValue('car-year', car?.year);
        setValue('car-price', car?.price);
        setValue('car-old-price', car?.old_price);
        setValue('car-color', car?.color);
        setValue('car-mileage', car?.mileage);
        setValue('car-featured', String(car ? !!car.is_featured : true));
        setValue('car-engine', car?.engine);
        setValue('car-hp', car?.hp);
        setValue('car-accel', car?.acceleration);
        setValue('car-transmission', car?.transmission);
        setValue('car-body-type', car?.body_type);
        setValue('car-doors', car?.doors);
        setValue('car-owners', car?.owners);
        setValue('car-passengers', car?.passengers);
        setValue('car-invoice', car?.invoice);
        setValue('car-keys-count', car?.keys_count);
        setValue('car-plates-status', car?.plates_status);
        setValue('car-description', car?.description);

        renderImagePreview(els.carPreviewStrip, getImages(car?.image_url));
        openModal('car-modal');
    }

    function openEventModal(event = null) {
        state.editingEventId = event?.id || null;
        $('event-modal-title').textContent = event ? 'Editar evento' : 'Agregar evento';
        els.eventForm.reset();
        els.eventPreviewStrip.innerHTML = '';

        setValue('event-title', event?.title);
        setValue('event-date', event?.date);
        setValue('event-datetime', toLocalDateTimeInput(event?.event_datetime));
        setValue('event-day', event?.day);
        setValue('event-month', event?.month);
        setValue('event-status', String(event ? !!event.is_upcoming : true));
        setValue('event-location', event?.location);
        setValue('event-description', event?.description);
        setValue('event-cta-link', event?.cta_link);

        renderImagePreview(els.eventPreviewStrip, event?.image_url ? [event.image_url] : []);
        openModal('event-modal');
    }

    function openGalleryModal(item = null) {
        state.editingGalleryId = item?.id || null;
        $('gallery-modal-title').textContent = item ? 'Editar foto' : 'Agregar foto';
        els.galleryForm.reset();
        els.galleryPreviewStrip.innerHTML = '';

        setValue('gallery-tag', item?.tag);
        setValue('gallery-title', item?.title);
        setValue('gallery-description', item?.description);

        renderImagePreview(els.galleryPreviewStrip, item?.image_url ? [item.image_url] : []);
        openModal('gallery-modal');
    }

    async function openLeadWorkspace(id) {
        const lead = state.leads.find((item) => item.id === id);
        if (!lead) return;

        state.activeLeadId = id;
        renderLeadSummary(lead);
        setValue('lead-admin-message', '');
        setValue('lead-appointment-at', toLocalDateTimeInput(lead.appointment_at));
        setValue('lead-appointment-notes', lead.appointment_notes);
        openModal('lead-modal-admin');
        await renderLeadThread(lead);
    }

    function renderLeadSummary(lead) {
        const isGeneral = (lead.lead_type || 'vehicle_quote') === 'general';
        const car   = lead.inventory_cars || lead.car_snapshot || {};
        const title = isGeneral
            ? (lead.subject || 'Consulta general')
            : ([car.brand, car.model, car.year].filter(Boolean).join(' ') || 'Unidad no disponible');
        const typeLabel = isGeneral ? '💬 Consulta general' : '🚗 Cotización de vehículo';

        $('lead-admin-title').textContent = `${lead.customer_name || 'Cliente'} — ${title}`;
        $('lead-admin-summary').innerHTML = `
            <span class="admin-pill">${typeLabel}</span>
            <span class="admin-pill">Estado: ${escapeHtml(lead.status || 'nuevo')}</span>
            ${lead.customer_phone ? `<span class="admin-pill">${escapeHtml(lead.customer_phone)}</span>` : ''}
            ${lead.customer_email ? `<span class="admin-pill">${escapeHtml(lead.customer_email)}</span>` : ''}
            ${!isGeneral && car.price ? `<span class="admin-pill">${escapeHtml(car.price)}</span>` : ''}
            ${!isGeneral && lead.budget_mxn ? `<span class="admin-pill">Presupuesto ${formatMoney(lead.budget_mxn)}</span>` : ''}
            ${lead.appointment_at ? `<span class="admin-pill">Cita ${escapeHtml(formatAdminDate(lead.appointment_at))}</span>` : ''}
        `;
    }

    async function renderLeadThread(lead) {
        const thread = $('lead-thread');
        thread.innerHTML = '<div class="empty-state">Cargando conversacion...</div>';

        try {
            const { data, error } = await window.supabaseClient
                .from('vehicle_lead_messages')
                .select('*')
                .eq('lead_id', lead.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const messages = data?.length ? data : lead.message ? [{
                sender_type: 'cliente',
                message: lead.message,
                created_at: lead.created_at
            }] : [];

            paintLeadMessages(messages);
        } catch (err) {
            console.error('Error cargando conversacion:', err);
            const fallback = lead.message ? [{
                sender_type: 'cliente',
                message: lead.message,
                created_at: lead.created_at
            }] : [];
            paintLeadMessages(fallback, 'La tabla de mensajes aun no esta activa en Supabase.');
        }
    }

    function paintLeadMessages(messages, warning = '') {
        const thread = $('lead-thread');
        if (!messages.length) {
            thread.innerHTML = `<div class="empty-state">${warning || 'Todavia no hay mensajes para esta solicitud.'}</div>`;
            return;
        }

        thread.innerHTML = `
            ${warning ? `<div class="empty-state">${escapeHtml(warning)}</div>` : ''}
            ${messages.map((message) => `
                <div class="lead-message ${message.sender_type === 'admin' ? 'admin' : ''}">
                    <div class="lead-message-meta">
                        <span>${message.sender_type === 'admin' ? 'Admin' : message.sender_type === 'sistema' ? 'Sistema' : 'Cliente'}</span>
                        <span>${escapeHtml(formatAdminDate(message.created_at) || '')}</span>
                    </div>
                    <p>${escapeHtml(message.message)}</p>
                </div>
            `).join('')}
        `;
        thread.scrollTop = thread.scrollHeight;
    }

    async function saveCar(event) {
        event.preventDefault();
        const button = $('save-car-btn');
        const oldText = button.textContent;
        button.disabled = true;
        button.textContent = 'Guardando...';

        try {
            const current = state.cars.find((car) => car.id === state.editingCarId);
            const imageFiles = [...$('car-image-files').files].slice(0, 8);
            const videoFile = $('car-preview-video-file').files[0];
            const imageUrls = imageFiles.length
                ? await uploadFiles(imageFiles, 'cars')
                : getImages(current?.image_url);
            const videoUrl = videoFile
                ? await uploadFile(videoFile, 'videos')
                : current?.preview_video_url || 'BMW BY Jm.mp4';

            const passengers = readNumber('car-passengers');
            let description = readText('car-description');
            if (passengers !== null && !state.carColumns.has('passengers')) {
                description = appendDetail(description, `Pasajeros: ${passengers}`);
            }

            const payload = filterPayload({
                brand: readText('car-brand'),
                model: readText('car-model'),
                year: readNumber('car-year'),
                price: readText('car-price'),
                old_price: readText('car-old-price') || null,
                color: readText('car-color') || 'Por definir',
                mileage: readText('car-mileage') || '0 km',
                is_featured: $('car-featured').value === 'true',
                engine: readText('car-engine') || 'N/A',
                hp: readText('car-hp') || 'N/A',
                acceleration: readText('car-accel') || 'N/A',
                transmission: readText('car-transmission') || 'Automatica',
                body_type: readText('car-body-type') || null,
                doors: readNumber('car-doors'),
                owners: readNumber('car-owners') ?? 1,
                passengers,
                invoice: readText('car-invoice') || null,
                keys_count: readNumber('car-keys-count'),
                plates_status: readText('car-plates-status') || null,
                description: description || null,
                image_url: imageUrls.length ? imageUrls.join(',') : 'inventario/imagenes_coches/coche_1.jpeg',
                preview_video_url: videoUrl
            }, state.carColumns);

            const request = state.editingCarId
                ? window.supabaseClient.from('inventory_cars').update(payload).eq('id', state.editingCarId)
                : window.supabaseClient.from('inventory_cars').insert([payload]);

            const { error } = await request;
            if (error) throw error;

            closeModal('car-modal');
            await fetchCars();
            renderCars();
            showToast(state.editingCarId ? 'Carro actualizado' : 'Carro agregado');
        } catch (err) {
            console.error('Error guardando carro:', err);
            showToast('Error al guardar carro');
        } finally {
            button.disabled = false;
            button.textContent = oldText;
        }
    }

    async function saveEvent(event) {
        event.preventDefault();
        const button = $('save-event-btn');
        const oldText = button.textContent;
        button.disabled = true;
        button.textContent = 'Guardando...';

        try {
            const current = state.events.find((item) => item.id === state.editingEventId);
            const file = $('event-image-file').files[0];
            const imageUrl = file ? await uploadFile(file, 'events') : current?.image_url || 'multimedia_cash/event_upcoming.png';

            const payload = filterPayload({
                title: readText('event-title'),
                date: readText('event-date'),
                event_datetime: readDateTime('event-datetime'),
                day: readText('event-day'),
                month: readText('event-month').toUpperCase(),
                location: readText('event-location'),
                description: readText('event-description') || null,
                is_upcoming: $('event-status').value === 'true',
                image_url: imageUrl,
                cta_link: readText('event-cta-link') || null
            }, state.eventColumns);

            const request = state.editingEventId
                ? window.supabaseClient.from('events').update(payload).eq('id', state.editingEventId)
                : window.supabaseClient.from('events').insert([payload]);

            const { error } = await request;
            if (error) throw error;

            closeModal('event-modal');
            await fetchEvents();
            renderEvents();
            showToast(state.editingEventId ? 'Evento actualizado' : 'Evento agregado');
        } catch (err) {
            console.error('Error guardando evento:', err);
            showToast('Error al guardar evento');
        } finally {
            button.disabled = false;
            button.textContent = oldText;
        }
    }

    async function saveGallery(event) {
        event.preventDefault();
        const button = $('save-gallery-btn');
        const oldText = button.textContent;
        button.disabled = true;
        button.textContent = 'Guardando...';

        try {
            const current = state.galleryItems.find((item) => item.id === state.editingGalleryId);
            const file = $('gallery-image-file').files[0];
            const imageUrl = file ? await uploadFile(file, 'gallery') : current?.image_url || 'multimedia_cash/flipbook_garage.png';

            const payload = filterPayload({
                tag: readText('gallery-tag') || 'GALERIA',
                title: readText('gallery-title'),
                description: readText('gallery-description') || null,
                image_url: imageUrl,
                is_active: true,
                sort_order: state.galleryItems.length + 1
            }, state.galleryColumns);

            const request = state.editingGalleryId
                ? window.supabaseClient.from('gallery_items').update(payload).eq('id', state.editingGalleryId)
                : window.supabaseClient.from('gallery_items').insert([payload]);

            const { error } = await request;
            if (error) throw error;

            closeModal('gallery-modal');
            await fetchGallery();
            renderGallery();
            showToast(state.editingGalleryId ? 'Foto actualizada' : 'Foto agregada');
        } catch (err) {
            console.error('Error guardando galeria:', err);
            showToast('Error al guardar foto');
        } finally {
            button.disabled = false;
            button.textContent = oldText;
        }
    }

    async function deleteCar(id) {
        if (!confirm('Eliminar definitivamente este vehiculo?')) return;
        const { error } = await window.supabaseClient.from('inventory_cars').delete().eq('id', id);
        if (error) {
            console.error(error);
            showToast('Error al eliminar carro');
            return;
        }
        await fetchCars();
        renderCars();
        showToast('Carro eliminado');
    }

    async function deleteEvent(id) {
        if (!confirm('Eliminar definitivamente este evento?')) return;
        const { error } = await window.supabaseClient.from('events').delete().eq('id', id);
        if (error) {
            console.error(error);
            showToast('Error al eliminar evento');
            return;
        }
        await fetchEvents();
        renderEvents();
        showToast('Evento eliminado');
    }

    async function deleteGalleryItem(id) {
        if (!confirm('Eliminar definitivamente esta foto de la galeria?')) return;
        const { error } = await window.supabaseClient.from('gallery_items').delete().eq('id', id);
        if (error) {
            console.error(error);
            showToast('Error al eliminar foto');
            return;
        }
        await fetchGallery();
        renderGallery();
        showToast('Foto eliminada');
    }

    async function updateLeadStatus(id, status, options = {}) {
        const { error } = await window.supabaseClient
            .from('vehicle_leads')
            .update({ status })
            .eq('id', id);

        if (error) {
            console.error(error);
            showToast('Error al actualizar interesado');
            return;
        }

        await fetchLeads();
        renderLeads();
        if (options.keepModalOpen && state.activeLeadId) {
            const lead = state.leads.find((item) => item.id === state.activeLeadId);
            if (lead) renderLeadSummary(lead);
        }
        showToast('Interesado actualizado');
    }

    function showConfirm(message) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = `
                <div style="background:#1a1a1a;border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:2rem;max-width:380px;width:90%;text-align:center;">
                    <p style="color:#e5e5e5;font-size:1rem;margin:0 0 1.5rem;line-height:1.5;">${message}</p>
                    <div style="display:flex;gap:0.75rem;justify-content:center;">
                        <button id="confirm-cancel" style="flex:1;padding:0.7rem;border-radius:7px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;font-weight:700;cursor:pointer;">Cancelar</button>
                        <button id="confirm-ok" style="flex:1;padding:0.7rem;border-radius:7px;border:1px solid rgba(192,57,43,0.6);background:rgba(192,57,43,0.15);color:#ffafa7;font-weight:700;cursor:pointer;">Eliminar</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector('#confirm-ok').addEventListener('click', () => { overlay.remove(); resolve(true); });
            overlay.querySelector('#confirm-cancel').addEventListener('click', () => { overlay.remove(); resolve(false); });
        });
    }

    async function deleteLead(id, name) {
        const label = name ? `la solicitud de ${name}` : 'esta solicitud';
        const ok = await showConfirm(`¿Eliminar ${label}?<br><span style="font-size:.85rem;color:#888;">Esta acción no se puede deshacer.</span>`);
        if (!ok) return;

        const { error: msgErr } = await window.supabaseClient
            .from('vehicle_lead_messages')
            .delete()
            .eq('lead_id', id);

        if (msgErr) { console.error(msgErr); showToast('Error al eliminar mensajes'); return; }

        const { error } = await window.supabaseClient
            .from('vehicle_leads')
            .delete()
            .eq('id', id);

        if (error) { console.error(error); showToast('Error al eliminar solicitud'); return; }

        if (state.activeLeadId === id) {
            closeModal('lead-workspace-modal');
            state.activeLeadId = null;
        }

        await fetchLeads();
        renderLeads();
        showToast('Solicitud eliminada');
    }

    async function saveLeadMessage(event) {
        event.preventDefault();
        if (!state.activeLeadId) return;

        const message = readText('lead-admin-message');
        if (!message) {
            showToast('Escribe un mensaje primero');
            return;
        }

        const button = event.currentTarget.querySelector('button[type="submit"]');
        const oldText = button.textContent;
        button.disabled = true;
        button.textContent = 'Guardando...';

        try {
            const { error } = await window.supabaseClient.from('vehicle_lead_messages').insert([{
                lead_id: state.activeLeadId,
                sender_type: 'admin',
                message
            }]);
            if (error) throw error;

            setValue('lead-admin-message', '');
            await window.supabaseClient
                .from('vehicle_leads')
                .update({ status: 'contactado' })
                .eq('id', state.activeLeadId);
            await fetchLeads();
            renderLeads();
            const lead = state.leads.find((item) => item.id === state.activeLeadId);
            if (lead) {
                renderLeadSummary(lead);
                await renderLeadThread(lead);
            }
            showToast('Mensaje guardado');
        } catch (err) {
            console.error('Error guardando mensaje:', err);
            showToast('No se pudo guardar el mensaje. Revisa vehicle_lead_messages.');
        } finally {
            button.disabled = false;
            button.textContent = oldText;
        }
    }

    async function saveLeadAppointment() {
        if (!state.activeLeadId) return;

        const appointmentAt = readDateTime('lead-appointment-at');
        const appointmentNotes = readText('lead-appointment-notes') || null;
        if (!appointmentAt) {
            showToast('Elige fecha y hora para agendar');
            return;
        }

        const button = $('save-appointment-btn');
        const oldText = button.textContent;
        button.disabled = true;
        button.textContent = 'Agendando...';

        try {
            const { error } = await window.supabaseClient
                .from('vehicle_leads')
                .update({
                    appointment_at: appointmentAt,
                    appointment_notes: appointmentNotes,
                    status: 'agendado'
                })
                .eq('id', state.activeLeadId);
            if (error) throw error;

            await window.supabaseClient.from('vehicle_lead_messages').insert([{
                lead_id: state.activeLeadId,
                sender_type: 'sistema',
                message: `Visita agendada para ${formatAdminDate(appointmentAt)}${appointmentNotes ? `. Notas: ${appointmentNotes}` : ''}`
            }]);

            await fetchLeads();
            renderLeads();
            const lead = state.leads.find((item) => item.id === state.activeLeadId);
            if (lead) {
                renderLeadSummary(lead);
                await renderLeadThread(lead);
            }
            showToast('Cita agendada');
        } catch (err) {
            console.error('Error agendando cita:', err);
            showToast('No se pudo agendar. Revisa columnas appointment_at y appointment_notes.');
        } finally {
            button.disabled = false;
            button.textContent = oldText;
        }
    }

    async function uploadFiles(files, folder) {
        const urls = [];
        for (const file of files) urls.push(await uploadFile(file, folder));
        return urls;
    }

    async function uploadFile(file, folder) {
        const ext = file.name.split('.').pop();
        const cleanName = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${cleanName}.${ext}`;
        const { error } = await window.supabaseClient.storage.from(BUCKET).upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });
        if (error) throw error;
        const { data } = window.supabaseClient.storage.from(BUCKET).getPublicUrl(path);
        return data.publicUrl;
    }

    function filterPayload(payload, columns) {
        const result = {};
        Object.entries(payload).forEach(([key, value]) => {
            if (!columns.has(key)) return;
            if (value === '') result[key] = null;
            else result[key] = value;
        });
        return result;
    }

    function openModal(id) {
        $(id).classList.add('active');
        $(id).setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(id) {
        $(id).classList.remove('active');
        $(id).setAttribute('aria-hidden', 'true');
        if (id === 'lead-modal-admin') state.activeLeadId = null;
        document.body.style.overflow = '';
    }

    function renderImagePreview(container, urls) {
        container.innerHTML = '';
        urls.filter(Boolean).forEach((url) => {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Preview';
            container.appendChild(img);
        });
    }

    function getImages(value) {
        return String(value || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    function setValue(id, value) {
        const el = $(id);
        if (!el) return;
        el.value = value ?? '';
    }

    function readText(id) {
        return ($(id)?.value || '').trim();
    }

    function readNumber(id) {
        const value = readText(id);
        if (!value) return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function readDateTime(id) {
        const value = readText(id);
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }

    function toLocalDateTimeInput(value) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return offsetDate.toISOString().slice(0, 16);
    }

    function formatAdminDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('es-MX', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    }

    function formatMoney(value) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 0
        }).format(value || 0);
    }

    function sortEventsForAdmin(a, b) {
        if (a.is_upcoming !== b.is_upcoming) return a.is_upcoming ? -1 : 1;
        const aTime = eventTimestamp(a);
        const bTime = eventTimestamp(b);
        if (a.is_upcoming) return aTime - bTime;
        return bTime - aTime;
    }

    function eventTimestamp(event) {
        const time = event?.event_datetime ? new Date(event.event_datetime).getTime() : NaN;
        return Number.isNaN(time) ? 0 : time;
    }

    function syncEventDateFields() {
        const value = readText('event-datetime');
        if (!value) return;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return;

        const month = date.toLocaleString('es-MX', { month: 'short' }).replace('.', '').toUpperCase();
        setValue('event-day', String(date.getDate()).padStart(2, '0'));
        setValue('event-month', month);
        setValue('event-date', date.toLocaleString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }));
    }

    function appendDetail(description, detail) {
        const text = (description || '').trim();
        if (!detail || text.includes(detail)) return text;
        return text ? `${text}\n${detail}` : detail;
    }

    function normalize(value) {
        return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function unique(values) {
        return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
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

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'admin-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2600);
    }
});
