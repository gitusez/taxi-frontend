async function loadPrices() {
  const res = await fetch('/api/manual-prices');
  const manual = await res.json();

  const container = document.getElementById('cars-container');
  container.innerHTML = '';

  Object.entries(manual).forEach(([number, data]) => {
    container.appendChild(createCarCard(number, data));
  });
}

function createInput(labelText, value, name, type = 'text') {
  const label = document.createElement('label');
  label.textContent = labelText;

  const input = document.createElement('input');
  input.type = type;
  input.value = value || '';
  input.dataset.type = name;

  label.appendChild(input);
  return label;
}

function createTextarea(labelText, value, name) {
  const label = document.createElement('label');
  label.textContent = labelText;

  const textarea = document.createElement('textarea');
  textarea.value = value || '';
  textarea.dataset.type = name;

  label.appendChild(textarea);
  return label;
}

function createCarCard(number, data = {}) {
  const card = document.createElement('div');
  card.className = 'car-card';

  const header = document.createElement('div');
  header.className = 'car-header';
  header.textContent = number;
  card.appendChild(header);

  const fields = document.createElement('div');
  fields.className = 'car-fields';
  fields.appendChild(createInput('Аренда (rent)', data.rent, 'rent'));
  fields.appendChild(createInput('Выкуп (buyout)', data.buyout, 'buyout'));
  fields.appendChild(createInput('Прокат (prokat)', data.prokat, 'prokat'));
  fields.appendChild(createTextarea('Комплектация', data.equipment, 'equipment'));
  fields.appendChild(createTextarea('Описание', data.description, 'description'));
  card.appendChild(fields);

  // Upload section
  const upload = document.createElement('div');
  upload.className = 'upload-section';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;

  const uploadBtn = document.createElement('button');
  uploadBtn.textContent = '📸 Загрузить фото';
  uploadBtn.onclick = () => uploadPhotos(number, fileInput.files);

  upload.appendChild(fileInput);
  upload.appendChild(uploadBtn);
  card.appendChild(upload);

  // Photo preview
  const preview = document.createElement('div');
  preview.className = 'photo-preview';
  preview.dataset.number = number;
  card.appendChild(preview);

  loadCarPhotos(number, preview);

  // Присваиваем каждому input госномер
  card.querySelectorAll('input, textarea').forEach(el => {
    el.dataset.number = number;
  });

  return card;
}

async function uploadPhotos(number, files) {
  if (!files.length) return;

  const formData = new FormData();
  for (let file of files) formData.append('photos', file);
  formData.append('number', number);

  const res = await fetch('/api/photos/upload', {
    method: 'POST',
    body: formData
  });

  if (res.ok) {
    const preview = document.querySelector(`.photo-preview[data-number="${number}"]`);
    preview.innerHTML = '';
    loadCarPhotos(number, preview);
  } else {
    alert("Ошибка загрузки фото");
  }
}

async function loadCarPhotos(number, container) {
  const res = await fetch(`/api/photos/${number}`);
  if (!res.ok) return;

  const list = await res.json();
  list.forEach(filename => {
    const item = document.createElement('div');
    item.className = 'photo-item';

    const img = document.createElement('img');
    img.src = `/photos/${number}/${filename}`;

    const del = document.createElement('button');
    del.textContent = '×';
    del.onclick = async () => {
      await fetch(`/api/photos/${number}/${filename}`, { method: 'DELETE' });
      item.remove();
    };

    item.appendChild(img);
    item.appendChild(del);
    container.appendChild(item);
  });
}

async function savePrices() {
  const updated = {};
  document.querySelectorAll('input, textarea').forEach(el => {
    const num = el.dataset.number;
    const type = el.dataset.type;
    const val = el.value.trim();
    if (!updated[num]) updated[num] = {};
    if (val) updated[num][type] = val;
  });

  const res = await fetch('/api/manual-prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updated)
  });

  const rj = await res.json();
  if (rj.success) {
    alert("✅ Сохранено");
    await loadPrices();
  } else {
    alert("Ошибка сохранения");
  }
}

// Запуск
loadPrices();
