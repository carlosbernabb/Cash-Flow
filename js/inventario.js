document.addEventListener('DOMContentLoaded', () => {
    loadFullInventory();
});

// =====================================================
// INVENTARIO COMPLETO (Fetch from Supabase)
// =====================================================
async function loadFullInventory() {
    const carsGrid = document.querySelector('.inv-cars-grid'); // Based on inventario.html grid element class
    if (!carsGrid) return;

    // Show a loading indicator while fetching
    carsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#b0b0b0; font-size:1.2rem; margin:4rem 0;">Cargando catálogo completo...</p>';

    try {
        // Fetch all cars (not limited to featured, not limited to 4)
        const { data: cars, error } = await window.supabaseClient
            .from('inventory_cars')
            .select('*')
            .order('created_at', { ascending: true }); // O podrías ordenar por precio, año, etc.

        if (error) {
            console.error('Error fetching full inventory:', error);
            carsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#ff4444; margin:4rem 0;">Error al cargar el catálogo. Por favor intenta más tarde.</p>';
            return;
        }

        carsGrid.innerHTML = '';

        if (!cars || cars.length === 0) {
            carsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#b0b0b0; margin:4rem 0;">No hay vehículos disponibles en este momento en el catálogo.</p>';
            return;
        }

        cars.forEach(car => {
            const card = document.createElement('div');
            card.className = 'car-card inv-car-card';

            const firstImage = car.image_url ? car.image_url.split(',')[0].trim() : 'inventario/imagenes_coches/coche_1.jpeg';
            const vUrl = car.preview_video_url || 'BMW BY Jm.mp4';
            const finalImageSrc = firstImage.startsWith('http') ? firstImage : `../${firstImage}`;
            const finalVideoSrc = vUrl.startsWith('http') ? vUrl : `../${vUrl}`;

            card.innerHTML = `
                <div class="car-image-container inv-car-image-container">
                    <img src="${finalImageSrc}" alt="${car.brand} ${car.model}" loading="lazy">
                    <!-- Fixing video absolute path from root -->
                    <video class="hover-video" src="${finalVideoSrc}" muted loop playsinline preload="none"></video>
                </div>
                <div class="car-info inv-car-info">
                    <span class="car-brand">${car.brand}</span>
                    <h3 class="car-model">${car.model}</h3>
                    <p class="car-price">${car.price}</p>
                    <ul class="car-specs inv-car-specs">
                        <li>Año: ${car.year}</li>
                        <li>Color: ${car.color}</li>
                        <li>${car.transmission}</li>
                        <li>Kilometraje: ${car.mileage || 'N/A'}</li>
                        <li>Dueños: ${car.owners || 'N/A'}</li>
                    </ul>
                    <a href="#" class="btn-details">Ver Detalles</a>
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
        console.error('Unexpected error loading full inventory:', err);
        carsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#ff4444; margin:4rem 0;">Error de red al cargar el catálogo completo.</p>';
    }
}
