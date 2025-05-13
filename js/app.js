import { config } from './config.js';

function toLatinNumber(plate) {
  const map = {
    'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K',
    'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P',
    'С': 'C', 'Т': 'T', 'У': 'Y', 'Х': 'X',
    'а': 'A', 'в': 'B', 'е': 'E', 'к': 'K',
    'м': 'M', 'н': 'H', 'о': 'O', 'р': 'P',
    'с': 'C', 'т': 'T', 'у': 'Y', 'х': 'X'
  };
  return plate.replace(/\s/g, '').split('').map(c => map[c] || c).join('');
}

function hasSupplementary(car) {
  const eq = car.equipment || "";
  return /Установлено доп/i.test(eq);
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  
  
  const CACHE_KEY = 'cars_cache_v1';
  const CACHE_TTL_MS = 60000; // 60 секунд
  
  function loadCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const now = Date.now();
      if (cached.time && now - cached.time < CACHE_TTL_MS && Array.isArray(cached.cars)) {
        return cached.cars;
      }
    } catch (e) {
      console.warn('[CACHE] Ошибка чтения кэша:', e);
    }
    return null;
  }
  
  function saveCache(cars) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        time: Date.now(),
        cars
      }));
    } catch (e) {
      console.warn('[CACHE] Ошибка записи кэша:', e);
    }
  }
  
  function clearCache() {
    localStorage.removeItem(CACHE_KEY);
  }
  
  
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

    let allCars = [];
    let originalCars = [];
    let unsortedCars = []; // ← оригинальный порядок с сервера
    let currentMode = 'rent'; // 'rent' или 'buyout'
    let offset = 0;
    let allLoaded = false;
    let firstLoad = true;


        // ==== КЭШ и автообновление ====
    
        const cachedCars = loadCache();

        if (cachedCars) {
          allCars = cachedCars;
          originalCars = [...allCars];
          unsortedCars = [...allCars]; // ✅ фикс: сохраняем порядок для "Без сортировки"
          offset = allCars.length;
          firstLoad = false;
          renderCars();
          loadMoreBtn.style.display = "block";
          loadMoreBtn.disabled = false;
          feedbackNotice.style.display = "none";
        } else {
          loadCars(config.itemsInitial);
        }
        
    
        // автообновление данных каждые 60 секунд
setInterval(async () => {
  console.log('[INFO] Автообновление...');

  const savedScroll = window.scrollY;
  const savedSort = document.getElementById('sortSelect')?.value || '';
  const savedQuery = document.getElementById('searchInput')?.value || '';
  const savedMode = currentMode;

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: 100, offset: 0 })
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Ошибка сервера");

    const newCars = Array.isArray(result.cars_list)
      ? result.cars_list
      : Object.values(result.cars_list || {});

    // Сравним новые и старые
    const oldIds = new Set(allCars.map(c => c.id));
    const newIds = new Set(newCars.map(c => c.id));

    const changed = newCars.length !== allCars.length ||
      [...newIds].some(id => !oldIds.has(id));

    if (changed) {
      allCars = [...newCars];
      originalCars = [...newCars];
      offset = newCars.length;
      saveCache(allCars);

      // Применим текущий режим
      if (["rent", "buyout", "prokat"].includes(savedMode)) {
        currentMode = savedMode;
      }

      // Сортировка
      const sortSelect = document.getElementById('sortSelect');
      if (sortSelect) {
        sortSelect.value = savedSort;
        if (savedSort) {
          sortCars();
        } else {
          renderCars();
        }
      }

      // Поиск
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.value = savedQuery;
        if (savedQuery) searchCars();
      }

      // Вернуть прокрутку
      if (!document.hidden) {
        window.scrollTo(0, savedScroll);
      }

      console.log('[INFO] Данные обновлены');
    } else {
      console.log('[INFO] Изменений нет');
    }

  } catch (error) {
    console.warn('[ERROR] Автообновление:', error.message);
  }

}, CACHE_TTL_MS);

    // обработчик должен быть доступен всегда
    loadMoreBtn.addEventListener('click', () => {
      if (!allLoaded) loadCars(config.itemsLoadMore);

});

    // === Восстановление состояния после возврата из карточки ===
    const savedCars = localStorage.getItem('savedCars');
    const savedOffset = localStorage.getItem('savedOffset');
    const savedMode = localStorage.getItem('savedMode'); //savedMode

if (savedCars && savedOffset) {
allCars = JSON.parse(savedCars);
offset = parseInt(savedOffset, 10);
const savedTotal = parseInt(localStorage.getItem('carsTotal') || '1000', 10);

const savedSort = localStorage.getItem('savedSort');
const savedOriginal = localStorage.getItem('originalCars');
originalCars = savedOriginal ? JSON.parse(savedOriginal) : [...allCars];

if (savedMode === 'buyout' || savedMode === 'rent'|| savedMode === 'prokat') {
  currentMode = savedMode;
  document.getElementById("rentTab").classList.toggle("active", currentMode === "rent");
  document.getElementById("buyoutTab").classList.toggle("active", currentMode === "buyout");
  document.getElementById("prokatTab").classList.toggle("active", currentMode === "prokat");
  localStorage.removeItem('savedMode');
}

if (savedSort) {
  document.getElementById('sortSelect').value = savedSort;
  sortCars();
  localStorage.removeItem('savedSort');
}

allLoaded = offset >= savedTotal;
renderCars();

localStorage.removeItem('savedCars');
localStorage.removeItem('savedOffset');

if (!allLoaded) {
  loadMoreBtn.style.display = "block";
  loadMoreBtn.disabled = false;
  feedbackNotice.style.display = currentMode === 'prokat' ? "none" : "none";
} else {
  loadMoreBtn.style.display = "none";
  feedbackNotice.style.display = currentMode === 'prokat' ? "none" : "block";
}


// Восстановление прокрутки
const savedScroll = localStorage.getItem('scrollPosition');
if (savedScroll !== null) {
  setTimeout(() => {
    window.scrollTo(0, parseInt(savedScroll, 10));
    localStorage.removeItem('scrollPosition');
  }, 100);
}

initEventListeners();
return;

}


    // === Инициализация ===
    initEventListeners();
    loadCars(config.itemsInitial);

function initEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const rentTab = document.getElementById("rentTab");
  const buyoutTab = document.getElementById("buyoutTab");
  const prokatTab = document.getElementById("prokatTab");

  if (rentTab && buyoutTab && prokatTab) {
    rentTab.addEventListener("click", () => switchMode("rent"));
    buyoutTab.addEventListener("click", () => switchMode("buyout"));
    prokatTab.addEventListener("click", () => switchMode("prokat"));
  }

  if (searchInput) searchInput.addEventListener('input', debounce(searchCars, 300));
  if (sortSelect) sortSelect.addEventListener('change', sortCars);

  // повторная инициализация кнопки модального окна
  const openContactBtn = document.getElementById("openContactBtn");
  if (openContactBtn) {
    openContactBtn.addEventListener("click", () => {
      const contactModal = document.getElementById("contactModal");
      if (contactModal) contactModal.style.display = "flex";
    });
  }

  // закрытие модального окна
  const closeContactBtn = document.getElementById("closeContactBtn");
  if (closeContactBtn) {
    closeContactBtn.addEventListener("click", () => {
      const contactModal = document.getElementById("contactModal");
      if (contactModal) contactModal.style.display = "none";
    });
  }

  // закрытие при клике вне окна
  window.addEventListener("click", (e) => {
    const contactModal = document.getElementById("contactModal");
    if (e.target === contactModal) {
      contactModal.style.display = "none";
    }
  });

  // убрать фокус с поля поиска
  document.addEventListener("click", (e) => {
    if (searchInput && !searchInput.contains(e.target)) {
      searchInput.blur();
    }
  });
}



  function resetSortAndSearch() {
    const sortSelect = document.getElementById('sortSelect');
    const searchInput = document.getElementById('searchInput');
  
    if (sortSelect) {
      sortSelect.value = '';
    }
  
    if (searchInput) {
      searchInput.value = '';
    }
  }
  

  function switchMode(mode) {
    currentMode = mode;
  
    const modes = ["rent", "buyout", "prokat"];
    modes.forEach(id => {
      const tab = document.getElementById(`${id}Tab`);
      if (tab) tab.classList.toggle("active", id === mode);
    });
  
    // Общий сброс сортировки и поиска
    resetSortAndSearch();
  
    allCars = [...unsortedCars];
    originalCars = [...unsortedCars];    
  
    renderCars();
  
    // Применить сортировку если она осталась выбрана (например, после возврата)
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect?.value) {
      sortCars();
    }
  }
  
    // // // === Загрузка данных с сервера ===

    async function loadCars(itemsCount, isRefresh = false) {
      if (currentMode === 'prokat') {
        renderCars();
        loader.style.display = "none";
        return;
      }
    
      try {
        if (feedbackNotice) feedbackNotice.style.display = "none";
        errorBox.style.display = "none";
        loadMoreBtn.style.display = "none";
        loader.style.display = "block";
    
        if (isRefresh) clearCache();
    
        const response = await fetch(config.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsCount, offset: isRefresh ? 0 : offset })
        });
    
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || "Ошибка сервера");
    
        const newCars = Array.isArray(result.cars_list)
          ? result.cars_list
          : Object.values(result.cars_list || {});
        const total = result.total || 0;
        localStorage.setItem('carsTotal', total);
    
        const newIds = new Set(newCars.map(car => car.id));
        allCars = isRefresh
          ? [...newCars]
          : [...allCars.filter(car => !newIds.has(car.id)), ...newCars];
    
        if (unsortedCars.length === 0) {
          unsortedCars = [...newCars];
        }
    
        if (isRefresh) {
          originalCars = [...newCars];
          offset = newCars.length;
        } else {
          const existingIds = new Set(originalCars.map(car => car.id));
          const uniqueNew = newCars.filter(car => !existingIds.has(car.id));
          originalCars.push(...uniqueNew);
          offset += itemsCount;
        }
    
        saveCache(allCars);
        renderCars();
    
        if (total <= 100 || offset >= total) {
          allLoaded = true;
          loadMoreBtn.style.display = "none";
          loadMoreBtn.disabled = true;
    
          setTimeout(() => {
            feedbackNotice.style.display = "block";
          }, 300);
        } else {
          allLoaded = false;
          loadMoreBtn.style.display = "block";
          loadMoreBtn.disabled = false;
          feedbackNotice.style.display = "none";
        }
    
      } catch (error) {
        showError(error.message);
      } finally {
        loader.style.display = "none";
        firstLoad = false;
      }
    }
    

// ========== renderCars ==========

async function renderCars() {
  if (!grid) return;

  const totalEl = document.getElementById("totalCount");
  const fragment = document.createDocumentFragment();
  const prokatNumbers = config.prokatNumbers.map(toLatinNumber);

  // 1. Формируем список машин
  let filteredCars = [];

  if (currentMode === 'prokat') {
    filteredCars = [...allCars];

    prokatNumbers.forEach(num => {
      if (!filteredCars.some(car => toLatinNumber(car.number || '') === num)) {
        const extra = unsortedCars.find(car => toLatinNumber(car.number || '') === num);
        if (extra) filteredCars.push(extra);
      }
    });

    // приоритетные номера в начало
    filteredCars.sort((a, b) => {
      const na = toLatinNumber(a.number || '');
      const nb = toLatinNumber(b.number || '');
      const ia = prokatNumbers.indexOf(na);
      const ib = prokatNumbers.indexOf(nb);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return 0;
    });

  } else {
    filteredCars = allCars.filter(car =>
      !prokatNumbers.includes(toLatinNumber(car.number || ''))
    );
  }

  // Исключаем «Установлено доп» из всех табов, кроме buyout
  filteredCars = filteredCars.filter(car => {
    return hasSupplementary(car)
      ? currentMode === 'buyout'
      : true;
  });

  // 2. Обновляем счётчик
  if (totalEl) {
    totalEl.textContent = `Всего автомобилей: ${filteredCars.length}`;
    totalEl.style.display = "block";
  }

  // 3. Рендерим карточки
  const cards = await Promise.all(filteredCars.map(createCarCard));
  grid.innerHTML = "";
  cards.forEach(c => fragment.appendChild(c));
  grid.appendChild(fragment);

  // 4. Управляем "Загрузить ещё" и модалкой
  if (!allLoaded) {
    loadMoreBtn.style.display = currentMode === 'prokat' ? "none" : "block";
    loadMoreBtn.disabled = false;
    feedbackNotice.style.display = "none";
  } else {
    loadMoreBtn.style.display = "none";
    feedbackNotice.style.display = "block";
  }
}




    async function renderFiltered(filteredCars) {
      if (!grid) return;

        //  ─────── ДОБАВИЛИ ФИЛЬТРАЦИЮ ───────
  filteredCars = filteredCars.filter(car =>
    hasSupplementary(car)
      ? currentMode === 'buyout'     // если «Установлено доп» — только в buyout
      : true                         // иначе — всегда
  );
    
      const fragment = document.createDocumentFragment();
      const cardPromises = filteredCars.map(car => createCarCard(car));
      const cards = await Promise.all(cardPromises);
      cards.forEach(card => fragment.appendChild(card));
    
      grid.innerHTML = "";
      grid.appendChild(fragment);
    }


async function createCarCard(car) {
  const card = document.createElement('div');
  card.className = 'car-card';

  const model = (car.model || "").toLowerCase();
  const rawNumber = car.number || "";
  const carNumber = toLatinNumber(rawNumber.toUpperCase());

  // 💰 Получаем цену как есть
  const price = getCarPrice(car, currentMode) || "";

  // 🖼 Загрузка изображения
  const img = document.createElement("img");
  img.alt = "Фото авто";
  img.loading = "lazy";
  img.className = "car-img";

  const fallback = model.includes("vesta")
    ? 'img/vesta1.jpg'
    : model.includes("largus")
      ? 'img/largus1.jpg'
      : 'img/granta1.jpg';

  try {
    const res = await fetch(`/api/photos/${carNumber}`);
    const result = await res.json();
    img.src = (result.success && result.photos.length > 0) ? result.photos[0] : fallback;
  } catch {
    img.src = fallback;
  }

  // 📋 Детали карточки
  const details = `
    <h3 class="car-price">Цена: ${price}</h3>
    <p class="car-title">${car.brand || 'Без марки'} ${car.model || ''}</p>
    <div class="car-detal">
      <p>Год: ${car.year || '—'}</p>
      <p>Цвет: ${car.color || '—'}</p>
      <p>Гос.Номер: ${car.number || '—'}</p>
      <p>Пробег: ${car.odometer_display || '—'}</p>
    </div>
  `;

  card.appendChild(img);
  card.insertAdjacentHTML("beforeend", details);

  card.onclick = () => {
    localStorage.setItem('scrollPosition', window.scrollY);
    localStorage.setItem('savedCars', JSON.stringify(allCars));
    localStorage.setItem('originalCars', JSON.stringify(originalCars));
    localStorage.setItem('savedOffset', offset);
    localStorage.setItem('savedMode', currentMode);
    const sortValue = document.getElementById('sortSelect')?.value || '';
    localStorage.setItem('savedSort', sortValue);
    // window.location.href = `car-details.html?car=${car.id}`;
    window.location.href = `car-details.html?car=${car.id}&mode=${currentMode}`;
  };

  return card;
}


function getCarPrice(car, mode) {
  const number = toLatinNumber((car.number || "").toUpperCase());

  // ✅ Только ручные цены
  if (car.manual_price && car.manual_price[mode]) {
    return car.manual_price[mode]; // строка или число
  }

  return "Цена не указана";
}

function getNumericPrice(car, mode) {
  const priceRaw = getCarPrice(car, mode);
  // если цена не указана или не может быть приведена – возвращаем 0
  if (!priceRaw || typeof priceRaw === 'string' && !/\d/.test(priceRaw)) {
    return 0;
  }
  // если уже число — возвращаем как есть
  if (typeof priceRaw === 'number') {
    return priceRaw;
  }
  // из строки убираем всё, кроме цифр
  return parseInt(priceRaw.replace(/[^\d]/g, ''), 10) || 0;
}


  // === Сортировка ===

function sortCars() {
  const sortValue = document.getElementById('sortSelect')?.value;
  const prokatNumbers = config.prokatNumbers.map(toLatinNumber);

  // Вспомогательная функция для расширенного списка прокатных машин
  function getProkatList() {
    const list = [...allCars];
    prokatNumbers.forEach(num => {
      if (!list.some(car => toLatinNumber(car.number || '') === num)) {
        const extra = unsortedCars.find(car => toLatinNumber(car.number || '') === num);
        if (extra) list.push(extra);
      }
    });
    return list;
  }

  // Вспомогательная функция для приоритизации по списку prokatNumbers
  function prioritize(list) {
    return list.sort((a, b) => {
      const na = toLatinNumber(a.number || '');
      const nb = toLatinNumber(b.number || '');
      const ia = prokatNumbers.indexOf(na);
      const ib = prokatNumbers.indexOf(nb);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;   // a не приоритет, b — приоритет → b выше
        if (ib === -1) return -1;  // b не приоритет, a — приоритет → a выше
        return ia - ib;            // оба приоритетные — по их порядку в prokatNumbers
      }
      return 0; // если ни одна не в приоритете — сохраняем относительный порядок
    });
  }

  // 1) Собираем исходный массив перед сортировкой
  let target;
  if (currentMode === 'prokat') {
    target = getProkatList();
  } else {
    target = allCars.filter(car =>
      !prokatNumbers.includes(toLatinNumber(car.number || ''))
    );
  }

  // 2) Если "Без сортировки":
  if (!sortValue) {
    if (currentMode === 'prokat') {
      // приоритетные номера наверх
      target = prioritize(target);
    }
    allCars = [...target];
    originalCars = [...target];
    renderFiltered(target);
    return;
  }

  // 3) Иначе — парсим направление и поле
  const [field, order] = sortValue.split('_');

  // 4) Сортируем копию target
  const sorted = [...target].sort((a, b) => {
    let aVal, bVal;

    if (field === 'price') {
      aVal = getNumericPrice(a, currentMode);
      bVal = getNumericPrice(b, currentMode);
      // «Цена не указана» — всегда в конец
      if (aVal === 0 && bVal !== 0) return order === 'asc' ? 1 : -1;
      if (bVal === 0 && aVal !== 0) return order === 'asc' ? -1 : 1;
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    } else if (field === 'mileage') {
      aVal = parseInt(a.odometer || 0, 10);
      bVal = parseInt(b.odometer || 0, 10);
    } else {
      aVal = String(a[field] || '');
      bVal = String(b[field] || '');
      return order === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // originalCars = [...sorted];
  // renderFiltered(sorted);
  allCars = originalCars = sorted;
  renderFiltered(sorted);
}

    // === Поиск ===
    
// ========== searchCars ==========
function searchCars() {
  const searchInput = document.getElementById('searchInput');
  const totalEl     = document.getElementById('totalCount');
  const query       = (searchInput?.value || '').toLowerCase().trim();

  // транслитерация для кириллицы
  const translitMap = {
    а:'a', в:'v', г:'g', д:'d', е:'e', ё:'e', ж:'zh', з:'z',
    и:'i', й:'y', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p',
    р:'r', с:'s', т:'t', у:'u', ф:'f', х:'h', ц:'ts', ч:'ch',
    ш:'sh', щ:'sch', ъ:'', ы:'y', ь:'', э:'e', ю:'yu', я:'ya'
  };
  const translit = str =>
    str.split('').map(c => translitMap[c] || translitMap[c.toLowerCase()] || c).join('');
  const normalizedQuery = query.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const altQuery        = translit(normalizedQuery);

  // список прокатных номеров
  const prokatNumbers = config.prokatNumbers.map(toLatinNumber);

  // функция для полного списка проката
  const getProkatList = () => {
    const list = [...allCars];
    prokatNumbers.forEach(num => {
      if (!list.some(c => toLatinNumber(c.number || '') === num)) {
        const extra = unsortedCars.find(c => toLatinNumber(c.number || '') === num);
        if (extra) list.push(extra);
      }
    });
    return list;
  };

  // 1) фильтрация по вкладке
  let filtered = currentMode === 'prokat'
    ? getProkatList()
    : allCars.filter(car =>
        !prokatNumbers.includes(toLatinNumber(car.number || ''))
      );

  // 2) если есть текст — применяем поиск по brand+model
  if (normalizedQuery) {
    filtered = filtered.filter(car => {
      const name = ((car.brand||'') + ' ' + (car.model||'')).toLowerCase();
      const normName = name.normalize("NFD").replace(/[̀-ͯ]/g, "");
      return normName.includes(normalizedQuery) || normName.includes(altQuery);
    });
  }

  // 2.1) и здесь тоже отбрасываем «Установлено доп» вне buyout
  filtered = filtered.filter(car => {
    return hasSupplementary(car)
      ? currentMode === 'buyout'
      : true;
  });

  // 3) обновляем счётчик
  if (totalEl) {
    totalEl.textContent = `Всего автомобилей: ${filtered.length}`;
    totalEl.style.display = "block";
  }

  // 4) рендерим результаты
  renderFiltered(filtered);

  // 5) модалка «Не нашли авто мечты…»
if (filtered.length === 0) {
  feedbackNotice.style.display = "block";
} else {
  feedbackNotice.style.display = allLoaded ? "block" : "none";
}


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
          // Скрыть ошибку через 5 секунд
    setTimeout(() => {
      errorBox.style.display = "none";
    }, 5000);
    }
    console.error(message);
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
}


