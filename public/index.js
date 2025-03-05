document.addEventListener("DOMContentLoaded", async () => {
  const openBtn = document.querySelector(".open-modal-btn");
  const modal = document.querySelector(".modal-overlay");
  const modalWrapper = document.querySelector(".modal-wrapper");
  const closeBtn = document.querySelector(".close-modal-btn");
  const statusContainer = document.querySelector(".status-container");
  const statusCards = document.querySelectorAll(".status-card");
  const form = document.querySelector("form");
  const todoContainer = document.querySelector(".todo-container");

  let isEditing = false;

  async function fetchTasks() {
    const response = await fetch("http://localhost:7000/api/tasks");
    const tasks = await response.json();
    console.log(tasks);

    function createTaskElement(task) {
      let src;
      switch (task.status) {
        case "completed":
          src = `resources/Done_round.svg`;
          break;
        case "in-progress":
          src = `resources/Time_atack_duotone.svg`;
          break;
        case "wont-do":
          src = `resources/close_ring_duotone.svg`;
          break;
        default:
          break;
      }

      let html;

      if (task.status) {
        html = `<div class="task ${task.status}" data-id="${task.id}">
          <p class="task-icon">${task.emoji}</p>
          <h2>${task.name}</h2>
          <img src=${src} alt="${task.status}" />
        </div>`;
      } else {
        html = `<div class="task todo" data-id="${task.id}">
          <p class="task-icon">${task.emoji}</p>
          <div class="">
            <h2>${task.name}</h2>
            <p class="task-desc">
              ${task.description}
            </p>
          </div>
        </div>`;
      }
      return html;
    }

    tasks.forEach((task) => {
      const taskElement = createTaskElement(task);
      todoContainer.insertAdjacentHTML("beforeend", taskElement);
    });
  }

  fetchTasks();

  function clearForm() {
    document.getElementById("task-name").value = "";
    document.getElementById("desc").value = "";

    document
      .querySelectorAll('input[name="emoji"]:checked')
      .forEach((el) => (el.checked = false));
    document
      .querySelectorAll('input[name="status"]:checked')
      .forEach((el) => (el.checked = false));

    document.querySelectorAll(".status-card").forEach((card) => {
      card.classList.remove("blue");
      card.querySelector(".status-checked")?.remove();
    });
  }

  function openModal() {
    modal.classList.remove("hide");
    if (isEditing) {
      document.querySelector(".add-button").classList.add("hide");
      document.querySelector(".edit-button").classList.remove("hide");
      document.querySelector(".delete-button").classList.remove("hide");
    } else {
      document.querySelector(".add-button").classList.remove("hide");
      document.querySelector(".edit-button").classList.add("hide");
      document.querySelector(".delete-button").classList.add("hide");
    }
  }

  function closeModal(e, clickedOutside) {
    if (clickedOutside) {
      if (e.target.classList.contains("modal-overlay")) {
        modalWrapper.classList.add("closing");
        clearForm();
        setTimeout(() => {
          modal.classList.add("hide");
          modalWrapper.classList.remove("closing");
        }, 300);
      }
    } else {
      modalWrapper.classList.add("closing");
      clearForm();
      setTimeout(() => {
        modal.classList.add("hide");
        modalWrapper.classList.remove("closing");
      }, 300);
    }
    isEditing = false;
  }

  openBtn.addEventListener("click", openModal);
  modal.addEventListener("click", (e) => closeModal(e, true));
  closeBtn.addEventListener("click", closeModal);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const taskName = document.getElementById("task-name").value;
    const description = document.getElementById("desc").value;
    const emoji = document.querySelector('input[name="emoji"]:checked')?.value;
    const status = document.querySelector(
      'input[name="status"]:checked'
    )?.value;

    if (!taskName || !description || !emoji) {
      alert("❌ Please fill out all fields.");
      return;
    }

    const response = await fetch("http://localhost:7000/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskName, description, emoji, status }),
    });

    if (response.ok) {
      alert("✅ Task added successfully!");
      fetchTasks();
      closeModal(e, false);
    } else {
      alert("❌ Error adding task.");
    }
  });

  statusContainer.addEventListener("click", (e) => {
    const parent = e.target.parentElement;

    if (!parent) return;

    const statusCardsArray = [...statusCards];

    statusCardsArray.forEach((task) => {
      task.classList.remove("blue");
      task.querySelector(".status-checked")?.remove();
    });

    if (statusCardsArray.includes(parent)) {
      parent.classList.add("blue");

      if (!parent.querySelector(".status-checked")) {
        const img = document.createElement("img");
        img.src = "resources/Done_round.svg";
        img.alt = "checked";
        img.classList.add("status-checked");
        parent.appendChild(img);
      }
    }
  });

  todoContainer.addEventListener("click", (e) => {
    const taskDiv = e.target.closest(".task");

    if (!taskDiv) return;
    if (!taskDiv || taskDiv.classList.contains("static-task")) return;

    const taskId = taskDiv.dataset.id;

    openEditModal(taskId);
  });

  const openEditModal = async (id) => {
    isEditing = true;
    try {
      const response = await fetch(`http://localhost:7000/api/tasks/${id}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - Task not found`);
      }

      const todo = await response.json();
      console.log(todo);

      modalWrapper.querySelector("h2").innerHTML = "Task Detail";
      document.getElementById("task-name").value = todo.name || "";
      document.getElementById("desc").value = todo.description || "";

      const emojiInput = document.querySelector(
        `input[name="emoji"][value="${todo.emoji}"]`
      );
      if (emojiInput) emojiInput.checked = true;

      if (todo.status) {
        const statusInput = document.querySelector(
          `input[name="status"][value="${todo.status}"]`
        );
        if (statusInput) {
          statusInput.checked = true;
          const statusCard = statusInput.closest(".status-card");
          if (statusCard) {
            statusCard.classList.add("blue");
            if (!statusCard.querySelector(".status-checked")) {
              const img = document.createElement("img");
              img.src = "resources/Done_round.svg";
              img.alt = "checked";
              img.classList.add("status-checked");
              statusCard.appendChild(img);
            }
          }
        }
      }
      openModal();
    } catch (error) {
      console.error("Error fetching task:", error);
      alert("❌ Failed to fetch task details. Please try again.");
    }
  };
});
