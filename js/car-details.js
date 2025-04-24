//car-details.js
import { config } from './config.js';

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
    mileage: car.odometer || "—",

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
  equipEl.innerHTML = `<ul>${features.map(item => `<li>${item}</li>`).join('')}</ul>`;
}

// 👉 Показываем описание
const descEl = document.querySelector(".detail-description");
console.log("🟡 Описание:", description); // ← временно
if (descEl) {
  descEl.textContent = description || "Описание отсутствует";
}


  const swiperWrapper = document.querySelector('.swiper-wrapper');
  swiperWrapper.innerHTML = car.avatar
    ? `<div class="swiper-slide"><img src="${car.avatar}" alt="Фото авто" onclick="openLightbox(['${car.avatar}'], 0)"></div>`
    : '<div class="swiper-slide">Нет фото</div>';

  new Swiper('.swiper-container', {
    slidesPerView: 1,
    spaceBetween: 0
  });
}

let fullscreenSwiper;
window.openLightbox = function(images, startIndex) {
  const wrapper = document.getElementById('lightboxSwiperWrapper');
  wrapper.innerHTML = '';
  images.forEach(src => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.innerHTML = `<div class="swiper-zoom-container"><img src="${src}" alt="Фото"></div>`;
    wrapper.appendChild(slide);
  });

  if (fullscreenSwiper) fullscreenSwiper.destroy(true, true);
  fullscreenSwiper = new Swiper('.fullscreen-swiper', {
    initialSlide: startIndex,
    slidesPerView: 1,
    loop: false,
    zoom: { maxRatio: 3, toggle: true },
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

// function showError(msg) {
//   const el = document.querySelector('.detail-description');
//   if (el) {
//     el.textContent = msg;
//     el.style.color = 'red';
//   }
//   console.error(msg);
// }

function showError(msg) {
  console.error(msg);

  const errorBox = document.querySelector('.error-message');
  if (errorBox) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }
}
