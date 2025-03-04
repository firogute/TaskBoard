document.addEventListener("DOMContentLoaded", async () => {
  const openBtn = document.querySelector(".open-modal-btn");
  const modal = document.querySelector(".modal-overlay");
  const modalWrapper = document.querySelector(".modal-wrapper");
  const closeBtn = document.querySelector(".close-modal-btn");

  // Fetch tasks and display them on page load
  async function fetchTasks() {
    const response = await fetch("http://localhost:7000/api/tasks");
    const tasks = await response.json();
    console.log(tasks );
    const todoContainer = document.querySelector(".todo");
    const inProgressContainer = document.querySelector(".inprogress");
    const doneContainer = document.querySelector(".done");
    const wontDoContainer = document.querySelector(".not");

    // Function to create task elements
    function createTaskElement(task) {
      const taskElement = document.createElement("div");
      taskElement.classList.add("task");
      taskElement.innerHTML = `
        <p>${task.emoji}</p>
        <h3>${task.name}</h3>
        <p>${task.description}</p>
      `;
      return taskElement;
    }

    // Loop through tasks and append them to the correct container
    tasks.forEach((task) => {
      const taskElement = createTaskElement(task);
      switch (task.status) {
        case "completed":
          doneContainer.appendChild(taskElement);
          break;
        case "in-progress":
          inProgressContainer.appendChild(taskElement);
          break;
        case "wont-do":
          wontDoContainer.appendChild(taskElement);
          break;
        default:
          todoContainer.appendChild(taskElement);
          break;
      }
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
      body: JSON.stringify({ name: taskName, description, emoji, status }),
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
