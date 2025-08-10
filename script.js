const taskInput = document.getElementById('taskInput');
const taskTime = document.getElementById('taskTime');
const taskDate = document.getElementById('taskDate');
const taskPriority = document.getElementById('taskPriority');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const tasksLeft = document.getElementById('tasksLeft');
const taskCount = document.getElementById('taskCount');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterButtons = document.querySelectorAll('.filter-btn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');

let currentFilter = 'all';
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function init() {
    setDefaultDateTime();
    renderTasks();
    updateTaskCount();
    
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    exportBtn.addEventListener('click', exportTasks);
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', importTasks);
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTasks();
        });
    });
}

function setDefaultDateTime() {
    const now = new Date();
    const timeString = now.toTimeString().substring(0, 5);
    const dateString = now.toISOString().substring(0, 10);
    
    taskTime.value = timeString;
    taskDate.value = dateString;
}

function addTask() {
    const text = taskInput.value.trim();
    const time = taskTime.value;
    const date = taskDate.value;
    const priority = taskPriority.value;
    
    if (text) {
        tasks.push({
            id: Date.now(),
            text,
            time,
            date,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        });
        
        saveTasks();
        renderTasks();
        updateTaskCount();
        taskInput.value = '';
        taskInput.focus();
    }
}

function renderTasks() {
    taskList.innerHTML = '';
    
    let filteredTasks = tasks;
    if (currentFilter === 'active') filteredTasks = tasks.filter(task => !task.completed);
    if (currentFilter === 'completed') filteredTasks = tasks.filter(task => task.completed);
    
    if (filteredTasks.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'list-group-item text-center text-muted py-4';
        emptyMessage.innerHTML = `
            <i class="far fa-smile fa-2x mb-2"></i>
            <p class="mb-0">${currentFilter === 'all' ? 'No tasks yet. Add one above!' :
                          currentFilter === 'active' ? 'No active tasks' : 'No completed tasks'}</p>
        `;
        taskList.appendChild(emptyMessage);
        return;
    }
    
    filteredTasks.sort((a, b) => {
        if (a.priority === b.priority) {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    }).forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = `list-group-item task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;
        
        taskItem.innerHTML = `
            <div class="d-flex align-items-center">
                <input type="checkbox" class="form-check-input task-check me-3" ${task.completed ? 'checked' : ''}>
                <div class="flex-grow-1">
                    <div class="task-text">${task.text}</div>
                    <div class="task-details mt-1">
                        ${task.time ? `<span><i class="far fa-clock"></i> ${task.time}</span>` : ''}
                        ${task.date ? `<span><i class="far fa-calendar-alt"></i> ${task.date}</span>` : ''}
                        <span class="task-priority priority-${task.priority}">
                            <i class="fas fa-${task.priority === 'high' ? 'exclamation-circle' : 
                                            task.priority === 'medium' ? 'minus-circle' : 'check-circle'}"></i> 
                            ${task.priority}
                        </span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn btn btn-sm btn-outline-primary me-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn btn btn-sm btn-outline-danger">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
        
        taskList.appendChild(taskItem);
        
        const checkbox = taskItem.querySelector('.task-check');
        const editBtn = taskItem.querySelector('.edit-btn');
        const deleteBtn = taskItem.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', () => toggleTaskComplete(task.id, checkbox.checked));
        editBtn.addEventListener('click', () => editTask(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
    });
}

function toggleTaskComplete(id, completed) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        task.completed = completed;
        saveTasks();
        updateTaskCount();
        
        if (currentFilter !== 'all') {
            setTimeout(() => renderTasks(), 300);
        }
    }
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;
    
    const newText = prompt('Edit task:', task.text);
    if (newText !== null && newText.trim() !== '') {
        task.text = newText.trim();
        task.time = prompt('Edit time:', task.time) || task.time;
        task.date = prompt('Edit date:', task.date) || task.date;
        task.priority = prompt('Edit priority (low/medium/high):', task.priority) || task.priority;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
}

function clearCompletedTasks() {
    if (confirm('Are you sure you want to clear all completed tasks?')) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
}

function updateTaskCount() {
    const activeTasks = tasks.filter(task => !task.completed).length;
    taskCount.textContent = activeTasks;
    tasksLeft.textContent = `${activeTasks} ${activeTasks === 1 ? 'task' : 'tasks'} remaining`;
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `tasks-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTasks = JSON.parse(e.target.result);
            if (Array.isArray(importedTasks)) {
                if (confirm('Import tasks? This will replace your current tasks.')) {
                    tasks = importedTasks;
                    saveTasks();
                    renderTasks();
                    updateTaskCount();
                    alert(`${tasks.length} tasks imported successfully!`);
                }
            } else {
                alert('Invalid file format. Please import a valid JSON file.');
            }
        } catch (error) {
            alert('Error importing tasks. Please check the file and try again.');
        }
        fileInput.value = '';
    };
    reader.readAsText(file);
}

init();