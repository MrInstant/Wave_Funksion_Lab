const TASKS = [
  { id: 1, title: "Käi 5 minutit lühemalt duši all", points: 30, co2: 0.3 },
  { id: 2, title: "Mine täna rattaga tööle või kooli", points: 55, co2: 1.2 },
  { id: 3, title: "Kasuta korduvkasutatavat joogipudelit", points: 20, co2: 0.2 },
  { id: 4, title: "Lülita elektroonika ööseks vooluvõrgust välja", points: 25, co2: 0.35 }
];

const MONEY_RATE = 0.02;

const state = {
  username: "",
  points: 0,
  co2: 0,
  completedIds: new Set()
};

const loginView = document.getElementById("loginView");
const homeView = document.getElementById("homeView");
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("usernameInput");
const welcomeName = document.getElementById("welcomeName");
const taskList = document.getElementById("taskList");
const pointsValue = document.getElementById("pointsValue");
const moneyValue = document.getElementById("moneyValue");
const co2Value = document.getElementById("co2Value");
const logoutBtn = document.getElementById("logoutBtn");

function renderTasks() {
  taskList.innerHTML = "";

  TASKS.forEach((task) => {
    const isDone = state.completedIds.has(task.id);
    const li = document.createElement("li");
    li.className = `task-item ${isDone ? "done" : ""}`;

    li.innerHTML = `
      <div class="task-meta">
        <strong>${task.title}</strong>
        <small>+${task.points} punkti · -${task.co2} kg CO₂</small>
      </div>
      <button ${isDone ? "disabled" : ""} data-id="${task.id}">
        ${isDone ? "Tehtud ✅" : "Märgi tehtuks"}
      </button>
    `;

    taskList.appendChild(li);
  });
}

function updateStats() {
  pointsValue.textContent = state.points;
  moneyValue.textContent = (state.points * MONEY_RATE).toFixed(2);
  co2Value.textContent = `${state.co2.toFixed(1)} kg`;
}

function completeTask(taskId) {
  const task = TASKS.find((item) => item.id === taskId);
  if (!task || state.completedIds.has(taskId)) return;

  state.completedIds.add(taskId);
  state.points += task.points;
  state.co2 += task.co2;
  updateStats();
  renderTasks();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.username = usernameInput.value.trim();
  if (!state.username) return;

  welcomeName.textContent = state.username;
  loginView.classList.add("hidden");
  homeView.classList.remove("hidden");
  renderTasks();
  updateStats();
});

taskList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const id = Number(target.dataset.id);
  completeTask(id);
});

logoutBtn.addEventListener("click", () => {
  state.username = "";
  state.points = 0;
  state.co2 = 0;
  state.completedIds.clear();
  loginForm.reset();

  homeView.classList.add("hidden");
  loginView.classList.remove("hidden");
});
