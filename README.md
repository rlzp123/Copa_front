# Mercado da Copa — App (Front)

App web moderna para o Mercado da Copa, construída em **React + Vite** e publicada como **PWA** (instalável no celular/computador e funcional offline).

## O que tem

- **Catálogo** com busca, filtros (categoria, preço, ordenação) e detalhe do produto
- **Leilão ao vivo** simulado em itens raros
- **Carrinho** com calculadora de frete e **checkout em etapas** (entrega → pagamento → confirmação)
- **Autenticação** (login/registro) com sessão via JWT e **fallback offline** no localStorage
- **Vendas**: publique seus itens na vitrine (com upload de imagem)
- **Trocas**: propostas de troca com status e **chat de conversa**
- **Avaliações**, **favoritos**, **notificações** e **radar de pessoas próximas**
- **PWA**: manifest, service worker, ícones e offline-first
- **Design**: tema escuro verde/amarelo com a fonte Qatar 2022 da versão original

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:5173
```

A API é acessada via `/api`. Em dev, o Vite faz o proxy para `http://localhost:3000` (o `Copa_back`).  basta rodar o backend em outra janela:

```bash
cd Copa_back && npm install && npm start   # http://localhost:3000
```

**Sem backend?** Não tem problema: o app cai no catálogo local + localStorage e continua 100% funcional.

## Configurar a URL da API (produção)

No Vercel (ou qualquer ambiente), defina a variável de ambiente:

```
VITE_API_URL=https://copa-back-xi.vercel.app/api
```

## Deploy no Vercel

1. Importe este repositório no Vercel.
2. Em **Settings → Environment Variables**, adicione `VITE_API_URL` com a URL pública da API (ex: `https://copa-back-xi.vercel.app/api`).
3. Publique. O build já gera o `dist/` com o service worker do PWA.

## Estrutura

```
src/
├── components/   # Header, CartDrawer, ProductCard, Modal, Intro, Toasts
├── context/      # AppContext (estado global: auth, carrinho, vendas, trocas...)
├── lib/          # api.js (chamadas + fallback), storage.js, format.js, catalogo.js
├── pages/        # Home, Catalogo, Produto, Carrinho, Checkout, Login, Register,
│                 # Perfil, Vendas, Trocas, ChatTroca, Avaliacoes, Notificacoes, Radar
└── styles/       # global.css (design system)
```

## Observação

Esta app é o **front reconstruído**. Os dados do catálogo e a autenticação podem vir do backend (`Copa_back`) ou do localStorage quando o backend estiver indisponível — o app funciona em ambos os cenários.
