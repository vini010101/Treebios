const AuthService = {
    KEYS: {
        USER: 'userData',
        TOKEN: 'authToken',
        IS_LOGGED: 'isLoggedIn'
    },

    saveUserData(userData) {
        localStorage.setItem(this.KEYS.USER, JSON.stringify(userData));
        localStorage.setItem(this.KEYS.IS_LOGGED, 'true');
        if (userData.token) {
            localStorage.setItem(this.KEYS.TOKEN, userData.token);
        }
    },

    getUserData() {
        const userData = localStorage.getItem(this.KEYS.USER);
        return userData ? JSON.parse(userData) : null;
    },

    isLoggedIn() {
        return localStorage.getItem(this.KEYS.IS_LOGGED) === 'true';
    },

    isAdmin() {
        const userData = this.getUserData();
        return userData?.type === 'admin';
    },

    getToken() {
        return localStorage.getItem(this.KEYS.TOKEN);
    },

    // Fazer logout
    logout() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        window.location.href = '/login/Login.html';
    },

    checkAuthAndRedirect() {
        if (!this.isLoggedIn()) {
            window.location.href = '/login/Login.html';
            return;
        }

        const currentPath = window.location.pathname;
        const isAdminPage = currentPath.includes('/admin/');
        const isUserPage = currentPath.includes('/dadosCadastrais/');

        if (isAdminPage && !this.isAdmin()) {
            window.location.href = '/dadosCadastrais/DadosCadastrais.html';
        } else if (isUserPage && this.isAdmin()) {
            window.location.href = '/admin/admin.html';
        }
    }
};

// Exportar o serviço
window.AuthService = AuthService;