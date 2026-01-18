/**
 * ToDo App Logic - Django DRF Version (Fixed & Simplified)
 * API: http://127.0.0.1:8000
 */

// --- KONFIGURACJA API ---
const API_URL = 'http://127.0.0.1:8000';

// --- Zmienne Globalne ---
let tasks = [];
let currentUser = null; 

const USERS_KEY = 'todo_users_db'; 
const SESSION_KEY = 'todo_current_session'; 

// --- Elementy DOM ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginCard = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');
const navUserName = document.getElementById('nav-user-name');

const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const searchInput = document.getElementById('search');
const taskCounter = document.getElementById('task-counter');

// --- Inicjalizacja ---
document.addEventListener('DOMContentLoaded', () => {
    M.FormSelect.init(document.querySelectorAll('select'));
    M.Datepicker.init(document.querySelectorAll('.datepicker'), {
        format: 'yyyy-mm-dd', autoClose: true
    });
    M.Modal.init(document.querySelectorAll('.modal'));

    checkSession();
});

// ==========================================
// SEKCJA 1: LOGIKA API (CRUD)
// ==========================================

async function fetchTasks() {
    if (!currentUser) return;
    try {
        const response = await fetch(`${API_URL}/tasks/`);
        if (!response.ok) throw new Error(`Błąd: ${response.status}`);
        
        const allTasks = await response.json();
        
        // Zabezpieczenie przed błędnymi danymi
        if (!Array.isArray(allTasks)) {
            console.error("Dane z serwera nie są tablicą:", allTasks);
            return;
        }

        // Filtrujemy zadania tylko dla zalogowanego użytkownika
        tasks = allTasks.filter(task => task.assignee === currentUser.username);
        
        renderTasks();
        updateStats();
    } catch (error) {
        console.error('Fetch Error:', error);
        M.toast({html: 'Nie udało się pobrać zadań', classes: 'red'});
    }
}

async function addTask(e) {
    e.preventDefault();
    if (!currentUser) return;

    const titleInput = document.getElementById('title');
    if (!titleInput.value.trim()) {
        M.toast({html: 'Podaj tytuł!', classes: 'red'});
        return;
    }

    const newTaskData = {
        title: titleInput.value,
        description: document.getElementById('description').value || "",
        completed: false,
        priority: document.getElementById('priority').value,
        deadline: document.getElementById('deadline').value || "",
        category: document.getElementById('category').value || "",
        assignee: currentUser.username
    };

    try {
        const response = await fetch(`${API_URL}/tasks/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTaskData)
        });

        if (response.status === 201) {
            const createdTask = await response.json();
            tasks.unshift(createdTask); 
            renderTasks();
            updateStats();
            taskForm.reset();
            M.updateTextFields();
            M.toast({html: 'Zadanie dodane!', classes: 'green'});
        } else {
            throw new Error('Błąd zapisu');
        }
    } catch (error) {
        console.error('Add Error:', error);
        M.toast({html: 'Błąd dodawania zadania', classes: 'red'});
    }
}

async function toggleTaskStatus(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    const updatedStatus = !task.completed;

    try {
        const response = await fetch(`${API_URL}/tasks/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: updatedStatus })
        });

        if (response.ok) {
            task.completed = updatedStatus;
            renderTasks();
            updateStats();
        }
    } catch (error) {
        console.error('Toggle Error:', error);
    }
}

async function saveEdit() {
    const id = document.getElementById('edit-id').value;
    if (!id) return;

    const updatedData = {
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-description').value,
        priority: document.getElementById('edit-priority').value,
        deadline: document.getElementById('edit-deadline').value,
        category: document.getElementById('edit-category').value,
        assignee: document.getElementById('edit-assignee').value 
    };

    try {
        const response = await fetch(`${API_URL}/tasks/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            await fetchTasks(); // Odśwież wszystko
            M.Modal.getInstance(document.getElementById('edit-modal')).close();
            M.toast({html: 'Zapisano zmiany', classes: 'green'});
        } else {
            M.toast({html: 'Błąd edycji', classes: 'red'});
        }
    } catch (error) {
        console.error('Edit Error:', error);
    }
}

async function deleteTask(id) {
    if(!confirm('Czy usunąć zadanie?')) return;

    try {
        const response = await fetch(`${API_URL}/tasks/${id}/`, {
            method: 'DELETE'
        });

        if (response.ok) {
            tasks = tasks.filter(t => t.id != id);
            renderTasks();
            updateStats();
            M.toast({html: 'Usunięto', classes: 'grey darken-1'});
        }
    } catch (error) {
        console.error('Delete Error:', error);
    }
}

// ==========================================
// SEKCJA 2: AUTENTYKACJA (LocalStorage)
// ==========================================

document.getElementById('show-register-btn').addEventListener('click', () => {
    loginCard.classList.add('hide');
    registerCard.classList.remove('hide');
});

document.getElementById('show-login-btn').addEventListener('click', () => {
    registerCard.classList.add('hide');
    loginCard.classList.remove('hide');
});

document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pwd = document.getElementById('reg-password').value;
    const pwdConfirm = document.getElementById('reg-password-confirm').value;

    if (pwd !== pwdConfirm) {
        M.toast({html: 'Hasła różne!', classes: 'red'});
        return;
    }

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.some(u => u.username === username)) {
        M.toast({html: 'Login zajęty!', classes: 'red'});
        return;
    }

    users.push({ username, email, password: pwd });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    M.toast({html: 'Konto założone. Zaloguj się.', classes: 'green'});
    
    document.getElementById('register-form').reset();
    registerCard.classList.add('hide');
    loginCard.classList.remove('hide');
});

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const pwd = document.getElementById('login-password').value;
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    const user = users.find(u => u.username === username && u.password === pwd);
    if (user) loginUser(user);
    else M.toast({html: 'Błędne dane', classes: 'red'});
});

document.getElementById('logout-btn').addEventListener('click', logoutUser);

function loginUser(user) {
    currentUser = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    navUserName.textContent = user.username;
    authContainer.classList.add('hide');
    appContainer.classList.remove('hide');
    document.getElementById('login-form').reset();
    fetchTasks();
}

function logoutUser() {
    currentUser = null;
    tasks = [];
    localStorage.removeItem(SESSION_KEY);
    appContainer.classList.add('hide');
    authContainer.classList.remove('hide');
    loginCard.classList.remove('hide');
    registerCard.classList.add('hide');
}

function checkSession() {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) loginUser(JSON.parse(session));
}

// ==========================================
// SEKCJA 3: UI (Renderowanie) - TUTAJ BYŁ BŁĄD
// ==========================================

function renderTasks(filterType = 'all', searchTerm = '') {
    taskList.innerHTML = '';
    let filtered = tasks;

    // Filtrowanie
    if (filterType === 'active') filtered = tasks.filter(t => !t.completed);
    else if (filterType === 'completed') filtered = tasks.filter(t => t.completed);

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(t => 
            t.title.toLowerCase().includes(term) || 
            (t.description && t.description.toLowerCase().includes(term))
        );
    }

    if (filtered.length === 0) {
        taskList.innerHTML = '<li class="collection-item center-align grey-text">Brak zadań</li>';
        return;
    }

    filtered.forEach(task => {
        const li = document.createElement('li');

        // --- PRZYGOTOWANIE DANYCH PRZED HTML (Uproszczenie) ---
        // Dzięki temu nie ma skomplikowanych if-ów wewnątrz HTML stringa
        
        const prio = task.priority || 'medium';
        const isCompleted = task.completed;
        const assignee = task.assignee || ''; 
        const deadline = task.deadline || '';
        const category = task.category || '';
        const description = task.description || '';

        // Logika kolorów i tekstów
        let prioColor = 'green';
        let prioLabel = 'Niski';
        
        if (prio === 'high') { prioColor = 'red'; prioLabel = 'Wysoki'; }
        else if (prio === 'medium') { prioColor = 'orange'; prioLabel = 'Średni'; }

        // Budowanie snippetów HTML (tylko jeśli dane istnieją)
        const assigneeHtml = assignee ? `<span class="chip-small"><i class="material-icons tiny left">person</i> ${assignee}</span>` : '';
        const deadlineHtml = deadline ? `<span class="chip-small"><i class="material-icons tiny left">event</i> ${deadline}</span>` : '';
        const categoryHtml = category ? `<span class="chip-small blue lighten-4 blue-text text-darken-2">#${category}</span>` : '';

        // --- BUDOWANIE HTML ---
        li.className = `collection-item avatar priority-${prio} ${isCompleted ? 'task-completed' : ''}`;
        
        li.innerHTML = `
            <label>
                <input type="checkbox" class="filled-in task-check" data-id="${task.id}" ${isCompleted ? 'checked' : ''} />
                <span></span>
            </label>
            <div class="task-content" style="display:inline-block; width: 90%; margin-left: 10px; vertical-align: top;">
                <span class="title" style="font-weight: bold; font-size: 1.1rem;">${task.title}</span>
                <p class="grey-text text-darken-1" style="margin: 5px 0;">${description}</p>
                
                <div class="task-meta">
                    ${assigneeHtml}
                    <span class="chip-small white-text ${prioColor} lighten-1">${prioLabel}</span>
                    ${deadlineHtml}
                    ${categoryHtml}
                </div>
            </div>
            
            <div class="secondary-content">
                <a href="#!" class="edit-btn" data-id="${task.id}"><i class="material-icons orange-text">edit</i></a>
                <a href="#!" class="delete-btn" data-id="${task.id}"><i class="material-icons red-text">delete</i></a>
            </div>
        `;
        taskList.appendChild(li);
    });
}

function updateStats() {
    const count = tasks.filter(t => !t.completed).length;
    taskCounter.innerText = count;
}

function openEditModal(id) {
    const task = tasks.find(t => t.id == id); // == bo id z URL może być string
    if (!task) return;

    document.getElementById('edit-id').value = task.id;
    document.getElementById('edit-title').value = task.title;
    document.getElementById('edit-description').value = task.description;
    document.getElementById('edit-assignee').value = task.assignee || currentUser.username;
    document.getElementById('edit-deadline').value = task.deadline;
    document.getElementById('edit-category').value = task.category;
    
    const prioritySelect = document.getElementById('edit-priority');
    prioritySelect.value = task.priority || 'medium';
    M.FormSelect.init(prioritySelect);

    M.updateTextFields();
    M.Modal.getInstance(document.getElementById('edit-modal')).open();
}

// Event Listeners
taskForm.addEventListener('submit', addTask);
document.getElementById('save-edit-btn').addEventListener('click', saveEdit);

taskList.addEventListener('click', (e) => {
    const btnDelete = e.target.closest('.delete-btn');
    const btnEdit = e.target.closest('.edit-btn');
    const checkbox = e.target.classList.contains('task-check');

    if (btnDelete) deleteTask(btnDelete.dataset.id);
    else if (btnEdit) openEditModal(btnEdit.dataset.id);
    else if (checkbox) toggleTaskStatus(e.target.dataset.id);
});

// Filtrowanie
let currentFilter = 'all';
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('darken-4', 'z-depth-2'));
        e.target.classList.add('darken-4', 'z-depth-2');
        currentFilter = e.target.dataset.filter;
        renderTasks(currentFilter, searchInput.value);
    });
});

searchInput.addEventListener('input', (e) => renderTasks(currentFilter, e.target.value));