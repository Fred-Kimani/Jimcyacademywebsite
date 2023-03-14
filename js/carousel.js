const carousel = document.querySelector(".carousel");
const cards = document.querySelector(".cards");
const card = document.querySelectorAll(".card");

const btnPrev = document.createElement("div");
btnPrev.classList.add("btn", "left", "disabled");
btnPrev.innerHTML = "&#10094;";
carousel.appendChild(btnPrev);

const btnNext = document.createElement("div");
btnNext.classList.add("btn", "right");
btnNext.innerHTML = "&#10095;";
carousel.appendChild(btnNext);

let cardIndex = 0;
const cardWidth = card[0].offsetWidth + parseInt(window.getComputedStyle(card[0]).marginLeft) + parseInt(window.getComputedStyle(card[0]).marginRight);
const cardsWidth = cardWidth * card.length;
cards.style.width = cardsWidth + "px";

const moveCards = (direction) => {
  if (direction === "prev" && cardIndex > 0) {
    cardIndex--;
  } else if (direction === "next" && cardIndex < card.length - 1) {
    cardIndex++;
  }

  cards.style.transform = `translateX(-${cardIndex * cardWidth}px)`;

  updateBtnState();
};

const updateBtnState = () => {
  if (cardIndex === 0) {
    btnPrev.classList.add("disabled");
  } else {
    btnPrev.classList.remove("disabled");
  }

  if (cardIndex === card.length - 1) {
    btnNext.classList.add("disabled");
  } else {
    btnNext.classList.remove("disabled");
  }
};

btnPrev.addEventListener("click", () => {
  moveCards("prev");
});

btnNext.addEventListener("click", () => {
  moveCards("next");
});

updateBtnState();
