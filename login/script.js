// login.js
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const loginButton = document.querySelector(".login-button");

  try {
    loginButton.disabled = true;
    loginButton.textContent = "Entrando...";

    const response = await fetch("https://biosbackend.up.railway.app/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log("Resposta do servidor:", data); // Debug

    if (!response.ok) {
      throw new Error(data.error || "Erro ao fazer login");
    }

    // Armazenar dados do usuário
    localStorage.setItem(
      "userData",
      JSON.stringify({
        id: data.id,
        name: data.name,
        email: data.email,
        type: data.type,
      })
    );
    localStorage.setItem("isLoggedIn", "true");

    // Redirecionar baseado no tipo
    if (data.type === "admin") {
      window.location.href = "../admin/admin.html";
    } else {
      window.location.href = "../dadosCadastrais/DadosCadastrais.html";
    }
  } catch (error) {
    showError(error.message);
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Entrar";
  }
}

function showError(message) {
  let errorDiv = document.querySelector(".error-message");
  if (!errorDiv) {
    errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    document
      .querySelector(".login-form")
      .insertBefore(errorDiv, document.querySelector(".login-button"));
  }
  errorDiv.textContent = message;
  errorDiv.style.display = "block";

  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 5000);
}

// Verificar estado do login ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  const userData = localStorage.getItem("userData");
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const togglePassword = document.querySelector(".toggle-password");
  const passwordInput = document.getElementById("password");
  const eyeIcon = togglePassword.querySelector(".eye-icon");

  if (isLoggedIn === "true" && userData) {
    const user = JSON.parse(userData);
    if (user.type === "admin") {
      window.location.href = "../admin/admin.html";
    } else {
      window.location.href = "../dadosCadastrais/DadosCadastrais.html";
    }
  }

  togglePassword.addEventListener("click", () => {
    // Alternar o tipo do input entre "password" e "text"
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);

    // Remover o ícone antigo
    const oldIcon = togglePassword.querySelector(".eye-icon");
    oldIcon.remove();

    // Criar novo ícone
    const newIcon = document.createElement("i");
    newIcon.className = "eye-icon";
    newIcon.setAttribute(
      "data-lucide",
      type === "password" ? "eye" : "eye-off"
    );
    togglePassword.appendChild(newIcon);

    // Recriar os ícones
    lucide.createIcons();

    // Atualizar o texto de acessibilidade
    togglePassword.setAttribute(
      "aria-label",
      type === "password" ? "Mostrar senha" : "Ocultar senha"
    );
  });

  // Adicionar listener para o formulário
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
});
