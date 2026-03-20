// =================== FAVORITAR JOGOS ===================
const favoriteBtns = document.querySelectorAll('.favorite-btn');

favoriteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Impede que o clique no card seja acionado
        
        const icon = btn.querySelector('i');
        
        if (btn.classList.contains('favorited')) {
            // Remove dos favoritos
            btn.classList.remove('favorited');
            icon.classList.remove('fas');
            icon.classList.add('far');
        } else {
            // Adiciona aos favoritos
            btn.classList.add('favorited');
            icon.classList.remove('far');
            icon.classList.add('fas');
            
            // Animação de feedback
            btn.style.transform = 'scale(1.3)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 200);
        }
    });
});

// =================== CLIQUE NO CARD DO JOGO ===================
const gameCards = document.querySelectorAll('.game-card');

gameCards.forEach(card => {
    card.addEventListener('click', () => {
        const gameTitle = card.querySelector('.game-title').textContent;

        // salva o jogo clicado
        localStorage.setItem("gameSelecionado", gameTitle);

        // redireciona pra página
        window.location.href = "InfoJogo.html";
    });
});

// =================== BUSCA DE JOGOS ===================
const searchInput = document.querySelector('.search-box input');

searchInput?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    gameCards.forEach(card => {
        const title = card.querySelector('.game-title').textContent.toLowerCase();
        const genre = card.querySelector('.game-genre').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || genre.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// =================== ORDENAÇÃO DE JOGOS ===================
const sortSelect = document.querySelector('.sort-select');

sortSelect?.addEventListener('change', (e) => {
    const sortType = e.target.value;
    const gamesGrid = document.querySelector('.games-grid');
    const cardsArray = Array.from(gameCards);
    
    cardsArray.sort((a, b) => {
        const titleA = a.querySelector('.game-title').textContent;
        const titleB = b.querySelector('.game-title').textContent;
        const ratingA = parseFloat(a.querySelector('.game-rating').textContent.split(' ')[1]);
        const ratingB = parseFloat(b.querySelector('.game-rating').textContent.split(' ')[1]);
        
        switch(sortType) {
            case 'Mais populares':
                return ratingB - ratingA;
            case 'A-Z':
                return titleA.localeCompare(titleB);
            case 'Z-A':
                return titleB.localeCompare(titleA);
            default: // Mais recentes
                return 0;
        }
    });
    
    // Reorganiza os cards
    cardsArray.forEach(card => gamesGrid.appendChild(card));
});

// =================== NAVEGAÇÃO DO MENU ===================
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active de todos
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Adiciona active no clicado
        item.classList.add('active');
        
        console.log('Navegando para:', item.textContent.trim());
    });
});

// =================== BOTÃO DE FILTRO (ABRE MODAL) ===================
const filterBtn = document.querySelector('.filter-btn');
const filterModal = document.getElementById('filterModal');
const closeModal = document.getElementById('closeModal');
const clearFilters = document.getElementById('clearFilters');
const applyFilters = document.getElementById('applyFilters');

filterBtn?.addEventListener('click', () => {
    filterModal.classList.add('active');
});

closeModal?.addEventListener('click', () => {
    filterModal.classList.remove('active');
});

// Fecha o modal ao clicar fora dele
filterModal?.addEventListener('click', (e) => {
    if (e.target === filterModal) {
        filterModal.classList.remove('active');
    }
});

// Limpar filtros
clearFilters?.addEventListener('click', () => {
    const checkboxes = filterModal.querySelectorAll('input[type="checkbox"]');
    const radios = filterModal.querySelectorAll('input[type="radio"]');
    
    checkboxes.forEach(cb => cb.checked = false);
    radios.forEach(radio => {
        if (radio.value === 'all') radio.checked = true;
    });
});

// Aplicar filtros
applyFilters?.addEventListener('click', () => {
    // Aqui você pode implementar a lógica de filtragem
    console.log('Filtros aplicados!');
    
    filterModal.classList.remove('active');
    
    // Exemplo de como pegar os filtros selecionados:
    const selectedGenres = Array.from(filterModal.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    const selectedRating = filterModal.querySelector('input[name="rating"]:checked').value;
    
    console.log('Gêneros:', selectedGenres);
    console.log('Avaliação:', selectedRating);
});

// =================== TRATAMENTO DE ERRO DE LOGO ===================
const headerLogo = document.getElementById('header-logo');

if (headerLogo) {
    headerLogo.addEventListener('error', function() {
        this.style.display = 'none';
    });
}

// Tratamento para logos dos jogos que não carregarem
const gameLogos = document.querySelectorAll('.game-logo');

gameLogos.forEach(logo => {
    logo.addEventListener('error', function() {
        // Cria um placeholder caso a imagem não carregue
        this.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05));
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: rgba(212, 175, 55, 0.5);
        `;
        placeholder.innerHTML = '<i class="fas fa-gamepad"></i>';
        this.parentElement.appendChild(placeholder);
    });
});

// =================== DROPDOWN DO USUÁRIO ===================
const userProfile = document.getElementById('userProfile');
const userDropdown = document.getElementById('userDropdown');

// Posiciona o dropdown
if (userProfile && userDropdown) {
    userProfile.style.position = 'relative';

    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
        userProfile.classList.toggle('active');
    });

    // Fecha o dropdown ao clicar fora
    document.addEventListener('click', () => {
        userDropdown.classList.remove('active');
        userProfile.classList.remove('active');
    });

    // Impede que cliques no dropdown o fechem
    userDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Ações dos itens do dropdown
    const dropdownItems = userDropdown.querySelectorAll('.dropdown-item');

    dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
            const text = item.textContent.trim();

            let user = null;
            try {
                user = JSON.parse(localStorage.getItem("velora_user"));
            } catch (e) {
                user = null;
            }

            userDropdown.classList.remove('active');
            userProfile.classList.remove('active');

            if (text.includes("Meu Perfil")) {
                if (!user) {
                    window.location.href = "LoginCadastro.html";
                    return;
                }

                if (user.account_type === "developer") {
                    window.location.href = "PerfilDev.html";
                } else {
                    window.location.href = "PerfilUsuario.html";
                }
            }

            if (text.includes("Sair")) {
                localStorage.removeItem("velora_user");
                window.location.href = "LoginCadastro.html";
            }
        });
    });

    const user = JSON.parse(localStorage.getItem("velora_user"));

if (user) {
    const userNameElement = document.querySelector(".user-name");

    if (userNameElement) {
        userNameElement.textContent =
            user.account_type === "developer" ? "Desenvolvedor" : "Jogador";
    }
}

// =================== JOGOS CUSTOMIZÁVEIS ===================

const customGames = [
    {
        title: "Meu Jogo 1",
        genre: "Ação",
        rating: 4.9,
        image: "custom1.png"
    },
    {
        title: "Meu Jogo 2",
        genre: "RPG",
        rating: 4.7,
        image: "custom2.png"
    },
    {
        title: "Meu Jogo 3",
        genre: "Terror",
        rating: 4.5,
        image: "custom3.png"
    },
    {
        title: "Meu Jogo 4",
        genre: "Puzzle",
        rating: 4.3,
        image: "custom4.png"
    },
    {
        title: "Meu Jogo 5",
        genre: "Aventura",
        rating: 4.8,
        image: "custom5.png"
    },
    {
        title: "Meu Jogo 6",
        genre: "Indie",
        rating: 4.6,
        image: "custom6.png"
    },
    {
        title: "Meu Jogo 7",
        genre: "Plataforma",
        rating: 4.4,
        image: "custom7.png"
    },
    {
        title: "Meu Jogo 8",
        genre: "Corrida",
        rating: 4.2,
        image: "custom8.png"
    },
    {
        title: "Meu Jogo 9",
        genre: "Simulação",
        rating: 4.1,
        image: "custom9.png"
    },
    {
        title: "Meu Jogo 10",
        genre: "Multiplayer",
        rating: 4.9,
        image: "custom10.png"
    }
];

function carregarJogosCustom() {
    const cards = document.querySelectorAll(".custom-game");

    cards.forEach((card, index) => {
        const game = customGames[index];
        if (!game) return;

        card.querySelector(".game-title").textContent = game.title;
        card.querySelector(".game-genre").textContent = game.genre;
        card.querySelector(".game-rating").innerHTML =
            `<i class="fas fa-star"></i> ${game.rating}`;

        const img = card.querySelector(".game-logo");
        img.src = game.image;
    });
}

// executa quando carregar a página
document.addEventListener("DOMContentLoaded", carregarJogosCustom);
}