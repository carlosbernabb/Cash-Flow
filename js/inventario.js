let allCarsData = [];
let filteredCarsData = [];
let priceBounds = { min: 0, max: 0 };

document.addEventListener('DOMContentLoaded', () => {
    loadFullInventory();
    bindLeadModal();
});

async function loadFullInventory() {
    const carsGrid = document.querySelector('.inv-cars-grid');
    if (!carsGrid) return;

    carsGrid.innerHTML = '<p class="inv-message">Cargando catalogo completo...</p>';

    try {
        const { data: cars, error } = await window.supabaseClient
            .from('inventory_cars')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allCarsData = (cars || []).map((car) => ({
            ...car,
            price_value: parsePrice(car.price)
        }));

        bindInventoryControls();
        populateFilters();
        setupBudgetFilter();
        renderInventory();
    } catch (err) {
        console.error('Error loading inventory:', err);
        carsGrid.innerHTML = '<p class="inv-message inv-message--error">Error al cargar el catalogo.</p>';
    }
}

function bindInventoryControls() {
    [
        'inv-search',
        'filter-budget-min',
        'filter-budget-max',
        'filter-budget-slider',
        'filter-brand',
        'filter-model',
        'filter-year',
        'filter-color'
    ].forEach((id) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.bound === 'true') return;
        el.dataset.bound = 'true';
        el.addEventListener('input', () => {
            if (id === 'filter-budget-slider') {
                document.getElementById('filter-budget-max').value = el.value;
            }
            renderInventory();
        });
        el.addEventListener('change', renderInventory);
    });

    document.getElementById('clear-filters')?.addEventListener('click', clearFilters);
}

function populateFilters() {
    fillSelect('filter-brand', 'Todas', unique(allCarsData.map((car) => car.brand)));
    fillSelect('filter-model', 'Todos', unique(allCarsData.map((car) => car.model)));
    fillSelect('filter-year', 'Todos', unique(allCarsData.map((car) => car.year)).sort((a, b) => b - a));
    fillSelect('filter-color', 'Todos', unique(allCarsData.map((car) => car.color)));
}

function setupBudgetFilter() {
    const prices = allCarsData.map((car) => car.price_value).filter((price) => price > 0);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    priceBounds = { min, max };

    const minInput = document.getElementById('filter-budget-min');
    const maxInput = document.getElementById('filter-budget-max');
    const slider = document.getElementById('filter-budget-slider');

    if (minInput) {
        minInput.min = min;
        minInput.max = max;
        minInput.placeholder = min ? formatMoney(min) : 'Minimo';
    }

    if (maxInput) {
        maxInput.min = min;
        maxInput.max = max;
        maxInput.placeholder = max ? formatMoney(max) : 'Maximo';
    }

    if (slider) {
        slider.min = min;
        slider.max = max;
        slider.value = max;
        slider.step = calculateStep(min, max);
    }

    updateBudgetHint();
}

function fillSelect(id, label, values) {
    const select = document.getElementById(id);
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">${label}</option>`;
    values.filter(Boolean).forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
    if ([...select.options].some((option) => option.value === current)) select.value = current;
}

function renderInventory() {
    const carsGrid = document.querySelector('.inv-cars-grid');
    const query = normalize(document.getElementById('inv-search')?.value);
    const budgetMin = readBudget('filter-budget-min', priceBounds.min);
    const budgetMax = readBudget('filter-budget-max', priceBounds.max);
    const brand = document.getElementById('filter-brand')?.value || '';
    const model = document.getElementById('filter-model')?.value || '';
    const year = document.getElementById('filter-year')?.value || '';
    const color = document.getElementById('filter-color')?.value || '';

    filteredCarsData = allCarsData.filter((car) => {
        const haystack = normalize([
            car.brand, car.model, car.year, car.color, car.engine, car.transmission,
            car.body_type, car.invoice, car.plates_status, car.description, car.price
        ].join(' '));

        return (!query || haystack.includes(query)) &&
            (!brand || car.brand === brand) &&
            (!model || car.model === model) &&
            (!year || String(car.year) === String(year)) &&
            (!color || car.color === color) &&
            matchesBudget(car.price_value, budgetMin, budgetMax);
    });

    carsGrid.innerHTML = '';
    updateResultsHeader({ query, budgetMin, budgetMax, brand, model, year, color });
    updateBudgetHint(budgetMin, budgetMax);

    if (!filteredCarsData.length) {
        carsGrid.innerHTML = '<p class="inv-message">No hay vehiculos con esos filtros. Ajusta tu presupuesto o limpia filtros.</p>';
        return;
    }

    filteredCarsData.forEach((car) => carsGrid.appendChild(buildCarCard(car)));
}

function buildCarCard(car) {
    const card = document.createElement('article');
    card.className = 'car-card inv-car-card';
    card.dataset.carId = car.id;

    const firstImage = getImages(car.image_url)[0] || 'inventario/imagenes_coches/coche_1.jpeg';
    const finalImageSrc = makePublicPath(firstImage);
    const finalVideoSrc = makePublicPath(car.preview_video_url || 'BMW BY Jm.mp4');
    const optionalSpecs = buildOptionalSpecs(car);

    card.innerHTML = `
        <div class="car-image-container inv-car-image-container">
            <img src="${escapeAttr(finalImageSrc)}" alt="${escapeAttr(car.brand || '')} ${escapeAttr(car.model || '')}" loading="lazy">
            <video class="hover-video" src="${escapeAttr(finalVideoSrc)}" muted loop playsinline preload="none"></video>
            <img class="photo-logo photo-logo--sm" src="../assets/logo.png" alt="Cash & Flow">
        </div>
        <div class="car-info inv-car-info">
            <span class="car-brand">${escapeHtml(car.brand || 'Unidad')}</span>
            <h3 class="car-model inv-car-model">${escapeHtml([car.model, car.year].filter(Boolean).join(' '))}</h3>
            <p class="car-price inv-car-price">
                ${escapeHtml(car.price || 'Precio a consultar')}
                ${car.old_price ? `<span class="old-price">${escapeHtml(car.old_price)}</span>` : ''}
            </p>
            <ul class="car-specs inv-car-specs">
                ${optionalSpecs.map((spec) => `<li>${spec}</li>`).join('')}
            </ul>
            <button type="button" class="btn-details inv-lead-btn" data-lead-car="${escapeAttr(car.id)}">Cotizar / ver detalles</button>
        </div>
    `;

    const videoElement = card.querySelector('video.hover-video');
    card.addEventListener('mouseenter', () => {
        if (videoElement.readyState === 0) videoElement.load();
        videoElement.play().then(() => videoElement.classList.add('is-ready')).catch(() => { });
    });

    card.addEventListener('mouseleave', () => {
        videoElement.pause();
        videoElement.currentTime = 0;
        videoElement.classList.remove('is-ready');
    });

    card.querySelector('[data-lead-car]').addEventListener('click', () => openLeadModal(car));
    return card;
}

function buildOptionalSpecs(car) {
    const specs = [
        car.invoice && `<strong>Factura:</strong> ${escapeHtml(car.invoice)}`,
        car.color && `<strong>Color:</strong> ${escapeHtml(car.color)}`,
        car.year && `<strong>Modelo:</strong> ${escapeHtml(car.year)}`,
        car.keys_count !== null && car.keys_count !== undefined && `<strong>Llaves:</strong> ${escapeHtml(car.keys_count)}`,
        car.owners !== null && car.owners !== undefined && `<strong>Due&ntilde;os:</strong> ${escapeHtml(car.owners)}`,
        car.doors !== null && car.doors !== undefined && `<strong>Puertas:</strong> ${escapeHtml(car.doors)}`,
        car.transmission && `<strong>Transmision:</strong> ${escapeHtml(car.transmission)}`,
        car.engine && `<strong>Motor:</strong> ${escapeHtml(car.engine)}`,
        car.body_type && `<strong>Carroceria:</strong> ${escapeHtml(car.body_type)}`,
        car.plates_status && `<strong>Pagos:</strong> ${escapeHtml(car.plates_status)}`,
        car.mileage && `<strong>Kilometraje:</strong> ${escapeHtml(car.mileage)}`
    ].filter(Boolean);

    if (car.description) {
        specs.push(`<span class="car-description">${escapeHtml(car.description).replace(/\n/g, '<br>')}</span>`);
    }

    return specs.length ? specs : ['Detalles disponibles por mensaje.'];
}

function bindLeadModal() {
    document.getElementById('lead-modal-close')?.addEventListener('click', closeLeadModal);
    document.getElementById('lead-cancel')?.addEventListener('click', closeLeadModal);
    document.getElementById('lead-modal')?.addEventListener('click', (event) => {
        if (event.target.id === 'lead-modal') closeLeadModal();
    });
    document.getElementById('lead-form')?.addEventListener('submit', submitLead);
}

function openLeadModal(car) {
    document.getElementById('lead-car-id').value = car.id;
    document.getElementById('lead-car-title').textContent = `${car.brand || ''} ${car.model || ''} ${car.year || ''}`.trim();
    document.getElementById('lead-budget').value = car.price_value || '';
    document.getElementById('lead-message').value = `Quiero cotizar ${car.brand || ''} ${car.model || ''} ${car.year || ''} y conocer disponibilidad para verlo.`.trim();
    document.getElementById('lead-car-summary').innerHTML = `
        <strong>${escapeHtml(car.price || 'Precio a consultar')}</strong>
        <span>ID unidad: ${escapeHtml(car.id)}</span>
    `;
    document.getElementById('lead-car-details').innerHTML = buildLeadDetails(car);
    document.getElementById('lead-modal').classList.add('active');
    document.getElementById('lead-modal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLeadModal() {
    document.getElementById('lead-modal')?.classList.remove('active');
    document.getElementById('lead-modal')?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

async function submitLead(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'Enviando...';

    const carId = document.getElementById('lead-car-id').value;
    const car = allCarsData.find((item) => item.id === carId);

    const payload = {
        car_id: carId,
        customer_name: readText('lead-name'),
        customer_phone: readText('lead-phone'),
        customer_email: readText('lead-email') || null,
        budget_mxn: readNumber('lead-budget'),
        message: readText('lead-message') || null,
        source: 'inventario_web',
        status: 'nuevo',
        car_snapshot: car ? {
            brand: car.brand,
            model: car.model,
            year: car.year,
            price: car.price,
            image_url: getImages(car.image_url)[0] || null
        } : null
    };

    try {
        const { data, error } = await window.supabaseClient.from('vehicle_leads').insert([payload]).select('id').single();
        if (error) throw error;

        if (data?.id && payload.message) {
            const { error: messageError } = await window.supabaseClient.from('vehicle_lead_messages').insert([{
                lead_id: data.id,
                sender_type: 'cliente',
                message: payload.message
            }]);
            if (messageError) console.warn('Lead message was not saved:', messageError.message);
        }

        form.reset();
        closeLeadModal();
        showInventoryToast('Cotizacion enviada. Cash & Flow te contactara pronto.');
    } catch (err) {
        console.error('Error sending lead:', err);
        showInventoryToast('No se pudo enviar. Revisa que la tabla vehicle_leads exista en Supabase.');
    } finally {
        button.disabled = false;
        button.textContent = oldText;
    }
}

function buildLeadDetails(car) {
    const details = [
        ['Marca', car.brand],
        ['Modelo', car.model],
        ['Año', car.year],
        ['Color', car.color],
        ['Kilometraje', car.mileage],
        ['Transmision', car.transmission],
        ['Motor', car.engine],
        ['Factura', car.invoice],
        ['Pagos', car.plates_status]
    ].filter(([, value]) => value !== null && value !== undefined && value !== '');

    return details.map(([label, value]) => `
        <div>
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
        </div>
    `).join('');
}

function clearFilters() {
    ['inv-search', 'filter-budget-min', 'filter-budget-max', 'filter-brand', 'filter-model', 'filter-year', 'filter-color'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const slider = document.getElementById('filter-budget-slider');
    if (slider) slider.value = priceBounds.max;
    renderInventory();
}

function updateResultsHeader(filters) {
    const count = document.getElementById('inv-results-count');
    const active = document.getElementById('inv-active-filters');
    if (count) count.textContent = `${filteredCarsData.length} de ${allCarsData.length} unidades`;

    const chips = [];
    if (filters.query) chips.push('Busqueda activa');
    if (filters.budgetMin > priceBounds.min || filters.budgetMax < priceBounds.max) {
        chips.push(`${formatMoney(filters.budgetMin)} - ${formatMoney(filters.budgetMax)}`);
    }
    ['brand', 'model', 'year', 'color'].forEach((key) => {
        if (filters[key]) chips.push(filters[key]);
    });
    if (active) active.textContent = chips.length ? chips.join(' / ') : 'Todo el inventario';
}

function updateBudgetHint(min = priceBounds.min, max = priceBounds.max) {
    const hint = document.getElementById('budget-hint');
    if (!hint) return;
    if (!priceBounds.min && !priceBounds.max) {
        hint.textContent = 'Sin precios cargados';
        return;
    }
    hint.textContent = `Inventario desde ${formatMoney(priceBounds.min)}. Buscando entre ${formatMoney(min)} y ${formatMoney(max)}.`;
}

function matchesBudget(price, min, max) {
    if (!price) return false;
    return price >= min && price <= max;
}

function readBudget(id, fallback) {
    const raw = document.getElementById(id)?.value;
    const value = Number(raw);
    if (!raw || !Number.isFinite(value)) return fallback;
    return value;
}

function readText(id) {
    return (document.getElementById(id)?.value || '').trim();
}

function readNumber(id) {
    const value = readText(id);
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function calculateStep(min, max) {
    const range = max - min;
    if (range <= 1000000) return 25000;
    if (range <= 5000000) return 50000;
    return 100000;
}

function parsePrice(price) {
    const normalized = String(price || '').replace(/,/g, '');
    const match = normalized.match(/\d+(\.\d+)?/);
    return match ? Number(match[0]) || 0 : 0;
}

function formatMoney(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0
    }).format(value || 0);
}

function getImages(value) {
    return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function makePublicPath(src) {
    if (!src) return '';
    if (/^(https?:)?\/\//.test(src)) return src;
    if (src.startsWith('../')) return src;
    return `../${src}`;
}

function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function unique(values) {
    return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function showInventoryToast(message) {
    const toast = document.createElement('div');
    toast.className = 'inv-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
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
