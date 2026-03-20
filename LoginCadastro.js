const API_BASE = "http://127.0.0.1:5000/api";

// =========================
// API
// =========================
async function apiPost(path, body) {
    const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Erro na requisição.");
    }

    return data;
}

// =========================
// TOAST
// =========================
function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMessage = toast?.querySelector(".toast-message");

    if (!toast || !toastMessage) {
        alert(message);
        return;
    }

    toastMessage.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

// =========================
// MODO LOGIN / CADASTRO
// =========================
const modeBtns = document.querySelectorAll(".mode-btn");
const authForms = document.querySelectorAll(".auth-form");

modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;

        modeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        authForms.forEach((form) => {
            form.classList.remove("active");

            if (form.id === `form-${mode}`) {
                form.classList.add("active");
            }
        });
    });
});

// =========================
// MOSTRAR SENHA
// =========================
document.querySelectorAll(".toggle-pwd").forEach((btn) => {
    btn.addEventListener("click", function () {
        const input = this.parentElement.querySelector("input");
        const icon = this.querySelector("i");

        if (!input || !icon) return;

        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    });
});

// =========================
// TIPO DE CONTA
// =========================
const typeOptions = document.querySelectorAll(".type-option");
const playerFields = document.getElementById("player-fields");
const developerFields = document.getElementById("developer-fields");

function setRequired(container, required) {
    if (!container) return;

    container.querySelectorAll("input").forEach((input) => {
        if (required) {
            input.setAttribute("required", "required");
        } else {
            input.removeAttribute("required");
        }
    });
}

// estado inicial
if (playerFields && developerFields) {
    setRequired(playerFields, true);
    setRequired(developerFields, false);
}

typeOptions.forEach((option) => {
    option.addEventListener("click", () => {
        const type = option.dataset.type;

        typeOptions.forEach((o) => o.classList.remove("active"));
        option.classList.add("active");

        const accountTypeInput = document.querySelector(
            `input[name="accountType"][value="${type}"]`
        );
        if (accountTypeInput) {
            accountTypeInput.checked = true;
        }

        if (type === "player") {
            playerFields?.classList.remove("hidden");
            developerFields?.classList.add("hidden");

            setRequired(playerFields, true);
            setRequired(developerFields, false);
        } else {
            playerFields?.classList.add("hidden");
            developerFields?.classList.remove("hidden");

            setRequired(playerFields, false);
            setRequired(developerFields, true);
        }
    });
});

// =========================
// TABS DE DESENVOLVEDOR
// =========================
const devTabs = document.querySelectorAll(".dev-tab");

devTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        devTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
    });
});

// =========================
// LOGIN
// =========================
document.getElementById("form-login")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);

    const login = (fd.get("login") || "").toString().trim();
    const password = (fd.get("password") || "").toString().trim();

    if (!login || !password) {
        showToast("❌ Preencha login e senha.");
        return;
    }

    try {
        showToast("🔄 Entrando...");

        const data = await apiPost("/login", {
            login,
            password
        });

        if (data.user) {
            localStorage.setItem("velora_user", JSON.stringify(data.user));
        }

        showToast("✅ Login realizado!");

        setTimeout(() => {
            window.location.href = "Catalogo.html";
        }, 800);
    } catch (err) {
        showToast(`❌ ${err.message}`);
    }
});

// =========================
// CADASTRO
// =========================
document.getElementById("form-register")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const fd = new FormData(form);

    const accountType =
        document.querySelector('input[name="accountType"]:checked')?.value || "player";

    let password = "";
    let confirmPassword = "";

    if (accountType === "player") {
        password = document.querySelector('#player-fields input[name="password"]')?.value.trim() || "";
        confirmPassword = document.querySelector('#player-fields input[name="confirm_password"]')?.value.trim() || "";
    } else {
        password = document.querySelector('#developer-fields input[name="password"]')?.value.trim() || "";
        confirmPassword = document.querySelector('#developer-fields input[name="confirm_password"]')?.value.trim() || "";
    }

    if (password !== confirmPassword) {
        showToast("❌ As senhas não coincidem.");
        return;
    }

    try {
        if (accountType === "player") {

            const name = (fd.get("full_name") || "").toString().trim();
            const username = (fd.get("username") || "").toString().trim();
            const email = (fd.get("email") || "").toString().trim();

            await apiPost("/register", {
                name,
                username,
                email,
                password,
                accountType: "player"
            });

        } else {

            const name = (fd.get("dev_display_name") || "").toString().trim();
            const username = (fd.get("dev_username") || "").toString().trim();
            const email = (fd.get("dev_email") || "").toString().trim();

            await apiPost("/register", {
                name,
                username,
                email,
                password,
                accountType: "developer"
            });
        }

        showToast("✅ Conta criada com sucesso!");
        form.reset();

    } catch (err) {
        showToast(`❌ ${err.message}`);
    }

});