# ⚽ Mercado da Copa

Loja e comunidade de colecionadores de futebol: um **protótipo front-end** (HTML, CSS e
JavaScript puros, sem build) onde é possível explorar um catálogo de camisas, bolas,
medalhas e relíquias das Copas do Mundo, montar um carrinho, publicar anúncios, propor
trocas com outros torcedores e acompanhar pedidos em um quadro kanban.

> **Protótipo acadêmico.** Nenhuma compra real é processada. Contas, favoritos,
> anúncios, trocas, avaliações e pedidos ficam salvos no `localStorage` do navegador.
> As imagens dos produtos são ilustrativas (geradas por IA).

## Como rodar

Não há dependências nem etapa de build. Basta servir a pasta:

```bash
# opção 1 — Node
npx serve .

# opção 2 — Python
python3 -m http.server 8000
```

Depois abra `http://localhost:8000` (ou a porta indicada). Como o projeto usa `localStorage`
e APIs opcionais, abrir o `index.html` direto pelo `file://` também funciona.

### Backend (opcional)

O arquivo `script.js` procura uma API em `http://localhost:3000/api`
(`POST /login`, `POST /register`, `GET /produtos`, `GET /pedidos/:usuario`, `POST /pedidos`,
`GET /pessoas`). **A loja funciona 100% sem ela**: quando a API não responde, o catálogo
local (`catalogo.js`) e o `localStorage` assumem automaticamente.

## Funcionalidades

| Área | O que faz |
| --- | --- |
| Entrada | Abertura em vídeo (com botão de pular e carregamento visível), cadastro e login (API ou conta local) |
| Vitrine | Busca, filtros por seleção (chips), categoria, edição da Copa, tamanho e condição, faixa de preço, ordenação e contador de resultados |
| Produto | Modal com preço, estoque, condição, origem, selo de autenticidade e avaliações por estrelas |
| Carrinho | Gaveta lateral com quantidades, subtotal, frete grátis acima de R$ 200, 10% de desconto acima de R$ 300 e contador no ícone |
| Vender | Publicação de anúncios com prévia de imagem |
| Trocas | Radar de colecionadores, propostas de troca e chat por proposta |
| Pedidos | Kanban com etapas (analisando, embalando, fechado) e avaliação do vendedor |
| Perfil | Nome de exibição, e-mail, avatares de craques, troca de senha e reputação |
| Extras | Favoritos, notificações (inclusive alerta de mudança de preço) e avisos flutuantes (toasts) |

## Estrutura

```
index.html            marcação da aplicação (telas de entrada + 5 abas)
style.css             estilo base (identidade visual, cursores personalizados)
store-layout.css      camada visual inspirada no letreiro de mercado
ui-polish.css         camada de polimento: tipografia, profundidade, estados e responsividade
catalogo.js           catálogo local dos produtos (fallback da API)
script.js             regras da loja: catálogo, carrinho, trocas, pedidos, perfil
accessibility.js      teclado nos itens de menu e avatares
ui-enhancements.js    experiência: toasts, foco em modais, animações, vídeos sob demanda
fontes/               fonte Qatar 2022 (usada no logotipo e nos títulos)
img-vendas/           fotos dos produtos
```

## Acessibilidade e desempenho

- Todos os modais prendem o foco, fecham com `Esc` e devolvem o foco ao elemento de origem.
- Formulários com rótulos/`aria-label`, avisos com `role="status"`/`alert` e foco visível consistente.
- Atalhos de teclado: `/` foca a busca e `C` abre o carrinho.
- Vídeos carregam sob demanda (o fundo do login só é baixado quando a tela aparece) e a
  abertura se fecha sozinha se o arquivo não carregar.
- Animações de entrada são ignoradas quando o sistema pede `prefers-reduced-motion`.
- Imagens com `loading="lazy"` e troca automática por uma imagem de reserva quando o arquivo
  do produto não existe.

## Notas de desenvolvimento

- `ui-polish.css` e `ui-enhancements.js` são camadas **aditivas**: podem ser removidas sem
  quebrar nenhuma regra de negócio.
- Ao migrar para um backend real, ajuste `API_URL` no topo de `script.js`.
- Os vídeos (`img/abertura.mp4` com ~9 MB e `img/videoplayback.mp4` com ~5,6 MB) ainda são
  pesados; o ideal é recomprimi-los (por exemplo, com `ffmpeg -crf 28 -preset slow`) antes de publicar.
