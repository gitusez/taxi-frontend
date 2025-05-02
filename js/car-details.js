//car-details.js
import { config } from './config.js';

function toLatinNumber(plate) {
  const map = {
    'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K',
    'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P',
    'С': 'C', 'Т': 'T', 'У': 'Y', 'Х': 'X',
    // нижний регистр (на всякий случай)
    'а': 'A', 'в': 'B', 'е': 'E', 'к': 'K',
    'м': 'M', 'н': 'H', 'о': 'O', 'р': 'P',
    'с': 'C', 'т': 'T', 'у': 'Y', 'х': 'X'
  };
  return plate.replace(/\s/g, '').split('').map(c => map[c] || c).join('');
}


document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const carId = params.get('car');

  if (!carId || isNaN(carId)) {
    showError("Некорректный ID автомобиля");
    return;
  }

  try {
    const car = await loadCarDetails(carId);
    renderCarDetails(car);
  } catch (error) {
    showError(`Ошибка загрузки: ${error.message}`);
  }
});

async function loadCarDetails(carId) {
  const requestData = {
    filters: {},
    items: 9999,
    offset: 0
  };

  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData)
  });

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Не-JSON ответ сервера: ${text.slice(0, 100)}`);
  }

  const result = await response.json();
  if (!result.success) throw new Error(result.error || "Ошибка API");

  const cars = Array.isArray(result.cars_list)
    ? result.cars_list
    : Object.values(result.cars_list || {});

  const car = cars.find(c => c.id == carId || c.car_id == carId);
  if (!car) throw new Error("Автомобиль не найден");
  return car;
}

function renderCarDetails(car) {
    // Преобразуем тип КПП
    let transmission = car.transmission;
    if (typeof transmission === 'string') {
      const type = transmission.toLowerCase();
      if (type === 'mt') transmission = 'Механическая коробка';
      else if (type === 'at') transmission = 'Автомат';
    }
  const fields = {
    brand: car.brand,
    model: car.model,
    year: car.year,
    color: car.color,
    number: car.number,
    // mileage: car.odometer || "—",
    mileage: car.odometer ? `${car.odometer.toLocaleString('ru-RU')} км.` : "—",

    fuel: car.fuel_type,
    transmission: transmission,
    // equipment: car.equipment


    // transmission: car.transmission,
    // vin: car.vin,
    // status: car.status

  };

  // 👇 Разделим equipment на комплектацию (список) и описание (абзац)
let features = [];
let description = "";

if (typeof car.equipment === 'string') {
  const lines = car.equipment.split('\n').map(line => line.trim()).filter(Boolean);
  const descStart = lines.findIndex(line => line.toLowerCase().startsWith('описание'));
  if (descStart !== -1) {
    features = lines.slice(0, descStart);
    description = lines.slice(descStart + 1).join('\n');
  } else {
    features = lines;
  }
}


  Object.entries(fields).forEach(([key, value]) => {
    const el = document.querySelector(`.detail-${key}`);
    if (el) el.textContent = value ?? "—";
  });

  // 👉 Показываем комплектацию как список
const equipEl = document.querySelector(".detail-equipment");
if (equipEl) {
  equipEl.innerHTML = features.map(item => `<div class="feature-line">${item}</div>`).join('');

}

// 👉 Показываем описание
const descEl = document.querySelector(".detail-description");
// console.log("🟡 Описание:", description); // ← временно
if (descEl) {
  descEl.textContent = description || "Описание отсутствует";
}

// // 📸 Автозагрузка всех фото из папки по номеру

// const swiperWrapper = document.querySelector('.photo-box .swiper-wrapper');

// const rawNumber = car.number || "";
// const carNumber = toLatinNumber(rawNumber.toUpperCase());

// const basePath = `/photos/${carNumber}`;
// const images = [];

// for (let i = 1; i <= 20; i++) {
//   images.push(`${basePath}/${carNumber}_${i}.jpeg`);
// }

// // Проверка, существует ли хотя бы одно фото
// let atLeastOneExists = false;
// let loadedSlides = [];

// let checkCount = 0;
// const checkLimit = images.length;
// const validImages = []; // ← обязательно объявляем!
// images.forEach((src, index) => {
//   const img = new Image();
//   img.src = src;
//   img.onload = () => {
//     validImages.push(src);
//     loadedSlides.push(`
//       <div class="swiper-slide">
//         <img src="${src}" alt="Фото авто" onclick="openLightbox(${JSON.stringify(validImages)}, ${validImages.length - 1})">
//       </div>
//     `);
//     checkDone();
//   };
  
//   img.onerror = () => checkDone();
// });

// function checkDone() {
//   checkCount++;

//   if (checkCount === checkLimit) {
//     if (validImages.length > 0) {
//       // Вставляем слайды с data-index
//       swiperWrapper.innerHTML = validImages.map((src, index) => `
//         <div class="swiper-slide">
//           <img src="${src}" alt="Фото авто" data-index="${index}" class="car-photo">
//         </div>
//       `).join("");

//       // Привязываем события клика после вставки DOM
//       document.querySelectorAll('.car-photo').forEach((img, i) => {
//         img.addEventListener('click', () => openLightbox(validImages, i));
//       });

//       // Инициализация swiper
//       requestAnimationFrame(() => {
//         new Swiper('.car-swiper.swiper-container', {
//           slidesPerView: 1,
//           spaceBetween: 0,
//           direction: 'horizontal',
//           loop: false,
//           observer: true,
//           observeParents: true
//         });
//       });
//     } else {
//       // Нет валидных фото
//       swiperWrapper.innerHTML = `<div class="swiper-slide"><div class="no-photo">Фото отсутствует</div></div>`;
//     }
//   }
// }


// 📸 Автозагрузка всех фото из папки по номеру
const swiperWrapper = document.querySelector('.photo-box .swiper-wrapper');

const rawNumber = car.number || "";
const carNumber = toLatinNumber(rawNumber.toUpperCase());
const basePath = `/photos/${carNumber}`;
const extensions = ['jpeg', 'jpg', 'png'];
const maxPhotos = 20;

// Генерация всех возможных путей
const imagePaths = [];
for (let i = 1; i <= maxPhotos; i++) {
  for (let ext of extensions) {
    imagePaths.push(`${basePath}/${carNumber}_${i}.${ext}`);
  }
}

// Проверка существования файлов
const checkImages = imagePaths.map(src => {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
});

// Загружаем и отображаем
Promise.all(checkImages).then(results => {
  const validImages = results.filter(Boolean);

  // if (validImages.length === 0) {
  //   swiperWrapper.innerHTML = `<div class="swiper-slide"><div class="no-photo">Фото отсутствует</div></div>`;
  //   return;
  // }

  if (validImages.length === 0) {
    const model = (car.model || "").toLowerCase();
    let fallback = '/img/granta1.jpg'; // по умолчанию
  
    if (model.includes("vesta")) fallback = "/img/vesta1.jpg";
    else if (model.includes("largus")) fallback = "/img/largus1.jpg";
  
    swiperWrapper.innerHTML = `
      <div class="swiper-slide">
        <img src="${fallback}" alt="Фото авто" class="car-photo">
      </div>
    `;
  
    // Поддержим полноэкранный просмотр даже с fallback
    document.querySelectorAll('.car-photo').forEach((img, i) => {
      img.addEventListener('click', () => openLightbox([fallback], 0));
    });
  
    return;
  }
  

  // Сохраняем правильный порядок и делаем HTML
  swiperWrapper.innerHTML = validImages.map((src, index) => `
    <div class="swiper-slide">
      <img src="${src}" alt="Фото авто" loading="lazy" data-index="${index}" class="car-photo">
    </div>
  `).join('');

  // Привязываем клики
  document.querySelectorAll('.car-photo').forEach((img, i) => {
    img.addEventListener('click', () => openLightbox(validImages, i));
  });

  // Инициализация Swiper
  requestAnimationFrame(() => {
    new Swiper('.car-swiper.swiper-container', {
      slidesPerView: 1,
      spaceBetween: 0,
      direction: 'horizontal',
      loop: false,
      observer: true,
      observeParents: true,
      preloadImages: false,
      lazy: true
    });
  });
});


}

let fullscreenSwiper;

window.openLightbox = function(images, startIndex = 0) {
  const wrapper = document.getElementById('lightboxSwiperWrapper');
  wrapper.innerHTML = '';

  images.forEach(src => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    // slide.innerHTML = `<div class="swiper-zoom-container"><img src="${src}" alt="Фото"></div>`;
    slide.innerHTML = `<div class="swiper-zoom-container"><img src="${src}" alt="Фото" loading="lazy"></div>`;
    wrapper.appendChild(slide);
  });

  if (fullscreenSwiper) fullscreenSwiper.destroy(true, true);

  fullscreenSwiper = new Swiper('.fullscreen-swiper', {
    initialSlide: startIndex,
    slidesPerView: 1,
    loop: false,
    zoom: { maxRatio: 3, toggle: true },
    observer: true,
    observeParents: true,
    pagination: {
      el: '.fullscreen-pagination',
      type: 'fraction',
      renderFraction: (currentClass, totalClass) =>
        `<span class="${currentClass}"></span>/<span class="${totalClass}"></span>`
    }
  });

  document.getElementById('lightbox').style.display = 'flex';
  document.body.classList.add('lightbox-open');
};


window.closeLightbox = function() {
  document.getElementById('lightbox').style.display = 'none';
  if (fullscreenSwiper) fullscreenSwiper.destroy(true, true);
  document.body.classList.remove('lightbox-open');
};

function showError(msg) {
  console.error(msg);

  const errorBox = document.querySelector('.error-message');
  if (errorBox) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }
}
