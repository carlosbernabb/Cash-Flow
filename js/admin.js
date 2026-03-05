document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-car-form');
    const listContainer = document.getElementById('admin-cars-list');
    const modal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-car-form');
    const modalClose = document.getElementById('modal-close');
    const carCountEl = document.getElementById('car-count');

    let currentEditId = null;
    let allCars = [];

    // Ensure Supabase is initialized
    if (!window.supabaseClient) {
        showToast('❌ Error: Cliente Supabase no encontrado');
        return;
    }

    renderAdminCards();

    // ─── Fetch cars from Supabase ──────────────────────────────────────────────
    async function fetchCars() {
        try {
            const { data: cars, error } = await window.supabaseClient
                .from('inventory_cars')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching cars:', error);
                throw error;
            }
            allCars = cars || [];
            updateCount();
            return allCars;
        } catch (err) {
            showToast('❌ Error de red al cargar inventario');
            return [];
        }
    }

    function updateCount() {
        if (!carCountEl) return;
        const n = allCars.length;
        carCountEl.textContent = n + ' vehículo' + (n !== 1 ? 's' : '');
    }

    // ─── Helper: File Upload ───────────────────────────────────────────────────
    async function uploadFileToSupabase(file, folder) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await window.supabaseClient.storage
            .from('car_media')
            .upload(filePath, file);

        if (error) {
            console.error('Upload Error:', error);
            throw error;
        }

        const { data: { publicUrl } } = window.supabaseClient.storage
            .from('car_media')
            .getPublicUrl(filePath);

        return publicUrl;
    }

    // ─── Agregar nuevo carro ───────────────────────────────────────────────────
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-add-btn');
        const oldText = submitBtn.textContent;
        submitBtn.textContent = 'Guardando...';
        submitBtn.disabled = true;

        // Get files
        const imageFiles = document.getElementById('car-image-files').files;
        const videoFile = document.getElementById('car-preview-video-file').files[0];

        let imageUrls = [];
        let videoUrl = 'BMW BY Jm.mp4';

        try {
            // Upload images
            for (let i = 0; i < Math.min(imageFiles.length, 5); i++) {
                const url = await uploadFileToSupabase(imageFiles[i], 'images');
                imageUrls.push(url);
            }

            // Upload video
            if (videoFile) {
                videoUrl = await uploadFileToSupabase(videoFile, 'videos');
            }

            const newCar = {
                brand: document.getElementById('car-brand').value.trim(),
                model: document.getElementById('car-model').value.trim(),
                year: parseInt(document.getElementById('car-year').value),
                price: document.getElementById('car-price').value.trim(),
                engine: document.getElementById('car-engine').value.trim() || 'N/A',
                hp: document.getElementById('car-hp').value.trim() || 'N/A',
                acceleration: document.getElementById('car-accel').value.trim() || 'N/A',
                color: 'Por Definir', // Default needed constraint
                transmission: 'Automático',
                mileage: document.getElementById('car-mileage').value.trim() || '0 km',
                owners: parseInt(document.getElementById('car-owners').value) || 1,
                image_url: imageUrls.length > 0 ? imageUrls.join(',') : 'inventario/imagenes_coches/coche_1.jpeg',
                preview_video_url: videoUrl,
                is_featured: document.getElementById('car-featured').checked
            };

            const { error } = await window.supabaseClient
                .from('inventory_cars')
                .insert([newCar]);

            if (error) throw error;

            form.reset();
            document.getElementById('add-preview').style.display = 'none';
            await renderAdminCards();
            showToast('✅ Vehículo agregado a Supabase');
        } catch (err) {
            console.error('Error adding car:', err);
            showToast('❌ Error al guardar vehículo');
        } finally {
            submitBtn.textContent = oldText;
            submitBtn.disabled = false;
        }
    });

    // ─── Cerrar modal ──────────────────────────────────────────────────────────
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // ─── Guardar edición ───────────────────────────────────────────────────────
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentEditId) return;

        const submitBtn = document.getElementById('submit-edit-btn');
        const oldText = submitBtn.textContent;
        submitBtn.textContent = 'Guardando...';
        submitBtn.disabled = true;

        const editCar = allCars.find(c => c.id === currentEditId);
        if (!editCar) return;

        // Get files
        const imageFiles = document.getElementById('edit-image-files').files;
        const videoFile = document.getElementById('edit-preview-video-file').files[0];

        let finalImageUrls = editCar.image_url;
        let finalVideoUrl = editCar.preview_video_url;

        try {
            // Upload new images if selected
            if (imageFiles.length > 0) {
                let uploadedUrls = [];
                for (let i = 0; i < Math.min(imageFiles.length, 5); i++) {
                    const url = await uploadFileToSupabase(imageFiles[i], 'images');
                    uploadedUrls.push(url);
                }
                finalImageUrls = uploadedUrls.join(',');
            }

            // Upload new video if selected
            if (videoFile) {
                finalVideoUrl = await uploadFileToSupabase(videoFile, 'videos');
            }

            const updated = {
                brand: document.getElementById('edit-brand').value.trim(),
                model: document.getElementById('edit-model').value.trim(),
                year: parseInt(document.getElementById('edit-year').value),
                price: document.getElementById('edit-price').value.trim(),
                engine: document.getElementById('edit-engine').value.trim(),
                hp: document.getElementById('edit-hp').value.trim(),
                acceleration: document.getElementById('edit-accel').value.trim(),
                mileage: document.getElementById('edit-mileage').value.trim(),
                owners: parseInt(document.getElementById('edit-owners').value) || 1,
                image_url: finalImageUrls,
                preview_video_url: finalVideoUrl,
                is_featured: document.getElementById('edit-featured').checked
            };

            const { error } = await window.supabaseClient
                .from('inventory_cars')
                .update(updated)
                .eq('id', currentEditId);

            if (error) throw error;

            closeModal();
            await renderAdminCards();
            showToast('✏️ Vehículo actualizado en Supabase');
        } catch (err) {
            console.error('Error updating car:', err);
            showToast('❌ Error al actualizar vehículo');
        } finally {
            submitBtn.textContent = oldText;
            submitBtn.disabled = false;
        }
    });

    // ─── Render de tarjetas ────────────────────────────────────────────────────
    async function renderAdminCards() {
        listContainer.innerHTML = '<p style="color:#b0b0b0; text-align:center; padding:2rem;">Cargando inventario desde la Nube...</p>';
        const cars = await fetchCars();
        listContainer.innerHTML = '';

        if (cars.length === 0) {
            listContainer.innerHTML = '<p style="color:#b0b0b0; text-align:center; padding:2rem;">No hay vehículos registrados.</p>';
            return;
        }

        cars.forEach(car => {
            const card = document.createElement('div');
            card.className = 'admin-card';
            // Need to fix local paths if missing prefix, but we trust the DB string
            const imgSrc = car.image_url;

            card.innerHTML = `
                <div class="admin-card-img" style="background-image:url('${imgSrc}'); position: relative; overflow: hidden;">
                    <div class="video-preview admin-video-preview" style="position: absolute; top:0; left:0; width:100%; height:100%; opacity: 0; transition: opacity 0.3s; background: black; z-index: 1;">
                        <video muted playsinline loop style="width: 100%; height: 100%; object-fit: cover;"></video>
                    </div>
                    ${car.is_featured ? '<div style="position:absolute; top:10px; right:10px; background:var(--accent-color); color:black; padding:2px 8px; border-radius:4px; font-size:0.7rem; font-weight:800; z-index: 10;">⭐ DESTACADO</div>' : ''}
                </div>
                <div class="admin-card-body">
                    <div class="admin-card-info">
                        <span class="admin-card-brand">${car.brand}</span>
                        <h3 class="admin-card-model">${car.model}</h3>
                        <span class="admin-card-year">${car.year}</span>
                        <p class="admin-card-price">${car.price}</p>
                        <p class="admin-card-specs" style="margin-bottom: 0.5rem;">
                            🔧 ${car.engine || '—'} &nbsp;|&nbsp; ⚡ ${car.hp || '—'} &nbsp;|&nbsp; 🏎️ ${car.acceleration || '—'}
                        </p>
                        <p class="admin-card-specs" style="font-size: 0.65rem; color:#666;">
                            Distancia: ${car.mileage} | Dueños: ${car.owners}
                        </p>
                    </div>
                    <div class="admin-card-actions">
                        <button class="btn-edit" data-id="${car.id}">✏️ Editar</button>
                        <button class="btn-delete" data-id="${car.id}">🗑️ Eliminar</button>
                    </div>
                </div>
            `;

            // Hover effects for the video preview
            const videoContainer = card.querySelector('.admin-video-preview');
            const video = card.querySelector('video');

            card.addEventListener('mouseenter', () => {
                const videoUrl = car.preview_video_url;
                if (videoUrl) {
                    video.src = videoUrl;
                    videoContainer.style.opacity = '1';
                    video.play().catch(e => console.log('Autoplay prevent on hover', e));
                }
            });

            card.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
                videoContainer.style.opacity = '0';
            });

            listContainer.appendChild(card);
        });

        // Eventos editar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                openEditModal(id);
            });
        });

        // Eventos eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('¿Eliminar definitivamente este vehículo de Supabase?')) {
                    try {
                        const { error } = await window.supabaseClient
                            .from('inventory_cars')
                            .delete()
                            .eq('id', id);

                        if (error) throw error;

                        await renderAdminCards();
                        showToast('🗑️ Vehículo eliminado');
                    } catch (err) {
                        console.error('Delete error', err);
                        showToast('❌ Error al eliminar');
                    }
                }
            });
        });
    }

    // ─── Abrir modal de edición ────────────────────────────────────────────────
    function openEditModal(id) {
        const car = allCars.find(c => c.id === id);
        if (!car) return;
        currentEditId = id;
        document.getElementById('edit-brand').value = car.brand || '';
        document.getElementById('edit-model').value = car.model || '';
        document.getElementById('edit-year').value = car.year || '';
        document.getElementById('edit-price').value = car.price || '';
        document.getElementById('edit-engine').value = car.engine || '';
        document.getElementById('edit-hp').value = car.hp || '';
        document.getElementById('edit-accel').value = car.acceleration || '';
        document.getElementById('edit-mileage').value = car.mileage || '';
        document.getElementById('edit-owners').value = car.owners || 1;
        // File inputs get reset, so we'll rely on old values if empty.
        document.getElementById('edit-image-files').value = '';
        document.getElementById('edit-preview-video-file').value = '';
        document.getElementById('edit-featured').checked = !!car.is_featured;

        // Display first image from the comma separated list
        const firstImg = car.image_url ? car.image_url.split(',')[0] : '';
        document.getElementById('edit-preview').src = firstImg;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        currentEditId = null;
    }

    // ─── Toast ─────────────────────────────────────────────────────────────────
    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'admin-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.classList.add('show'), 10);
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2500);
    }

    // Preview de imagen en formulario "agregar"
    document.getElementById('car-image-files').addEventListener('change', function () {
        const container = document.getElementById('add-preview-container');
        container.innerHTML = '';
        if (this.files && this.files.length > 0) {
            Array.from(this.files).slice(0, 5).forEach(file => {
                const img = document.createElement('img');
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '6px';
                img.src = URL.createObjectURL(file);
                container.appendChild(img);
            });
        }
    });

    // Preview de imagen en modal "editar"
    document.getElementById('edit-image-files').addEventListener('change', function () {
        if (this.files && this.files[0]) {
            document.getElementById('edit-preview').src = URL.createObjectURL(this.files[0]);
        }
    });
});
