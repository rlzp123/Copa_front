// Catálogo local (fallback offline). Espelha o catálogo original da versão em HTML/JS.
// Quando o backend responde, os dados da API sobrescrevem estes.

export const catalogoLocal = [
  { id: 1, nome: 'Camisa Brasil 1970', desc: 'Relíquia da seleção tricampeã mundial, inspirada no esquadrão de Pelé.', preco: 249.90, estoque: 4, categoria: 'Camisas', condicao: 'Muito boa', origem: 'Acervo brasileiro, 1970', img: '/img-vendas/camisa_1970_Brasil.jpg' },
  { id: 2, nome: 'Camisa Holanda 1988', desc: 'Clássico laranja da "Laranja Mecânica", para colecionadores.', preco: 189.90, estoque: 3, categoria: 'Camisas', condicao: 'Boa', origem: 'Coleção europeia, 1988', img: '/img-vendas/camisa_1988_Holanda.jpg' },
  { id: 3, nome: 'Bola Retrô de Couro 1930', desc: 'Réplica costurada à mão da primeira bola de Copa do Mundo.', preco: 159.90, estoque: 5, categoria: 'Bolas', condicao: 'Restaurada', origem: 'Acervo de partidas históricas', img: '/img-vendas/bola_retro.jpg' },
  { id: 4, nome: 'Medalha Histórica', desc: 'Miniatura de metal dourado para sua coleção de conquistas.', preco: 79.90, estoque: 8, categoria: 'Colecionáveis', condicao: 'Excelente', origem: 'Edição comemorativa da Copa', img: '/img-vendas/Medalha_Historica.jpg' },
  { id: 5, nome: 'Luva de Goleiro Clássica', desc: 'Inspirada nas grandes defesas dos anos 80, com palma de látex sintético.', preco: 119.90, estoque: 2, categoria: 'Equipamentos', condicao: 'Usada, conservada', origem: 'Acervo de futebol nacional', img: '/img-vendas/luva.webp' },
  { id: 6, nome: 'Chuteira do R9 (2002)', desc: 'Design inspirado no Fenômeno e no pentacampeonato no Japão/Coreia.', preco: 299.90, estoque: 1, categoria: 'Equipamentos', condicao: 'Muito boa', origem: 'Coleção especial do futebol brasileiro', img: '/img-vendas/chuteira_r9.jpg' },
  { id: 7, nome: 'Cachecol da Copa', desc: 'Acessório de lã dupla face para torcer em qualquer estádio.', preco: 69.90, estoque: 6, categoria: 'Acessórios', condicao: 'Novo', origem: 'Linha oficial de torcedor', img: '/img-vendas/cachecol.webp' },
  { id: 8, nome: 'Funko Pop Futebol', desc: 'Ícone do futebol em formato Funko para sua estante.', preco: 99.90, estoque: 3, categoria: 'Colecionáveis', condicao: 'Novo', origem: 'Edição licenciada de colecionador', img: '/img-vendas/funkopop.webp' },
  { id: 9, nome: 'Boné Canarinho Clássico', desc: 'Boné Brasil canarinho com estampa de alta qualidade e tecido respirável.', preco: 65.00, estoque: 15, categoria: 'Acessórios', condicao: 'Novo', origem: 'Linha oficial de torcedor', img: '/img-vendas/bone_canarinho.webp' },
  { id: 10, nome: 'Casaco Copa 94', desc: 'Casaco de viagem da comissão técnica da seleção tetracampeã nos EUA.', preco: 280.00, estoque: 2, categoria: 'Acessórios', condicao: 'Muito boa', origem: 'Acervo nacional, Copa de 1994', img: '/img-vendas/casaco_94.jpg' },
  { id: 11, nome: 'Camisa Argentina 1986', desc: 'Manto listrado celeste do título eterno de Maradona no México.', preco: 360.00, estoque: 4, categoria: 'Camisas', condicao: 'Restaurada', origem: 'Colecionador argentino, 1986', img: '/img-vendas/argentina.webp' },
  { id: 12, nome: 'Camisa Alemanha 1990', desc: 'Design geométrico icônico da Alemanha Ocidental campeã na Itália.', preco: 340.00, estoque: 3, categoria: 'Camisas', condicao: 'Excelente', origem: 'Acervo europeio, Copa de 1990', img: '/img-vendas/alemanha.webp' },
  { id: 13, nome: 'Camisa França 1998', desc: 'A faixa vermelha no peito da primeira conquista francesa liderada por Zidane.', preco: 310.00, estoque: 2, categoria: 'Camisas', condicao: 'Muito boa', origem: 'Europa, Copa de 1998', img: '/img-vendas/franca.jpeg' },
  { id: 14, nome: 'Camisa Holanda 1974', desc: 'O manto da Laranja Mecânica liderada por Cruyff. Tecido premium retrô.', preco: 320.00, estoque: 3, categoria: 'Camisas', condicao: 'Boa', origem: 'Coleção europeia, 1974', img: '/img-vendas/camisa_holanda.webp' },
  { id: 15, nome: 'Bandeira Oficial do Brasil', desc: 'Bandeira gigante em poliéster reforçado para apoiar a seleção no estádio.', preco: 55.00, estoque: 30, categoria: 'Acessórios', condicao: 'Novo', origem: 'Linha oficial de torcedor', img: '/img-vendas/bandeira.webp' },
  { id: 16, nome: 'Álbum Completo - Copa 2014', desc: 'Álbum completo, todas as figurinhas coladas, capa dura.', preco: 1700.00, estoque: 7, categoria: 'Colecionáveis', condicao: 'Usada, conservada', origem: 'Colecionador local, Copa de 2014', img: '/img-vendas/album.webp' },
  { id: 17, nome: 'Ingresso emoldurado 1950', desc: 'Réplica emoldurada do bilhete oficial do Maracanazo da Copa de 50.', preco: 2550.00, estoque: 1, categoria: 'Colecionáveis', condicao: 'Restaurado', origem: 'Museu do Futebol, Copa de 1950', img: '/img-vendas/ingresso.jpg' },
  { id: 18, nome: 'Livro Histórico das Copas', desc: 'Enciclopédia ilustrada com todos os dados e fotos desde 1930.', preco: 75.00, estoque: 9, categoria: 'Colecionáveis', condicao: 'Novo', origem: 'Edição ilustrada', img: '/img-vendas/historia.webp' },
  { id: 19, nome: 'Flâmula da Final 1958', desc: 'Flâmula decorativa em cetim celebrando o primeiro título mundial do Brasil.', preco: 200.00, estoque: 10, categoria: 'Colecionáveis', condicao: 'Excelente', origem: 'Suécia, Copa de 1958', img: '/img-vendas/flamula.png' },
  { id: 20, nome: 'Meião Oficial Amarelo', desc: 'Meião de alta performance com amortecimento anatômico.', preco: 45.00, estoque: 25, categoria: 'Equipamentos', condicao: 'Novo', origem: 'Linha oficial de torcedor', img: '/img-vendas/meia.avif' },
]

// Itens raros que entram em leilão no detalhe do produto
export const itensLeilao = new Set([17, 16])

export const categorias = ['Todas', 'Camisas', 'Bolas', 'Colecionáveis', 'Equipamentos', 'Acessórios']
