const API = "http://localhost:3000/api";
let token = localStorage.getItem("admintoken");

if (!token) {
  alert("Acesso negado! Faça login como administrador.");
  window.location.href = "index.html";
}

// Alternar abas
document.querySelectorAll(".sidebar li").forEach(li => {
  li.addEventListener("click", () => {
    document.querySelectorAll(".sidebar li").forEach(i => i.classList.remove("active"));
    li.classList.add("active");

    const section = li.dataset.section;
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("visible"));
    document.getElementById(`sec-${section}`).classList.add("visible");
  });
});

// Logout
document.getElementById("logout-admin").addEventListener("click", () => {
  localStorage.removeItem("admintoken");
  window.location.href = "index.html";
});

//================== PRODUTOS ==================//

// Função auxiliar para buscar detalhes de um produto
async function getProductDetails(id) {
    const res = await fetch(`${API}/products/${id}`);
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao buscar detalhes do produto.");
    }
    return res.json();
}

async function carregarProdutos() {
  const res = await fetch(`${API}/products`);
  const produtos = await res.json();
  const container = document.getElementById("lista-produtos");
  container.innerHTML = ""; // Limpa o container

  produtos.forEach(p => {
    container.innerHTML += `
      <div class="card product-card">
        <img src="https://via.placeholder.com/250x150?text=${encodeURIComponent(p.nome)}" alt="Imagem de ${p.nome}" />
        
        <div class="card-info">
          <h4>${p.nome}</h4>
          <p class="description">${p.descricao || "Sem descrição."}</p>
          <p>Preço: <strong>R$ ${parseFloat(p.preco).toFixed(2)}</strong></p>
          <p>Estoque: <strong>${p.estoque}</strong></p>
        </div>

        <div class="card-footer">
            <p class="status-badge ${p.ativo ? "active-status" : "inactive-status"}">
                Status: ${p.ativo ? "Ativo ✅" : "Desativado ❌"}
            </p>
            
            <div class="button-group">
                <button class="btn-edit" onclick="editarProduto(${p.id_produto}, ${p.preco}, ${p.estoque})">
                    Editar
                </button>
                <button class="btn-toggle-active" onclick="toggleAtivo(${p.id_produto}, ${p.ativo})">
                    ${p.ativo ? "Desativar" : "Ativar"}
                </button>
            </div>
            <button class="btn-delete" onclick="excluirProduto(${p.id_produto})">
                Excluir
            </button>
        </div>
      </div>
    `;
  });
}

async function editarProduto(id, preco, estoque) {
  try {
    // 1. Obter dados atuais do produto
    const currentProduct = await getProductDetails(id);

    // 2. Coletar novas informações
    const novoPreco = prompt("Novo preço:", preco);
    const novoEstoque = prompt("Novo estoque:", estoque);

    if (novoPreco === null || novoEstoque === null) return;

    // 3. Mesclar novos dados com os dados existentes
    const body = {
        // Mantém todos os campos existentes
        nome: currentProduct.nome, 
        descricao: currentProduct.descricao, 
        ativo: currentProduct.ativo,
        // Aplica as alterações de preço e estoque
        preco: parseFloat(novoPreco),
        estoque: parseInt(novoEstoque, 10),
    };

    const res = await fetch(`${API}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
        alert("Produto editado com sucesso!");
        carregarProdutos();
    } else {
        const data = await res.json();
        throw new Error(data.message || "Erro desconhecido ao editar produto.");
    }

  } catch (err) {
    alert("Erro: " + err.message);
  }
}

async function toggleAtivo(id, ativo) {
    try {
        // 1. Obter dados atuais do produto
        const currentProduct = await getProductDetails(id);

        // 2. Mesclar novos dados (apenas o 'ativo' muda)
        const body = {
            // Mantém todos os campos existentes
            nome: currentProduct.nome, 
            descricao: currentProduct.descricao, 
            preco: currentProduct.preco, 
            estoque: currentProduct.estoque,
            // Aplica a alteração de status
            ativo: !ativo,
        };

        const res = await fetch(`${API}/products/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            alert("Status atualizado com sucesso!");
            carregarProdutos();
        } else {
            const data = await res.json();
            throw new Error(data.message || "Erro desconhecido ao alterar status.");
        }

    } catch (err) {
        alert("Erro: " + err.message);
    }
}

async function excluirProduto(id) {
  // A mensagem agora reflete o Soft Delete, que é o que realmente acontece.
  if (!confirm("Tem certeza que deseja DESATIVAR e remover este produto da vitrine? (Recomendado para evitar erros 500).")) return;

  try {
    // 1. Obter dados atuais do produto (função que já deve estar no seu admin.js)
    const currentProduct = await getProductDetails(id);

    // 2. Preparar o corpo da requisição para o Soft Delete
    const body = {
        // Mantém todos os campos existentes
        nome: currentProduct.nome, 
        descricao: currentProduct.descricao, 
        preco: currentProduct.preco, 
        estoque: currentProduct.estoque,
        // Altera o status para FALSE (Soft Delete)
        ativo: false,
    };

    // 3. Enviar PUT para desativar o produto
    const res = await fetch(`${API}/products/${id}`, {
        method: "PUT", 
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
        },
        body: JSON.stringify(body),
    });

    if (res.ok) {
        alert("Produto desativado (removido da vitrine) com sucesso!");
        carregarProdutos();
    } else {
        const data = await res.json();
        throw new Error(data.message || "Erro desconhecido ao desativar produto.");
    }

  } catch (err) {
    alert("Erro: " + err.message);
  }
}

async function adicionarProduto() {
    const nome = prompt("Nome do Produto:");
    if (!nome) return;

    const descricao = prompt("Descrição (opcional):", "");
    const preco = prompt("Preço (R$):");
    if (!preco || isNaN(parseFloat(preco))) {
        alert("Preço inválido.");
        return;
    }

    const estoque = prompt("Estoque Inicial:");
    if (!estoque || isNaN(parseInt(estoque, 10))) {
        alert("Estoque inválido.");
        return;
    }

    const body = {
        nome,
        descricao,
        preco: parseFloat(preco),
        estoque: parseInt(estoque, 10),
        // Novo produto deve ser criado como ativo (TRUE) por padrão
    };

    try {
        const res = await fetch(`${API}/products`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            alert("Produto cadastrado com sucesso!");
            carregarProdutos(); // Recarrega a lista para mostrar o novo item
        } else {
            const data = await res.json();
            throw new Error(data.message || "Erro desconhecido ao cadastrar.");
        }
    } catch (err) {
        alert("Erro no cadastro: " + err.message);
    }
}

//================== PEDIDOS ==================//
async function carregarPedidos() {
  const res = await fetch(`${API}/orders/admin/all`, {
    headers: { Authorization: "Bearer " + token },
  });

  const pedidos = await res.json();
  const container = document.getElementById("lista-pedidos");
  container.innerHTML = ""; // Limpa o container

  pedidos.forEach(p => {
    // Determina a classe do badge de status
    let statusClass = p.status.toLowerCase().replace(/ /g, '-'); // ex: 'em-preparo'
    
    container.innerHTML += `
      <div class="card order-card">
        <h4>Pedido #${p.id_pedido}</h4>
        
        <div class="card-info">
            <p>Cliente: <strong>${p.cliente}</strong></p>
            <p>Endereço: 
                ${p.cliente_endereco || 'Endereço não encontrado'}
            </p>
        </div>

        <div class="card-footer">
            <p class="status-badge order-status ${statusClass}">
                Status Atual: ${p.status}
            </p>

            <label for="status-select-${p.id_pedido}">Alterar Status:</label>
            <select id="status-select-${p.id_pedido}" onchange="updateStatus(${p.id_pedido}, this.value)">
                <option value="Em preparo" ${p.status=="Em preparo"?"selected":""}>Em preparo</option>
                <option value="A caminho" ${p.status=="A caminho"?"selected":""}>A caminho</option>
                <option value="Entregue" ${p.status=="Entregue"?"selected":""}>Entregue</option>
            </select>
        </div>
      </div>
    `;
  });
}

async function updateStatus(id, status) {
  // A lógica de PUT para o backend (API) está correta
  await fetch(`${API}/orders/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ status }),
  });

  // CORREÇÃO: Remova o 'alert' e chame a função de carregamento
  // Isso fará com que os dados sejam buscados novamente, incluindo o status atualizado.
  carregarPedidos(); 
}

// Inicialização do painel
carregarProdutos();
carregarPedidos();

document.getElementById("btn-add-product").addEventListener("click", adicionarProduto);