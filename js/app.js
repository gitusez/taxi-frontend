import { config } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  let allCars = [];
  let offset = 0;
  let allLoaded = false;

  const loader = document.querySelector('.loader');
  const errorBox = document.querySelector('.error-message');
  const grid = document.querySelector('.cars-grid');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const noMoreCarsNotice = document.getElementById('noMoreCarsNotice');

  initEventListeners();
  loadCars(config.itemsInitial);

  function initEventListeners() {
    document.getElementById('searchInput')?.addEventListener('input', debounce(searchCars, 300));
    document.getElementById('sortSelect')?.addEventListener('change', () => {
      sortCars();
      renderCars();
    });

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        if (!allLoaded) loadCars(config.itemsLoadMore);
      });
    }
  }

  async function loadCars(itemsCount) {
    try {
      loader.style.display = "block";
      errorBox.style.display = "none";

      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsCount, offset })
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Ошибка сервера");

      const rawCars = Array.isArray(result.cars_list)
        ? result.cars_list
        : Object.values(result.cars_list || {});

      if (rawCars.length === 0) {
        allLoaded = true;
        if (loadMoreBtn) loadMoreBtn.disabled = true;

        // Показать уведомление через 5 секунд
        setTimeout(() => {
          if (noMoreCarsNotice) {
            noMoreCarsNotice.style.display = "block";
          }
        }, 5000);

        return;
      }

      allCars = allCars.concat(rawCars);
      offset += itemsCount;

      sortCars();
      renderCars();
    } catch (error) {
      showError(error.message);
    } finally {
      loader.style.display = "none";
    }
  }

  function renderCars() {
    if (!grid) return;
    grid.innerHTML = "";

    allCars.forEach(car => {
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
      card.onclick = () => window.location.href = `car-details.html?car=${car.id}`;
      grid.appendChild(card);
    });
  }

  function sortCars() {
    const value = document.getElementById('sortSelect')?.value;
    if (!value) return;

    const [field, order] = value.split('_');
    allCars.sort((a, b) => {
      const aVal = String(a[field] || '');
      const bVal = String(b[field] || '');
      return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }

  function searchCars() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allCars.filter(car => {
      const name = ((car.brand || '') + ' ' + (car.model || '')).toLowerCase();
      return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(
        query.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      );
    });
    allCars = filtered;
    renderCars();
  }

  function debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  function showError(message) {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.style.display = "block";
    }
    console.error(message);
  }
});
