document.addEventListener('DOMContentLoaded', () => {
    // Referencias
    const form = document.getElementById('add-car-form');
    const listContainer = document.getElementById('admin-cars-list');

    // Cargar inventario inicial
    renderAdminList();

    // Evento para añadir un carro
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Recopilar datos
        const newCar = {
            brand: document.getElementById('car-brand').value,
            model: document.getElementById('car-model').value,
            year: parseInt(document.getElementById('car-year').value),
            price: document.getElementById('car-price').value,
            engine: document.getElementById('car-engine').value,
            hp: document.getElementById('car-hp').value,
            acceleration: document.getElementById('car-accel').value,
            imageUrl: document.getElementById('car-image').value
        };

        // Guardar en DB mockeada
        window.CashFlowDB.addCar(newCar);

        // Limpiar formulario y recargar listado
        form.reset();
        renderAdminList();
    });

    // Función para renderizar el listado
    function renderAdminList() {
        const cars = window.CashFlowDB.getAllCars();
        listContainer.innerHTML = '';

        if (cars.length === 0) {
            listContainer.innerHTML = '<p style="color: #b0b0b0;">Aún no hay vehículos registrados.</p>';
            return;
        }

        cars.forEach(car => {
            const div = document.createElement('div');
            div.className = 'admin-car-item';
            div.innerHTML = `
                <div>
                    <strong>${car.brand} ${car.model}</strong> (${car.year})
                    <br>
                    <span style="color:#b0b0b0; font-size:0.8rem">${car.price}</span>
                </div>
                <button class="btn-delete" data-id="${car.id}">Eliminar</button>
            `;
            listContainer.appendChild(div);
        });

        // Eventos a los botones de eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('¿Estás seguro de eliminar este vehículo del inventario?')) {
                    window.CashFlowDB.deleteCar(id);
                    renderAdminList(); // Recargar la lista
                }
            });
        });
    }
});
