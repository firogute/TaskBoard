const openBtn = document.querySelector(".open-modal-btn");
const modal = document.querySelector(".modal-overlay");
const modalWrapper = document.querySelector(".modal-wrapper");
const closeBtn = document.querySelector(".close-modal-btn");

function openModal() {
  modal.classList.remove("hide");
}

function closeModal(e, clickedOutside) {
  if (clickedOutside) {
    if (e.target.classList.contains("modal-overlay")) {
      modalWrapper.classList.add("closing");
      setTimeout(() => {
        modal.classList.add("hide");
        modalWrapper.classList.remove("closing");
      }, 300);
    }
  } else {
    modalWrapper.classList.add("closing");
    setTimeout(() => {
      modal.classList.add("hide");
      modalWrapper.classList.remove("closing");
    }, 300);
  }
}

openBtn.addEventListener("click", openModal);
modal.addEventListener("click", (e) => closeModal(e, true));
closeBtn.addEventListener("click", closeModal);
