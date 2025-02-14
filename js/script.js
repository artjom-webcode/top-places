"use strict";

class Place {
  constructor(coords, name, comment, type, rating) {
    this.coords = coords; // [lat, lng]
    this.type = type;
    this.name = name;
    this.comment = comment;
    this.date = new Date();
    this.id = (Date.now() + "").slice(-10);
    this.rating = rating;
  }
}

const form = document.querySelector(".form");
const overlay = document.querySelector(".overlay");
const inputName = document.querySelector(".form__input--name");
const inputComments = document.querySelector(".form__input--comments");
const inputType = document.querySelector(".form__input--type");
const containerPlaces = document.querySelector(".places");
const ratingItems = document.querySelectorAll(".rating__item");
const filterBtns = document.querySelector(".filter-buttons");
const formCloseBtn = document.querySelector(".form__close-btn");
// console.log(filterBtns);

class App {
  constructor() {
    this.map = map;
    this.mapZoomLevel = 14;
    this.mapEvent;
    this.places = [];

    // Get user's position
    this.getPosition();

    this.getLocalStorage();
    form.addEventListener("submit", this.newPlace.bind(this));
    containerPlaces.addEventListener("click", this.moveToPopup.bind(this));
    filterBtns.addEventListener("click", (e) => this.filterPlaces.bind(this)(e));
    formCloseBtn.addEventListener("click", (e) => this.hideForm.bind(this)(e));
    overlay.addEventListener("click", (e) => this.hideForm.bind(this)(e));
  }

  getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.loadMap.bind(this), function () {
        console.log("Could not get your position!");
      });
    }
  }

  loadMap(position) {
    if (!this.map) {
      console.log("Loading");
    }
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.map = L.map("map").setView(coords, this.mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    // Handling clicks on map
    this.map.on("click", this.showForm.bind(this));
    this.places.forEach((place) => this.renderPlaceMarker(place));
  }

  showForm(mapE) {
    this.mapEvent = mapE;
    form.classList.remove("hidden");
    overlay.classList.remove("hidden");
    inputName.focus();
  }

  hideForm(e) {
    e.preventDefault();
    inputComments.value = inputName.value = "";
    ratingItems.forEach((ratingItem) => (ratingItem.checked = false));

    form.style.display = "none";
    form.classList.add("hidden");
    overlay.classList.add("hidden");
    setTimeout(() => (form.style.display = "block"), 1000);
  }

  newPlace(e) {
    e.preventDefault();

    //Get data form
    const name = inputName.value;
    const comment = inputComments.value;
    const type = inputType.value;
    const { lat, lng } = this.mapEvent.latlng;
    let rating = "-";
    ratingItems.forEach(function (item) {
      if (item.checked) {
        rating = item.value;
      }
    });

    const place = new Place([lat, lng], name, comment, type, rating);
    this.places.push(place);

    // Render place on map as marker
    this.renderPlaceMarker(place);

    // Render place on the list
    this.renderPlace(place);

    // Hide form + clear input fields
    this.hideForm(e);

    this.setLocalStorage();
    console.log(this.places);
  }

  renderPlaceMarker(place) {
    L.marker(place.coords)
      .addTo(this.map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: "place-marker",
          //   className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(` <ion-icon name="${place.type}-outline"></ion-icon>  ${place.name}`)
      .openPopup();
  }

  renderPlace(place) {
    // <ion-icon name="storefront-outline"></ion-icon>;
    let html = `
      <li class="place" data-id="${place.id}">
        <div class="place__top">
          <div class="place__icon">
            <ion-icon name="${place.type}-outline"></ion-icon>
          </div>
          <h2 class="place__title">${place.name}</h2>
          <div class="place__rating">
            <span class="place__star">
              <ion-icon name="star-outline"></ion-icon>
            </span>
            <span>${place.rating}</span>
          </div>
        </div>
        <p class="place__comment">
          ${place.comment}
        </p>
      </li>
    `;
    containerPlaces.insertAdjacentHTML("afterbegin", html);
  }

  setLocalStorage() {
    localStorage.setItem("places", JSON.stringify(this.places));
  }

  getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("places"));

    if (!data) return;
    this.places = data;

    this.places.forEach((place) => {
      this.renderPlace(place);
    });
  }

  moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:

    if (!this.map) return;

    const placeEl = e.target.closest(".place");
    if (!placeEl) return;

    const place = this.places.find(function (place) {
      return place.id === placeEl.dataset.id;
    });
    // console.log(place);

    this.map.setView(place.coords, this.mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  filterPlaces(e) {
    const filterType = e.target.dataset.filter;
    if (!filterType) return;

    console.log(filterType);

    // Delete all markers
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });

    // Filter by type
    let filteredPlaces = this.places.filter((place) => place.type === filterType);

    // filter-button--active
    document.querySelectorAll(".filter-button").forEach((btn) => {
      btn.classList.remove("filter-button--active");
    });

    if (filterType === "all") {
      filteredPlaces = this.places;
    }

    containerPlaces.innerHTML = "";
    e.target.classList.add("filter-button--active");

    // show only filtered places
    filteredPlaces.forEach((place) => {
      this.renderPlace(place);
      this.renderPlaceMarker(place);
    });
  }
}

const app = new App();
