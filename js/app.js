
// app.js
import { config } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  // === Тема оформления ===
  const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  toggleTheme(prefersDarkTheme);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => toggleTheme(e.matches));

  function toggleTheme(isDark) {
    document.body.classList.toggle('dark-theme', isDark);
    document.body.classList.toggle('light-theme', !isDark);
    const logo = document.querySelector('.logo');
    if (logo) logo.src = isDark ? 'img/logo2.jpg' : 'img/logo.jpg';
  }

  // === DOM элементы ===
  const loader = document.querySelector('.loader');
  const errorBox = document.querySelector('.error-message');
  const grid = document.querySelector('.cars-grid');
  const loadMoreContainer = document.querySelector('.pagination-container');
  const feedbackNotice = document.getElementById('noMoreCarsNotice');

  if (grid && loadMoreContainer && config?.apiUrl) {



    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.textContent = "Загрузить ещё";
    loadMoreBtn.className = "btn load-more-btn";
    loadMoreContainer.appendChild(loadMoreBtn);

    // обработчик должен быть доступен всегда
    loadMoreBtn.addEventListener('click', () => {
    if (!allLoaded) loadCars(config.itemsLoadMore);



});
    let allCars = [];
    let originalCars = [];
    let currentMode = 'rent'; // 'rent' или 'buyout'
    let offset = 0;
    let allLoaded = false;
    let firstLoad = true;

    // === Восстановление состояния после возврата из карточки ===
    const savedCars = localStorage.getItem('savedCars');
    const savedOffset = localStorage.getItem('savedOffset');
    const savedScroll = localStorage.getItem('scrollPosition');
    const savedMode = localStorage.getItem('savedMode'); //savedMode

if (savedCars && savedOffset) {
  allCars = JSON.parse(savedCars);
  offset = parseInt(savedOffset, 10);

  const savedSort = localStorage.getItem('savedSort'); // ⬅️ СНАЧАЛА ОБЪЯВЛЯЕМ

  const savedOriginal = localStorage.getItem('originalCars');
  originalCars = savedOriginal ? JSON.parse(savedOriginal) : [...allCars];
  
  if (savedMode === 'buyout' || savedMode === 'rent') {
    currentMode = savedMode;
    document.getElementById("rentTab").classList.toggle("active", currentMode === "rent");
    document.getElementById("buyoutTab").classList.toggle("active", currentMode === "buyout");
    localStorage.removeItem('savedMode');
  }

  if (savedSort) {
    document.getElementById('sortSelect').value = savedSort;
    sortCars();
    localStorage.removeItem('savedSort');
  }

  renderCars();
  localStorage.removeItem('savedCars');
  localStorage.removeItem('savedOffset');

  // Восстановление прокрутки
  const savedScroll = localStorage.getItem('scrollPosition');
  if (savedScroll !== null) {
    setTimeout(() => {
      window.scrollTo(0, parseInt(savedScroll, 10));
      localStorage.removeItem('scrollPosition');
    }, 100);
  }

  // Инициализация событий после восстановления
  initEventListeners();

  loadMoreBtn.style.display = "block";
  loadMoreBtn.disabled = false;
  feedbackNotice.style.display = "none";
  allLoaded = false;

  return;
}


    // === Инициализация ===
    initEventListeners();
    loadCars(config.itemsInitial);

    loadMoreBtn.addEventListener('click', () => {
      if (!allLoaded) loadCars(config.itemsLoadMore);
    });

    function initEventListeners() {
      const searchInput = document.getElementById('searchInput');
      const sortSelect = document.getElementById('sortSelect');
      const rentTab = document.getElementById("rentTab");
      const buyoutTab = document.getElementById("buyoutTab");

      if (rentTab && buyoutTab) {
        rentTab.addEventListener("click", () => switchMode("rent"));
        buyoutTab.addEventListener("click", () => switchMode("buyout"));
      }

      if (searchInput) searchInput.addEventListener('input', debounce(searchCars, 300));
      if (sortSelect) sortSelect.addEventListener('change', () => {
        sortCars();
        renderCars();
      });

      // Клик вне поля поиска убирает фокус
    document.addEventListener("click", (e) => {
    const searchInput = document.getElementById("searchInput");
    if (searchInput && !searchInput.contains(e.target)) {
    searchInput.blur(); // убираем фокус
    }
    });
    }

    function switchMode(mode) {
      currentMode = mode;
      document.getElementById("rentTab").classList.toggle("active", mode === "rent");
      document.getElementById("buyoutTab").classList.toggle("active", mode === "buyout");
      renderCars();
    }

    // // === Загрузка данных с сервера ===
    async function loadCars(itemsCount) {
      try {
        errorBox.style.display = "none";
        loadMoreBtn.style.display = "none";
        loader.style.display = "block";
    
        const response = await fetch(config.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsCount, offset })
        });
    
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || "Ошибка сервера");
    
        const newCars = Array.isArray(result.cars_list) ? result.cars_list : Object.values(result.cars_list || {});
    
        if (newCars.length < itemsCount) {
          allLoaded = true;
          loadMoreBtn.style.display = "none";
          loadMoreBtn.disabled = true;
          feedbackNotice.style.display = "block";
        } else {
          allLoaded = false;
          loadMoreBtn.style.display = "block";
          loadMoreBtn.disabled = false;
          feedbackNotice.style.display = "none";
        }
    
        // Добавляем только уникальные
        newCars.forEach(car => {
          if (!allCars.some(existingCar => existingCar.id === car.id)) {
            allCars.push(car);
          }
        });
    
        // 🧠 Обновляем originalCars, чтобы "Без сортировки" работал правильно
        // if (firstLoad) {
        //   originalCars = [...allCars];
        // } else {
        //   const uniqueToOriginal = newCars.filter(car => !originalCars.some(orig => orig.id === car.id));
        //   originalCars.push(...uniqueToOriginal);
        // }

        if (firstLoad) {
          originalCars = [...allCars];        // сохраняем исходный порядок
          firstLoad = false;                  // сбрасываем, чтобы больше не перезаписывать
          const currentSort = document.getElementById('sortSelect')?.value;
          if (currentSort) {
            sortCars();                       // сортируем после сохранения original
          }
        } else {
          const uniqueToOriginal = newCars.filter(car => !originalCars.some(orig => orig.id === car.id));
          originalCars.push(...uniqueToOriginal);
        }
        
    
        offset += itemsCount;
    
        // const currentSort = document.getElementById('sortSelect')?.value;
        // if (currentSort) {
        //   sortCars(); // если выбрана сортировка
        // } else {
        //   allCars = [...originalCars]; // если "Без сортировки" — восстанавливаем порядок
        // }
    
        renderCars();
      } catch (error) {
        showError(error.message);
      } finally {
        loader.style.display = "none";
        if (!allLoaded) loadMoreBtn.style.display = "block";
        firstLoad = false;
      }
    }
    

    // === Рендер карточек ===
    function renderCars() {
      grid.innerHTML = "";
      allCars.forEach(car => grid.appendChild(createCarCard(car)));
    }

    function renderFiltered(filteredCars) {
      grid.innerHTML = "";
      filteredCars.forEach(car => grid.appendChild(createCarCard(car)));
    }

    function createCarCard(car) {
      const card = document.createElement('div');
      card.className = 'car-card';

      const model = (car.model || "").toLowerCase();
      let price = "—";
      if (model.includes("granta")) price = currentMode === 'rent' ? "1700 руб/сутки" : "850 000 ₽";
      else if (model.includes("vesta")) price = currentMode === 'rent' ? "2400 руб/сутки" : "1 050 000 ₽";
      else if (model.includes("largus")) price = currentMode === 'rent' ? "2600 руб/сутки" : "1 100 000 ₽";

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
          <p>Гос.Номер: ${car.number || '—'}</p>
          <p>Пробег: ${car.odometer_display || '—'}</p>
        </div>
      `;

//<p>Тип топлива: <span class="fuel-${fuelTypeClass}">${fuelType}</span></p>

      card.onclick = () => {
        localStorage.setItem('scrollPosition', window.scrollY);
        localStorage.setItem('savedCars', JSON.stringify(allCars));
        localStorage.setItem('originalCars', JSON.stringify(originalCars)); // 💾 сохраняем оригинальный порядок
        localStorage.setItem('savedOffset', offset);
        localStorage.setItem('savedMode', currentMode); // 💾 сохраняем вкладку
        const sortValue = document.getElementById('sortSelect')?.value || '';
        localStorage.setItem('savedSort', sortValue); // 💾 сохраняем сортировку
        window.location.href = `car-details.html?car=${car.id}`;
      };

      return card;
    }

  

    function getCarPrice(car) {
      const model = (car.model || "").toLowerCase();
      if (model.includes("granta")) return currentMode === 'rent' ? 1700 : 850000;
      if (model.includes("vesta")) return currentMode === 'rent' ? 2400 : 1050000;
      if (model.includes("largus")) return currentMode === 'rent' ? 2600 : 1100000;
      return 0;
    }

      // === Сортировка ===

    function sortCars() {
      const value = document.getElementById('sortSelect')?.value;
      if (!value) {
        allCars = [...originalCars]; // Сброс к изначальному порядку
        document.getElementById('sortSelect').selectedIndex = 0; // 👈 сброс селекта
        renderCars();                // 👉 нужно отрисовать заново!
        return;
      }
    
      const [field, order] = value.split('_');
    
      allCars.sort((a, b) => {
        let aVal, bVal;
    
        if (field === 'price') {
          aVal = getCarPrice(a);
          bVal = getCarPrice(b);
        } else if (field === 'mileage') {
          aVal = parseInt(a.odometer || 0, 10);
          bVal = parseInt(b.odometer || 0, 10);
        } else {
          aVal = String(a[field] || '');
          bVal = String(b[field] || '');
          return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
    
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }
    
    

    // === Поиск ===
    function searchCars() {
      const query = document.getElementById('searchInput')?.value.toLowerCase();
      if (!query) return renderCars();

      const translitMap = { а: 'a', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
      const translit = str => str.split('').map(c => translitMap[c] || translitMap[c.toLowerCase()] || c).join('');

      const normalizedQuery = query.normalize("NFD").replace(/[̀-ͯ]/g, "");
      const altQuery = translit(normalizedQuery);

      const filtered = allCars.filter(car => {
        const name = ((car.brand || '') + ' ' + (car.model || '')).toLowerCase();
        const normName = name.normalize("NFD").replace(/[̀-ͯ]/g, "");
        return normName.includes(normalizedQuery) || normName.includes(altQuery);
      });

      renderFiltered(filtered);
    }
  }

  // === Модалка "Оставить заявку" ===
  const contactModal = document.getElementById("contactModal");
  const openContactBtn = document.getElementById("openContactBtn");
  const closeContactBtn = document.getElementById("closeContactBtn");

  if (openContactBtn && contactModal) {
    openContactBtn.addEventListener("click", () => {
      contactModal.style.display = "flex";
    });
  }

  if (closeContactBtn && contactModal) {
    closeContactBtn.addEventListener("click", () => {
      contactModal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === contactModal) {
      contactModal.style.display = "none";
    }
  });

  const submitRequestBtn = document.getElementById("submitRequestBtn");
  if (submitRequestBtn) {
    submitRequestBtn.addEventListener("click", async () => {
      const name = document.getElementById("userName").value.trim();
      const phone = document.getElementById("userPhone").value.trim();
      const request = document.getElementById("userRequest").value.trim();

      if (!name || !phone) {
        alert("Пожалуйста, заполните имя и телефон");
        return;
      }

      try {
        const response = await fetch("/api/send-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, request })
        });

        const result = await response.json();
        if (result.success) {
          alert("Спасибо! Ваша заявка отправлена.");
          document.getElementById("userName").value = "";
          document.getElementById("userPhone").value = "";
          document.getElementById("userRequest").value = "";
          contactModal.style.display = "none";
        } else {
          alert("Ошибка: " + result.error);
        }
      } catch (err) {
        alert("Не удалось отправить заявку.");
      }
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
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
