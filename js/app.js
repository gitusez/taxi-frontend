
// import { config } from './config.js';

// document.addEventListener('DOMContentLoaded', () => {
//   let allCars = [];
//   let offset = 0;
//   let allLoaded = false;

//   const loader = document.querySelector('.loader');
//   const errorBox = document.querySelector('.error-message');
//   const grid = document.querySelector('.cars-grid');
//   const loadMoreContainer = document.querySelector('.pagination-container');
//   const loadMoreBtn = document.createElement('button');
//   loadMoreBtn.textContent = "Загрузить ещё";
//   loadMoreBtn.className = "btn load-more-btn";
//   loadMoreContainer.appendChild(loadMoreBtn);

//   const feedbackNotice = document.getElementById('noMoreCarsNotice');
//   const openContactBtn = document.getElementById('openContactBtn');
//   const contactModal = document.getElementById('contactModal');
//   const closeBtn = document.querySelector('.close-btn');

//   if (openContactBtn) {
//     openContactBtn.addEventListener('click', () => {
//       if (contactModal) contactModal.style.display = 'flex';
//     });
//   }

//   if (closeBtn) {
//     closeBtn.addEventListener('click', () => {
//       if (contactModal) contactModal.style.display = 'none';
//     });
//   }

//   const sendBtn = document.querySelector('#contactModal .btn.contact');
//   if (sendBtn) {
//     sendBtn.addEventListener('click', () => {
//       const inputs = contactModal.querySelectorAll('input');
//       const data = {
//         name: inputs[0].value.trim(),
//         phone: inputs[1].value.trim(),
//         request: inputs[2].value.trim()
//       };
//       console.log("Форма отправлена:", data);
//       contactModal.style.display = 'none';
//     });
//   }

//   initEventListeners();
//   loadCars(config.itemsInitial);

//   loadMoreBtn.addEventListener('click', () => {
//     if (!allLoaded) loadCars(config.itemsLoadMore);
//   });

//   function initEventListeners() {
//     const searchInput = document.getElementById('searchInput');
//     if (searchInput) searchInput.addEventListener('input', debounce(searchCars, 300));

//     const sortSelect = document.getElementById('sortSelect');
//     if (sortSelect) sortSelect.addEventListener('change', () => {
//       sortCars();
//       renderCars();
//     });
//   }

//   async function loadCars(itemsCount) {
//     try {
//       loader.style.display = "block";
//       errorBox.style.display = "none";

//       const response = await fetch(config.apiUrl, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ items: itemsCount, offset })
//       });

//       if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
//       const result = await response.json();
//       if (!result.success) throw new Error(result.error || "Ошибка сервера");

//       const newCars = Array.isArray(result.cars_list)
//         ? result.cars_list
//         : Object.values(result.cars_list || {});

//       if (newCars.length === 0) {
//         allLoaded = true;
//         loadMoreBtn.disabled = true;

//         setTimeout(() => {
//           if (feedbackNotice) feedbackNotice.style.display = "block";
//         }, 5000);
//         return;
//       }

//       allCars = allCars.concat(newCars);
//       offset += itemsCount;

//       sortCars();
//       renderCars();
//     } catch (error) {
//       showError(error.message);
//     } finally {
//       loader.style.display = "none";
//     }
//   }

//   function renderCars() {
//     grid.innerHTML = "";
//     allCars.forEach(car => {
//       const card = document.createElement('div');
//       card.className = 'car-card';
  
//       const model = (car.model || "").toLowerCase();
//       let price = "—";
//       if (model.includes("granta")) price = "1700 руб/сутки";
//       else if (model.includes("vesta")) price = "2400 руб/сутки";
//       else if (model.includes("largus")) price = "2600 руб/сутки";
  
//       const fuelType = car.fuel_type || "—";
//       const transmission = car.transmission || "—";
//       const equipment = car.equipment || "—";
//       const fuelTypeClass = typeof fuelType === 'string' ? fuelType.toLowerCase().replace(/\s/g, '-') : '';
//       const image = car.avatar || 'img/granta1.jpg';
  
//       card.innerHTML = `
//         <img src="${image}" alt="Фото авто" class="car-img">
//         <h3 class="car-price">Цена: ${price}</h3>
//         <p class="car-title">${car.brand || 'Без марки'} ${car.model || ''}</p>
//         <div class="car-detal">
//           <p>Год: ${car.year || '—'}</p>
//           <p>Цвет: ${car.color || '—'}</p>
//           <p>Номер: ${car.number || '—'}</p>
//           <p>Тип топлива: <span class="fuel-${fuelTypeClass}">${fuelType}</span></p>
//         </div>
//       `;
  
//       card.onclick = () => window.location.href = `car-details.html?car=${car.id}`;
//       grid.appendChild(card);
//     });
//   }

//   function sortCars() {
//     const value = document.getElementById('sortSelect')?.value;
//     if (!value) return;

//     const [field, order] = value.split('_');
//     allCars.sort((a, b) => {
//       const aVal = String(a[field] || '');
//       const bVal = String(b[field] || '');
//       return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
//     });
//   }

//   function searchCars() {
//     const query = document.getElementById('searchInput')?.value.toLowerCase();
//     const filtered = allCars.filter(car => {
//       const name = ((car.brand || '') + ' ' + (car.model || '')).toLowerCase();
//       return name.normalize("NFD").replace(/[̀-ͯ]/g, "").includes(
//         query.normalize("NFD").replace(/[̀-ͯ]/g, "")
//       );
//     });
//     renderFiltered(filtered);
//   }

//   function renderFiltered(filteredCars) {
//     grid.innerHTML = "";
//     filteredCars.forEach(car => {
//       const card = document.createElement('div');
//       card.className = 'car-card';
  
//       const model = (car.model || "").toLowerCase();
//       let price = "—";
//       if (model.includes("granta")) price = "1700 руб/сутки";
//       else if (model.includes("vesta")) price = "2400 руб/сутки";
//       else if (model.includes("largus")) price = "2600 руб/сутки";
  
//       const fuelType = car.fuel_type || "—";
//       const transmission = car.transmission || "—";
//       const equipment = car.equipment || "—";
//       const fuelTypeClass = typeof fuelType === 'string' ? fuelType.toLowerCase().replace(/\s/g, '-') : '';
//       const image = car.avatar || 'img/granta1.jpg';
  
//       card.innerHTML = `
//         <img src="${image}" alt="Фото авто" class="car-img">
//         <h3 class="car-price">Цена: ${price}</h3>
//         <p class="car-title">${car.brand || 'Без марки'} ${car.model || ''}</p>
//         <div class="car-detal">
//           <p>Год: ${car.year || '—'}</p>
//           <p>Цвет: ${car.color || '—'}</p>
//           <p>Номер: ${car.number || '—'}</p>
//           <p>Тип топлива: <span class="fuel-${fuelTypeClass}">${fuelType}</span></p>
//         </div>
//       `;
  
//       card.onclick = () => window.location.href = `car-details.html?car=${car.id}`;
//       grid.appendChild(card);
//     });
//   }

//   function showError(message) {
//     if (errorBox) {
//       errorBox.textContent = message;
//       errorBox.style.display = "block";
//     }
//     console.error(message);
//   }
// });

// function debounce(func, wait) {
//   let timeout;
//   return function(...args) {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func.apply(this, args), wait);
//   };
// }

import { config } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  let allCars = [];
  let offset = 0;
  let allLoaded = false;

  const loader = document.querySelector('.loader');
  const errorBox = document.querySelector('.error-message');
  const grid = document.querySelector('.cars-grid');
  const loadMoreContainer = document.querySelector('.pagination-container');
  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.textContent = "Загрузить ещё";
  loadMoreBtn.className = "btn load-more-btn";
  loadMoreContainer.appendChild(loadMoreBtn);

  const feedbackNotice = document.getElementById('noMoreCarsNotice');
  const openContactBtn = document.getElementById('openContactBtn');
  const contactModal = document.getElementById('contactModal');
  const closeBtn = document.querySelector('.close-btn');

  if (openContactBtn) {
    openContactBtn.addEventListener('click', () => {
      if (contactModal) contactModal.style.display = 'flex';
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (contactModal) contactModal.style.display = 'none';
    });
  }

  const sendBtn = document.querySelector('#contactModal .btn.contact');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const inputs = contactModal.querySelectorAll('input');
      const data = {
        name: inputs[0].value.trim(),
        phone: inputs[1].value.trim(),
        request: inputs[2].value.trim()
      };
      console.log("Форма отправлена:", data);
      contactModal.style.display = 'none';
    });
  }

  initEventListeners();
  loadCars(config.itemsInitial);

  loadMoreBtn.addEventListener('click', () => {
    if (!allLoaded) loadCars(config.itemsLoadMore);
  });

  function initEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', debounce(searchCars, 300));

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.addEventListener('change', () => {
      sortCars();
      renderCars();
    });
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

      const newCars = Array.isArray(result.cars_list)
        ? result.cars_list
        : Object.values(result.cars_list || {});

      if (newCars.length === 0) {
        allLoaded = true;
        loadMoreBtn.disabled = true;
        feedbackNotice.style.display = "block"; // Появляется сразу
        return;
      }

      // Фильтрация дубликатов
      newCars.forEach(car => {
        if (!allCars.some(existingCar => existingCar.id === car.id)) {
          allCars.push(car);
        }
      });

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
    grid.innerHTML = "";
    allCars.forEach(car => {
      const card = document.createElement('div');
      card.className = 'car-card';

      const model = (car.model || "").toLowerCase();
      let price = "—";
      if (model.includes("granta")) price = "1700 руб/сутки";
      else if (model.includes("vesta")) price = "2400 руб/сутки";
      else if (model.includes("largus")) price = "2600 руб/сутки";

      const fuelType = car.fuel_type || "—";
      const transmission = car.transmission || "—";
      const equipment = car.equipment || "—";
      const fuelTypeClass = typeof fuelType === 'string' ? fuelType.toLowerCase().replace(/\s/g, '-') : '';
      const image = car.avatar || 'img/granta1.jpg';

      card.innerHTML = `
        <img src="${image}" alt="Фото авто" class="car-img">
        <h3 class="car-price">Цена: ${price}</h3>
        <p class="car-title">${car.brand || 'Без марки'} ${car.model || ''}</p>
        <div class="car-detal">
          <p>Год: ${car.year || '—'}</p>
          <p>Цвет: ${car.color || '—'}</p>
          <p>Номер: ${car.number || '—'}</p>
          <p>Тип топлива: <span class="fuel-${fuelTypeClass}">${fuelType}</span></p>
          <p>Коробка передач: ${transmission}</p>
          <p>Комплектация: ${equipment}</p>
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
    const query = document.getElementById('searchInput')?.value.toLowerCase();
    const filtered = allCars.filter(car => {
      const name = ((car.brand || '') + ' ' + (car.model || '')).toLowerCase();
      return name.normalize("NFD").replace(/[̀-ͯ]/g, "").includes(
        query.normalize("NFD").replace(/[̀-ͯ]/g, "")
      );
    });
    renderFiltered(filtered);
  }

  function renderFiltered(filteredCars) {
    grid.innerHTML = "";
    filteredCars.forEach(car => {
      const card = document.createElement('div');
      card.className = 'car-card';

      const model = (car.model || "").toLowerCase();
      let price = "—";
      if (model.includes("granta")) price = "1700 руб/сутки";
      else if (model.includes("vesta")) price = "2400 руб/сутки";
      else if (model.includes("largus")) price = "2600 руб/сутки";

      const fuelType = car.fuel_type || "—";
      const fuelTypeClass = typeof fuelType === 'string' ? fuelType.toLowerCase().replace(/\s/g, '-') : '';      
      const image = car.avatar || 'img/granta1.jpg';

      card.innerHTML = `
        <img src="${image}" alt="Фото авто" class="car-img">
        <h3 class="car-price">Цена: ${price}</h3>
        <p class="car-title">${car.brand || 'Без марки'} ${car.model || ''}</p>
        <div class="car-detal">
          <p>Год: ${car.year || '—'}</p>
          <p>Цвет: ${car.color || '—'}</p>
          <p>Номер: ${car.number || '—'}</p>
          <p>Тип топлива: <span class="fuel-${fuelTypeClass}">${fuelType}</span></p>
        </div>
      `;

      card.onclick = () => window.location.href = `car-details.html?car=${car.id}`;
      grid.appendChild(card);
    });
  }

  function showError(message) {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.style.display = "block";
    }
    console.error(message);
  }
});

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
