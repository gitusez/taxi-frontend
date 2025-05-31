const container = document.getElementById("cars-container");

let manualPrices = {};
let cars = [];

async function loadManualPrices() {
  const res = await fetch("/api/manual-prices");
  manualPrices = await res.json();
}

async function loadCars() {
  const res = await fetch("/api/cars/combined", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: 1000 })
  });
  const data = await res.json();
  cars = data.cars_list;
}

function createCarCard(car) {
  const number = car.number.replace(/\s/g, "").toUpperCase();
  const card = document.createElement("div");
  card.className = "car-card";

  const price = manualPrices[number]?.price || "";
  const description = manualPrices[number]?.description || "";
  const equipment = manualPrices[number]?.equipment || "";

  card.innerHTML = `
    <h3>${number}</h3>
    <input type="text" placeholder="Цена" value="${price}" class="input price">
    <textarea placeholder="Описание" class="input desc">${description}</textarea>
    <textarea placeholder="Комплектация" class="input eq">${equipment}</textarea>
    <div class="photo-block" data-number="${number}">
      <label class="photo-label">
        📷 Выбрать файлы
        <input type="file" class="photo-input" data-number="${number}" multiple>
      </label>
      <div class="preview" id="preview-${number}"></div>
    </div>
    <button class="save-btn" data-number="${number}">💾 Сохранить</button>
  `;

  container.appendChild(card);
  loadUploadedPhotos(number);
  setupFileInput(card.querySelector(".photo-input"));
}

function setupFileInput(input) {
  input.addEventListener("change", () => {
    const number = input.dataset.number;
    const preview = document.getElementById("preview-" + number);

    [...input.files].forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = e => {
        const div = document.createElement("div");
        div.className = "photo-thumb";
        div.innerHTML = `<img src="${e.target.result}"><span class="remove">&times;</span>`;
        div.querySelector(".remove").onclick = () => div.remove();
        preview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  });
}

async function loadUploadedPhotos(number) {
  const preview = document.getElementById("preview-" + number);
  preview.innerHTML = "";

  const res = await fetch(`/api/photos/${number}`);
  const data = await res.json();

  if (data.success && Array.isArray(data.photos)) {
    data.photos.forEach(photoUrl => {
      const filename = photoUrl.split("/").pop();
      const div = document.createElement("div");
      div.className = "photo-thumb";
      div.innerHTML = `<img src="${photoUrl}"><span class="remove">&times;</span>`;
      div.querySelector(".remove").onclick = async () => {
        await fetch(`/api/photos/${number}/${filename}`, { method: "DELETE" });
        div.remove();
      };
      preview.appendChild(div);
    });
  }
}

document.addEventListener("click", async e => {
  if (e.target.classList.contains("save-btn")) {
    const card = e.target.closest(".car-card");
    const number = e.target.dataset.number;
    const price = card.querySelector(".price").value.trim();
    const desc = card.querySelector(".desc").value.trim();
    const eq = card.querySelector(".eq").value.trim();
    const photos = card.querySelector(".photo-input").files;

    manualPrices[number] = { price, description: desc, equipment: eq };

    await fetch("/api/manual-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manualPrices)
    });

    if (photos.length) {
      const form = new FormData();
      for (const file of photos) form.append("photos", file);
      form.append("number", number);

      await fetch("/api/photos/upload", {
        method: "POST",
        body: form
      });
    }

    alert(`Данные для ${number} сохранены!`);
    loadUploadedPhotos(number);
  }
});

(async () => {
  await loadManualPrices();
  await loadCars();
  cars.forEach(createCarCard);
})();
