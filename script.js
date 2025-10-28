// Wait for the DOM to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {
  // --- STATE (Data Structures) ---

  // 1. Available Resources (Object, acting as an Associative Array)
  let resources = {
    food: 1000,
    water: 1000,
    medicine: 500,
  };

  // 2. Pending Requests (Array, used as a Queue - FIFO)
  let requests = [
    {
      id: 1,
      area: "Riverside",
      disaster: "Flood",
      urgency: "High",
      requested: { food: 100, water: 200, medicine: 20 },
    },
    {
      id: 2,
      area: "Hilltop",
      disaster: "Earthquake",
      urgency: "Medium",
      requested: { food: 50, water: 50, medicine: 50 },
    },
  ];

  // 3. Allocation History (Array, used as a Stack - LIFO)
  let history = [];

  // --- DOM Element Selectors ---
  // Forms
  const addResourceForm = document.getElementById("add-resource-form");
  const submitRequestForm = document.getElementById("submit-request-form");

  // Buttons
  const allocateBtn = document.getElementById("allocate-btn");
  const undoBtn = document.getElementById("undo-btn");

  // Display Areas
  const foodCountEl = document.getElementById("food-count");
  const waterCountEl = document.getElementById("water-count");
  const medicineCountEl = document.getElementById("medicine-count");
  const requestListEl = document.getElementById("request-list");
  const historyListEl = document.getElementById("history-list");
  const notificationArea = document.getElementById("notification-area");

  // --- NEW: Notification Function ---
  /**
   * Displays a toast notification.
   * @param {string} message The message to display.
   * @param {string} type 'info', 'success', or 'error'.
   */
  function showNotification(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    notificationArea.appendChild(toast);

    // Trigger the slide-in animation
    setTimeout(() => {
      toast.classList.add("show");
    }, 10); // Small delay to allow CSS transition

    // Remove the toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      // Remove from DOM after animation finishes
      toast.addEventListener("transitionend", () => {
        toast.remove();
      });
    }, 3000);
  }

  // --- RENDER FUNCTIONS (To update the UI) ---

  // 1. Render Resources
  function renderResources() {
    foodCountEl.textContent = resources.food;
    waterCountEl.textContent = resources.water;
    medicineCountEl.textContent = resources.medicine;
  }

  // 2. Render Pending Requests (Queue)
  function renderRequests() {
    requestListEl.innerHTML = "";
    if (requests.length === 0) {
      requestListEl.innerHTML = `<p class="list-placeholder">Request queue is empty.</p>`;
      return;
    }
    requests.forEach((req, index) => {
      const el = document.createElement("div");
      el.className = `list-item urgency-${req.urgency}`;
      let title = req.area;
      if (index === 0) {
        title = `NEXT: ${req.area}`;
      }
      el.innerHTML = `
        <div class="list-item-header">
          <span>${title}</span>
          <span>${req.disaster}</span>
        </div>
        <div class="list-item-body">
          <b>Request:</b> ${req.requested.food} Food, ${req.requested.water} Water, ${req.requested.medicine} Medicine
        </div>
      `;
      requestListEl.appendChild(el);
    });
  }

  // 3. Render Allocation History (Stack)
  function renderHistory() {
    historyListEl.innerHTML = "";
    if (history.length === 0) {
      historyListEl.innerHTML = `<p class="list-placeholder">No allocation history.</p>`;
      return;
    }
    history.forEach((alloc, index) => {
      const el = document.createElement("div");
      el.className = "history-item";
      let title = `${alloc.area} (${alloc.disaster})`;
      if (index === 0) {
        title = `LAST: ${title}`;
      }
      el.innerHTML = `
        <div class="list-item-header">
          <span>${title}</span>
        </div>
        <div class="list-item-body">
          <b>Allocated:</b> ${alloc.allocated.food} Food, ${alloc.allocated.water} Water, ${alloc.allocated.medicine} Medicine
        </div>
      `;
      historyListEl.appendChild(el);
    });
  }

  // --- LOGIC FUNCTIONS (Event Handlers) ---

  function handleAddResource(e) {
    e.preventDefault();
    const type = document.getElementById("resource-type").value;
    const quantity = parseInt(
      document.getElementById("resource-quantity").value
    );

    if (quantity > 0) {
      resources[type] += quantity;
      renderResources();
      showNotification(`Added ${quantity} units of ${type}.`, "success"); // Replaced alert
    } else {
      showNotification("Please enter a valid quantity.", "error"); // Replaced alert
    }
  }

  function handleSubmitRequest(e) {
    e.preventDefault();
    const area = document.getElementById("req-area").value;
    const food = parseInt(document.getElementById("req-food").value) || 0;
    const water = parseInt(document.getElementById("req-water").value) || 0;
    const medicine =
      parseInt(document.getElementById("req-medicine").value) || 0;

    if (!area) {
      showNotification("Please enter an area name.", "error"); // Replaced alert
      return;
    }
    if (food <= 0 && water <= 0 && medicine <= 0) {
      showNotification("Please request at least one resource.", "error"); // Replaced alert
      return;
    }

    const newRequest = {
      id: Date.now(),
      area: area,
      disaster: document.getElementById("req-disaster").value,
      urgency: document.getElementById("req-urgency").value,
      requested: { food, water, medicine },
    };

    requests.push(newRequest); // ENQUEUE
    renderRequests();
    showNotification(`Request for ${area} added to queue.`, "info");
    submitRequestForm.reset();
  }

  function handleAllocate() {
    if (requests.length === 0) {
      showNotification("No pending requests to allocate.", "info"); // Replaced alert
      return;
    }

    const requestToProcess = requests[0];
    const { requested } = requestToProcess;

    const hasEnough =
      resources.food >= requested.food &&
      resources.water >= requested.water &&
      resources.medicine >= requested.medicine;

    if (!hasEnough) {
      showNotification(
        `Insufficient resources for ${requestToProcess.area}.`,
        "error"
      ); // Replaced alert
      return;
    }

    // 1. Update Resources
    resources.food -= requested.food;
    resources.water -= requested.water;
    resources.medicine -= requested.medicine;

    // 2. DEQUEUE
    requests.shift();

    // 3. PUSH to Stack
    const allocationRecord = {
      id: requestToProcess.id,
      area: requestToProcess.area,
      disaster: requestToProcess.disaster,
      allocated: requested,
    };
    history.unshift(allocationRecord);

    // 4. Update UI
    renderResources();
    renderRequests();
    renderHistory();
    showNotification(
      `Successfully allocated resources to ${requestToProcess.area}.`,
      "success"
    ); // Replaced alert
  }

  function handleUndo() {
    if (history.length === 0) {
      showNotification("No allocations in history to undo.", "info"); // Replaced alert
      return;
    }

    // 1. POP from Stack
    const lastAllocation = history.shift();
    const { allocated } = lastAllocation;

    // 2. Restore Resources
    resources.food += allocated.food;
    resources.water += allocated.water;
    resources.medicine += allocated.medicine;

    // 3. Update UI
    renderResources();
    renderHistory();
    showNotification(
      `Rolled back allocation for ${lastAllocation.area}.`,
      "info"
    ); // Replaced alert
  }

  // --- INITIALIZATION ---
  addResourceForm.addEventListener("submit", handleAddResource);
  submitRequestForm.addEventListener("submit", handleSubmitRequest);
  allocateBtn.addEventListener("click", handleAllocate);
  undoBtn.addEventListener("click", handleUndo);

  // Initial render
  renderResources();
  renderRequests();
  renderHistory();
});