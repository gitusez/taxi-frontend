import { config } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  let allCars = [];
  let currentPage = 1;
  let filteredCars = [];

  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageIndicator = document.getElementById('pageIndicator');

  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

  initEventListeners();
  loadCars();

  function initEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', debounce(searchCars, 300));

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.addEventListener('change', sortCars);

    if (prevPageBtn) prevPageBtn.addEventListener('click', () => changePage(-1));
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => changePage(1));
  }

  async function loadCars() {
    try {
      const requestData = {
        items: config.itemsPerPage,
        offset: 0,
        allowedOwners: config.allowedOwners  // ✅ добавлено
      };

      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const result = await response.json();
  
      if (!result.success) throw new Error(result.error || "Ошибка сервера");
  
      const rawCars = Array.isArray(result.cars_list)
        ? result.cars_list
        : Object.values(result.cars_list || {});
  
      allCars = rawCars;
      filteredCars = [...allCars];
      currentPage = 1;
      renderCars();
    } catch (error) {
      showError(error.message);
    }
  }
  function renderCars() {
    const grid = document.querySelector('.cars-grid');
    if (!grid) return;
    grid.innerHTML = "";

    const start = (currentPage - 1) * config.itemsPerPage;
    const carsToShow = filteredCars.slice(start, start + config.itemsPerPage);

    carsToShow.forEach(car => {
      const card = document.createElement('div');
      card.className = 'car-card';

      const model = (car.model || "").toLowerCase();
      let price = "—";
      if (model.includes("granta")) price = "1700 руб/сутки";
      else if (model.includes("vesta")) price = "2400 руб/сутки";
      else if (model.includes("largus")) price = "2600 руб/сутки";

      const status = car.status || "—";
      const statusClass = typeof status === 'string' ? status.toLowerCase() : '';
      const image = car.avatar || 'img/granta1.jpg';

      card.innerHTML = `
        <img src="${image}" alt="Фото авто" class="car-img">
        <h3 class="car-price">Цена: ${price}</h3>
        <p class="car-title">${car.brand || 'Без марки'} ${car.model || ''}</p>
        <div class="car-detal">
          <p>Год: ${car.year || '—'}</p>
          <p>Цвет: ${car.color || '—'}</p>
          <p>Номер: ${car.number || '—'}</p>
          <p>Статус: <span class="status-${statusClass}">${status}</span></p>
        </div>
      `;

      if (car.id) card.onclick = () => window.location.href = `car-details.html?car=${car.id}`;
      grid.appendChild(card);
    });

    updatePagination();
  }

  function updatePagination() {
    const total = Math.ceil(filteredCars.length / config.itemsPerPage);
    if (pageIndicator) pageIndicator.textContent = `Страница ${currentPage} из ${total}`;
    if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= total;
  }

  function changePage(delta) {
    const totalPages = Math.ceil(filteredCars.length / config.itemsPerPage);
    currentPage = Math.max(1, Math.min(currentPage + delta, totalPages));
    renderCars();
  }

  function searchCars() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    filteredCars = allCars.filter(car => {
      const name = ((car.brand || '') + ' ' + (car.model || '')).toLowerCase();
      return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(
        query.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      );
    });
    currentPage = 1;
    renderCars();
  }

  function sortCars() {
    const value = document.getElementById('sortSelect').value;
    if (!value) return renderCars();
    const [field, order] = value.split('_');
    filteredCars.sort((a, b) => {
      const aVal = String(a[field] || '');
      const bVal = String(b[field] || '');
      return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    currentPage = 1;
    renderCars();
  }

  function showError(message) {
    const errBox = document.querySelector('.error-message');
    if (errBox) {
      errBox.textContent = message;
      errBox.style.display = "block";
    }
    console.error(message);
  }
});
