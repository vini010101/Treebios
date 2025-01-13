// Primeiro, vamos verificar a autenticação
document.addEventListener("DOMContentLoaded", () => {
  // Verificar se usuário está autenticado e é admin
  if (!AuthService.isLoggedIn()) {
    window.location.href = "/login/Login.html";
    return;
  }

  if (!AuthService.isAdmin()) {
    window.location.href = "/dadosCadastrais/DadosCadastrais.html";
    return;
  }

  initializeDashboard();
  lucide.createIcons();
});

async function initializeDashboard() {
  try {
    await Promise.all([
      loadDashboardStats(),
      loadUsersTable(),
      loadAccessChart(7),
      setupEventListeners(),
    ]);
  } catch (error) {
    console.error("Erro ao inicializar dashboard:", error);
    showNotification("Erro ao carregar dados do dashboard", "error");
  }
}

// Carregar estatísticas do dashboard
async function loadDashboardStats() {
  try {
    const response = await fetch("https://biosbackend.up.railway.app/api/dashboard/stats", {
      headers: {
        Authorization: `Bearer ${AuthService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao carregar estatísticas");
    }

    const stats = await response.json();

    document.getElementById("totalUsers").textContent = stats.totalUsers;
    document.getElementById("todayAccess").textContent = stats.todayAccess;
    document.getElementById("totalReports").textContent = stats.totalReports;
  } catch (error) {
    console.error("Erro:", error);
    showNotification("Erro ao carregar estatísticas", "error");
  }
}

async function loadAccessChart(days = 7) {
    try {
        const response = await fetch(`https://biosbackend.up.railway.app/api/dashboard/access-history?days=${days}`, {
            headers: {
                'Authorization': `Bearer ${AuthService.getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar dados de acesso');
        }

        const data = await response.json();
        
        // Preencher datas faltantes com zero
        const filledData = fillMissingDates(data, days);

        // Configurar dados para o gráfico
        const chartData = {
            labels: filledData.map(d => formatDateForChart(d.date)),
            datasets: [{
                label: 'Acessos',
                data: filledData.map(d => d.count),
                fill: true,
                backgroundColor: 'rgba(59, 89, 152, 0.2)',
                borderColor: '#3B5998',
                tension: 0.4,
                pointBackgroundColor: '#3B5998',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        };

        // Criar/atualizar o gráfico
        const ctx = document.getElementById('accessChart').getContext('2d');
        
        if (window.accessChart) {
        }
        
        window.accessChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: function(context) {
                                return `Data: ${context[0].label}`;
                            },
                            label: function(context) {
                                return `Acessos: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return Math.floor(value);
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                }
            }
        });

    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao carregar gráfico de acessos', 'error');
    }
}

// Função para preencher datas faltantes com zero
function fillMissingDates(data, days) {
    const result = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const existingData = data.find(d => d.date === dateStr);
        result.push({
            date: dateStr,
            count: existingData ? existingData.count : 0
        });
    }
    
    return result;
}

// Função para formatar data para exibição no gráfico
function formatDateForChart(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
    });
}

// Atualizar período do gráfico
function updateChartPeriod(days) {
    const buttons = document.querySelectorAll('.filter-button');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.days === days.toString()) {
            btn.classList.add('active');
        }
    });

    loadAccessChart(days);
}

// Função para notificações
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

async function editUser(userId) {
  try {
      const userData = await getUserData(userId);
      openUserModal(userId); // O openUserModal já existe e está configurado para edição
  } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      showNotification('Erro ao carregar dados do usuário', 'error');
  }
}

// Carregar tabela de usuários
async function loadUsersTable() {
  try {
    const response = await fetch("https://biosbackend.up.railway.app/api/users");

    if (!response.ok) {
      throw new Error("Erro ao carregar usuários");
    }

    const users = await response.json();
    const tableBody = document.getElementById("usersTableBody");
    tableBody.innerHTML = "";

    users.forEach((user) => {
      const row = document.createElement("tr");
      // Formatar o último acesso
      const lastAccessText = user.last_access 
        ? formatDate(user.last_access)
        : 'Nunca acessou';

      row.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td><span class="badge ${user.type}">${user.type}</span></td>
        <td>${lastAccessText}</td>
        <td>
            <div class="action-buttons">
                <button onclick="editUser(${user.id})" class="action-button">
                    <i data-lucide="edit-2"></i>
                </button>
                <button onclick="deleteUser(${user.id})" class="action-button delete-button">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </td>
      `;
      tableBody.appendChild(row);
    });

    lucide.createIcons();
  } catch (error) {
    console.error("Erro:", error);
    showNotification("Erro ao carregar lista de usuários", "error");
  }
}

// Melhorar a função formatDate para lidar com datas nulas
function formatDate(dateString) {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data inválida";
    
    return date.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Data inválida";
  }
}

async function getUserData(userId) {
  try {
      const response = await fetch(`https://biosbackend.up.railway.app/api/users/${userId}`, {
          headers: {
              'Authorization': `Bearer ${AuthService.getToken()}`
          }
      });

      if (!response.ok) {
          throw new Error('Erro ao carregar dados do usuário');
      }

      return await response.json();
  } catch (error) {
      console.error('Erro:', error);
      showNotification('Erro ao carregar dados do usuário', 'error');
      throw error;
  }
}

window.openUserModal = function(userId = null) {
    const modal = document.getElementById('userModal');
    const modalTitle = modal.querySelector('h2');
    const form = document.getElementById('userForm');

    // Reset form
    form.reset();
    
    modalTitle.textContent = userId ? 'Editar Usuário' : 'Novo Usuário';
    
    if (userId) {
        getUserData(userId).then(userData => {
            form.querySelector('#userName').value = userData.name;
            form.querySelector('#userEmail').value = userData.email;
            form.querySelector('#userType').value = userData.type;
            
            const passwordField = form.querySelector('#userPassword');
            if (passwordField) {
                passwordField.required = false;
                passwordField.closest('.form-group').style.display = 'none';
            }
            form.dataset.userId = userId;
        });
    } else {
        const passwordField = form.querySelector('#userPassword');
        if (passwordField) {
            passwordField.required = true;
            passwordField.closest('.form-group').style.display = 'block';
        }
        delete form.dataset.userId;
    }

    modal.style.display = 'block';
    console.log('Modal aberto, form:', form); // Debug
};

window.closeUserModal = function () {
  const modal = document.getElementById("userModal");
  modal.style.display = "none";
};

window.handleUserSubmit = async function(event) {
  event.preventDefault();
  
  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');
  const userId = form.dataset.userId;
  
  // Capturar dados do formulário
  const userData = {
      name: form.querySelector('#userName').value.trim(),
      email: form.querySelector('#userEmail').value.trim(),
      type: form.querySelector('#userType').value
  };

  // Adicionar senha apenas se for um novo usuário ou se foi fornecida
  const password = form.querySelector('#userPassword').value;
  if (password) {
      userData.password = password;
  }

  // Validar dados antes de enviar
  if (!userData.name || !userData.email || (!userId && !userData.password)) {
      showNotification('Preencha todos os campos obrigatórios', 'error');
      return;
  }

  try {
      submitButton.disabled = true;
      submitButton.textContent = 'Salvando...';

      const url = userId 
          ? `https://biosbackend.up.railway.app/api/users/${userId}`
          : 'https://biosbackend.up.railway.app/api/users';
          
      const method = userId ? 'PUT' : 'POST';

      const response = await fetch(url, {
          method: method,
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${AuthService.getToken()}`
          },
          body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.error || 'Erro ao salvar usuário');
      }

      showNotification(
          `Usuário ${userId ? 'atualizado' : 'criado'} com sucesso!`, 
          'success'
      );
      closeUserModal();
      await loadUsersTable();

  } catch (error) {
      console.error('Erro:', error);
      showNotification(error.message, 'error');
  } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Salvar';
  }
};


async function deleteUser(userId) {
  if (!confirm("Tem certeza que deseja excluir este usuário?")) {
    return;
  }

  try {
    const response = await fetch(`https://biosbackend.up.railway.app/api/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${AuthService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao excluir usuário");
    }

    await loadUsersTable();
    showNotification("Usuário excluído com sucesso!", "success");
  } catch (error) {
    console.error("Erro:", error);
    showNotification("Erro ao excluir usuário", "error");
  }
}

// Gráfico de acessos
async function updateAccessChart(period) {
  try {
    const response = await fetch(
      `https://biosbackend.up.railway.app/api/dashboard/access-history?days=${period}`,
      {
        headers: {
          Authorization: `Bearer ${AuthService.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao carregar dados de acesso");
    }

    const accessData = await response.json();

    // Aqui você pode implementar a lógica do seu gráfico
    // Por exemplo, usando uma biblioteca como Chart.js
    console.log("Dados do gráfico:", accessData);
  } catch (error) {
    console.error("Erro:", error);
    showNotification("Erro ao carregar dados de acesso", "error");
  }
}

// Funções auxiliares
function showNotification(message, type = 'info') {
    // Remover notificações anteriores
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Adicionar ao DOM
    document.body.appendChild(notification);

    // Remover após 3 segundos
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function formatDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function handleLogout() {
  if (confirm("Deseja realmente sair?")) {
    AuthService.logout();
  }
}

// Event Listeners
function setupEventListeners() {
  const filterButtons = document.querySelectorAll(".filter-button");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      const days = button.textContent.includes("7")
        ? 7
        : button.textContent.includes("30")
        ? 30
        : 90;
      updateAccessChart(days);
    });
  });
}

// Exportar funções necessárias
window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;
window.handleUserSubmit = handleUserSubmit;
window.deleteUser = deleteUser;
window.handleLogout = handleLogout;
window.editUser = openUserModal;
