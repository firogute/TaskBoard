document.addEventListener("DOMContentLoaded", async () => {
  const openBtn = document.querySelector(".open-modal-btn");
  const modal = document.querySelector(".modal-overlay");
  const modalWrapper = document.querySelector(".modal-wrapper");
  const closeBtn = document.querySelector(".close-modal-btn");

  // Fetch tasks and display them on page load
  async function fetchTasks() {
    const response = await fetch("http://localhost:7000/api/tasks");
    const tasks = await response.json();
    console.log(tasks);
    const todoContainer = document.querySelector(".todo-container");

    // Function to create task elements
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

      const html = `
      <div class="btn ${task.status}">
          <p>${task.emoji}</p>
          <h2>${task.name}</h2>
          <img src=${src} alt="${task.status}" />
        </div>`;
      return html;
    }

    // Loop through tasks and append them to the correct container
    tasks.forEach((task) => {
      const taskElement = createTaskElement(task);
      todoContainer.insertAdjacentHTML("beforeend", taskElement);
    });
  }

  // Call fetchTasks to load tasks when the page is loaded
  fetchTasks();

  // Open modal function
  function openModal() {
    modal.classList.remove("hide");
  }

  // Close modal function
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

  // Handle task submission
  document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const taskName = document.getElementById("task-name").value;
    const description = document.getElementById("desc").value;
    const emoji = document.querySelector('input[name="emoji"]:checked').value;
    const status = document.querySelector('input[name="status"]:checked').value;

    // Send POST request to add the task
    const response = await fetch("http://localhost:7000/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskName, description, emoji, status }),
    });

    if (response.ok) {
      alert("✅ Task added successfully!");
      fetchTasks(); // Fetch tasks again to update the board
      closeModal(e, false); // Close the modal
    } else {
      alert("❌ Error adding task.");
    }
  });
});
