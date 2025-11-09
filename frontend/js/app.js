/* === app.js (VERSÃO FINAL E ESTÁVEL DO FRONT-END) === */
document.addEventListener("DOMContentLoaded", () => {
    
    // -----------------------------------------------------------------
    //  1. CONFIGURAÇÃO E ESTADO GLOBAL
    // -----------------------------------------------------------------
    const API = "http://localhost:3000/api";

    // Variáveis de estado
    let token = localStorage.getItem("userToken") || null; // Token do cliente
    // Inicializa o carrinho do localStorage para persistência
    let cart = JSON.parse(localStorage.getItem("cart") || "[]"); 

    // -----------------------------------------------------------------
    //  2. SELETORES DO DOM
    // -----------------------------------------------------------------
    // Produtos
    const productListDiv = document.getElementById("product-list");

    // Carrinho
    const cartSidebar = document.getElementById("cart-sidebar");
    const btnCartToggle = document.getElementById("btn-cart-toggle");
    const cartItemsDiv = document.getElementById("cart-items");
    const cartTotalSpan = document.getElementById("cart-total");
    const cartCountSpan = document.getElementById("cart-count"); // Ícone do header
    const cartCountSummarySpan = document.getElementById("cart-count-summary"); // Resumo no carrinho
    const inputAddress = document.getElementById("delivery-address");
    const selectPaymentMethod = document.getElementById("payment-method");
    const btnCheckout = document.getElementById("btn-checkout"); 

    // Modais
    const modalLogin = document.getElementById("modal-login");
    const modalRegister = document.getElementById("modal-register");
    const modalAdminLogin = document.getElementById("modal-admin-login");
    const toastNotification = document.getElementById("toast-notification");

    // Gatilhos dos Modais
    const btnAuth = document.getElementById("btn-auth"); // O botão "Login / Cadastro" principal
    const formLogin = document.getElementById("form-login");
    const formRegister = document.getElementById("form-register");
    const formAdminLogin = document.getElementById("form-admin-login");
    
    const linkToRegister = document.getElementById("link-to-register");
    const linkToLogin = document.querySelectorAll("#link-to-login"); // Ambos os links (login e registro)
    const linkToAdminLogin = document.getElementById("link-to-admin-login");

    // -----------------------------------------------------------------
    //  3. FUNÇÕES DE UTILIDADE E UI
    // -----------------------------------------------------------------

    function showToast(message, isError = false) {
        toastNotification.textContent = message;
        toastNotification.className = isError ? "toast visible error" : "toast visible";
        
        // Remove a notificação após 3 segundos
        setTimeout(() => {
            toastNotification.classList.remove("visible");
        }, 3000);
    }

    function showModal(modalElement) {
        modalElement.classList.remove("hidden");
    }

    function hideModal(modalElement) {
        modalElement.classList.add("hidden");
    }

    function toggleCartSidebar() {
        cartSidebar.classList.toggle("open");
    }
    
    function saveCart() {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantidade, 0);
        cartCountSpan.textContent = totalItems;
        if(cartCountSummarySpan) cartCountSummarySpan.textContent = totalItems;
    }

    // -----------------------------------------------------------------
    //  4. FUNÇÕES DE RENDERIZAÇÃO
    // -----------------------------------------------------------------

    async function fetchProducts() {
        try {
            const res = await fetch(`${API}/products`);
            if (!res.ok) throw new Error("Falha ao carregar produtos");
            const products = await res.json();
            
            productListDiv.innerHTML = "";
            products.forEach((p) => {
                const div = document.createElement("div");
                div.className = "product-card";
                div.innerHTML = `
                    <h4>${p.nome}</h4>
                    <p>${p.descricao || 'Café delicioso'}</p>
                    <p class="price">R$ ${parseFloat(p.preco).toFixed(2).replace('.', ',')}</p>
                    <button data-id="${p.id_produto}" class="btn-primary">Adicionar ao Carrinho</button>
                `;
                productListDiv.appendChild(div);
            });
            
            // Adiciona evento de clique a todos os botões "Adicionar"
            productListDiv.querySelectorAll(".product-card button").forEach((btn) =>
                btn.addEventListener("click", () => addToCart(btn.dataset.id))
            );

        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            productListDiv.innerHTML = `<p class="error">Não foi possível carregar os produtos. ${error.message}</p>`;
        }
    }

    function renderCart() {
        cartItemsDiv.innerHTML = "";
        let total = 0;
        
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p class="empty-cart-message">Carrinho Vazio</p>';
        } else {
            cart.forEach((item) => {
                total += parseFloat(item.preco) * item.quantidade; // Garante que preco é número
                const div = document.createElement("div");
                div.className = "cart-item";
                div.innerHTML = `
                    <div class="cart-item-info">
                        <strong>${item.nome}</strong>
                        <span>R$ ${(parseFloat(item.preco) * item.quantidade).toFixed(2).replace('.', ',')} (${item.quantidade}x R$ ${parseFloat(item.preco).toFixed(2).replace('.', ',')})</span>
                    </div>
                    <div class="cart-item-actions">
                        <button data-id="${item.id_produto}" data-action="remove">-</button>
                        <button data-id="${item.id_produto}" data-action="add">+</button>
                    </div>
                `;
                cartItemsDiv.appendChild(div);
            });
        }
        
        cartTotalSpan.textContent = total.toFixed(2).replace('.', ',');
        updateCartCount();
        saveCart();

        // Adiciona eventos aos botões de ajuste do carrinho
        cartItemsDiv.querySelectorAll("button").forEach(btn => {
            const id = btn.dataset.id;
            const action = btn.dataset.action;
            btn.addEventListener("click", () => {
                if (action === 'add') {
                    addToCart(id, 1);
                } else if (action === 'remove') {
                    removeFromCart(id, 1);
                }
            });
        });
    }

    // -----------------------------------------------------------------
    //  5. FUNÇÕES DE LÓGICA DO CARRINHO
    // -----------------------------------------------------------------

    function addToCart(id, quantity = 1) {
        const item = cart.find((i) => i.id_produto == id);
        
        if (item) {
            item.quantidade += quantity;
        } else {
            // Se o item não está no carrinho, buscamos no servidor para ter o nome e preço
            fetch(`${API}/products/${id}`)
                .then(res => res.json())
                .then(p => {
                    if (p && p.id_produto) {
                        cart.push({
                            id_produto: p.id_produto,
                            nome: p.nome,
                            quantidade: 1,
                            preco: parseFloat(p.preco), // Converte para número aqui
                        });
                        renderCart();
                        showToast(`"${p.nome}" adicionado ao carrinho!`);
                    } else {
                        showToast("Erro ao adicionar produto.", true);
                    }
                })
                .catch(err => {
                    console.error("Erro ao buscar produto para o carrinho:", err);
                    showToast("Erro de comunicação com o servidor.", true);
                });
            return; // Sai para renderizar após a busca
        }
        
        renderCart();
        showToast("Item adicionado ao carrinho!");
    }

    function removeFromCart(id, quantity = 1) {
        const index = cart.findIndex((i) => i.id_produto == id);
        
        if (index !== -1) {
            cart[index].quantidade -= quantity;
            
            if (cart[index].quantidade <= 0) {
                cart.splice(index, 1); // Remove item se a quantidade for zero ou menor
            }
            renderCart();
            showToast("Item removido do carrinho.");
        }
    }

    async function placeOrder(e) {
        e.preventDefault();

        if (!token) {
            showToast("Você precisa estar logado para finalizar o pedido.", true);
            showModal(modalLogin);
            return;
        }

        if (cart.length === 0) {
            showToast("O carrinho está vazio.", true);
            return;
        }
        
        const endereco = inputAddress.value.trim();
        const metodoPagamento = selectPaymentMethod.value;

        if (!endereco) {
            showToast("Por favor, informe o endereço de entrega.", true);
            return;
        }

        const orderData = {
            items: cart.map(item => ({ 
                id_produto: item.id_produto, 
                quantidade: item.quantidade 
            })),
            endereco: endereco,
            metodoPagamento: metodoPagamento
        };

        try {
            const res = await fetch(`${API}/orders`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(orderData),
            });

            const result = await res.json();

            if (res.ok) {
                showToast(`Pedido #${result.id_pedido} realizado com sucesso!`, false);
                cart = []; // Limpa o carrinho
                inputAddress.value = ""; // Limpa o endereço
                selectPaymentMethod.value = "Pix";
                renderCart(); // Atualiza a UI do carrinho
                toggleCartSidebar(); // Fecha o carrinho
            } else {
                showToast(`Erro ao finalizar pedido: ${result.message || "Erro desconhecido."}`, true);
            }
        } catch (error) {
            console.error("Erro no checkout:", error);
            showToast("Erro de comunicação com o servidor ao finalizar o pedido.", true);
        }
    }

    // -----------------------------------------------------------------
    //  6. FUNÇÕES DE AUTENTICAÇÃO (HANDLERS)
    // -----------------------------------------------------------------

    async function handleRegister(e) {
        e.preventDefault();
        
        const nome = document.getElementById("register-name").value;
        const email = document.getElementById("register-email").value;
        const senha = document.getElementById("register-password").value;
        const endereco = document.getElementById("register-address").value; // 'endereco'

        const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, senha, endereco }), // Deve corresponder ao authController
        });
        
        const j = await res.json();
        
        if (res.ok) {
            showToast("Cadastro realizado com sucesso! Faça login.");
            hideModal(modalRegister);
            showModal(modalLogin);
        } else {
            showToast("Erro no cadastro: " + (j.message || "Tente novamente."), true);
        }
    }


    async function handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById("login-email").value;
        const senha = document.getElementById("login-password").value;

        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha }),
        });
        
        const j = await res.json();
        
        if (res.ok) {
            token = j.token; 
            localStorage.setItem("userToken", token);
            showToast("Login realizado com sucesso!");
            hideModal(modalLogin);
        } else {
            showToast("Erro no login: " + (j.message || "Credenciais inválidas."), true);
        }
    }
    
    async function handleAdminLogin(e) {
        e.preventDefault();

        const email = document.getElementById('admin-email').value;
        const senha = document.getElementById('admin-password').value;

        const res = await fetch(`${API}/auth/admin/login`, {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const j = await res.json();

        if(res.ok){
            localStorage.setItem("admintoken", j.token);
            window.location.href = "admin.html"; // Redireciona para o painel
        } else {
            showToast("Login Admin falhou: " + (j.message || "Credenciais inválidas."), true);
        }
    }


    // -----------------------------------------------------------------
    //  7. EVENT LISTENERS
    // -----------------------------------------------------------------

    // Botão de Login/Cadastro no Header
    if (btnAuth) {
        btnAuth.addEventListener("click", () => showModal(modalLogin));
    }
    
    // Botão do Carrinho
    if(btnCartToggle) btnCartToggle.addEventListener("click", toggleCartSidebar);
    
    // Botão de Finalizar Pedido
    if(btnCheckout) btnCheckout.addEventListener("click", placeOrder);

    // Links de navegação entre modais
    if (linkToRegister) linkToRegister.addEventListener("click", (e) => {
        e.preventDefault();
        hideModal(modalLogin);
        showModal(modalRegister);
    });
    
    // O link 'Fazer Login' existe em dois locais (registro e admin)
    linkToLogin.forEach(link => link.addEventListener("click", (e) => {
        e.preventDefault();
        // Garante que o modal de origem seja fechado
        hideModal(modalRegister); 
        hideModal(modalAdminLogin); 
        showModal(modalLogin);
    }));

    if (linkToAdminLogin && modalAdminLogin) {
        linkToAdminLogin.addEventListener("click", (e) => {
            e.preventDefault();
            hideModal(modalLogin);
            showModal(modalAdminLogin);
        });
    }

    // Fecha modais ao clicar no botão de fechar (X)
    document.querySelectorAll(".close-button").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const modalElement = e.target.closest('.modal'); 
            if (modalElement) {
                hideModal(modalElement);
            }
        });
    });

    // Fecha modais ao clicar no fundo escuro
    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal")) {
            hideModal(e.target);
        }
    });

    // Formulários Submits
    if(formLogin) formLogin.addEventListener("submit", handleLogin);
    if(formRegister) formRegister.addEventListener("submit", handleRegister);
    if(formAdminLogin) formAdminLogin.addEventListener("submit", handleAdminLogin);

    // -----------------------------------------------------------------
    //  8. INICIALIZAÇÃO
    // -----------------------------------------------------------------
    
    function init() {
        fetchProducts(); // Busca os produtos na vitrine
        renderCart();    // Renderiza o carrinho
    }
    
    init();
});