let allProducts = [];
let cart = [];
let currentCategory = 'todos';
let activeRentalItem = null;

document.addEventListener("DOMContentLoaded", () => {
  loadData();
});

async function loadData() {
  try {
    const res = await fetch('vehiculo.json');
    if (!res.ok) throw new Error("CORS/HTTP error");
    const data = await res.json();
    processCatalogData(data);
  } catch (err) {
    if (window.DATA_VEHICULOS) {
      processCatalogData(window.DATA_VEHICULOS);
    }
  }
}

function processCatalogData(data) {
  allProducts = [];
  if (data.vehiculos) allProducts.push(...data.vehiculos);
  if (data.motos) allProducts.push(...data.motos);
  renderCatalog(allProducts);
}

function renderCatalog(items) {
  const container = document.getElementById('catalogContainer');
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = '<div class="col-12 text-center text-warning py-5"><h4>No se encontraron vehículos.</h4></div>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4';
    card.innerHTML = `
      <div class="card card-vehicle h-100">
        <div class="card-img-container">
          <img src="${item.imagen}" alt="${item.modelo}" onerror="this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80'">
          <span class="badge-offer">${item.oferta_alquiler}</span>
        </div>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge bg-warning text-dark">${item.tipo}</span>
            <small class="fw-bold" style="color: #ff5500;">CÓD: DSC-${item.codigo}</small>
          </div>
          <h5 class="card-title fw-bold text-white mb-1">${item.marca} ${item.modelo}</h5>
          <p class="card-text text-light small mb-3 flex-grow-1">${item.caracteristicas}</p>
          <div class="mb-3">
            <div class="d-flex justify-content-between">
              <small class="text-light">Venta:</small>
              <span class="price-sale">$${item.precio_venta.toLocaleString()} USD</span>
            </div>
            <div class="d-flex justify-content-between">
              <small class="text-light">Renta/Día:</small>
              <span class="price-rent">$${item.precio_alquiler_dia.toLocaleString()} USD</span>
            </div>
          </div>
          <div class="row g-2 mt-auto">
            <div class="col-6"><button class="btn btn-outline-warning w-100 fw-bold btn-sm" onclick="openRentModal(${item.codigo})">Alquilar</button></div>
            <div class="col-6"><button class="btn btn-orange w-100 fw-bold btn-sm" onclick="addToCartBuy(${item.codigo})">Comprar</button></div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function filterCategory(cat, e) {
  currentCategory = cat;
  document.querySelectorAll('#categoryTabs .nav-link').forEach(btn => btn.classList.remove('active'));
  if (e && e.target) e.target.classList.add('active');
  let filtered = cat === 'todos' ? allProducts : allProducts.filter(p => p.categoria === cat);
  renderCatalog(filtered);
}

function handleSearch() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  let filtered = allProducts.filter(p => p.marca.toLowerCase().includes(query) || p.modelo.toLowerCase().includes(query));
  renderCatalog(filtered);
}

function openRentModal(codigo) {
  activeRentalItem = allProducts.find(p => p.codigo === codigo);
  if (!activeRentalItem) return;
  document.getElementById('rentModalTitle').innerText = `Alquilar ${activeRentalItem.marca} ${activeRentalItem.modelo}`;
  document.getElementById('rentModalVehicleName').innerText = `${activeRentalItem.marca} ${activeRentalItem.modelo}`;
  document.getElementById('rentModalCode').innerText = `CÓD: DSC-${activeRentalItem.codigo}`;
  document.getElementById('rentModalImg').src = activeRentalItem.imagen;
  updateRentalCalculation();
  new bootstrap.Modal(document.getElementById('rentModal')).show();
}

function updateRentalCalculation() {
  if (!activeRentalItem) return;
  const modality = document.getElementById('rentalModalitySelect').value;
  const duration = parseInt(document.getElementById('rentalDurationInput').value) || 1;
  const rate = modality === 'dia' ? activeRentalItem.precio_alquiler_dia : activeRentalItem.precio_alquiler_hora;
  document.getElementById('rentRateDisplay').innerText = `$${rate.toLocaleString()} USD / ${modality}`;
  document.getElementById('rentSubtotalDisplay').innerText = `$${(rate * duration).toLocaleString()} USD`;
}

function confirmAddToCartRental() {
  if (!activeRentalItem) return;
  const modality = document.getElementById('rentalModalitySelect').value;
  const duration = parseInt(document.getElementById('rentalDurationInput').value) || 1;
  cart.push({
    codigo: activeRentalItem.codigo,
    marca: activeRentalItem.marca,
    modelo: activeRentalItem.modelo,
    tipoAccion: 'ALQUILER',
    modality: modality,
    duration: duration,
    precioUnitario: modality === 'dia' ? activeRentalItem.precio_alquiler_dia : activeRentalItem.precio_alquiler_hora,
    subtotal: (modality === 'dia' ? activeRentalItem.precio_alquiler_dia : activeRentalItem.precio_alquiler_hora) * duration,
    imagen: activeRentalItem.imagen
  });
  updateCartBadge();
  const modalEl = document.getElementById('rentModal');
  const modalObj = bootstrap.Modal.getInstance(modalEl);
  if (modalObj) modalObj.hide();
  Swal.fire({ title: '¡Alquiler Agregado!', icon: 'success', background: '#121212', color: '#fff' });
}

function addToCartBuy(codigo) {
  const item = allProducts.find(p => p.codigo === codigo);
  if (!item) return;
  cart.push({
    codigo: item.codigo,
    marca: item.marca,
    modelo: item.modelo,
    tipoAccion: 'VENTA',
    modality: 'Unidad',
    duration: 1,
    precioUnitario: item.precio_venta,
    subtotal: item.precio_venta,
    imagen: item.imagen
  });
  updateCartBadge();
  Swal.fire({ title: '¡Vehículo Añadido!', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#121212', color: '#fff' });
}

function updateCartBadge() {
  document.getElementById('cartCountBadge').innerText = cart.length;
}

function openCartModal() {
  renderCartItems();
  new bootstrap.Modal(document.getElementById('cartModal')).show();
}

function renderCartItems() {
  const container = document.getElementById('cartItemsContainer');
  container.innerHTML = '';
  if (cart.length === 0) {
    container.innerHTML = '<div class="text-center text-muted py-3">El carrito está vacío.</div>';
    updateCartTotals();
    return;
  }
  cart.forEach((item, index) => {
    container.innerHTML += `
      <div class="p-2 mb-2 rounded border border-secondary d-flex align-items-center justify-content-between bg-black">
        <div class="d-flex align-items-center">
          <img src="${item.imagen}" class="rounded me-2" style="width: 50px; height: 35px; object-fit: cover;">
          <div><strong class="text-white small">${item.marca} ${item.modelo}</strong><br><small class="text-warning">$${item.subtotal.toLocaleString()}</small></div>
        </div>
        <button class="btn btn-outline-danger btn-sm" onclick="cart.splice(${index},1);updateCartBadge();renderCartItems();">X</button>
      </div>`;
  });
  updateCartTotals();
}

function updateCartTotals() {
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const tax = subtotal * 0.18;
  document.getElementById('cartSubtotal').innerText = `$${subtotal.toLocaleString()} USD`;
  document.getElementById('cartTax').innerText = `$${tax.toLocaleString()} USD`;
  document.getElementById('cartTotal').innerText = `$${(subtotal + tax).toLocaleString()} USD`;
}

function clearCart() {
  cart = [];
  updateCartBadge();
  renderCartItems();
}

function processPayment(e) {
  e.preventDefault();
  if (cart.length === 0) return;

  const modalEl = document.getElementById('cartModal');
  const modalObj = bootstrap.Modal.getInstance(modalEl);
  if (modalObj) modalObj.hide();

  Swal.fire({
    title: 'Procesando PDF...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
    background: '#121212',
    color: '#fff'
  });

  setTimeout(() => {
    Swal.fire({
      icon: 'success',
      title: '¡Transacción Exitosa!',
      text: 'Se ha procesado la compra/alquiler en Dominican Street Cars.',
      background: '#121212',
      color: '#fff'
    });
    cart = [];
    updateCartBadge();
  }, 1000);
}