
// app.js
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


document.addEventListener('DOMContentLoaded', () => {

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
    let currentMode = 'rent'; // 'rent' или 'buyout'
    let offset = 0;
    let allLoaded = false;
    let firstLoad = true;


        // ==== КЭШ и автообновление ====
    
        const cachedCars = loadCache();

        if (cachedCars) {
          allCars = cachedCars;
          originalCars = [...allCars];
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
        // setInterval(() => {
        //   console.log('[INFO] Автообновление...');
        //   localStorage.removeItem(CACHE_KEY);
        //   offset = 0;
        //   allCars = [];
        //   originalCars = [];
        //   firstLoad = true;
        //   loadCars(config.itemsInitial);
        // }, CACHE_TTL_MS);

        // setInterval(() => {
        //   console.log('[INFO] Автообновление...');
        //   loadCars(config.itemsInitial, true); // передаём флаг обновления
        // }, CACHE_TTL_MS);



  //       setInterval(() => {
  //         console.log('[INFO] Автообновление...');
        
  //         const savedScroll = window.scrollY;
  //         const savedSort = document.getElementById('sortSelect')?.value || '';
  //         const savedQuery = document.getElementById('searchInput')?.value || '';
  //         const savedMode = currentMode;
        
  // // Заменяем количество на 100 (максимум)
  // loadCars(100, true).then(() => {
  //   const rentTab = document.getElementById("rentTab");
  //   const buyoutTab = document.getElementById("buyoutTab");
  //   if (rentTab && buyoutTab) {
  //     rentTab.classList.toggle("active", savedMode === "rent");
  //     buyoutTab.classList.toggle("active", savedMode === "buyout");
  //   }
  //   currentMode = savedMode;
        
  //           const sortSelect = document.getElementById('sortSelect');
  //           if (sortSelect && savedSort) {
  //             sortSelect.value = savedSort;
  //             sortCars();
  //           }
        
  //           const searchInput = document.getElementById('searchInput');
  //           if (searchInput && savedQuery) {
  //             searchInput.value = savedQuery;
  //             searchCars();
  //           } else {
  //             renderCars();
  //           }
        
  //           if (!document.hidden) {
  //             window.scrollTo(0, savedScroll);
  //           }
        
  //           // updateNotice.style.display = 'block';
  //           // setTimeout(() => updateNotice.style.display = 'none', 3000);
  //         });
  //       }, CACHE_TTL_MS);


  setInterval(() => {
    console.log('[INFO] Автообновление...');
  
    const savedScroll = window.scrollY;
    const savedSort = document.getElementById('sortSelect')?.value || '';
    const savedQuery = document.getElementById('searchInput')?.value || '';
    const savedMode = currentMode;
  
    loadCars(100, true).then(() => {
      // document.getElementById("rentTab")?.classList.toggle("active", savedMode === "rent");
      // document.getElementById("buyoutTab")?.classList.toggle("active", savedMode === "buyout");

      const rentTab = document.getElementById("rentTab");
const buyoutTab = document.getElementById("buyoutTab");

if (rentTab && buyoutTab) {
  if (savedMode === "rent") {
    rentTab.classList.add("active");
    buyoutTab.classList.remove("active");
  } else {
    rentTab.classList.remove("active");
    buyoutTab.classList.add("active");
  }
}

      currentMode = savedMode;
  
      const sortSelect = document.getElementById('sortSelect');
      if (sortSelect && savedSort) {
        sortSelect.value = savedSort;
        sortCars();
      }
  
      const searchInput = document.getElementById('searchInput');
      if (searchInput && savedQuery) {
        searchInput.value = savedQuery;
        searchCars();
      } else {
        renderCars();
      }
  
      if (!document.hidden) {
        window.scrollTo(0, savedScroll);
      }
    });
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

    // // // === Загрузка данных с сервера ===
    // async function loadCars(itemsCount) {
    //   try {
    //     errorBox.style.display = "none";
    //     loadMoreBtn.style.display = "none";
    //     loader.style.display = "block";
    
    //     const response = await fetch(config.apiUrl, {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({ items: itemsCount, offset })
    //     });
    
    //     if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    //     const result = await response.json();
    //     if (!result.success) throw new Error(result.error || "Ошибка сервера");
    
    //     const newCars = Array.isArray(result.cars_list) ? result.cars_list : Object.values(result.cars_list || {});
    
    //     if (newCars.length < itemsCount) {
    //       allLoaded = true;
    //       loadMoreBtn.style.display = "none";
    //       loadMoreBtn.disabled = true;
    //       feedbackNotice.style.display = "block";
    //     } else {
    //       allLoaded = false;
    //       loadMoreBtn.style.display = "block";
    //       loadMoreBtn.disabled = false;
    //       feedbackNotice.style.display = "none";
    //     }
    
    //     // Добавляем только уникальные
    //     newCars.forEach(car => {
    //       if (!allCars.some(existingCar => existingCar.id === car.id)) {
    //         allCars.push(car);
    //       }
    //     });
    
    //     if (firstLoad) {
    //       originalCars = [...allCars];        // сохраняем исходный порядок
    //       firstLoad = false;                  // сбрасываем, чтобы больше не перезаписывать
    //       const currentSort = document.getElementById('sortSelect')?.value;
    //       if (currentSort) {
    //         sortCars();                       // сортируем после сохранения original
    //       }
    //     } else {
    //       const uniqueToOriginal = newCars.filter(car => !originalCars.some(orig => orig.id === car.id));
    //       originalCars.push(...uniqueToOriginal);
    //     }
        
    //     offset += itemsCount;

    //     localStorage.setItem(CACHE_KEY, JSON.stringify({
    //       time: Date.now(),
    //       cars: allCars
    //     }));        

    //     renderCars();
    //   } catch (error) {
    //     showError(error.message);
    //   } finally {
    //     loader.style.display = "none";
    //     if (!allLoaded) loadMoreBtn.style.display = "block";
    //     firstLoad = false;
    //   }
    // }





    // async function loadCars(itemsCount, isRefresh = false) {
    //   try {
    //     errorBox.style.display = "none";
    //     loadMoreBtn.style.display = "none";
    //     loader.style.display = "block";
    
    //     if (isRefresh) clearCache();
    
    //     const response = await fetch(config.apiUrl, {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({ items: itemsCount, offset: isRefresh ? 0 : offset })
    //     });
    
    //     if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    //     const result = await response.json();
    //     if (!result.success) throw new Error(result.error || "Ошибка сервера");
    
    //     const newCars = Array.isArray(result.cars_list)
    //       ? result.cars_list
    //       : Object.values(result.cars_list || {});
    //     const total = result.total || 0;
    
    //     const newIds = new Set(newCars.map(car => car.id));
    //     allCars = isRefresh
    //       ? [...newCars]
    //       : [...allCars.filter(car => !newIds.has(car.id)), ...newCars];
    
    //     if (isRefresh) {
    //       originalCars = [...newCars];
    //       offset = newCars.length;
    //     } else {
    //       const existingIds = new Set(originalCars.map(car => car.id));
    //       const uniqueNew = newCars.filter(car => !existingIds.has(car.id));
    //       originalCars.push(...uniqueNew);
    //       offset += itemsCount;
    //     }
    
    //     saveCache(allCars);
    //     renderCars();
    
    //     if (offset >= total) {
    //       allLoaded = true;
    //       loadMoreBtn.style.display = "none";
    //       loadMoreBtn.disabled = true;
    //       feedbackNotice.style.display = "block";
    //     } else {
    //       allLoaded = false;
    //       loadMoreBtn.style.display = "block";
    //       loadMoreBtn.disabled = false;
    //       feedbackNotice.style.display = "none";
    //     }
    
    //   } catch (error) {
    //     showError(error.message);
    //   } finally {
    //     loader.style.display = "none";
    //     if (!allLoaded) loadMoreBtn.style.display = "block";
    //     firstLoad = false;
    //   }
    // }
    
    
    
    
    

    // === Рендер карточек ===
    // function renderCars() {
    //   grid.innerHTML = "";
    //   allCars.forEach(car => grid.appendChild(createCarCard(car)));
    // }

    // function renderFiltered(filteredCars) {
    //   grid.innerHTML = "";
    //   filteredCars.forEach(car => grid.appendChild(createCarCard(car)));
    // }



    async function loadCars(itemsCount, isRefresh = false) {
      try {

        if (feedbackNotice) {
          feedbackNotice.style.display = "none";
        }
        
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
            // Показываем уведомление только если total <= 100
            feedbackNotice.style.display = total <= 100 ? "block" : "none";
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
        // if (!allLoaded) loadMoreBtn.style.display = "block";
        firstLoad = false;
      }
    }
    

    function renderCars() {
      if (!grid) return;
    
      // 👇 Обновляем отображение общего количества
      const totalEl = document.getElementById("totalCount");
      if (totalEl) {
        const total = localStorage.getItem('carsTotal');
        totalEl.textContent = total ? `Всего автомобилей: ${total}` : '';
      }
    
      // 👇 Отрисовка карточек
      const fragment = document.createDocumentFragment();
      allCars.forEach(car => fragment.appendChild(createCarCard(car)));
      grid.innerHTML = "";
      grid.appendChild(fragment);
    }
    
    
    function renderFiltered(filteredCars) {
      if (!grid) return;
      const fragment = document.createDocumentFragment();
      filteredCars.forEach(car => fragment.appendChild(createCarCard(car)));
      grid.innerHTML = "";
      grid.appendChild(fragment);
    }
    
    

    // function createCarCard(car) {
    //   const card = document.createElement('div');
    //   card.className = 'car-card';

    //   const model = (car.model || "").toLowerCase();
    //   let price = "—";
    //   if (model.includes("granta")) price = currentMode === 'rent' ? "1700 руб/сутки" : "850 000 ₽";
    //   else if (model.includes("vesta")) price = currentMode === 'rent' ? "2400 руб/сутки" : "1 050 000 ₽";
    //   else if (model.includes("largus")) price = currentMode === 'rent' ? "2600 руб/сутки" : "1 100 000 ₽";

    //   const fuelType = car.fuel_type || "—";
    //   const fuelTypeClass = typeof fuelType === 'string' ? fuelType.toLowerCase().replace(/\s/g, '-') : '';
    //   // const image = car.avatar || 'img/granta1.jpg';
    //   const rawNumber = car.number || "";
    //   const carNumber = toLatinNumber(rawNumber.toUpperCase());
    //   const imagePath = `/photos/${carNumber}/${carNumber}_1.jpeg`;
    //   const image = car.avatar || imagePath;


    //   card.innerHTML = `
    //     <img src="${image}" alt="Фото авто" class="car-img">
    //     <h3 class="car-price">Цена: ${price}</h3>
    //     <p class="car-title">${car.brand || 'Без марки'} ${car.model || ''}</p>
    //     <div class="car-detal">
    //       <p>Год: ${car.year || '—'}</p>
    //       <p>Цвет: ${car.color || '—'}</p>
    //       <p>Гос.Номер: ${car.number || '—'}</p>
    //       <p>Пробег: ${car.odometer_display || '—'}</p>
    //     </div>
    //   `;

    //   card.onclick = () => {
    //     localStorage.setItem('scrollPosition', window.scrollY);
    //     localStorage.setItem('savedCars', JSON.stringify(allCars));
    //     localStorage.setItem('originalCars', JSON.stringify(originalCars)); // 💾 сохраняем оригинальный порядок
    //     localStorage.setItem('savedOffset', offset);
    //     localStorage.setItem('savedMode', currentMode); // 💾 сохраняем вкладку
    //     const sortValue = document.getElementById('sortSelect')?.value || '';
    //     localStorage.setItem('savedSort', sortValue); // 💾 сохраняем сортировку
    //     window.location.href = `car-details.html?car=${car.id}`;
    //   };

    //   return card;
    // }

//     function createCarCard(car) {
//       const card = document.createElement('div');
//       card.className = 'car-card';
    
//       const model = (car.model || "").toLowerCase();
//       // let price = "—";
//       // if (model.includes("granta")) price = currentMode === 'rent' ? "1700 руб/сутки" : "850 000 ₽";
//       // else if (model.includes("vesta")) price = currentMode === 'rent' ? "2400 руб/сутки" : "1 050 000 ₽";
//       // else if (model.includes("largus")) price = currentMode === 'rent' ? "2600 руб/сутки" : "1 100 000 ₽";
    
//       // const rawNumber = car.number || "";
//       // const carNumber = toLatinNumber(rawNumber.toUpperCase());
//       // const imagePath = `/photos/${carNumber}/${carNumber}_1.jpeg`;
//       // const fallback = 'img/granta1.jpg'; // 🔧 заглушка (должна быть в public/img)

//       let price = "—";
// if (model.includes("granta")) price = currentMode === 'rent' ? "1700 руб/сутки" : "850 000 ₽";
// else if (model.includes("vesta")) price = currentMode === 'rent' ? "2400 руб/сутки" : "1 050 000 ₽";
// else if (model.includes("largus")) price = currentMode === 'rent' ? "2600 руб/сутки" : "1 100 000 ₽";

// const rawNumber = car.number || "";
// const carNumber = toLatinNumber(rawNumber.toUpperCase());
// const imagePath = `/photos/${carNumber}/${carNumber}_1.jpeg`;

// let fallback = 'img/granta1.jpg'; // default
// if (model.includes("vesta")) fallback = 'img/vesta1.jpg';
// else if (model.includes("largus")) fallback = 'img/largus1.jpg';
    
//       const fuelType = car.fuel_type || "—";
//       const fuelTypeClass = typeof fuelType === 'string' ? fuelType.toLowerCase().replace(/\s/g, '-') : '';
    
//       card.innerHTML = `
//         <img src="${imagePath}" alt="Фото авто" loading="lazy" class="car-img" onerror="this.onerror=null; this.src='${fallback}'">
//         <h3 class="car-price">Цена: ${price}</h3>
//         <p class="car-title">${car.brand || 'Без марки'} ${car.model || ''}</p>
//         <div class="car-detal">
//           <p>Год: ${car.year || '—'}</p>
//           <p>Цвет: ${car.color || '—'}</p>
//           <p>Гос.Номер: ${car.number || '—'}</p>
//           <p>Пробег: ${car.odometer_display || '—'}</p>
//         </div>
//       `;
    
//       card.onclick = () => {
//         localStorage.setItem('scrollPosition', window.scrollY);
//         localStorage.setItem('savedCars', JSON.stringify(allCars));
//         localStorage.setItem('originalCars', JSON.stringify(originalCars));
//         localStorage.setItem('savedOffset', offset);
//         localStorage.setItem('savedMode', currentMode);
//         const sortValue = document.getElementById('sortSelect')?.value || '';
//         localStorage.setItem('savedSort', sortValue);
//         window.location.href = `car-details.html?car=${car.id}`;
//       };
    
//       return card;
//     }
    

  function createCarCard(car) {
  const card = document.createElement('div');
  card.className = 'car-card';

  const model = (car.model || "").toLowerCase();

  let price = "—";
  if (model.includes("granta")) price = currentMode === 'rent' ? "1700 руб/сутки" : "850 000 ₽";
  else if (model.includes("vesta")) price = currentMode === 'rent' ? "2400 руб/сутки" : "1 050 000 ₽";
  else if (model.includes("largus")) price = currentMode === 'rent' ? "2600 руб/сутки" : "1 100 000 ₽";

  const rawNumber = car.number || "";
  const carNumber = toLatinNumber(rawNumber.toUpperCase());
  const imagePath = `/photos/${carNumber}/${carNumber}_1.jpeg`;

  let fallback = 'img/granta1.jpg';
  if (model.includes("vesta")) fallback = 'img/vesta1.jpg';
  else if (model.includes("largus")) fallback = 'img/largus1.jpg';

  const img = document.createElement("img");
  img.src = imagePath;
  img.alt = "Фото авто";
  img.loading = "lazy";
  img.className = "car-img";
  img.onerror = () => {
    img.onerror = null;
    img.src = fallback;
  };

  const fuelType = car.fuel_type || "—";

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

    // function sortCars() {
    //   const value = document.getElementById('sortSelect')?.value;
    //   if (!value) {
    //     allCars = [...originalCars]; // Сброс к изначальному порядку
    //     document.getElementById('sortSelect').selectedIndex = 0; // 👈 сброс селекта
    //     renderCars();                // 👉 нужно отрисовать заново!
    //     return;
    //   }
    
    //   const [field, order] = value.split('_');
    
    //   allCars.sort((a, b) => {
    //     let aVal, bVal;
    
    //     if (field === 'price') {
    //       aVal = getCarPrice(a);
    //       bVal = getCarPrice(b);
    //     } else if (field === 'mileage') {
    //       aVal = parseInt(a.odometer || 0, 10);
    //       bVal = parseInt(b.odometer || 0, 10);
    //     } else {
    //       aVal = String(a[field] || '');
    //       bVal = String(b[field] || '');
    //       return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    //     }
    
    //     return order === 'asc' ? aVal - bVal : bVal - aVal;
    //   });
    // }

    function sortCars() {
      const value = document.getElementById('sortSelect')?.value;
      if (!value) {
        allCars = [...originalCars]; // сброс к изначальному порядку
        document.getElementById('sortSelect').selectedIndex = 0;
        return; // ⛔️ renderCars здесь больше не нужен
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
