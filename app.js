'use strict';

(() => {
  const STORAGE_KEY = 'taskflow.tasks.v1';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const form = $('#taskForm');
  const taskInput = $('#taskInput');
  const categoryInput = $('#taskCategory');
  const priorityInput = $('#taskPriority');
  const dueInput = $('#taskDue');
  const taskList = $('#taskList');
  const emptyState = $('#emptyState');
  const searchInput = $('#searchInput');
  const sortSelect = $('#sortSelect');
  const toast = $('#toast');
  const editDialog = $('#editDialog');
  let activeView = 'all';
  let activeStatus = 'all';
  let toastTimer;
  let tasks = loadTasks();

  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((task) => task && typeof task.id === 'string' && typeof task.title === 'string')
        .map((task) => ({
          id: task.id,
          title: task.title.slice(0, 120),
          category: ['Personal', 'Work', 'Study', 'Health'].includes(task.category) ? task.category : 'Personal',
          priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
          dueDate: typeof task.dueDate === 'string' ? task.dueDate : '',
          completed: Boolean(task.completed),
          createdAt: Number.isFinite(task.createdAt) ? task.createdAt : Date.now(),
          completedAt: Number.isFinite(task.completedAt) ? task.completedAt : null
        }));
    } catch (error) {
      console.warn('TaskFlow could not read saved tasks.', error);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error('TaskFlow could not save tasks.', error);
      showToast('Could not save changes. Check your browser storage settings.');
      return false;
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function prettyDate(dateString) {
    if (!dateString) return '';
    const date = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    const today = localDateString();
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = localDateString(tomorrowDate);
    if (dateString === today) return 'Due today';
    if (dateString === tomorrow) return 'Due tomorrow';
    return `Due ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)}`;
  }

  function isOverdue(task) {
    return Boolean(task.dueDate && task.dueDate < localDateString() && !task.completed);
  }

  function safeText(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function getVisibleTasks() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    let visible = tasks.filter((task) => {
      if (activeView === 'today' && task.dueDate !== localDateString()) return false;
      if (activeView === 'upcoming' && (!task.dueDate || task.dueDate < localDateString() || task.completed)) return false;
      if (activeView === 'completed' && !task.completed) return false;
      if (activeStatus === 'active' && task.completed) return false;
      if (activeStatus === 'completed' && !task.completed) return false;
      return !query || `${task.title} ${task.category} ${task.priority}`.toLocaleLowerCase().includes(query);
    });
    const priorityRank = { high: 0, medium: 1, low: 2 };
    visible.sort((a, b) => {
      switch (sortSelect.value) {
        case 'due': return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31') || b.createdAt - a.createdAt;
        case 'priority': return priorityRank[a.priority] - priorityRank[b.priority] || b.createdAt - a.createdAt;
        case 'alphabetical': return a.title.localeCompare(b.title);
        default: return b.createdAt - a.createdAt;
      }
    });
    return visible;
  }

  function createTaskRow(task) {
    const row = document.createElement('article');
    row.className = `task-row${task.completed ? ' is-completed' : ''}`;
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'task-check';
    check.checked = task.completed;
    check.setAttribute('aria-label', `${task.completed ? 'Mark incomplete' : 'Complete'}: ${task.title}`);
    check.addEventListener('change', () => toggleTask(task.id));

    const main = document.createElement('div');
    main.className = 'task-main';
    main.appendChild(safeText('div', 'task-title', task.title));
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.appendChild(safeText('span', 'category-tag', task.category));
    meta.appendChild(safeText('span', `priority-tag priority-${task.priority}`, `${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority`));
    if (task.dueDate) {
      const due = safeText('span', `due-label${isOverdue(task) ? ' overdue' : ''}`, isOverdue(task) ? `Overdue · ${prettyDate(task.dueDate).replace('Due ', '')}` : prettyDate(task.dueDate));
      meta.appendChild(due);
    }
    main.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    const edit = safeText('button', 'task-action', '✎');
    edit.type = 'button'; edit.title = 'Edit task'; edit.setAttribute('aria-label', `Edit ${task.title}`);
    edit.addEventListener('click', () => openEditDialog(task));
    const remove = safeText('button', 'task-action delete', '×');
    remove.type = 'button'; remove.title = 'Delete task'; remove.setAttribute('aria-label', `Delete ${task.title}`);
    remove.addEventListener('click', () => deleteTask(task.id));
    actions.append(edit, remove);
    row.append(check, main, actions);
    return row;
  }

  function render() {
    const visible = getVisibleTasks();
    taskList.replaceChildren(...visible.map(createTaskRow));
    const shouldShowEmpty = visible.length === 0;
    emptyState.classList.toggle('visible', shouldShowEmpty);
    taskList.hidden = shouldShowEmpty;
    $('#headingCount').textContent = String(visible.length);
    const completed = tasks.filter((task) => task.completed).length;
    const active = tasks.length - completed;
    const today = tasks.filter((task) => task.dueDate === localDateString() && !task.completed).length;
    const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    $('#allCount').textContent = String(tasks.length);
    $('#todayCount').textContent = String(today);
    $('#totalStat').textContent = String(tasks.length);
    $('#activeStat').textContent = String(active);
    $('#doneStat').textContent = String(completed);
    $('#completionStat').textContent = String(percent);
    $('#progressLabel').textContent = `${percent}% complete`;
    $('#progressBar').style.width = `${percent}%`;
    $('#doneNote').textContent = completed === 1 ? 'One win worth celebrating' : 'Wins worth celebrating';
    $('#footerSummary').textContent = tasks.length === 0 ? 'A fresh start. You’ve got this.' : active === 0 ? 'All caught up. Take a breath.' : `${active} task${active === 1 ? '' : 's'} left. One step at a time.`;
    const names = { all: 'All tasks', today: 'Today', upcoming: 'Upcoming', completed: 'Completed' };
    $('#breadcrumbLabel').textContent = names[activeView];
    $('#listHeading').firstChild.textContent = activeView === 'today' ? 'Today’s tasks ' : activeView === 'upcoming' ? 'Coming up ' : activeView === 'completed' ? 'Completed tasks ' : 'Your tasks ';
    $('#pageTitle').innerHTML = activeView === 'today' ? 'Own your <span>day.</span>' : activeView === 'upcoming' ? 'Plan what’s <span>next.</span>' : activeView === 'completed' ? 'Look how far you’ve <span>come.</span>' : 'Make today <span>count.</span>';
    $('#pageSubtitle').textContent = activeView === 'today' ? 'Focus on what matters right now.' : activeView === 'upcoming' ? 'A little planning goes a long way.' : activeView === 'completed' ? 'Every finished task is progress.' : 'A clear mind starts with a clear plan.';
    $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.filter === activeView));
    $$('.chip').forEach((button) => button.classList.toggle('selected', button.dataset.status === activeStatus));
  }

  function addTask(title, category, priority, dueDate) {
    tasks.unshift({ id: makeId(), title, category, priority, dueDate, completed: false, createdAt: Date.now(), completedAt: null });
    saveTasks();
    render();
    showToast('Task added. You’re one step closer!');
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function toggleTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;
    saveTasks(); render();
    showToast(task.completed ? 'Nice work — task completed!' : 'Task moved back to in progress.');
  }

  function deleteTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    tasks = tasks.filter((item) => item.id !== id);
    saveTasks(); render(); showToast('Task deleted.');
  }

  function openEditDialog(task) {
    $('#editId').value = task.id;
    $('#editTitle').value = task.title;
    $('#editCategory').value = task.category;
    $('#editPriority').value = task.priority;
    $('#editDue').value = task.dueDate;
    if (typeof editDialog.showModal === 'function') editDialog.showModal();
    else showToast('Editing is not supported by this browser.');
    $('#editTitle').focus();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = taskInput.value.trim();
    if (!title) { taskInput.focus(); return; }
    addTask(title, categoryInput.value, priorityInput.value, dueInput.value);
    form.reset();
    categoryInput.value = 'Personal'; priorityInput.value = 'medium'; taskInput.focus();
  });

  $$('.nav-item').forEach((button) => button.addEventListener('click', () => {
    activeView = button.dataset.filter; activeStatus = 'all'; render();
  }));
  $$('.chip').forEach((button) => button.addEventListener('click', () => {
    activeStatus = button.dataset.status; render();
  }));
  searchInput.addEventListener('input', render);
  sortSelect.addEventListener('change', render);
  $('#clearCompletedBtn').addEventListener('click', () => {
    const completedCount = tasks.filter((task) => task.completed).length;
    if (!completedCount) { showToast('No completed tasks to clear yet.'); return; }
    tasks = tasks.filter((task) => !task.completed);
    saveTasks(); render(); showToast(`${completedCount} completed task${completedCount === 1 ? '' : 's'} cleared.`);
  });
  $('#emptyAddBtn').addEventListener('click', () => taskInput.focus());
  $('#editForm').addEventListener('submit', (event) => {
    if (event.submitter && event.submitter.value === 'cancel') return;
    event.preventDefault();
    const id = $('#editId').value;
    const task = tasks.find((item) => item.id === id);
    const title = $('#editTitle').value.trim();
    if (!task || !title) return;
    task.title = title.slice(0, 120);
    task.category = $('#editCategory').value;
    task.priority = $('#editPriority').value;
    task.dueDate = $('#editDue').value;
    saveTasks(); editDialog.close(); render(); showToast('Task updated.');
  });

  const now = new Date();
  $('#dateLabel').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now).toUpperCase();
  $('#datePillText').textContent = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(now);
  render();
})();
