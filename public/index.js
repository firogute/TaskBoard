document.addEventListener("DOMContentLoaded", async () => {
  const openBtn = document.querySelector(".open-modal-btn");
  const modal = document.querySelector(".modal-overlay");
  const modalWrapper = document.querySelector(".modal-wrapper");
  const closeBtn = document.querySelector(".close-modal-btn");
  const statusContainer = document.querySelector(".status-container");
  const statusCards = document.querySelectorAll(".status-card");
  const form = document.querySelector("form");
  const todoContainer = document.querySelector(".todo-container");
  const editTaskBtn = document.querySelector(".edit-button");
  const deleteTaskBtn = document.querySelector(".delete-button");
  console.log("HIIIIIIIIIIIIIIIIIIII");

  let isEditing = false;
  const API_BASE_URL = "http://localhost:8080/api/";

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
    console.log("Opening");
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
  function hideModal() {
    modalWrapper.classList.add("closing");
    clearForm();
    setTimeout(() => {
      modal.classList.add("hide");
      modalWrapper.classList.remove("closing");
    }, 300);
  }

  function closeModal(e, clickedOutside) {
    if (!clickedOutside || e.target.classList.contains("modal-overlay")) {
      hideModal();
    }
  }

  openBtn.addEventListener("click", openModal);
  modal.addEventListener("click", (e) => closeModal(e, true));
  closeBtn.addEventListener("click", closeModal);

  async function fetchTasks() {
    try {
      const boardId = window.location.pathname.split("/")[1]; // Extract board ID from URL
      const response = await fetch(`${API_BASE_URL}tasks/${boardId}`);
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
          <h2>${task.taskName}</h2>
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
        document
          .querySelector(".todo-container")
          .insertAdjacentHTML("beforeend", taskElement);
      });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      alert("❌ Failed to fetch tasks. Please try again.");
    }
  }

  fetchTasks();

  const getBoardIdFromURL = () => {
    const urlParts = window.location.pathname.split("/");
    return urlParts[urlParts.length - 1]; // Last part of the URL
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Get form inputs
    const userId = getBoardIdFromURL();
    const taskNameInput = document.getElementById("task-name");
    const descInput = document.getElementById("desc");
    const emojiInput = document.querySelector('input[name="emoji"]:checked');
    const statusInput = document.querySelector('input[name="status"]:checked');
    const submitButton = document.querySelector(".add-button");

    // Get values
    const taskName = taskNameInput.value.trim();
    const description = descInput.value.trim();
    const emoji = emojiInput?.value;
    const status = statusInput?.value || "todo"; // Default status if not selected

    // Validation
    if (!taskName || !description || !emoji) {
      showErrorMessage("❌ Please fill out all fields.");
      return;
    }

    // Disable submit button to prevent multiple submissions
    submitButton.disabled = true;
    submitButton.textContent = "Adding...";

    // Create task object
    const newTask = { taskName, description, emoji, status };

    try {
      // Send task to API
      const response = await fetch(`${API_BASE_URL}board/${userId}/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) throw new Error("Failed to add task.");

      // Reset form after success
      taskNameInput.value = "";
      descInput.value = "";
      if (emojiInput) emojiInput.checked = false;
      if (statusInput) statusInput.checked = false;

      showSuccessMessage("✅ Task added successfully!");
      closeModal(e, false);
      fetchTasks(); // Refresh task list
    } catch (error) {
      showErrorMessage("❌ Error adding task. Try again.");
      console.error(error);
    } finally {
      // Re-enable button
      submitButton.disabled = false;
      submitButton.textContent = "Add New Task";
    }
  };

  // Helper functions for messages
  const showErrorMessage = (message) => {
    const errorDiv = document.getElementById("error-message");
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    setTimeout(() => (errorDiv.style.display = "none"), 3000);
  };

  const showSuccessMessage = (message) => {
    const successDiv = document.getElementById("success-message");
    successDiv.textContent = message;
    successDiv.classList.remove("hide");
    setTimeout(() => (successDiv.style.display = "none"), 3000);
  };

  form.addEventListener("submit", handleFormSubmit);

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
    console.log(isEditing);
    // try {
    //   const response = await fetch(`${API_BASE_URL}tasks/${id}`);

    //   if (!response.ok) {
    //     throw new Error(`Error: ${response.status} - Task not found`);
    //   }

    //   const todo = await response.json();
    //   // console.log(todo);

    //   modalWrapper.dataset.taskId = id;

    //   modalWrapper.querySelector("h2").textContent = "Task Detail";
    //   document.getElementById("task-name").value = todo.name || "";
    //   document.getElementById("desc").value = todo.description || "";

    //   const emojiInput = document.querySelector(
    //     `input[name="emoji"][value="${todo.emoji}"]`
    //   );
    //   if (emojiInput) emojiInput.checked = true;

    //   if (todo.status) {
    //     const statusInput = document.querySelector(
    //       `input[name="status"][value="${todo.status}"]`
    //     );
    //     if (statusInput) {
    //       statusInput.checked = true;
    //       const statusCard = statusInput.closest(".status-card");
    //       if (statusCard) {
    //         statusCard.classList.add("blue");
    //         if (!statusCard.querySelector(".status-checked")) {
    //           const img = document.createElement("img");
    //           img.src = "resources/Done_round.svg";
    //           img.alt = "checked";
    //           img.classList.add("status-checked");
    //           statusCard.appendChild(img);
    //         }
    //       }
    //     }
    //   }
    //   openModal();
    // } catch (error) {
    //   console.error("Error fetching task:", error);
    //   alert("❌ Failed to fetch task details. Please try again.");
    // }
  };

  editTaskBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const taskId = modalWrapper.dataset.taskId;
    // console.log(taskId);
    const taskName = document.getElementById("task-name").value;
    const description = document.getElementById("desc").value;
    const emoji = document.querySelector('input[name="emoji"]:checked')?.value;
    const status = document.querySelector(
      'input[name="status"]:checked'
    )?.value;

    if (!taskName || !description || !emoji || !status) {
      alert("❌ Please fill out all fields.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskName, description, emoji, status }),
      });

      if (response.ok) {
        alert("✅ Task updated successfully!");
        const taskElement = document.querySelector(
          `.task[data-id="${taskId}"]`
        );
        if (taskElement) {
          taskElement.className = `task ${status}`;
          taskElement.querySelector("h2").textContent = taskName;
          taskElement.querySelector(".task-icon").textContent = emoji;

          const statusImg = taskElement.querySelector("img");
          if (statusImg) {
            switch (status) {
              case "completed":
                statusImg.src = "resources/Done_round.svg";
                break;
              case "in-progress":
                statusImg.src = "resources/Time_atack_duotone.svg";
                break;
              case "wont-do":
                statusImg.src = "resources/close_ring_duotone.svg";
                break;
            }
          }
        }

        closeModal(e, false);
      } else {
        alert("❌ Error updating task.");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("❌ Something went wrong. Please try again.");
    }
  });

  deleteTaskBtn.addEventListener("click", async (e) => {
    const taskId = modalWrapper.dataset.taskId;

    try {
      const response = await fetch(`${API_BASE_URL}tasks/${taskId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("✅ Task deleted successfully!");

        const taskElement = document.querySelector(
          `.task[data-id="${taskId}"]`
        );
        if (taskElement) {
          taskElement.remove();
        }

        closeModal(e, false);
      } else {
        alert("❌ Error deleting task.");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("❌ Something went wrong. Please try again.");
    }
  });
});
