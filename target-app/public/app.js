// Dashboard functionality
if (document.getElementById('total-employees')) {
    // Load dashboard stats
    async function loadDashboardStats() {
        try {
            const [employeesRes, tasksRes] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/tasks')
            ]);

            const employees = await employeesRes.json();
            const tasks = await tasksRes.json();

            document.getElementById('total-employees').textContent = employees.length;
            document.getElementById('total-tasks').textContent = tasks.length;
            document.getElementById('completed-tasks').textContent = tasks.filter(t => t.status === 'completed').length;
            document.getElementById('pending-tasks').textContent = tasks.filter(t => t.status === 'pending').length;

            // Load recent activity (simplified)
            const recentActivity = document.getElementById('recent-activity-list');
            recentActivity.innerHTML = `
                <p><strong>${employees.length}</strong> employees in the system</p>
                <p><strong>${tasks.length}</strong> total tasks</p>
                <p><strong>${tasks.filter(t => t.status === 'completed').length}</strong> completed tasks</p>
                <p><strong>${tasks.filter(t => t.status === 'pending').length}</strong> pending tasks</p>
            `;
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            document.getElementById('total-employees').textContent = 'Error';
            document.getElementById('total-tasks').textContent = 'Error';
            document.getElementById('completed-tasks').textContent = 'Error';
            document.getElementById('pending-tasks').textContent = 'Error';
        }
    }

    loadDashboardStats();
}

// Tasks functionality
if (document.getElementById('task-form')) {
    const taskForm = document.getElementById('task-form');
    const tasksList = document.getElementById('tasks-list');

    // Load tasks
    async function loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            const tasks = await response.json();

            tasksList.innerHTML = '';

            if (tasks.length === 0) {
                tasksList.innerHTML = '<tr><td colspan="7">No tasks found</td></tr>';
                return;
            }

            tasks.forEach(task => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${task.id}</td>
                    <td>${task.title}</td>
                    <td>${task.description}</td>
                    <td><span class="status-badge status-${task.status.toLowerCase()}">${task.status}</span></td>
                    <td>${task.assignee}</td>
                    <td>${task.createdAt}</td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="editTask(${task.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTask(${task.id})">Delete</button>
                    </td>
                `;
                tasksList.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading tasks:', error);
            tasksList.innerHTML = '<tr><td colspan="7">Error loading tasks</td></tr>';
        }
    }

    // Handle form submission
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const assignee = document.getElementById('task-assignee').value.trim();

        if (!title || !description || !assignee) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, assignee })
            });

            if (response.ok) {
                // Clear form
                taskForm.reset();
                // Reload tasks
                loadTasks();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task');
        }
    });

    // Load tasks on page load
    loadTasks();
}

// Users functionality
if (document.getElementById('user-search')) {
    const userSearch = document.getElementById('user-search');
    const searchBtn = document.getElementById('search-btn');
    const usersList = document.getElementById('users-list');

    // Load users
    async function loadUsers(filter = '') {
        try {
            let url = '/api/users';
            if (filter) {
                url += `?q=${encodeURIComponent(filter)}`;
            }

            const response = await fetch(url);
            const users = await response.json();

            usersList.innerHTML = '';

            if (users.length === 0) {
                usersList.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
                return;
            }

            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.department}</td>
                    <td>${user.role}</td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="viewUser(${user.id})">View</button>
                    </td>
                `;
                usersList.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading users:', error);
            usersList.innerHTML = '<tr><td colspan="6">Error loading users</td></tr>';
        }
    }

    // Handle search
    searchBtn.addEventListener('click', () => {
        const query = userSearch.value.trim();
        loadUsers(query);
    });

    // Handle enter key
    userSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    // Load all users on page load
    loadUsers();
}

// Profile functionality
if (document.getElementById('profile-form')) {
    const profileForm = document.getElementById('profile-form');

    // Load profile
    async function loadProfile() {
        try {
            const response = await fetch('/api/profile');
            const profile = await response.json();

            document.getElementById('profile-name').value = profile.name || '';
            document.getElementById('profile-email').value = profile.email || '';
            document.getElementById('profile-department').value = profile.department || '';
            document.getElementById('profile-role').value = profile.role || '';
            document.getElementById('profile-employee-id').value = profile.employeeId || '';
            document.getElementById('profile-hire-date').value = profile.hireDate || '';
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    // Handle form submission
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('profile-name').value.trim();
        const email = document.getElementById('profile-email').value.trim();
        const department = document.getElementById('profile-department').value.trim();

        if (!name || !email || !department) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, department })
            });

            if (response.ok) {
                alert('Profile updated successfully');
                loadProfile();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    });

    // Load profile on page load
    loadProfile();
}

// Helper functions (for inline HTML handlers)
function editTask(id) {
    // In a real app, this would populate a form with task data
    alert(`Edit task ${id} - functionality would be implemented here`);
}

function deleteTask(id) {
    if (!confirm(`Are you sure you want to delete task ${id}?`)) return;

    fetch(`/api/tasks/${id}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) {
                // Reload tasks list
                if (document.getElementById('tasks-list')) {
                    loadTasks();
                }
            } else {
                return response.json().then(err => alert('Error: ' + (err.error || 'Unknown error')));
            }
        })
        .catch(() => alert('Failed to delete task'));
}

function viewUser(id) {
    alert(`View user ${id} - functionality would be implemented here`);
}