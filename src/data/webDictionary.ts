export type DictionaryLanguage = 'html' | 'css' | 'js';

export interface DictionarySpecItem {
  name: string;
  detail: string;
}

export interface DictionaryEntry {
  id: string;
  term: string;
  sortKey: string;
  language: DictionaryLanguage;
  category: string;
  summary: string;
  description: string;
  syntax: string;
  specsLabel: string;
  specs: DictionarySpecItem[];
  notes: string[];
  example: string;
}

type RawDictionaryEntry = Omit<DictionaryEntry, 'id' | 'sortKey'> & {
  sortKey?: string;
};

function computeSortKey(term: string): string {
  return term
    .replace(/^[<>/!:@.\-\s]+/, '')
    .replace(/[<>()[\]`]/g, '')
    .trim()
    .toLowerCase();
}

const RAW_ENTRIES: RawDictionaryEntry[] = [
  // ================= HTML =================
  {
    term: '<a>',
    language: 'html',
    category: 'Tag de link e navegação',
    summary: 'Cria um hiperlink para outra página, arquivo, seção da página ou endereço de e-mail.',
    description:
      'A tag <a> (anchor) transforma texto, imagens ou blocos inteiros em links clicáveis. O destino é definido pelo atributo href. Também pode disparar downloads de arquivos ou rolar até um elemento com id específico usando #id.',
    syntax: '<a href="url" target="_blank" rel="noopener noreferrer">Texto do link</a>',
    specsLabel: 'Atributos principais',
    specs: [
      {name: 'href', detail: 'URL de destino, âncora interna (#secao), mailto: ou tel:.'},
      {name: 'target', detail: 'Define onde abrir o link (_self na mesma aba, _blank em nova aba).'},
      {name: 'rel', detail: 'Relação com o destino. Use "noopener noreferrer" com target="_blank".'},
      {name: 'download', detail: 'Indica ao navegador para baixar o arquivo em vez de navegar.'},
    ],
    notes: [
      'Evite textos genéricos como "clique aqui"; descreva o destino para melhorar acessibilidade.',
      'Links sem atributo href não são focáveis pelo teclado nem funcionam como links reais.',
    ],
    example: `<nav>\n  <a href="#contato">Ir para contato</a>\n  <a href="https://exemplo.com" target="_blank" rel="noopener noreferrer">\n    Site externo\n  </a>\n</nav>`,
  },
  {
    term: '<article>',
    language: 'html',
    category: 'Tag semântica',
    summary: 'Representa um conteúdo independente e autocontido, como uma postagem ou notícia.',
    description:
      'A tag <article> delimita um bloco de conteúdo que faz sentido por conta própria e poderia ser distribuído separadamente (um artigo de blog, card de produto completo, comentário de usuário ou post em feed).',
    syntax: '<article>\n  <h2>Título</h2>\n  <p>Conteúdo...</p>\n</article>',
    specsLabel: 'Uso recomendado',
    specs: [
      {name: 'Cabeçalho interno', detail: 'Normalmente inclui um título (<h1> a <h6>) para identificar o artigo.'},
      {name: 'Aninhamento', detail: 'Um <article> pode conter outros <article> relacionados, como comentários.'},
    ],
    notes: [
      'Use <article> quando o conteúdo puder ser reaproveitado fora do contexto atual da página.',
      'Para agrupar seções temáticas de um mesmo conteúdo, prefira <section>.',
    ],
    example: `<article>\n  <header>\n    <h2>Guia rápido de CSS Grid</h2>\n    <time datetime="2026-05-10">10 de maio</time>\n  </header>\n  <p>Aprenda a criar layouts responsivos em poucas linhas.</p>\n</article>`,
  },
  {
    term: '<aside>',
    language: 'html',
    category: 'Tag semântica',
    summary: 'Define um conteúdo complementar ou lateral ao conteúdo principal da página.',
    description:
      'A tag <aside> marca informações tangencialmente relacionadas ao conteúdo principal, como barras laterais, caixas de notas, biografia do autor, glossários ou links relacionados.',
    syntax: '<aside>\n  <h3>Veja também</h3>\n</aside>',
    specsLabel: 'Características',
    specs: [
      {name: 'Função ARIA', detail: 'Possui papel implícito "complementary" para leitores de tela.'},
      {name: 'Posicionamento', detail: 'A aparência lateral depende do CSS; a tag define apenas o significado.'},
    ],
    notes: [
      'Não use <aside> apenas para estilizar uma coluna lateral se o conteúdo for principal.',
    ],
    example: `<main>\n  <p>Conteúdo principal do tutorial.</p>\n  <aside>\n    <strong>Dica:</strong> use Ctrl + Enter para executar rápido.\n  </aside>\n</main>`,
  },
  {
    term: '<audio>',
    language: 'html',
    category: 'Tag de mídia',
    summary: 'Incorpora um reprodutor de áudio diretamente na página HTML.',
    description:
      'A tag <audio> permite tocar arquivos sonoros (MP3, OGG, WAV) com controles nativos do navegador ou controlados via JavaScript usando a API HTMLMediaElement.',
    syntax: '<audio src="som.mp3" controls></audio>',
    specsLabel: 'Atributos principais',
    specs: [
      {name: 'src', detail: 'Caminho do arquivo de áudio.'},
      {name: 'controls', detail: 'Exibe os botões nativos de play, pausa, barra de progresso e volume.'},
      {name: 'autoplay / muted', detail: 'Navegadores exigem muted para reprodução automática.'},
      {name: 'loop', detail: 'Reinicia o áudio automaticamente ao terminar.'},
      {name: 'preload', detail: 'Define o pré-carregamento: "none", "metadata" ou "auto".'},
    ],
    notes: [
      'Você pode incluir várias tags <source> dentro de <audio> para oferecer formatos alternativos.',
    ],
    example: `<audio controls preload="metadata">\n  <source src="musica.mp3" type="audio/mpeg" />\n  Seu navegador não suporta áudio HTML5.\n</audio>`,
  },
  {
    term: '<blockquote>',
    language: 'html',
    category: 'Tag de texto',
    summary: 'Indica uma citação longa em bloco retirada de outra fonte.',
    description:
      'A tag <blockquote> representa um trecho citado de outro documento, livro ou autor. Por padrão, os navegadores aplicam um recuo lateral ao bloco.',
    syntax: '<blockquote cite="https://fonte.com">Texto citado</blockquote>',
    specsLabel: 'Atributos e tags associadas',
    specs: [
      {name: 'cite', detail: 'URL da fonte original da citação (não aparece visualmente na tela).'},
      {name: '<cite>', detail: 'Usada fora ou no rodapé da citação para nomear a obra ou autor.'},
    ],
    notes: [
      'Para citações curtas na mesma linha de um parágrafo, use a tag <q>.',
    ],
    example: `<figure>\n  <blockquote>\n    <p>A simplicidade é o último grau de sofisticação.</p>\n  </blockquote>\n  <figcaption>— <cite>Leonardo da Vinci</cite></figcaption>\n</figure>`,
  },
  {
    term: '<body>',
    language: 'html',
    category: 'Tag estrutural',
    summary: 'Contém todo o conteúdo visível e interativo de um documento HTML.',
    description:
      'Tudo o que o usuário vê ou interage na página (textos, imagens, botões, formulários, scripts no final da página) fica dentro da tag <body>. Deve existir apenas um <body> por documento HTML.',
    syntax: '<body>\n  <!-- Conteúdo visível -->\n</body>',
    specsLabel: 'Regras estruturais',
    specs: [
      {name: 'Posição', detail: 'Vem logo após o fechamento de </head>, dentro de <html>.'},
      {name: 'Estilização', detail: 'Costuma receber fonte padrão, cor de fundo e reset de margin no CSS.'},
    ],
    notes: [
      'Navegadores aplicam margin: 8px por padrão no <body>; muitos projetos redefinem para margin: 0.',
    ],
    example: `<!DOCTYPE html>\n<html lang="pt-BR">\n  <head><title>Página</title></head>\n  <body>\n    <h1>Olá, mundo!</h1>\n  </body>\n</html>`,
  },
  {
    term: '<br>',
    language: 'html',
    category: 'Tag de texto',
    summary: 'Insere uma quebra de linha simples dentro de um texto.',
    description:
      'A tag <br> (line break) força o texto seguinte a continuar na linha de baixo sem iniciar um novo parágrafo. É uma tag vazia (void), ou seja, não possui tag de fechamento.',
    syntax: 'Linha 1<br>Linha 2',
    specsLabel: 'Comportamento',
    specs: [
      {name: 'Tag vazia', detail: 'Não escreva </br>; use <br> ou <br />.'},
      {name: 'Uso correto', detail: 'Endereços postais, poemas e quebras reais dentro de um bloco.'},
    ],
    notes: [
      'Não use vários <br> seguidos para criar espaçamento vertical; use margin ou padding no CSS.',
    ],
    example: `<p>\n  Av. Paulista, 1000<br>\n  São Paulo — SP\n</p>`,
  },
  {
    term: '<button>',
    language: 'html',
    category: 'Tag de formulário e ação',
    summary: 'Cria um botão clicável acessível para disparar ações ou enviar formulários.',
    description:
      'A tag <button> cria botões interativos que respondem naturalmente a clique, teclado (Enter/Espaço) e leitores de tela. Pode conter texto, ícones SVG ou ambos.',
    syntax: '<button type="button">Clique aqui</button>',
    specsLabel: 'Atributos principais',
    specs: [
      {name: 'type="button"', detail: 'Botão comum controlado por JavaScript (não envia formulário).'},
      {name: 'type="submit"', detail: 'Envia o formulário pai (é o padrão se type for omitido!).'},
      {name: 'type="reset"', detail: 'Restaura os campos do formulário para seus valores iniciais.'},
      {name: 'disabled', detail: 'Impede cliques e foco no botão enquanto estiver presente.'},
    ],
    notes: [
      'Sempre defina type="button" quando o botão não for enviar um formulário, evitando recarregamentos acidentais.',
      'Prefira <button> para ações na página e <a> para navegar para outra URL.',
    ],
    example: `<button type="button" id="btn-salvar">\n  Salvar alterações\n</button>`,
  },
  {
    term: '<canvas>',
    language: 'html',
    category: 'Tag gráfica',
    summary: 'Área de desenho bitmap para gráficos 2D, jogos, animações e WebGL via JavaScript.',
    description:
      'A tag <canvas> cria uma tela em branco com largura e altura configuráveis onde o JavaScript desenha formas, textos, imagens e animações quadro a quadro usando getContext("2d") ou "webgl".',
    syntax: '<canvas id="tela" width="400" height="250"></canvas>',
    specsLabel: 'Atributos e métodos',
    specs: [
      {name: 'width / height', detail: 'Resolução interna de pixels da tela (padrão: 300x150).'},
      {name: 'getContext("2d")', detail: 'Retorna o pincel 2D no JavaScript para desenhar retângulos, arcos e linhas.'},
    ],
    notes: [
      'Defina width e height pelos atributos HTML para evitar distorção do desenho; use CSS apenas se quiser escalar mantendo proporção.',
    ],
    example: `<canvas id="quadro" width="240" height="120"></canvas>\n<script>\n  const ctx = document.getElementById('quadro').getContext('2d');\n  ctx.fillStyle = '#2563eb';\n  ctx.fillRect(20, 20, 100, 60);\n</script>`,
  },
  {
    term: '<code>',
    language: 'html',
    category: 'Tag de texto',
    summary: 'Marca um trecho curto de código de programação no meio do texto.',
    description:
      'A tag <code> exibe palavras-chave, comandos ou nomes de variáveis com fonte monoespaçada para diferenciá-los visualmente do texto comum.',
    syntax: '<p>Use <code>console.log()</code> para depurar.</p>',
    specsLabel: 'Combinação comum',
    specs: [
      {name: 'Com <pre>', detail: 'Para blocos inteiros com quebras de linha e indentação preservadas, envolva <code> dentro de <pre>.'},
    ],
    notes: [
      'Caracteres como < e > dentro de <code> devem ser escritos como &lt; e &gt; para não virarem tags HTML.',
    ],
    example: `<pre><code>const total = 10 + 5;\nconsole.log(total);</code></pre>`,
  },
  {
    term: '<details>',
    language: 'html',
    category: 'Tag interativa',
    summary: 'Cria um bloco expansível (sanfona/acordeão) nativo sem precisar de JavaScript.',
    description:
      'A tag <details> oculta detalhes adicionais até o usuário clicar no título definido pela tag <summary>. Funciona nativamente em todos os navegadores modernos com suporte a teclado.',
    syntax: '<details>\n  <summary>Ver detalhes</summary>\n  <p>Conteúdo oculto...</p>\n</details>',
    specsLabel: 'Atributos principais',
    specs: [
      {name: 'open', detail: 'Quando presente, o bloco já inicia aberto.'},
      {name: 'name', detail: 'Agrupa vários <details> com o mesmo name para que apenas um fique aberto por vez.'},
    ],
    notes: [
      'O primeiro filho direto de <details> deve ser <summary>.',
    ],
    example: `<details>\n  <summary>Como funciona o pagamento?</summary>\n  <p>Aceitamos cartão, Pix e boleto.</p>\n</details>`,
  },
  {
    term: '<div>',
    language: 'html',
    category: 'Tag estrutural',
    summary: 'Contêiner genérico em bloco usado para agrupar elementos e aplicar estilos ou layout.',
    description:
      'A tag <div> (division) não possui significado semântico próprio. Ela serve para agrupar elementos quando nenhuma tag semântica (<section>, <article>, <nav>, <header>) é adequada, especialmente para layouts com Flexbox ou Grid.',
    syntax: '<div class="cartao">...</div>',
    specsLabel: 'Comportamento padrão',
    specs: [
      {name: 'display', detail: 'Block (ocupa 100% da largura disponível e começa em nova linha).'},
      {name: 'Semântica', detail: 'Neutra; não comunica papel especial para leitores de tela.'},
    ],
    notes: [
      'Evite "divite" (excesso de divs); dê preferência a tags semânticas quando o bloco tiver papel claro.',
    ],
    example: `<div class="grade">\n  <div class="coluna">Item 1</div>\n  <div class="coluna">Item 2</div>\n</div>`,
  },
  {
    term: '<!DOCTYPE html>',
    language: 'html',
    category: 'Declaração do documento',
    summary: 'Declara ao navegador que o arquivo usa o padrão moderno HTML5.',
    description:
      'Deve ser sempre a primeira linha de um arquivo HTML completo. Sem essa declaração, alguns navegadores entram no modo de compatibilidade antigo (quirks mode), alterando medidas de box-model e estilos.',
    syntax: '<!DOCTYPE html>',
    specsLabel: 'Regras',
    specs: [
      {name: 'Não é uma tag', detail: 'É uma instrução de parser, portanto não tem fechamento.'},
      {name: 'Case-insensitive', detail: 'Funciona em maiúsculas ou minúsculas, mas <!DOCTYPE html> é a convenção.'},
    ],
    notes: [
      'Em editores rápidos, o HTML dentro do body funciona sozinho, mas ao exportar um arquivo completo ela é essencial.',
    ],
    example: `<!DOCTYPE html>\n<html lang="pt-BR">\n  <head>\n    <meta charset="UTF-8" />\n    <title>Meu site</title>\n  </head>\n  <body></body>\n</html>`,
  },
  {
    term: '<em>',
    language: 'html',
    category: 'Tag de texto',
    summary: 'Aplica ênfase semântica a uma palavra ou frase (geralmente exibida em itálico).',
    description:
      'A tag <em> (emphasis) muda a entonação da leitura em leitores de tela, destacando uma palavra importante na frase. Visualmente aparece em itálico por padrão.',
    syntax: '<p>Você <em>precisa</em> salvar antes de sair.</p>',
    specsLabel: 'Comparação',
    specs: [
      {name: '<em> vs <i>', detail: '<em> indica ênfase de significado; <i> serve para termos técnicos, estrangeirismos ou voz alternativa.'},
    ],
    notes: [
      'Pode ser aninhada para indicar níveis maiores de ênfase.',
    ],
    example: `<p>Este campo é <em>obrigatório</em> para continuar.</p>`,
  },
  {
    term: '<footer>',
    language: 'html',
    category: 'Tag semântica',
    summary: 'Define o rodapé de uma página ou de uma seção/artigo específico.',
    description:
      'A tag <footer> contém informações de encerramento: direitos autorais, links de contato, autoria, data de publicação ou navegação secundária.',
    syntax: '<footer>© 2026 Minha Empresa</footer>',
    specsLabel: 'Uso',
    specs: [
      {name: 'Escopo', detail: 'Pode estar no final do <body> ou no final de um <article> / <section>.'},
    ],
    notes: [
      'Pode haver mais de um <footer> na mesma página se pertencerem a artigos diferentes.',
    ],
    example: `<footer>\n  <p>Feito com HTML, CSS e JS.</p>\n  <a href="#topo">Voltar ao topo</a>\n</footer>`,
  },
  {
    term: '<form>',
    language: 'html',
    category: 'Tag de formulário',
    summary: 'Agrupa campos de entrada para coletar e enviar dados do usuário.',
    description:
      'A tag <form> envolve inputs, selects e botões de envio. Ela habilita envio ao pressionar Enter nos campos, validação nativa HTML5 e o evento "submit" no JavaScript.',
    syntax: '<form action="/enviar" method="post">...</form>',
    specsLabel: 'Atributos principais',
    specs: [
      {name: 'action', detail: 'URL para onde os dados serão enviados no envio tradicional.'},
      {name: 'method', detail: 'Método HTTP ("get" coloca na URL; "post" envia no corpo da requisição).'},
      {name: 'novalidate', detail: 'Desativa os balões de validação automática do navegador.'},
    ],
    notes: [
      'Em apps JavaScript, use event.preventDefault() no evento submit para tratar os dados sem recarregar a página.',
    ],
    example: `<form id="cadastro">\n  <label for="email">E-mail</label>\n  <input id="email" type="email" required />\n  <button type="submit">Enviar</button>\n</form>`,
  },
  {
    term: '<h1> até <h6>',
    language: 'html',
    category: 'Tag de título',
    summary: 'Definem a hierarquia de títulos e subtítulos do documento, do nível 1 ao 6.',
    description:
      '<h1> representa o título principal e mais importante da página, <h2> representa seções principais, <h3> subseções e assim por diante. Motores de busca e leitores de tela usam essa árvore para navegar pelo documento.',
    syntax: '<h1>Título Principal</h1>\n<h2>Subtítulo</h2>',
    specsLabel: 'Boas práticas',
    specs: [
      {name: 'Hierarquia', detail: 'Siga a ordem lógica (não pule de <h1> direto para <h4> apenas pelo tamanho da fonte).'},
      {name: 'Tamanho visual', detail: 'Use CSS (font-size) para ajustar o tamanho visual sem quebrar a semântica.'},
    ],
    notes: [
      'Recomenda-se ter apenas um <h1> principal por página.',
    ],
    example: `<main>\n  <h1>Documentação</h1>\n  <section>\n    <h2>Instalação</h2>\n    <h3>Requisitos</h3>\n  </section>\n</main>`,
  },
  {
    term: '<head>',
    language: 'html',
    category: 'Tag estrutural',
    summary: 'Armazena metadados, título da aba e links para folhas de estilo e fontes.',
    description:
      'A tag <head> fica antes do <body> e não exibe elementos na área da página. Ela configura codificação de caracteres (<meta charset>), título da aba (<title>), responsividade (viewport), favicon e arquivos CSS (<link>).',
    syntax: '<head>\n  <meta charset="UTF-8" />\n  <title>Título</title>\n</head>',
    specsLabel: 'Tags permitidas dentro',
    specs: [
      {name: '<title>', detail: 'Define o nome exibido na aba do navegador.'},
      {name: '<meta>', detail: 'Charset, viewport mobile e descrição SEO.'},
      {name: '<link>', detail: 'Importa arquivos CSS externos ou ícones.'},
      {name: '<style> / <script>', detail: 'Estilos inline ou scripts de configuração.'},
    ],
    notes: [
      'Nunca coloque tags visuais como <div> ou <p> dentro do <head>.',
    ],
    example: `<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Minha Aplicação</title>\n</head>`,
  },
  {
    term: '<header>',
    language: 'html',
    category: 'Tag semântica',
    summary: 'Representa o cabeçalho introdutório da página ou de uma seção.',
    description:
      'A tag <header> agrupa elementos iniciais como logotipo, título da página, barra de busca ou menu de navegação (<nav>). Também pode ser usada no topo de um <article>.',
    syntax: '<header>\n  <h1>Minha Marca</h1>\n</header>',
    specsLabel: 'Regras',
    specs: [
      {name: 'Restrição', detail: 'Não coloque um <header> dentro de outro <header> ou de um <footer>.'},
    ],
    notes: [
      'Não confunda <header> (área visual de cabeçalho no <body>) com <head> (metadados invisíveis).',
    ],
    example: `<header>\n  <strong>Treks</strong>\n  <nav><a href="#recursos">Recursos</a></nav>\n</header>`,
  },
  {
    term: '<hr>',
    language: 'html',
    category: 'Tag estrutural',
    summary: 'Insere uma quebra temática entre parágrafos ou seções (linha divisória).',
    description:
      'A tag <hr> (horizontal rule) indica mudança de assunto ou cena no conteúdo. Visualmente desenha uma linha horizontal que pode ser estilizada via CSS.',
    syntax: '<hr>',
    specsLabel: 'Características',
    specs: [
      {name: 'Tag vazia', detail: 'Não usa </hr>. Pode ser estilizada com border e height no CSS.'},
    ],
    notes: [
      'Prefira CSS border-bottom se a linha for puramente decorativa sem separação temática.',
    ],
    example: `<p>Fim do primeiro capítulo.</p>\n<hr>\n<p>Início do segundo capítulo.</p>`,
  },
  {
    term: '<iframe>',
    language: 'html',
    category: 'Tag de incorporação',
    summary: 'Incorpora outro documento HTML ou página externa dentro da página atual.',
    description:
      'A tag <iframe> cria uma janela isolada (sandbox) capaz de exibir mapas, vídeos incorporados, documentos ou previews ao vivo sem misturar CSS e JavaScript com a página pai.',
    syntax: '<iframe src="url" title="Descrição"></iframe>',
    specsLabel: 'Atributos principais',
    specs: [
      {name: 'src / srcdoc', detail: 'URL externa ou código HTML direto em string.'},
      {name: 'title', detail: 'Obrigatório para acessibilidade descrevendo o conteúdo incorporado.'},
      {name: 'sandbox', detail: 'Restringe permissões (scripts, formulários, popups) por segurança.'},
      {name: 'loading="lazy"', detail: 'Só carrega o iframe quando o usuário rolar até perto dele.'},
    ],
    notes: [
      'Alguns sites bloqueiam exibição em iframe por segurança via cabeçalho X-Frame-Options.',
    ],
    example: `<iframe\n  src="https://example.com"\n  title="Exemplo incorporado"\n  width="100%"\n  height="300"\n></iframe>`,
  },
  {
    term: '<img>',
    language: 'html',
    category: 'Tag de mídia',
    summary: 'Exibe uma imagem na página HTML.',
    description:
      'A tag <img> é uma tag vazia que carrega e renderiza imagens (PNG, JPG, WebP, SVG, AVIF). O atributo alt fornece texto alternativo essencial para acessibilidade e quando a imagem falha.',
    syntax: '<img src="caminho.jpg" alt="Descrição da imagem" />',
    specsLabel: 'Atributos principais',
    specs: [
      {name: 'src', detail: 'URL ou caminho do arquivo de imagem.'},
      {name: 'alt', detail: 'Texto descritivo da imagem. Deixe alt="" apenas se for puramente decorativa.'},
      {name: 'width / height', detail: 'Evitam saltos de layout (CLS) enquanto a imagem carrega.'},
      {name: 'loading="lazy"', detail: 'Adia o carregamento de imagens fora da tela inicial.'},
    ],
    notes: [
      'Combine com CSS object-fit: cover para preencher cartões sem achatar a imagem.',
    ],
    example: `<img\n  src="foto.webp"\n  alt="Paisagem montanhosa ao amanhecer"\n  width="640"\n  height="360"\n  loading="lazy"\n/>`,
  },
  {
    term: '<input>',
    language: 'html',
    category: 'Tag de formulário',
    summary: 'Cria campos interativos para entrada de texto, números, datas, arquivos ou marcação.',
    description:
      'A tag <input> muda completamente de aparência e teclado virtual dependendo do atributo type. É o componente central de formulários na Web.',
    syntax: '<input type="text" name="usuario" placeholder="Digite aqui" />',
    specsLabel: 'Tipos mais comuns (type)',
    specs: [
      {name: 'text / email / password', detail: 'Texto comum, e-mail validado ou senha oculta.'},
      {name: 'number / range', detail: 'Entrada numérica ou barra deslizante (slider).'},
      {name: 'checkbox / radio', detail: 'Múltipla escolha ou escolha única dentro de um mesmo name.'},
      {name: 'date / color / file', detail: 'Seletor de data, seletor de cor ou envio de arquivo.'},
      {name: 'required / disabled / readonly', detail: 'Validação obrigatória, bloqueado ou somente leitura.'},
    ],
    notes: [
      'Sempre associe o <input> a uma tag <label for="id"> para facilitar o clique e acessibilidade.',
    ],
    example: `<label for="idade">Idade</label>\n<input id="idade" type="number" min="1" max="120" required />`,
  },
  {
    term: '<label>',
    language: 'html',
    category: 'Tag de formulário',
    summary: 'Associa um rótulo descritivo a um campo de formulário (<input>, <select>, <textarea>).',
    description:
      'Quando vinculado pelo atributo for (igual ao id do campo) ou envolvendo o campo, clicar no texto do <label> foca ou marca automaticamente o campo associado.',
    syntax: '<label for="nome">Nome completo</label>\n<input id="nome" type="text" />',
    specsLabel: 'Atributos',
    specs: [
      {name: 'for', detail: 'Deve corresponder exatamente ao id do controle de formulário.'},
    ],
    notes: [
      'Nunca substitua <label> apenas por placeholder; placeholders somem ao digitar.',
    ],
    example: `<label>\n  <input type="checkbox" name="termos" />\n  Aceito os termos de uso\n</label>`,
  },
  {
    term: '<li>',
    language: 'html',
    category: 'Tag de lista',
    summary: 'Representa um item individual dentro de uma lista ordenada (<ol>) ou não ordenada (<ul>).',
    description:
      'Cada ponto ou item numerado de uma lista deve ser envolvido em <li>. Pode conter texto, links, imagens e até outras listas aninhadas.',
    syntax: '<ul>\n  <li>Primeiro item</li>\n</ul>',
    specsLabel: 'Atributo em <ol>',
    specs: [
      {name: 'value', detail: 'Em listas <ol>, define um número específico para o item atual e os seguintes.'},
    ],
    notes: [
      'Use <li> apenas como filho direto de <ul>, <ol> ou <menu>.',
    ],
    example: `<ol>\n  <li>Abrir o editor</li>\n  <li>Escrever código</li>\n  <li>Executar projeto</li>\n</ol>`,
  },
  {
    term: '<link>',
    language: 'html',
    category: 'Tag de metadados',
    summary: 'Conecta o documento HTML a recursos externos, principalmente arquivos CSS e ícones.',
    description:
      'Inserida dentro do <head>, a tag vazia <link> informa ao navegador para baixar folhas de estilo externas, fontes da web ou ícones da aba (favicon).',
    syntax: '<link rel="stylesheet" href="estilos.css" />',
    specsLabel: 'Atributos principais',
    specs: [
      {name: 'rel', detail: 'Tipo de relação: "stylesheet", "icon", "preconnect", "canonical".'},
      {name: 'href', detail: 'Caminho ou URL do recurso.'},
    ],
    notes: [
      'Diferente de <a>, <link> não cria link clicável para o usuário; serve apenas para recursos do documento.',
    ],
    example: `<head>\n  <link rel="stylesheet" href="style.css" />\n  <link rel="icon" href="favicon.ico" />\n</head>`,
  },
  {
    term: '<main>',
    language: 'html',
    category: 'Tag semântica',
    summary: 'Delimita o conteúdo principal e exclusivo da página.',
    description:
      'A tag <main> ajuda tecnologias assistivas a pular direto para o conteúdo central, ignorando menus repetidos, barras laterais e rodapés.',
    syntax: '<main>\n  <h1>Conteúdo principal</h1>\n</main>',
    specsLabel: 'Regras',
    specs: [
      {name: 'Unicidade', detail: 'Deve existir apenas um <main> visível por página.'},
      {name: 'Independência', detail: 'Não coloque cabeçalho global, menu lateral ou rodapé dentro de <main>.'},
    ],
    notes: [
      'Excelente ponto de partida para centralizar o conteúdo principal com max-width no CSS.',
    ],
    example: `<header>Menu</header>\n<main>\n  <h1>Painel de controle</h1>\n</main>\n<footer>Rodapé</footer>`,
  },
  {
    term: '<meta>',
    language: 'html',
    category: 'Tag de metadados',
    summary: 'Fornece metadados estruturais sobre a página dentro do <head>.',
    description:
      'Tags <meta> definem a codificação de caracteres (UTF-8 para acentos), escala em celulares (viewport), descrição para buscadores e cartões de compartilhamento social.',
    syntax: '<meta charset="UTF-8" />',
    specsLabel: 'Metas essenciais',
    specs: [
      {name: 'charset="UTF-8"', detail: 'Garante exibição correta de acentos e símbolos.'},
      {name: 'name="viewport"', detail: 'Com content="width=device-width, initial-scale=1.0", torna o site responsivo no celular.'},
      {name: 'name="description"', detail: 'Resumo exibido nos resultados de pesquisa.'},
    ],
    notes: [
      'A tag <meta charset="UTF-8" /> deve aparecer nos primeiros bytes do <head>.',
    ],
    example: `<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <meta name="description" content="Editor rápido na web" />\n</head>`,
  },
  {
    term: '<nav>',
    language: 'html',
    category: 'Tag semântica',
    summary: 'Agrupa os links principais de navegação do site ou de uma área da página.',
    description:
      'A tag <nav> sinaliza blocos com links importantes de navegação (menu superior, menu lateral, paginação ou sumário).',
    syntax: '<nav aria-label="Principal">...</nav>',
    specsLabel: 'Boas práticas',
    specs: [
      {name: 'aria-label', detail: 'Quando houver mais de um <nav> na página, dê nomes diferentes a cada um.'},
    ],
    notes: [
      'Links isolados em rodapés de copyright não precisam obrigatoriamente de <nav>.',
    ],
    example: `<nav aria-label="Menu principal">\n  <a href="/">Início</a>\n  <a href="/sobre">Sobre</a>\n</nav>`,
  },
  {
    term: '<ol>',
    language: 'html',
    category: 'Tag de lista',
    summary: 'Cria uma lista ordenada onde a sequência numérica ou alfabética importa.',
    description:
      'Use <ol> (ordered list) para passos de receita, rankings, instruções numeradas ou índices ordenados. Os itens internos devem ser tags <li>.',
    syntax: '<ol>\n  <li>Passo 1</li>\n  <li>Passo 2</li>\n</ol>',
    specsLabel: 'Atributos',
    specs: [
      {name: 'start', detail: 'Número inicial da contagem (ex: start="5").'},
      {name: 'reversed', detail: 'Inverte a contagem de trás para frente.'},
      {name: 'type', detail: 'Estilo do marcador: "1", "a", "A", "i" ou "I".'},
    ],
    notes: [
      'Se a ordem dos itens não alterar o sentido, prefira <ul>.',
    ],
    example: `<ol type="1">\n  <li>Baixar arquivos</li>\n  <li>Configurar ambiente</li>\n</ol>`,
  },
  {
    term: '<p>',
    language: 'html',
    category: 'Tag de texto',
    summary: 'Define um parágrafo de texto.',
    description:
      'A tag <p> representa um bloco de texto corrido. Navegadores aplicam automaticamente margem superior e inferior para separar parágrafos consecutivos.',
    syntax: '<p>Este é um parágrafo de exemplo.</p>',
    specsLabel: 'Regras',
    specs: [
      {name: 'Conteúdo', detail: 'Deve conter apenas elementos inline (texto, <a>, <strong>, <em>, <span>), nunca outra tag de bloco como <div>.'},
    ],
    notes: [
      'Não deixe tags <p></p> vazias apenas para dar espaçamento.',
    ],
    example: `<p>Primeiro parágrafo explicando o assunto.</p>\n<p>Segundo parágrafo com detalhes adicionais.</p>`,
  },
  {
    term: '<script>',
    language: 'html',
    category: 'Tag de programação',
    summary: 'Incorpora ou carrega código JavaScript executável na página HTML.',
    description:
      'A tag <script> pode conter JavaScript inline ou importar um arquivo externo via atributo src. Controla o momento de carregamento com defer ou async.',
    syntax: '<script src="app.js" defer></script>',
    specsLabel: 'Atributos principais',
    specs: [
      {name: 'src', detail: 'URL do arquivo .js externo.'},
      {name: 'defer', detail: 'Baixa em paralelo e executa só depois de todo o HTML ser analisado, mantendo a ordem.'},
      {name: 'async', detail: 'Baixa em paralelo e executa assim que terminar o download (ordem não garantida).'},
      {name: 'type="module"', detail: 'Habilita import/export de módulos ES modernos (já funciona com defer automático).'},
    ],
    notes: [
      'Mesmo ao carregar arquivo externo via src, a tag <script> sempre exige fechamento </script>.',
    ],
    example: `<script type="module" src="main.js"></script>`,
  },
  {
    term: '<section>',
    language: 'html',
    category: 'Tag semântica',
    summary: 'Agrupa uma seção temática de conteúdo, normalmente acompanhada de um título.',
    description:
      'A tag <section> divide uma página ou artigo em capítulos lógicos (ex: "Recursos", "Planos", "Depoimentos").',
    syntax: '<section>\n  <h2>Recursos</h2>\n</section>',
    specsLabel: 'Quando usar',
    specs: [
      {name: 'Com título', detail: 'Quase sempre possui um <h2>–<h6> logo no início.'},
    ],
    notes: [
      'Se o bloco existir só para alinhar elementos no CSS, use <div> em vez de <section>.',
    ],
    example: `<section id="planos">\n  <h2>Planos disponíveis</h2>\n  <p>Escolha o plano ideal.</p>\n</section>`,
  },
  {
    term: '<select>',
    language: 'html',
    category: 'Tag de formulário',
    summary: 'Cria uma caixa de seleção suspensa (dropdown) com opções <option>.',
    description:
      'A tag <select> apresenta uma lista fechada de opções definidas por <option> (e agrupadas opcionalmente com <optgroup>).',
    syntax: '<select name="pais">\n  <option value="br">Brasil</option>\n</select>',
    specsLabel: 'Atributos',
    specs: [
      {name: 'multiple', detail: 'Permite selecionar mais de uma opção ao mesmo tempo.'},
      {name: 'required', detail: 'Exige uma opção com value não vazio.'},
    ],
    notes: [
      'Use value="" na primeira <option> de instrução (ex: "Selecione...") para validar required.',
    ],
    example: `<label for="cidade">Cidade</label>\n<select id="cidade">\n  <option value="">Escolha...</option>\n  <option value="sp">São Paulo</option>\n  <option value="rj">Rio de Janeiro</option>\n</select>`,
  },
  {
    term: '<span>',
    language: 'html',
    category: 'Tag de texto',
    summary: 'Contêiner genérico inline para estilizar ou manipular parte de um texto.',
    description:
      'A tag <span> funciona como a <div>, mas em linha (inline): ela não quebra a linha antes nem depois. É ideal para colorir uma palavra ou atualizar um número via JavaScript.',
    syntax: '<p>Total: <span id="valor">0</span></p>',
    specsLabel: 'Comportamento',
    specs: [
      {name: 'display', detail: 'Inline (não aceita width e height fixos a menos que mude para inline-block).'},
    ],
    notes: [
      'Quando houver significado específico (como destaque forte ou código), prefira <strong>, <em> ou <code>.',
    ],
    example: `<p>Olá, <span class="destaque">Visitante</span>!</p>`,
  },
  {
    term: '<strong>',
    language: 'html',
    category: 'Tag de texto',
    summary: 'Indica texto de grande importância, seriedade ou urgência (exibido em negrito).',
    description:
      'Além de deixar o texto em negrito por padrão, <strong> comunica importância semântica para mecanismos de busca e leitores de tela.',
    syntax: '<p><strong>Atenção:</strong> ação irreversível.</p>',
    specsLabel: 'Diferença para <b>',
    specs: [
      {name: '<strong> vs <b>', detail: '<strong> carrega importância no texto; <b> serve apenas para chamar atenção visual sem peso semântico extra.'},
    ],
    notes: [
      'Não use <strong> em títulos inteiros que já usam <h1>–<h6>; ajuste font-weight no CSS.',
    ],
    example: `<p>Prazo final: <strong>hoje às 18h</strong>.</p>`,
  },
  {
    term: '<table>',
    language: 'html',
    category: 'Tag de dados tabulares',
    summary: 'Organiza dados em linhas (<tr>) e colunas de cabeçalho (<th>) ou células (<td>).',
    description:
      'A tag <table> estrutura dados tabulares reais (planilhas, horários, tabelas de preços), combinada com <thead> para cabeçalhos e <tbody> para o corpo dos dados.',
    syntax: '<table>\n  <thead><tr><th>Nome</th></tr></thead>\n  <tbody><tr><td>Ana</td></tr></tbody>\n</table>',
    specsLabel: 'Tags internas essenciais',
    specs: [
      {name: '<thead> / <tbody>', detail: 'Separam o cabeçalho fixo do corpo dos registros.'},
      {name: '<tr>', detail: 'Table Row: cria uma nova linha.'},
      {name: '<th> / <td>', detail: 'Célula de título da coluna/linha (<th>) e célula comum de dado (<td>).'},
    ],
    notes: [
      'Nunca use <table> para montar o layout de uma página inteira; use CSS Grid ou Flexbox.',
    ],
    example: `<table>\n  <thead>\n    <tr><th>Produto</th><th>Preço</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Caderno</td><td>R$ 24,00</td></tr>\n  </tbody>\n</table>`,
  },
  {
    term: '<textarea>',
    language: 'html',
    category: 'Tag de formulário',
    summary: 'Cria um campo de texto multilinha redimensionável pelo usuário.',
    description:
      'Diferente de <input type="text">, a tag <textarea> permite que o usuário digite várias linhas, como comentários, mensagens ou descrições longas.',
    syntax: '<textarea rows="4" cols="40" placeholder="Sua mensagem"></textarea>',
    specsLabel: 'Atributos principais',
    specs: [
      {name: 'rows / cols', detail: 'Altura em linhas e largura aproximada inicial.'},
      {name: 'maxlength', detail: 'Limite máximo de caracteres permitidos.'},
      {name: 'placeholder', detail: 'Texto de dica exibido enquanto o campo estiver vazio.'},
    ],
    notes: [
      'O valor inicial vai entre a tag de abertura e </textarea>, não no atributo value.',
    ],
    example: `<label for="bio">Biografia</label>\n<textarea id="bio" rows="3" maxlength="200"></textarea>`,
  },
  {
    term: '<ul>',
    language: 'html',
    category: 'Tag de lista',
    summary: 'Cria uma lista não ordenada com marcadores (pontos) para itens sem ordem rígida.',
    description:
      'A tag <ul> (unordered list) agrupa itens relacionados usando marcadores. É muito usada também para menus de navegação e listas de recursos.',
    syntax: '<ul>\n  <li>Item A</li>\n  <li>Item B</li>\n</ul>',
    specsLabel: 'Estilização CSS',
    specs: [
      {name: 'list-style', detail: 'Pode ser alterado para disc, circle, square ou none (muito comum em menus).'},
    ],
    notes: [
      'Só insira tags <li> como filhas diretas de <ul>.',
    ],
    example: `<ul>\n  <li>HTML para estrutura</li>\n  <li>CSS para estilo</li>\n  <li>JavaScript para comportamento</li>\n</ul>`,
  },
  {
    term: '<video>',
    language: 'html',
    category: 'Tag de mídia',
    summary: 'Incorpora um reprodutor de vídeo nativo na página.',
    description:
      'A tag <video> reproduz vídeos MP4 ou WebM direto no navegador sem depender de plugins externos.',
    syntax: '<video src="video.mp4" controls width="480"></video>',
    specsLabel: 'Atributos principais',
    specs: [
      {name: 'controls', detail: 'Mostra botões de play, pausa, tempo e tela cheia.'},
      {name: 'poster', detail: 'Imagem de capa exibida antes de iniciar o vídeo.'},
      {name: 'autoplay muted playsinline', detail: 'Combinação necessária para vídeos de fundo rodarem automaticamente no celular.'},
    ],
    notes: [
      'Adicione legendas acessíveis usando a tag <track kind="subtitles">.',
    ],
    example: `<video controls width="400" poster="capa.jpg">\n  <source src="aula.mp4" type="video/mp4" />\n</video>`,
  },

  // ================= CSS =================
  {
    term: 'align-items',
    language: 'css',
    category: 'Propriedade Flexbox e Grid',
    summary: 'Alinha os itens filhos no eixo perpendicular (vertical em linhas) dentro de um contêiner Flex ou Grid.',
    description:
      'Quando o contêiner tem display: flex ou display: grid, align-items controla como os elementos se distribuem na altura da linha (ou largura da coluna se flex-direction for column).',
    syntax: 'align-items: center;',
    specsLabel: 'Valores aceitos',
    specs: [
      {name: 'stretch', detail: 'Padrão: estica os filhos para preencher a altura do contêiner.'},
      {name: 'center', detail: 'Centraliza os filhos verticalmente (em flex-direction: row).'},
      {name: 'flex-start / flex-end', detail: 'Alinha no início ou no fim do eixo transversal.'},
      {name: 'baseline', detail: 'Alinha pela linha de base do texto dos elementos.'},
    ],
    notes: [
      'Para alinhar apenas um filho específico diferente dos demais, use align-self nele.',
    ],
    example: `.cabecalho {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}`,
  },
  {
    term: 'animation',
    language: 'css',
    category: 'Propriedade de animação',
    summary: 'Atalho que aplica e configura animações definidas com @keyframes em um elemento.',
    description:
      'A propriedade animation permite criar movimentos contínuos, loops, pulsos e entradas em múltiplos estágios sem precisar de JavaScript.',
    syntax: 'animation: nome 300ms ease-out forwards;',
    specsLabel: 'Subpropriedades incluídas',
    specs: [
      {name: 'animation-name', detail: 'Nome definido na regra @keyframes.'},
      {name: 'animation-duration', detail: 'Tempo de duração de um ciclo (ex: 0.4s ou 400ms).'},
      {name: 'animation-timing-function', detail: 'Curva de velocidade: ease, linear, ease-in-out, cubic-bezier().'},
      {name: 'animation-iteration-count', detail: 'Quantas vezes repetir (1, 3 ou infinite).'},
      {name: 'animation-fill-mode', detail: 'Use "forwards" para manter o estilo do último quadro após terminar.'},
    ],
    notes: [
      'Prefira animar transform e opacity para manter 60 fps suaves.',
    ],
    example: `.alerta {\n  animation: surgir 240ms ease-out forwards;\n}`,
  },
  {
    term: 'backdrop-filter',
    language: 'css',
    category: 'Propriedade de efeito visual',
    summary: 'Aplica efeitos gráficos como desfoque (blur) ao que está atrás de um elemento semitransparente.',
    description:
      'Muito usada para efeito de "vidro fosco" (glassmorphism) em cabeçalhos fixos, menus e modais sobre imagens ou conteúdo que rola por baixo.',
    syntax: 'backdrop-filter: blur(8px);',
    specsLabel: 'Funções aceitas',
    specs: [
      {name: 'blur(px)', detail: 'Desfoca o fundo atrás do elemento.'},
      {name: 'brightness() / saturate()', detail: 'Ajusta brilho ou saturação do fundo visível.'},
    ],
    notes: [
      'O elemento precisa ter fundo semitransparente (ex: rgba(255, 255, 255, 0.7)) para o efeito aparecer.',
    ],
    example: `.barra-topo {\n  background: rgba(255, 255, 255, 0.75);\n  backdrop-filter: blur(10px);\n}`,
  },
  {
    term: 'background',
    language: 'css',
    category: 'Propriedade visual',
    summary: 'Define em uma única regra cor de fundo, imagem, gradiente, repetição e posicionamento.',
    description:
      'Atalho versátil para background-color, background-image (como linear-gradient), background-position, background-size e background-repeat.',
    syntax: 'background: linear-gradient(135deg, #2563eb, #06b6d4);',
    specsLabel: 'Propriedades relacionadas',
    specs: [
      {name: 'background-color', detail: 'Cor sólida de preenchimento.'},
      {name: 'background-image', detail: 'Imagem url(...) ou gradiente.'},
      {name: 'background-size', detail: '"cover" cobre tudo sem distorcer; "contain" mostra a imagem inteira.'},
      {name: 'background-position', detail: 'Alinhamento do fundo (ex: center, top right).'},
    ],
    notes: [
      'Ao usar apenas cor sólida, prefira background-color para não sobrescrever imagens de fundo herdadas.',
    ],
    example: `.banner {\n  background: url("capa.jpg") center / cover no-repeat;\n}`,
  },
  {
    term: 'border',
    language: 'css',
    category: 'Propriedade de caixa (Box Model)',
    summary: 'Define a espessura, o estilo e a cor da borda ao redor de um elemento.',
    description:
      'Atalho para border-width, border-style e border-color. Pode ser aplicada em todos os lados ou individualmente (border-top, border-right, border-bottom, border-left).',
    syntax: 'border: 1px solid #d4d4d8;',
    specsLabel: 'Estilos principais',
    specs: [
      {name: 'solid', detail: 'Linha contínua sólida.'},
      {name: 'dashed / dotted', detail: 'Linha tracejada ou pontilhada.'},
      {name: 'none', detail: 'Remove a borda padrão (comum em inputs ou botões).'},
    ],
    notes: [
      'Com box-sizing: border-box, a borda não aumenta a largura total declarada do elemento.',
    ],
    example: `.cartao {\n  border: 1px solid #e5e7eb;\n  border-left: 4px solid #2563eb;\n}`,
  },
  {
    term: 'border-radius',
    language: 'css',
    category: 'Propriedade visual',
    summary: 'Arredonda os cantos da borda e do fundo de um elemento.',
    description:
      'Aceita unidades em px, rem ou porcentagem (%). Um valor único arredonda os 4 cantos; 50% em um elemento quadrado cria um círculo perfeito.',
    syntax: 'border-radius: 12px;',
    specsLabel: 'Variações',
    specs: [
      {name: '1 valor', detail: 'Aplica igual nos 4 cantos.'},
      {name: '4 valores', detail: 'Sentido horário: topo-esq, topo-dir, baixo-dir, baixo-esq.'},
      {name: '50% ou 9999px', detail: 'Círculo (em quadrado) ou formato de pílula (em retângulo).'},
    ],
    notes: [
      'Para cortar uma imagem interna junto com os cantos arredondados, adicione overflow: hidden no contêiner.',
    ],
    example: `.avatar {\n  width: 64px;\n  height: 64px;\n  border-radius: 50%;\n}`,
  },
  {
    term: 'box-shadow',
    language: 'css',
    category: 'Propriedade visual',
    summary: 'Adiciona uma ou mais sombras externas ou internas ao redor da caixa do elemento.',
    description:
      'Controla deslocamento horizontal (X), deslocamento vertical (Y), desfoque (blur), expansão (spread) e cor da sombra.',
    syntax: 'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);',
    specsLabel: 'Parâmetros na ordem',
    specs: [
      {name: 'offset-x / offset-y', detail: 'Deslocamento horizontal e vertical da sombra.'},
      {name: 'blur-radius', detail: 'Suavidade do desfoque (quanto maior, mais difusa).'},
      {name: 'spread-radius', detail: 'Opcional: expande ou encolhe o tamanho da sombra.'},
      {name: 'inset', detail: 'Opcional no início: projeta a sombra para dentro da caixa.'},
    ],
    notes: [
      'Sombras sutis com opacidade baixa (0.06 a 0.15) parecem mais naturais do que preto sólido.',
    ],
    example: `.cartao:hover {\n  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);\n}`,
  },
  {
    term: 'box-sizing',
    language: 'css',
    category: 'Propriedade de caixa (Box Model)',
    summary: 'Define se padding e border somam ou ficam contidos dentro de width e height.',
    description:
      'Por padrão (content-box), width: 200px com padding: 20px deixa o elemento com 240px reais. Com border-box, os 200px já incluem padding e borda, evitando quebras de layout.',
    syntax: 'box-sizing: border-box;',
    specsLabel: 'Valores aceitos',
    specs: [
      {name: 'content-box', detail: 'Padrão antigo: width/height medem apenas o conteúdo interno.'},
      {name: 'border-box', detail: 'Recomendado: width/height incluem conteúdo + padding + borda.'},
    ],
    notes: [
      'Quase todo projeto moderno aplica box-sizing: border-box no seletor universal *.',
    ],
    example: `*, *::before, *::after {\n  box-sizing: border-box;\n}`,
  },
  {
    term: 'calc()',
    language: 'css',
    category: 'Função CSS',
    summary: 'Realiza cálculos matemáticos misturando unidades diferentes diretamente no CSS.',
    description:
      'Permite somar, subtrair, multiplicar e dividir valores como porcentagem e pixels (ex: 100% - 32px ou 100vh - 56px) de forma dinâmica.',
    syntax: 'height: calc(100vh - 56px);',
    specsLabel: 'Regras de sintaxe',
    specs: [
      {name: 'Espaços em + e -', detail: 'Sempre deixe espaço antes e depois dos sinais + e - (ex: 100% - 20px).'},
      {name: 'Operadores', detail: 'Suporta +, -, * e /.'},
    ],
    notes: [
      'Pode ser combinada com variáveis CSS: calc(var(--espaco) * 2).',
    ],
    example: `.conteudo {\n  width: calc(100% - 2rem);\n  margin: 0 auto;\n}`,
  },
  {
    term: 'clamp()',
    language: 'css',
    category: 'Função CSS',
    summary: 'Limita um valor fluido entre um mínimo, um valor ideal e um máximo.',
    description:
      'Excelente para tipografia e espaçamentos responsivos sem precisar escrever vários @media queries. A sintaxe recebe (mínimo, preferido, máximo).',
    syntax: 'font-size: clamp(1rem, 2.5vw, 2rem);',
    specsLabel: 'Argumentos',
    specs: [
      {name: '1º (mínimo)', detail: 'Limite inferior; o valor nunca ficará menor que ele.'},
      {name: '2º (ideal)', detail: 'Valor flexível, geralmente usando vw ou %.'},
      {name: '3º (máximo)', detail: 'Limite superior em telas grandes.'},
    ],
    notes: [
      'Evite usar apenas vw puro no valor ideal; somar rem (ex: 1rem + 2vw) mantém o suporte ao zoom do navegador.',
    ],
    example: `h1 {\n  font-size: clamp(1.5rem, 1.1rem + 2vw, 3rem);\n}`,
  },
  {
    term: 'color',
    language: 'css',
    category: 'Propriedade de texto',
    summary: 'Define a cor do texto e das decorações de texto de um elemento.',
    description:
      'Propriedade herdada pelos elementos filhos. Aceita códigos hexadecimais (#111827), rgb()/rgba(), hsl()/hsla(), nomes de cor ou variáveis CSS.',
    syntax: 'color: #1f2937;',
    specsLabel: 'Formatos comuns',
    specs: [
      {name: 'Hexadecimal', detail: '#2563eb ou curto #000.'},
      {name: 'RGB / RGBA', detail: 'rgb(37, 99, 235) ou rgba(37, 99, 235, 0.8) com transparência.'},
      {name: 'HSL', detail: 'hsl(221, 83%, 53%) — matiz, saturação e luminosidade.'},
      {name: 'currentColor', detail: 'Palavra-chave especial usada em bordas/SVGs para copiar o valor de color.'},
    ],
    notes: [
      'Mantenha bom contraste entre color e background-color para leitura confortável.',
    ],
    example: `body {\n  color: #171717;\n  background-color: #ffffff;\n}`,
  },
  {
    term: 'cursor',
    language: 'css',
    category: 'Propriedade de interação',
    summary: 'Altera o ícone do ponteiro do mouse ao passar sobre o elemento.',
    description:
      'Ajuda o usuário a reconhecer visualmente elementos clicáveis, textos selecionáveis, áreas arrastáveis ou ações bloqueadas.',
    syntax: 'cursor: pointer;',
    specsLabel: 'Valores mais usados',
    specs: [
      {name: 'pointer', detail: 'Mãozinha clicável (botões, links, cards interativos).'},
      {name: 'default / text', detail: 'Seta padrão ou barra vertical de seleção de texto.'},
      {name: 'not-allowed', detail: 'Símbolo de bloqueio para controles desabilitados.'},
      {name: 'grab / grabbing', detail: 'Mão aberta ou fechada para itens arrastáveis.'},
    ],
    notes: [
      'Mesmo usando cursor: pointer em um elemento clicável, prefira <button> para manter acessibilidade por teclado.',
    ],
    example: `button:not(:disabled) {\n  cursor: pointer;\n}\nbutton:disabled {\n  cursor: not-allowed;\n}`,
  },
  {
    term: 'display',
    language: 'css',
    category: 'Propriedade de layout',
    summary: 'Define como um elemento se comporta na caixa e como organiza seus filhos.',
    description:
      'Uma das propriedades mais importantes do CSS. Controla se o elemento ocupa uma linha inteira (block), flui com o texto (inline), vira um contêiner Flexbox/Grid ou desaparece da renderização (none).',
    syntax: 'display: flex;',
    specsLabel: 'Valores principais',
    specs: [
      {name: 'block', detail: 'Quebra linha e ocupa toda a largura disponível.'},
      {name: 'inline', detail: 'Flui na mesma linha do texto; ignora width/height.'},
      {name: 'inline-block', detail: 'Flui na linha, mas aceita width, height e margens verticais.'},
      {name: 'flex', detail: 'Ativa Flexbox para alinhamento em 1 dimensão (linha ou coluna).'},
      {name: 'grid', detail: 'Ativa CSS Grid para grades em 2 dimensões (linhas e colunas).'},
      {name: 'none', detail: 'Oculta o elemento completamente sem ocupar espaço.'},
    ],
    notes: [
      'display: none remove o elemento da tela instantaneamente (não anima com transition).',
    ],
    example: `.menu {\n  display: flex;\n  gap: 1rem;\n  align-items: center;\n}`,
  },
  {
    term: 'flex',
    language: 'css',
    category: 'Propriedade Flexbox',
    summary: 'Controla o quanto um item filho dentro de um Flexbox pode crescer, encolher e seu tamanho base.',
    description:
      'Atalho aplicado nos filhos diretos de um contêiner display: flex para flex-grow, flex-shrink e flex-basis. Muito usado para fazer uma área ocupar todo o espaço restante.',
    syntax: 'flex: 1;',
    specsLabel: 'Valores comuns',
    specs: [
      {name: 'flex: 1', detail: 'O item cresce e encolhe livremente para dividir o espaço disponível.'},
      {name: 'flex: 0 0 auto', detail: 'Mantém o tamanho natural sem esticar nem espremer.'},
      {name: 'flex: 1 1 260px', detail: 'Tamanho ideal de 260px, podendo crescer ou diminuir.'},
    ],
    notes: [
      'Para evitar que textos longos estourem um item flex: 1, adicione min-width: 0 nele.',
    ],
    example: `.layout {\n  display: flex;\n}\n.barra-lateral { width: 240px; flex-shrink: 0; }\n.conteudo { flex: 1; min-width: 0; }`,
  },
  {
    term: 'flex-direction',
    language: 'css',
    category: 'Propriedade Flexbox',
    summary: 'Define a direção principal em que os itens Flexbox são posicionados.',
    description:
      'Alterna o fluxo do Flexbox entre horizontal (linha) ou vertical (coluna), além das versões invertidas.',
    syntax: 'flex-direction: column;',
    specsLabel: 'Valores aceitos',
    specs: [
      {name: 'row', detail: 'Padrão: itens lado a lado da esquerda para a direita.'},
      {name: 'column', detail: 'Itens empilhados de cima para baixo.'},
      {name: 'row-reverse / column-reverse', detail: 'Inverte a ordem visual dos itens.'},
    ],
    notes: [
      'Quando mudar para column, justify-content passa a alinhar na vertical e align-items na horizontal.',
    ],
    example: `.coluna {\n  display: flex;\n  flex-direction: column;\n  gap: 0.75rem;\n}`,
  },
  {
    term: 'font-family',
    language: 'css',
    category: 'Propriedade de tipografia',
    summary: 'Define a fonte ou lista de fontes alternativas usadas para renderizar o texto.',
    description:
      'Recebe uma lista em ordem de prioridade separada por vírgulas, terminando em uma família genérica (sans-serif, serif ou monospace) caso as fontes anteriores não existam.',
    syntax: 'font-family: "Inter", system-ui, sans-serif;',
    specsLabel: 'Famílias genéricas',
    specs: [
      {name: 'sans-serif', detail: 'Fontes modernas sem serifa (limpas para telas).'},
      {name: 'serif', detail: 'Fontes com serifa tradicional (editorial/livros).'},
      {name: 'monospace', detail: 'Todos os caracteres têm a mesma largura (ideal para código).'},
      {name: 'system-ui', detail: 'Usa a fonte nativa do sistema operacional do usuário.'},
    ],
    notes: [
      'Nomes de fontes com espaços devem ficar entre aspas, como "JetBrains Mono".',
    ],
    example: `body {\n  font-family: system-ui, -apple-system, sans-serif;\n}\ncode {\n  font-family: "JetBrains Mono", monospace;\n}`,
  },
  {
    term: 'font-size',
    language: 'css',
    category: 'Propriedade de tipografia',
    summary: 'Define o tamanho da fonte do texto.',
    description:
      'Aceita pixels (px), rem (relativo ao <html>, recomendado para acessibilidade), em ou funções fluidas como clamp().',
    syntax: 'font-size: 1rem;',
    specsLabel: 'Unidades comuns',
    specs: [
      {name: 'rem', detail: 'Relativo ao font-size raiz (1rem geralmente equivale a 16px). Respeita preferências do usuário.'},
      {name: 'px', detail: 'Tamanho fixo em pixels.'},
      {name: 'em', detail: 'Relativo ao font-size do elemento pai.'},
    ],
    notes: [
      'Evite textos corridos menores que 14px (0.875rem) para manter boa legibilidade.',
    ],
    example: `h1 { font-size: 2rem; }\np { font-size: 1rem; }`,
  },
  {
    term: 'font-weight',
    language: 'css',
    category: 'Propriedade de tipografia',
    summary: 'Define a espessura (peso) do traço da fonte, do fino ao negrito.',
    description:
      'Usa valores numéricos de 100 a 900 ou palavras-chave como normal (400) e bold (700).',
    syntax: 'font-weight: 600;',
    specsLabel: 'Pesos mais comuns',
    specs: [
      {name: '400 (normal)', detail: 'Peso padrão para textos corridos.'},
      {name: '500 / 600', detail: 'Médio e seminegrito (ótimo para botões e rótulos).'},
      {name: '700 (bold)', detail: 'Negrito para títulos e destaques.'},
    ],
    notes: [
      'A fonte carregada precisa oferecer o peso escolhido; caso contrário o navegador simula ou aproxima para o peso disponível.',
    ],
    example: `.titulo {\n  font-weight: 700;\n}\n.subtitulo {\n  font-weight: 500;\n}`,
  },
  {
    term: 'gap',
    language: 'css',
    category: 'Propriedade Flexbox e Grid',
    summary: 'Define o espaçamento entre linhas e colunas dentro de um contêiner Flex ou Grid.',
    description:
      'Substitui margens manuais entre irmãos, aplicando espaço apenas entre os elementos internos sem adicionar sobra nas bordas externas.',
    syntax: 'gap: 16px;',
    specsLabel: 'Variações',
    specs: [
      {name: '1 valor', detail: 'Mesmo espaçamento entre linhas e colunas.'},
      {name: '2 valores', detail: 'Primeiro define row-gap (linhas), segundo define column-gap (colunas).'},
    ],
    notes: [
      'Mais limpo que margin-right porque dispensa remover margem do último item.',
    ],
    example: `.grade {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 1.5rem 1rem;\n}`,
  },
  {
    term: 'grid-template-columns',
    language: 'css',
    category: 'Propriedade Grid',
    summary: 'Define a quantidade e a largura das colunas em um contêiner display: grid.',
    description:
      'Aceita medidas fixas, frações flexíveis (fr), repeat(), minmax() e auto-fit para criar grades que se adaptam automaticamente à largura da tela.',
    syntax: 'grid-template-columns: repeat(3, 1fr);',
    specsLabel: 'Recursos úteis',
    specs: [
      {name: 'fr', detail: 'Fração do espaço disponível restante (ex: 1fr 2fr divide em 1/3 e 2/3).'},
      {name: 'repeat(n, tamanho)', detail: 'Repete um padrão de colunas.'},
      {name: 'repeat(auto-fit, minmax(220px, 1fr))', detail: 'Cria colunas responsivas automáticas sem @media queries.'},
    ],
    notes: [
      'Combine com minmax(0, 1fr) se algum conteúdo interno estiver alargando a coluna além do esperado.',
    ],
    example: `.galeria {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n  gap: 16px;\n}`,
  },
  {
    term: ':hover',
    language: 'css',
    category: 'Pseudoclasse CSS',
    summary: 'Aplica estilos enquanto o ponteiro do mouse estiver sobre o elemento.',
    description:
      'Pseudoclasse essencial para feedback visual em botões, links e cartões. Combinada com transition, cria transições suaves ao passar o mouse.',
    syntax: '.botao:hover { background-color: #1d4ed8; }',
    specsLabel: 'Boas práticas',
    specs: [
      {name: 'Com :focus-visible', detail: 'Combine .botao:hover com .botao:focus-visible para quem navega pelo teclado também ver o destaque.'},
    ],
    notes: [
      'Em telas sensíveis ao toque, o estado :hover pode ficar preso após o toque; evite esconder conteúdo essencial atrás dele.',
    ],
    example: `.link {\n  color: #2563eb;\n  transition: color 150ms ease;\n}\n.link:hover {\n  color: #1e40af;\n}`,
  },
  {
    term: 'justify-content',
    language: 'css',
    category: 'Propriedade Flexbox e Grid',
    summary: 'Distribui e alinha os itens ao longo do eixo principal dentro de um contêiner Flex ou Grid.',
    description:
      'Controla como o espaço livre é repartido entre os filhos: agrupados no centro, nas pontas ou com espaços iguais.',
    syntax: 'justify-content: space-between;',
    specsLabel: 'Valores principais',
    specs: [
      {name: 'flex-start / flex-end', detail: 'Alinha todos os itens no início ou no final.'},
      {name: 'center', detail: 'Centraliza os itens ao longo do eixo principal.'},
      {name: 'space-between', detail: 'Primeiro item na ponta inicial, último na ponta final, espaço igual entre eles.'},
      {name: 'space-around / space-evenly', detail: 'Distribui espaço também ao redor das extremidades.'},
    ],
    notes: [
      'Só produz efeito visível quando sobrar espaço livre no eixo principal.',
    ],
    example: `.navbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}`,
  },
  {
    term: '@keyframes',
    language: 'css',
    category: 'Regra-at CSS',
    summary: 'Define os quadros intermediários (etapas) de uma animação CSS.',
    description:
      'Declara como as propriedades CSS mudam ao longo do tempo (de from/0% até to/100%). Depois de definida, a animação é ativada no elemento com a propriedade animation.',
    syntax: '@keyframes nome {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}',
    specsLabel: 'Marcadores de tempo',
    specs: [
      {name: 'from / to', detail: 'Atalhos para o início (0%) e fim (100%).'},
      {name: '0% ... 100%', detail: 'Permite definir quantos estágios intermediários quiser (ex: 50%).'},
    ],
    notes: [
      'Dê nomes descritivos às animações para evitar conflitos no projeto.',
    ],
    example: `@keyframes pulsar {\n  0%, 100% { transform: scale(1); }\n  50% { transform: scale(1.06); }\n}\n.icone {\n  animation: pulsar 1.5s infinite;\n}`,
  },
  {
    term: 'line-height',
    language: 'css',
    category: 'Propriedade de tipografia',
    summary: 'Controla a altura de cada linha de texto (espaçamento entrelinhas).',
    description:
      'Melhora muito o conforto de leitura. Recomenda-se passar um número sem unidade (ex: 1.5), que multiplica proporcionalmente o font-size atual.',
    syntax: 'line-height: 1.6;',
    specsLabel: 'Valores recomendados',
    specs: [
      {name: '1.5 a 1.7', detail: 'Ideal para parágrafos de texto corrido.'},
      {name: '1.1 a 1.25', detail: 'Mais indicado para títulos grandes.'},
    ],
    notes: [
      'Prefira valores sem unidade (1.5) em vez de px fixos para que elementos filhos herdem a proporção corretamente.',
    ],
    example: `p {\n  font-size: 1rem;\n  line-height: 1.65;\n}`,
  },
  {
    term: 'margin',
    language: 'css',
    category: 'Propriedade de caixa (Box Model)',
    summary: 'Cria espaçamento externo fora da borda do elemento para afastá-lo dos vizinhos.',
    description:
      'Aceita de 1 a 4 valores (topo, direita, baixo, esquerda). O valor especial auto nas laterais centraliza horizontalmente elementos em bloco que tenham width definido.',
    syntax: 'margin: 0 auto;',
    specsLabel: 'Propriedades individuais',
    specs: [
      {name: 'margin-top / margin-bottom', detail: 'Espaço acima e abaixo.'},
      {name: 'margin-left / margin-right', detail: 'Espaço à esquerda e à direita.'},
      {name: 'margin-inline', detail: 'Atalho moderno para esquerda e direita juntas.'},
    ],
    notes: [
      'Margens verticais de dois blocos vizinhos podem se sobrepor (margin collapsing), prevalecendo a maior.',
    ],
    example: `.container {\n  max-width: 960px;\n  margin: 2rem auto;\n}`,
  },
  {
    term: '@media',
    language: 'css',
    category: 'Regra-at CSS',
    summary: 'Aplica estilos condicionais conforme o tamanho da tela, tema escuro ou preferência de movimento.',
    description:
      'Base do design responsivo (Media Queries). Permite adaptar colunas, tamanhos de fonte e visibilidade entre celulares, tablets e computadores.',
    syntax: '@media (min-width: 768px) { ... }',
    specsLabel: 'Consultas comuns',
    specs: [
      {name: 'min-width / max-width', detail: 'Reage à largura da janela de visualização.'},
      {name: 'prefers-color-scheme: dark', detail: 'Detecta se o usuário usa modo escuro no sistema.'},
      {name: 'prefers-reduced-motion: reduce', detail: 'Desativa animações fortes para quem prefere movimento reduzido.'},
    ],
    notes: [
      'Na abordagem Mobile-First, escreva o layout de celular primeiro e use min-width para telas maiores.',
    ],
    example: `.grade {\n  display: grid;\n  grid-template-columns: 1fr;\n}\n@media (min-width: 768px) {\n  .grade { grid-template-columns: 1fr 1fr; }\n}`,
  },
  {
    term: 'object-fit',
    language: 'css',
    category: 'Propriedade de mídia',
    summary: 'Define como uma imagem ou vídeo preenche sua caixa quando tem width e height fixos.',
    description:
      'Impede que fotos fiquem esticadas ou achatadas ao ajustar proporcionalmente dentro de contêineres quadrados ou retangulares.',
    syntax: 'object-fit: cover;',
    specsLabel: 'Valores aceitos',
    specs: [
      {name: 'cover', detail: 'Preenche todo o espaço mantendo a proporção e cortando as sobras.'},
      {name: 'contain', detail: 'Mostra a mídia inteira sem cortar, podendo deixar espaço livre.'},
      {name: 'fill', detail: 'Padrão: estica para caber (pode distorcer a imagem).'},
    ],
    notes: [
      'Use object-position: center top junto com cover para focar no rosto em fotos de perfil.',
    ],
    example: `.foto-card {\n  width: 100%;\n  height: 200px;\n  object-fit: cover;\n}`,
  },
  {
    term: 'opacity',
    language: 'css',
    category: 'Propriedade visual',
    summary: 'Controla a transparência geral de um elemento e de todos os seus filhos.',
    description:
      'Recebe um número de 0 (completamente invisível, mas ainda ocupando espaço e clicável) até 1 (totalmente opaco).',
    syntax: 'opacity: 0.75;',
    specsLabel: 'Diferença para RGBA',
    specs: [
      {name: 'opacity vs rgba()', detail: 'opacity torna texto, borda e filhos transparentes juntos; rgba() afeta só uma cor específica (como o fundo).'},
    ],
    notes: [
      'Se quiser impedir cliques quando opacity for 0, adicione pointer-events: none.',
    ],
    example: `.desabilitado {\n  opacity: 0.45;\n  pointer-events: none;\n}`,
  },
  {
    term: 'overflow',
    language: 'css',
    category: 'Propriedade de caixa (Box Model)',
    summary: 'Controla o que acontece quando o conteúdo interno ultrapassa o tamanho da caixa.',
    description:
      'Permite cortar excessos (hidden), adicionar barra de rolagem automática (auto) ou sempre visível (scroll), podendo ser configurada separadamente para overflow-x e overflow-y.',
    syntax: 'overflow: auto;',
    specsLabel: 'Valores aceitos',
    specs: [
      {name: 'visible', detail: 'Padrão: o conteúdo vaza para fora da caixa.'},
      {name: 'hidden', detail: 'Corta tudo o que passar dos limites (sem rolagem).'},
      {name: 'auto', detail: 'Mostra barra de rolagem apenas quando o conteúdo realmente transbordar.'},
      {name: 'scroll', detail: 'Exibe espaço de barra de rolagem o tempo todo.'},
    ],
    notes: [
      'overflow: hidden impede que position: sticky funcione dentro daquele ancestral; nesses casos, prefira overflow: clip.',
    ],
    example: `.tabela-responsiva {\n  width: 100%;\n  overflow-x: auto;\n}`,
  },
  {
    term: 'padding',
    language: 'css',
    category: 'Propriedade de caixa (Box Model)',
    summary: 'Cria espaçamento interno entre o conteúdo do elemento e sua borda.',
    description:
      'Aumenta o respiro interno de botões, cartões e inputs. A cor de fundo ou imagem do elemento preenche também a área do padding.',
    syntax: 'padding: 12px 20px;',
    specsLabel: 'Sintaxes abreviadas',
    specs: [
      {name: '1 valor', detail: 'Igual nos 4 lados.'},
      {name: '2 valores', detail: 'Vertical (topo/baixo) e Horizontal (esquerda/direita).'},
      {name: '4 valores', detail: 'Topo, Direita, Baixo, Esquerda (sentido horário).'},
    ],
    notes: [
      'Não aceita valores negativos (ao contrário de margin).',
    ],
    example: `.botao {\n  padding: 0.625rem 1.25rem;\n}`,
  },
  {
    term: 'position',
    language: 'css',
    category: 'Propriedade de posicionamento',
    summary: 'Define o método de posicionamento do elemento e habilita top, right, bottom, left e z-index.',
    description:
      'Controla se o elemento segue o fluxo normal, se desloca em relação a si mesmo, fixa na janela de visualização ou gruda durante a rolagem.',
    syntax: 'position: sticky;\ntop: 0;',
    specsLabel: 'Valores aceitos',
    specs: [
      {name: 'static', detail: 'Padrão: segue o fluxo normal; ignora top/left e z-index.'},
      {name: 'relative', detail: 'Permanece no fluxo, mas vira referência para filhos absolute.'},
      {name: 'absolute', detail: 'Sai do fluxo e se posiciona em relação ao ancestral posicionado mais próximo.'},
      {name: 'fixed', detail: 'Fica fixo em relação à janela do navegador mesmo ao rolar.'},
      {name: 'sticky', detail: 'Rola normalmente até atingir o limite (ex: top: 0) e então gruda.'},
    ],
    notes: [
      'Sempre aplique position: relative no pai quando quiser posicionar um badge ou botão com position: absolute dentro dele.',
    ],
    example: `.badge-wrap { position: relative; }\n.badge {\n  position: absolute;\n  top: 8px;\n  right: 8px;\n}`,
  },
  {
    term: 'rem',
    language: 'css',
    category: 'Unidade CSS',
    summary: 'Unidade de medida proporcional ao tamanho de fonte do elemento raiz (<html>).',
    description:
      '1rem equivale ao font-size definido no <html> (por padrão, 16px). Diferente de em, não acumula multiplicações em elementos aninhados e respeita o zoom de fonte do usuário.',
    syntax: 'padding: 1.5rem;\nfont-size: 1.125rem;',
    specsLabel: 'Conversão padrão (1rem = 16px)',
    specs: [
      {name: '0.75rem', detail: 'Equivale a 12px.'},
      {name: '0.875rem', detail: 'Equivale a 14px.'},
      {name: '1rem', detail: 'Equivale a 16px.'},
      {name: '1.5rem', detail: 'Equivale a 24px.'},
    ],
    notes: [
      'Use rem para fontes e espaçamentos principais, e px para bordas finas (1px).',
    ],
    example: `.cartao {\n  padding: 1.25rem;\n  font-size: 1rem;\n}`,
  },
  {
    term: 'text-align',
    language: 'css',
    category: 'Propriedade de texto',
    summary: 'Alinha horizontalmente o conteúdo inline (textos, imagens inline) dentro de um bloco.',
    description:
      'Alinha o texto à esquerda, direita, centralizado ou justificado nas duas margens.',
    syntax: 'text-align: center;',
    specsLabel: 'Valores principais',
    specs: [
      {name: 'left / start', detail: 'Alinhamento à esquerda (ou início da escrita).'},
      {name: 'center', detail: 'Centraliza cada linha de texto.'},
      {name: 'right / end', detail: 'Alinha à direita (útil em colunas numéricas de tabelas).'},
      {name: 'justify', detail: 'Alinha nas duas margens laterais esticando os espaços.'},
    ],
    notes: [
      'Não centraliza elementos em bloco com width definido; para isso use margin: 0 auto ou Flexbox.',
    ],
    example: `.cabecalho-central {\n  text-align: center;\n}`,
  },
  {
    term: 'transform',
    language: 'css',
    category: 'Propriedade visual e animação',
    summary: 'Move, gira, redimensiona ou inclina um elemento no espaço 2D ou 3D sem afetar o layout vizinho.',
    description:
      'Operações de transform acontecem na camada gráfica (GPU), mantendo o espaço original ocupado pelo elemento e permitindo animações muito fluidas.',
    syntax: 'transform: translateY(-4px) scale(1.02);',
    specsLabel: 'Funções principais',
    specs: [
      {name: 'translate(x, y)', detail: 'Desloca horizontal e verticalmente.'},
      {name: 'scale(n)', detail: 'Amplia (> 1) ou reduz (< 1) o tamanho.'},
      {name: 'rotate(deg)', detail: 'Gira no sentido horário (ex: 45deg) ou anti-horário (-45deg).'},
      {name: 'skew(deg)', detail: 'Inclina os ângulos da caixa.'},
    ],
    notes: [
      'A ordem das funções importa: rotate antes de translate produz resultado diferente de translate antes de rotate.',
    ],
    example: `.cartao:hover {\n  transform: translateY(-3px);\n}`,
  },
  {
    term: 'transition',
    language: 'css',
    category: 'Propriedade de animação',
    summary: 'Anima suavemente a mudança de propriedades CSS entre dois estados (ex: normal e :hover).',
    description:
      'Define quais propriedades animar, duração, curva de aceleração e atraso opcional sempre que um valor mudar via pseudoclasse ou classe JavaScript.',
    syntax: 'transition: background-color 180ms ease, transform 180ms ease;',
    specsLabel: 'Parâmetros',
    specs: [
      {name: 'property', detail: 'Propriedade alvo (evite "all" em elementos grandes; liste explicitamente).'},
      {name: 'duration', detail: 'Duração da transição (150ms a 300ms costumam parecer ágeis).'},
      {name: 'timing-function', detail: 'ease, ease-out, linear ou cubic-bezier().'},
    ],
    notes: [
      'Coloque transition no estado base do elemento, e não apenas dentro de :hover, para animar tanto na entrada quanto na saída.',
    ],
    example: `.botao {\n  transition: transform 150ms ease, opacity 150ms ease;\n}\n.botao:active {\n  transform: scale(0.97);\n}`,
  },
  {
    term: 'var()',
    language: 'css',
    category: 'Função CSS',
    summary: 'Lê e aplica o valor de uma variável CSS (Custom Property) com fallback opcional.',
    description:
      'Permite reutilizar cores, fontes e espaçamentos definidos com --nome-da-variavel (geralmente em :root) e alterá-los dinamicamente para tema claro/escuro.',
    syntax: 'color: var(--cor-texto, #111827);',
    specsLabel: 'Argumentos',
    specs: [
      {name: '1º (--nome)', detail: 'Nome da variável CSS começando obrigatoriamente com dois hifens (--).'},
      {name: '2º (fallback)', detail: 'Opcional: valor substituto usado se a variável não estiver definida.'},
    ],
    notes: [
      'Variáveis CSS são sensíveis a maiúsculas e minúsculas (--cor ≠ --Cor).',
    ],
    example: `:root {\n  --primaria: #2563eb;\n}\n.botao {\n  background-color: var(--primaria);\n}`,
  },
  {
    term: 'z-index',
    language: 'css',
    category: 'Propriedade de empilhamento',
    summary: 'Define a ordem de sobreposição (qual elemento fica na frente) no eixo Z.',
    description:
      'Elementos com z-index maior aparecem na frente dos que têm z-index menor dentro do mesmo contexto de empilhamento. Útil para menus dropdown, tooltips e modais.',
    syntax: 'z-index: 50;',
    specsLabel: 'Pré-requisito',
    specs: [
      {name: 'Elemento posicionado', detail: 'Só funciona em elementos com position diferente de static (ou filhos diretos de Flex/Grid).'},
    ],
    notes: [
      'Mantenha uma escala organizada (ex: 10 para cabeçalho, 30 para dropdown, 40 para modal, 50 para toast) em vez de 999999.',
    ],
    example: `.modal {\n  position: fixed;\n  inset: 0;\n  z-index: 40;\n}`,
  },

  // ================= JAVASCRIPT =================
  {
    term: 'addEventListener()',
    language: 'js',
    category: 'Método DOM',
    summary: 'Registra uma função para ser executada sempre que um evento acontecer em um elemento.',
    description:
      'Conecta interações do usuário (cliques, teclas, envio de formulário, rolagem) ou eventos da janela ao seu código JavaScript sem sobrescrever outros ouvintes no mesmo elemento.',
    syntax: 'elemento.addEventListener("click", (event) => { ... });',
    specsLabel: 'Parâmetros principais',
    specs: [
      {name: 'type', detail: 'Nome do evento: "click", "input", "submit", "keydown", "change".'},
      {name: 'listener', detail: 'Função callback que recebe o objeto Event.'},
      {name: 'options', detail: 'Opcional: { once: true } executa só uma vez; { passive: true } otimiza scroll.'},
    ],
    notes: [
      'Para conseguir remover depois com removeEventListener(), guarde a função em uma variável nomeada.',
    ],
    example: `const btn = document.querySelector('#salvar');\nbtn.addEventListener('click', () => {\n  console.log('Botão clicado!');\n});`,
  },
  {
    term: 'Array.filter()',
    language: 'js',
    category: 'Método de Array',
    summary: 'Cria um novo array contendo apenas os elementos que passarem em um teste lógico.',
    description:
      'Percorre todos os itens do array original executando a função fornecida. Sempre que a função retornar true, o item entra no novo array sem modificar o array original.',
    syntax: 'const filtrados = lista.filter((item, indice) => condicao);',
    specsLabel: 'Parâmetros e retorno',
    specs: [
      {name: 'callback(item, index, array)', detail: 'Deve retornar true para manter o item ou false para descartar.'},
      {name: 'Retorno', detail: 'Um novo Array (vazio [] se nenhum elemento passar no teste).'},
    ],
    notes: [
      'Muito usado em buscas em tempo real e remoção imutável de itens.',
    ],
    example: `const numeros = [3, 12, 5, 20];\nconst maiores = numeros.filter((n) => n >= 10);\nconsole.log(maiores); // [12, 20]`,
  },
  {
    term: 'Array.find()',
    language: 'js',
    category: 'Método de Array',
    summary: 'Retorna o primeiro elemento do array que satisfizer a condição informada.',
    description:
      'Diferente de filter() que retorna uma lista inteira, find() para imediatamente assim que encontra o primeiro item correspondente. Retorna undefined se nada for encontrado.',
    syntax: 'const achado = lista.find((item) => item.id === 2);',
    specsLabel: 'Parâmetros e retorno',
    specs: [
      {name: 'callback(item, index, array)', detail: 'Função de busca que retorna booleano.'},
      {name: 'Retorno', detail: 'O próprio elemento encontrado ou undefined.'},
    ],
    notes: [
      'Se você só precisar saber a posição (índice) do item, use findIndex().',
    ],
    example: `const usuarios = [{id: 1, nome: 'Ana'}, {id: 2, nome: 'Léo'}];\nconst leo = usuarios.find((u) => u.id === 2);\nconsole.log(leo?.nome); // "Léo"`,
  },
  {
    term: 'Array.forEach()',
    language: 'js',
    category: 'Método de Array',
    summary: 'Executa uma função para cada item de um array (apenas para efeitos colaterais).',
    description:
      'Percorre o array do início ao fim realizando uma ação por elemento, como atualizar elementos na tela ou somar valores. Sempre retorna undefined.',
    syntax: 'lista.forEach((item, indice) => { ... });',
    specsLabel: 'Comportamento',
    specs: [
      {name: 'Retorno', detail: 'Sempre undefined (para transformar dados em outro array, use map()).'},
      {name: 'Interrupção', detail: 'Não aceita break nem continue; para interromper no meio, prefira for...of.'},
    ],
    notes: [
      'Evite async/await dentro de forEach(); ele não aguarda as Promises terminarem — use for...of.',
    ],
    example: `const tarefas = ['Estudar', 'Praticar'];\ntarefas.forEach((item, i) => {\n  console.log(\`\${i + 1}. \${item}\`);\n});`,
  },
  {
    term: 'Array.map()',
    language: 'js',
    category: 'Método de Array',
    summary: 'Transforma cada elemento de um array e devolve um novo array com o mesmo tamanho.',
    description:
      'Executa a função de transformação em cada item e monta um novo array com os resultados retornados, preservando intacto o array original.',
    syntax: 'const novo = lista.map((item) => transformado);',
    specsLabel: 'Parâmetros e retorno',
    specs: [
      {name: 'callback(item, index, array)', detail: 'Retorna o novo valor correspondente àquele item.'},
      {name: 'Retorno', detail: 'Novo Array com a mesma quantidade de elementos.'},
    ],
    notes: [
      'Sempre garanta que há um return dentro da função callback quando usar chaves {}.',
    ],
    example: `const precos = [10, 20, 30];\nconst comDesconto = precos.map((p) => p * 0.9);\nconsole.log(comDesconto); // [9, 18, 27]`,
  },
  {
    term: 'Array.reduce()',
    language: 'js',
    category: 'Método de Array',
    summary: 'Acumula todos os itens de um array para reduzi-los a um único valor (soma, objeto, total).',
    description:
      'Passa um valor acumulador de iteração em iteração até chegar ao resultado final. Muito útil para somar carrinhos de compras ou agrupar itens.',
    syntax: 'const total = lista.reduce((acumulador, item) => acumulador + item, 0);',
    specsLabel: 'Parâmetros',
    specs: [
      {name: 'callback(acc, item, index)', detail: 'Retorna o próximo valor do acumulador.'},
      {name: 'valorInicial', detail: 'Valor inicial de acc na primeira rodada (ex: 0 ou {}).'},
    ],
    notes: [
      'Sempre forneça o segundo argumento (valorInicial) para evitar erros em arrays vazios.',
    ],
    example: `const valores = [15, 25, 10];\nconst soma = valores.reduce((acc, v) => acc + v, 0);\nconsole.log(soma); // 50`,
  },
  {
    term: 'async / await',
    language: 'js',
    category: 'Palavra-chave assíncrona',
    summary: 'Permite escrever código assíncrono com Promises de forma sequencial e legível.',
    description:
      'Uma função marcada com async sempre retorna uma Promise. Dentro dela, a palavra-chave await pausa a execução daquela função até a Promise resolver ou rejeitar, sem travar a interface.',
    syntax: 'async function carregar() {\n  const dados = await fetch(url);\n}',
    specsLabel: 'Tratamento de erros',
    specs: [
      {name: 'try / catch', detail: 'Envolva chamadas com await em try/catch para capturar falhas de rede ou rejeições.'},
      {name: 'Promise.all()', detail: 'Use com await quando várias requisições independentes puderem rodar juntas.'},
    ],
    notes: [
      'Não coloque await dentro de funções comuns sem async (exceto no topo de módulos ES).',
    ],
    example: `async function buscarUsuario() {\n  try {\n    const res = await fetch('https://jsonplaceholder.typicode.com/users/1');\n    const user = await res.json();\n    console.log(user.name);\n  } catch (erro) {\n    console.error('Falha:', erro);\n  }\n}`,
  },
  {
    term: 'class',
    language: 'js',
    category: 'Palavra-chave de OOP',
    summary: 'Define um molde (classe) para criar objetos com propriedades e métodos compartilhados.',
    description:
      'Sintaxe moderna sobre protótipos em JavaScript. Inclui método constructor() para inicializar propriedades e suporta herança com extends.',
    syntax: 'class Pessoa {\n  constructor(nome) {\n    this.nome = nome;\n  }\n}',
    specsLabel: 'Recursos principais',
    specs: [
      {name: 'constructor()', detail: 'Executado automaticamente ao instanciar com new.'},
      {name: 'extends / super()', detail: 'Permite herdar métodos e propriedades de outra classe.'},
      {name: 'static', detail: 'Define métodos chamados direto na classe, não na instância.'},
    ],
    notes: [
      'Ao contrário de function declarada, classes não sofrem hoisting utilizável antes da linha onde foram declaradas.',
    ],
    example: `class Contador {\n  constructor(inicial = 0) {\n    this.valor = inicial;\n  }\n  incrementar() {\n    this.valor += 1;\n  }\n}\nconst c = new Contador(5);\nc.incrementar();`,
  },
  {
    term: 'console.log()',
    language: 'js',
    category: 'Método de depuração',
    summary: 'Imprime mensagens, variáveis ou objetos no console do navegador para inspecionar o código.',
    description:
      'Ferramenta fundamental de depuração. Aceita múltiplos argumentos separados por vírgula e possui variações como console.warn() (aviso), console.error() (erro) e console.table() (tabela).',
    syntax: 'console.log("Valor:", variavel);',
    specsLabel: 'Métodos irmãos',
    specs: [
      {name: 'console.warn()', detail: 'Exibe alerta amarelo no console.'},
      {name: 'console.error()', detail: 'Exibe mensagem de erro destacada.'},
      {name: 'console.table()', detail: 'Formata arrays de objetos em uma tabela.'},
    ],
    notes: [
      'Remova logs excessivos de código em produção para não poluir o console.',
    ],
    example: `const nome = 'Treks';\nconsole.log('Projeto:', nome);`,
  },
  {
    term: 'const',
    language: 'js',
    category: 'Declaração de variável',
    summary: 'Declara uma variável cujo vínculo (reatribuição) não pode ser trocado depois.',
    description:
      'Possui escopo de bloco (entre chaves {}) e exige um valor inicial na declaração. Deve ser a escolha padrão ao declarar variáveis em JavaScript moderno.',
    syntax: 'const taxa = 0.15;',
    specsLabel: 'Atenção com objetos e arrays',
    specs: [
      {name: 'Imutabilidade de referência', detail: 'Não pode fazer obj = outroObj, mas pode alterar propriedades internas (obj.nome = "Ana") ou dar push em um array.'},
    ],
    notes: [
      'Use let somente quando a variável realmente precisar ser reatribuída (como contadores).',
    ],
    example: `const lista = ['HTML', 'CSS'];\nlista.push('JS'); // Permitido\n// lista = [];    // Erro!`,
  },
  {
    term: 'createElement()',
    language: 'js',
    category: 'Método DOM',
    summary: 'Cria dinamicamente um novo elemento HTML na memória para ser inserido na página.',
    description:
      'Método de document que instancia qualquer tag HTML (como li, div, button) com segurança, permitindo configurar textContent, classes e eventos antes de anexá-la ao DOM.',
    syntax: 'const el = document.createElement("li");',
    specsLabel: 'Fluxo típico',
    specs: [
      {name: '1. Criar', detail: 'const item = document.createElement("li");'},
      {name: '2. Configurar', detail: 'item.textContent = "Novo item"; item.className = "ativo";'},
      {name: '3. Inserir', detail: 'pai.append(item) ou pai.prepend(item).'},
    ],
    notes: [
      'É mais seguro contra falhas XSS do que montar HTML concatenando strings com innerHTML quando houver dados do usuário.',
    ],
    example: `const li = document.createElement('li');\nli.textContent = 'Item criado via JS';\ndocument.querySelector('ul')?.append(li);`,
  },
  {
    term: 'document',
    language: 'js',
    category: 'Objeto global DOM',
    summary: 'Representa toda a página HTML carregada e serve de ponto de entrada para manipular o DOM.',
    description:
      'Por meio do objeto document você busca elementos (querySelector, getElementById), cria novos nós (createElement), lê o título da página e escuta eventos globais.',
    syntax: 'document.querySelector("h1");',
    specsLabel: 'Propriedades e métodos úteis',
    specs: [
      {name: 'document.title', detail: 'Lê ou altera o título da aba do navegador.'},
      {name: 'document.body', detail: 'Referência direta ao elemento <body>.'},
      {name: 'document.documentElement', detail: 'Referência ao <html> raiz (comum para alternar classe "dark").'},
    ],
    notes: [
      'Se o <script> estiver no <head> sem defer, aguarde o evento "DOMContentLoaded" antes de consultar elementos.',
    ],
    example: `document.title = 'Nova página';\nconsole.log(document.body.children.length);`,
  },
  {
    term: 'fetch()',
    language: 'js',
    category: 'API de rede',
    summary: 'Realiza requisições HTTP assíncronas para APIs e servidores externos.',
    description:
      'Retorna uma Promise que resolve para um objeto Response. É importante verificar response.ok antes de converter o corpo com response.json() ou response.text().',
    syntax: 'const res = await fetch(url, opcoes);',
    specsLabel: 'Opções comuns (2º argumento)',
    specs: [
      {name: 'method', detail: '"GET" (padrão), "POST", "PUT", "PATCH" ou "DELETE".'},
      {name: 'headers', detail: 'Cabeçalhos HTTP, como { "Content-Type": "application/json" }.'},
      {name: 'body', detail: 'Dados enviados (normalmente JSON.stringify(dados)).'},
    ],
    notes: [
      'fetch() não rejeita em erros HTTP 404 ou 500; sempre cheque if (!res.ok).',
    ],
    example: `const resposta = await fetch('/api/itens', {\n  method: 'POST',\n  headers: {'Content-Type': 'application/json'},\n  body: JSON.stringify({nome: 'Caderno'}),\n});\nif (!resposta.ok) throw new Error('Erro HTTP');`,
  },
  {
    term: 'for...of',
    language: 'js',
    category: 'Estrutura de repetição',
    summary: 'Percorre diretamente os valores de arrays, strings, Maps, Sets ou NodeLists.',
    description:
      'Forma limpa de iterar sem gerenciar índices numéricos. Diferente de forEach(), permite usar break, continue, return e await corretamente dentro do laço.',
    syntax: 'for (const item of colecao) { ... }',
    specsLabel: 'Compatibilidade',
    specs: [
      {name: 'Iteráveis aceitos', detail: 'Array, String, Set, Map, NodeList (resultado de querySelectorAll).'},
      {name: 'for...of vs for...in', detail: 'Use for...of para valores de arrays; for...in percorre nomes de chaves de objetos.'},
    ],
    notes: [
      'Para obter índice e valor juntos, use for (const [i, item] of lista.entries()).',
    ],
    example: `const frutas = ['Maçã', 'Banana', 'Uva'];\nfor (const fruta of frutas) {\n  if (fruta === 'Banana') continue;\n  console.log(fruta);\n}`,
  },
  {
    term: 'function',
    language: 'js',
    category: 'Declaração de função',
    summary: 'Declara um bloco de código reutilizável que recebe parâmetros e pode retornar um valor.',
    description:
      'Funções declaradas com function sofrem hoisting (podem ser chamadas antes da linha onde aparecem). Também podem ser escritas como arrow functions: (a, b) => a + b.',
    syntax: 'function somar(a, b = 0) {\n  return a + b;\n}',
    specsLabel: 'Conceitos',
    specs: [
      {name: 'Parâmetro padrão', detail: 'b = 0 define um valor automático se o argumento for omitido.'},
      {name: 'return', detail: 'Encerra a função e devolve o resultado para quem chamou.'},
    ],
    notes: [
      'Arrow functions (=>) não criam seu próprio this, sendo ideais para callbacks de array e eventos.',
    ],
    example: `function saudar(nome = 'visitante') {\n  return \`Olá, \${nome}!\`;\n}\nconsole.log(saudar('Clara'));`,
  },
  {
    term: 'getElementById()',
    language: 'js',
    category: 'Método DOM',
    summary: 'Busca rapidamente um único elemento HTML pelo valor exato do seu atributo id.',
    description:
      'Método direto do objeto document. Retorna o elemento encontrado ou null se nenhum elemento possuir aquele id.',
    syntax: 'const el = document.getElementById("meu-id");',
    specsLabel: 'Diferença para querySelector()',
    specs: [
      {name: 'Sem "#"', detail: 'Passe apenas o nome do id ("titulo"), sem colocar # na frente.'},
    ],
    notes: [
      'Sempre trate a possibilidade de null usando ?. ou um if antes de alterar propriedades.',
    ],
    example: `const titulo = document.getElementById('titulo-principal');\nif (titulo) {\n  titulo.textContent = 'Bem-vindo!';\n}`,
  },
  {
    term: 'if / else',
    language: 'js',
    category: 'Estrutura condicional',
    summary: 'Executa blocos diferentes de código conforme uma condição verdadeira ou falsa.',
    description:
      'Avalia uma expressão booleana (ou truthy/falsy). Pode encadear múltiplas verificações com else if e ter um caminho alternativo final com else.',
    syntax: 'if (condicao) {\n  // verdadeiro\n} else {\n  // falso\n}',
    specsLabel: 'Operadores comuns',
    specs: [
      {name: '=== / !==', detail: 'Igualdade e diferença estritas (comparam valor e tipo, preferível a ==).'},
      {name: '&& / || / !', detail: 'E lógico, OU lógico e negação.'},
    ],
    notes: [
      'Valores considerados falsos (falsy) automaticamente: false, 0, "", null, undefined e NaN.',
    ],
    example: `const nota = 8;\nif (nota >= 7) {\n  console.log('Aprovado');\n} else {\n  console.log('Em recuperação');\n}`,
  },
  {
    term: 'JSON.parse()',
    language: 'js',
    category: 'Método JSON',
    summary: 'Converte uma string no formato JSON de volta em objeto, array ou valor JavaScript.',
    description:
      'Muito usado ao ler dados guardados no localStorage ou textos vindos de arquivos e servidores. Lança SyntaxError se a string estiver malformada.',
    syntax: 'const objeto = JSON.parse(textoJson);',
    specsLabel: 'Segurança',
    specs: [
      {name: 'try / catch', detail: 'Sempre proteja JSON.parse() com try/catch ao ler dados externos ou do navegador.'},
    ],
    notes: [
      'JSON válido exige aspas duplas nas chaves e strings ({"nome": "Ana"}), nunca aspas simples.',
    ],
    example: `const bruto = '{"tema":"escuro","volume":0.8}';\nconst config = JSON.parse(bruto);\nconsole.log(config.tema); // "escuro"`,
  },
  {
    term: 'JSON.stringify()',
    language: 'js',
    category: 'Método JSON',
    summary: 'Converte um objeto ou array JavaScript em texto no formato JSON.',
    description:
      'Necessário para gravar objetos no localStorage ou enviar dados no corpo de uma requisição fetch POST.',
    syntax: 'const texto = JSON.stringify(objeto, null, 2);',
    specsLabel: 'Parâmetros opcionais',
    specs: [
      {name: 'replacer (2º)', detail: 'Passe null para manter todas as propriedades.'},
      {name: 'space (3º)', detail: 'Número de espaços (ex: 2) para formatar com indentação legível.'},
    ],
    notes: [
      'Funções e valores undefined dentro de objetos são omitidos na conversão JSON.',
    ],
    example: `const usuario = {nome: 'Lucas', ativo: true};\nlocalStorage.setItem('usuario', JSON.stringify(usuario));`,
  },
  {
    term: 'let',
    language: 'js',
    category: 'Declaração de variável',
    summary: 'Declara uma variável de escopo de bloco cujo valor pode ser reatribuído depois.',
    description:
      'Ideal para contadores, acumuladores ou variáveis que mudam ao longo da execução. Só existe dentro das chaves {} onde foi declarada.',
    syntax: 'let pontos = 0;\npontos += 10;',
    specsLabel: 'Diferença de var',
    specs: [
      {name: 'Escopo de bloco', detail: 'Ao contrário de var, let não vaza para fora de blocos if ou for.'},
    ],
    notes: [
      'Prefira const sempre que o valor não for ser reatribuído.',
    ],
    example: `let tentativas = 3;\ntentativas -= 1;\nconsole.log(tentativas); // 2`,
  },
  {
    term: 'localStorage',
    language: 'js',
    category: 'API de armazenamento',
    summary: 'Salva pares chave/valor no navegador de forma persistente mesmo após fechar a aba.',
    description:
      'Armazena strings localmente por domínio/origem. Para salvar objetos ou arrays, converta com JSON.stringify() ao gravar e JSON.parse() ao ler.',
    syntax: 'localStorage.setItem("chave", "valor");',
    specsLabel: 'Métodos principais',
    specs: [
      {name: 'setItem(chave, valor)', detail: 'Grava uma string na chave informada.'},
      {name: 'getItem(chave)', detail: 'Lê a string armazenada ou retorna null se não existir.'},
      {name: 'removeItem(chave)', detail: 'Apaga uma chave específica.'},
      {name: 'clear()', detail: 'Remove todos os dados salvos desse site.'},
    ],
    notes: [
      'Nunca guarde senhas ou segredos sensíveis no localStorage, pois qualquer script da página pode lê-lo.',
    ],
    example: `localStorage.setItem('tema', 'dark');\nconst tema = localStorage.getItem('tema') ?? 'light';`,
  },
  {
    term: 'Math',
    language: 'js',
    category: 'Objeto nativo',
    summary: 'Fornece constantes matemáticas (PI) e funções de arredondamento, aleatoriedade e cálculo.',
    description:
      'Objeto embutido com métodos estáticos prontos para números (Math não é instanciado com new).',
    syntax: 'Math.floor(Math.random() * 10);',
    specsLabel: 'Métodos mais usados',
    specs: [
      {name: 'Math.round() / floor() / ceil()', detail: 'Arredonda ao mais próximo, para baixo ou para cima.'},
      {name: 'Math.random()', detail: 'Número decimal aleatório >= 0 e < 1.'},
      {name: 'Math.min() / Math.max()', detail: 'Retorna o menor ou maior valor entre os argumentos.'},
      {name: 'Math.abs()', detail: 'Valor absoluto (sempre positivo).'},
    ],
    notes: [
      'Para sortear um inteiro entre min e max inclusivos: Math.floor(Math.random() * (max - min + 1)) + min.',
    ],
    example: `const dado = Math.floor(Math.random() * 6) + 1;\nconsole.log('Dado:', dado);`,
  },
  {
    term: 'Object.entries()',
    language: 'js',
    category: 'Método de Object',
    summary: 'Retorna um array de pares [chave, valor] de um objeto para facilitar iterações.',
    description:
      'Permite percorrer objetos comuns usando for...of, map() ou filter(). Irmão de Object.keys() (apenas chaves) e Object.values() (apenas valores).',
    syntax: 'Object.entries(objeto);',
    specsLabel: 'Métodos relacionados',
    specs: [
      {name: 'Object.keys(obj)', detail: 'Array com os nomes das propriedades.'},
      {name: 'Object.values(obj)', detail: 'Array com os valores das propriedades.'},
      {name: 'Object.fromEntries(pares)', detail: 'Operação inversa: transforma pares [chave, valor] em objeto.'},
    ],
    notes: [
      'Só inclui propriedades enumeráveis próprias do objeto.',
    ],
    example: `const notas = {HTML: 9, CSS: 10};\nfor (const [materia, nota] of Object.entries(notas)) {\n  console.log(materia, nota);\n}`,
  },
  {
    term: 'Promise',
    language: 'js',
    category: 'Objeto assíncrono',
    summary: 'Representa um valor que ainda será concluído no futuro (sucesso ou falha).',
    description:
      'Base de operações assíncronas como fetch(), temporizadores e leitura de arquivos. Possui três estados: pending (pendente), fulfilled (resolvida) ou rejected (rejeitada).',
    syntax: 'new Promise((resolve, reject) => { ... });',
    specsLabel: 'Métodos principais',
    specs: [
      {name: '.then() / .catch() / .finally()', detail: 'Encadeia sucesso, erro e limpeza final.'},
      {name: 'Promise.all([...])', detail: 'Aguarda todas terminarem juntas (falha se qualquer uma falhar).'},
      {name: 'Promise.allSettled([...])', detail: 'Aguarda todas terminarem e informa o resultado de cada uma.'},
    ],
    notes: [
      'Com async/await o código que consome Promises fica mais limpo do que encadear vários .then().',
    ],
    example: `const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));\nawait esperar(500);\nconsole.log('Meio segundo depois!');`,
  },
  {
    term: 'querySelector()',
    language: 'js',
    category: 'Método DOM',
    summary: 'Retorna o primeiro elemento HTML que corresponder a um seletor CSS.',
    description:
      'Aceita qualquer seletor CSS válido (#id, .classe, tag, [atributo], pai > filho). Retorna null se nada corresponder. Para pegar todos os correspondentes, use querySelectorAll().',
    syntax: 'const el = document.querySelector(".cartao.ativo");',
    specsLabel: 'Comparação com querySelectorAll()',
    specs: [
      {name: 'querySelector()', detail: 'Retorna apenas o primeiro Element ou null.'},
      {name: 'querySelectorAll()', detail: 'Retorna uma NodeList com todos os elementos encontrados (pode usar forEach).'},
    ],
    notes: [
      'Pode ser chamado também em um elemento específico (ex: form.querySelector("input")) para buscar só dentro dele.',
    ],
    example: `const botao = document.querySelector('button[type="submit"]');\nbotao?.classList.add('destaque');`,
  },
  {
    term: 'return',
    language: 'js',
    category: 'Palavra-chave de função',
    summary: 'Encerra a execução da função atual e opcionalmente devolve um valor.',
    description:
      'Qualquer código escrito após um return dentro do mesmo bloco não será executado. Se chamado sem valor (return;), devolve undefined.',
    syntax: 'return resultado;',
    specsLabel: 'Padrão útil',
    specs: [
      {name: 'Retorno antecipado (Guard clause)', detail: 'Valide casos inválidos logo no início com if (...) return; para evitar ifs aninhados.'},
    ],
    notes: [
      'Nunca quebre linha entre return e o valor retornado, pois o JavaScript pode inserir ; automático e retornar undefined.',
    ],
    example: `function dividir(a, b) {\n  if (b === 0) return null;\n  return a / b;\n}`,
  },
  {
    term: 'setInterval()',
    language: 'js',
    category: 'Temporizador',
    summary: 'Executa repetidamente uma função a cada intervalo fixo em milissegundos.',
    description:
      'Usado em relógios, cronômetros e atualizações periódicas. Retorna um ID numérico que deve ser passado para clearInterval(id) quando quiser parar a repetição.',
    syntax: 'const id = setInterval(() => { ... }, 1000);',
    specsLabel: 'Controle',
    specs: [
      {name: '1000 ms', detail: 'Equivale a 1 segundo.'},
      {name: 'clearInterval(id)', detail: 'Cancela o loop para evitar desperdício de memória.'},
    ],
    notes: [
      'Sempre limpe intervalos antigos antes de iniciar um novo quando o usuário clicar várias vezes.',
    ],
    example: `let segundos = 0;\nconst id = setInterval(() => {\n  segundos += 1;\n  console.log(segundos);\n  if (segundos >= 5) clearInterval(id);\n}, 1000);`,
  },
  {
    term: 'setTimeout()',
    language: 'js',
    category: 'Temporizador',
    summary: 'Agenda uma função para executar uma única vez após um atraso em milissegundos.',
    description:
      'Útil para ocultar notificações (toasts), aplicar debounce em buscas enquanto o usuário digita ou atrasar animações. Pode ser cancelado antes de rodar com clearTimeout(id).',
    syntax: 'const id = setTimeout(() => { ... }, 2000);',
    specsLabel: 'Parâmetros',
    specs: [
      {name: 'callback', detail: 'Função executada quando o tempo acabar.'},
      {name: 'delay', detail: 'Tempo em milissegundos (ex: 300 para 0,3s).'},
    ],
    notes: [
      'Use clearTimeout(id) ao receber nova digitação para implementar busca com debounce.',
    ],
    example: `const timer = setTimeout(() => {\n  console.log('Executado após 1,5s');\n}, 1500);`,
  },
  {
    term: 'spread (...)',
    language: 'js',
    category: 'Operador de espalhamento',
    summary: 'Expande elementos de um array, string ou propriedades de um objeto em outro.',
    description:
      'Representado por três pontos (...), permite copiar arrays/objetos sem mutar o original, juntar listas ou passar um array como argumentos de função.',
    syntax: 'const copia = [...lista, novoItem];\nconst perfil = {...base, ativo: true};',
    specsLabel: 'Usos principais',
    specs: [
      {name: 'Arrays', detail: '[...a, ...b] combina arrays em um novo.'},
      {name: 'Objetos', detail: '{...a, chave: novo} cria cópia sobrescrevendo campos específicos.'},
      {name: 'Rest em parâmetros', detail: 'function soma(...nums) agrupa argumentos em um array.'},
    ],
    notes: [
      'Realiza cópia rasa (shallow copy): objetos aninhados internos ainda compartilham referência.',
    ],
    example: `const padrao = {tema: 'claro', som: true};\nconst usuario = {...padrao, tema: 'escuro'};\nconsole.log(usuario);`,
  },
  {
    term: 'String.split()',
    language: 'js',
    category: 'Método de String',
    summary: 'Divide uma string em um array de pedaços usando um separador.',
    description:
      'Transforma frases em listas de palavras, linhas em arrays (split("\\n")) ou textos separados por vírgula (CSV) em itens manipuláveis.',
    syntax: 'const partes = texto.split(",");',
    specsLabel: 'Parâmetros',
    specs: [
      {name: 'separador', detail: 'Texto ou expressão regular onde fazer os cortes.'},
      {name: 'limit', detail: 'Opcional: quantidade máxima de pedaços no array retornado.'},
    ],
    notes: [
      'A operação oposta para juntar um array de volta em texto é array.join(", ").',
    ],
    example: `const tags = 'html,css,js'.split(',');\nconsole.log(tags); // ['html', 'css', 'js']`,
  },
  {
    term: 'String.trim()',
    language: 'js',
    category: 'Método de String',
    summary: 'Remove espaços em branco, tabulações e quebras de linha do início e do fim do texto.',
    description:
      'Indispensável ao validar formulários, evitando que um campo preenchido apenas com espaços pareça válido.',
    syntax: 'const limpo = texto.trim();',
    specsLabel: 'Variações',
    specs: [
      {name: 'trimStart()', detail: 'Remove espaços apenas do começo.'},
      {name: 'trimEnd()', detail: 'Remove espaços apenas do final.'},
    ],
    notes: [
      'Não altera espaços no meio da frase nem modifica a string original (retorna uma nova).',
    ],
    example: `const nome = '   Maria   '.trim();\nconsole.log(nome); // "Maria"`,
  },
  {
    term: 'switch',
    language: 'js',
    category: 'Estrutura condicional',
    summary: 'Compara um valor exato contra vários casos (case) possíveis de forma organizada.',
    description:
      'Alternativa limpa a vários else if comparando a mesma variável usando igualdade estrita (===).',
    syntax: 'switch (valor) {\n  case "a":\n    break;\n  default:\n    break;\n}',
    specsLabel: 'Palavras-chave',
    specs: [
      {name: 'case', detail: 'Define um valor possível para comparação estrita.'},
      {name: 'break', detail: 'Impede que a execução continue caindo nos casos abaixo.'},
      {name: 'default', detail: 'Executado quando nenhum case corresponder.'},
    ],
    notes: [
      'Se esquecer o break (e não der return), o JavaScript executará o próximo case automaticamente.',
    ],
    example: `const dia = 'seg';\nswitch (dia) {\n  case 'sab':\n  case 'dom':\n    console.log('Fim de semana');\n    break;\n  default:\n    console.log('Dia útil');\n}`,
  },
  {
    term: 'template literal (` `)',
    language: 'js',
    category: 'Sintaxe de String',
    summary: 'Strings entre crases que permitem interpolar variáveis com ${} e escrever múltiplas linhas.',
    description:
      'Substitui concatenações longas com + por expressões diretas dentro de ${expressao}, além de preservar quebras de linha no código.',
    syntax: '`Olá, ${nome}! Hoje é ${dia}.`',
    specsLabel: 'Recursos',
    specs: [
      {name: '${expressao}', detail: 'Aceita variáveis, cálculos ou chamadas de função.'},
      {name: 'Multilinha', detail: 'Permite quebrar linhas naturalmente sem \\n.'},
    ],
    notes: [
      'Usa crase (`), não aspas simples (\') nem aspas duplas (").',
    ],
    example: `const itens = 3;\nconst preco = 12;\nconsole.log(\`Total (\${itens} un.): R$ \${itens * preco}\`);`,
  },
  {
    term: 'try / catch',
    language: 'js',
    category: 'Tratamento de erros',
    summary: 'Captura erros em tempo de execução para evitar que o programa pare inesperadamente.',
    description:
      'O bloco try executa o código arriscado (como JSON.parse ou await fetch); se ocorrer uma exceção, o controle salta imediatamente para catch(error). O bloco opcional finally sempre roda ao final.',
    syntax: 'try {\n  // código\n} catch (erro) {\n  // tratamento\n} finally {\n  // sempre roda\n}',
    specsLabel: 'Blocos',
    specs: [
      {name: 'try', detail: 'Trecho monitorado contra exceções síncronas ou await.'},
      {name: 'catch (erro)', detail: 'Recebe o objeto Error com erro.message.'},
      {name: 'finally', detail: 'Opcional: ótimo para desligar indicadores de carregamento.'},
    ],
    notes: [
      'Não captura erros assíncronos dentro de callbacks como setTimeout a menos que o try esteja dentro do callback.',
    ],
    example: `try {\n  const dados = JSON.parse('{invalido}');\n} catch (erro) {\n  console.warn('JSON inválido:', erro.message);\n}`,
  },
  {
    term: 'typeof',
    language: 'js',
    category: 'Operador de tipo',
    summary: 'Retorna uma string informando o tipo primitivo de um valor ou variável.',
    description:
      'Útil para checar antes de manipular parâmetros recebidos ("string", "number", "boolean", "undefined", "function", "object").',
    syntax: 'typeof valor === "string"',
    specsLabel: 'Pegadinhas conhecidas',
    specs: [
      {name: 'typeof null', detail: 'Retorna "object" por legado histórico; teste null com valor === null.'},
      {name: 'typeof []', detail: 'Arrays também retornam "object"; use Array.isArray(valor).'},
    ],
    notes: [
      'Se uma variável nem existir no escopo, typeof variavel retorna "undefined" sem lançar erro.',
    ],
    example: `function formatar(v) {\n  if (typeof v === 'number') return v.toFixed(2);\n  return String(v);\n}`,
  },
  {
    term: 'while',
    language: 'js',
    category: 'Estrutura de repetição',
    summary: 'Repete um bloco de código enquanto a condição continuar verdadeira.',
    description:
      'Ideal quando não se sabe de antemão quantas repetições serão necessárias. A condição é testada antes de cada volta; na variante do...while, roda ao menos uma vez.',
    syntax: 'while (condicao) {\n  // código\n}',
    specsLabel: 'Cuidado essencial',
    specs: [
      {name: 'Loop infinito', detail: 'Garanta que algo dentro do while altere a condição para falsa em algum momento.'},
    ],
    notes: [
      'Para contagens fixas ou percorrer listas, for ou for...of costumam ser mais seguros.',
    ],
    example: `let n = 3;\nwhile (n > 0) {\n  console.log(n);\n  n -= 1;\n}`,
  },
  {
    term: 'window',
    language: 'js',
    category: 'Objeto global do navegador',
    summary: 'Objeto raiz da aba do navegador com medidas da janela, eventos globais e APIs Web.',
    description:
      'Representa a janela onde o documento roda. Contém innerWidth/innerHeight, location, history, matchMedia, timers e eventos como resize e keydown.',
    syntax: 'window.addEventListener("resize", () => { ... });',
    specsLabel: 'Propriedades úteis',
    specs: [
      {name: 'innerWidth / innerHeight', detail: 'Largura e altura úteis da janela em pixels.'},
      {name: 'location.href', detail: 'URL atual da página.'},
      {name: 'scrollTo(0, 0)', detail: 'Rola a página até a posição informada.'},
    ],
    notes: [
      'Evite criar variáveis globais soltas em window para não colidir com outros scripts.',
    ],
    example: `console.log('Largura da tela:', window.innerWidth);`,
  },
];

export const WEB_DICTIONARY: DictionaryEntry[] = RAW_ENTRIES.map((entry, index) => {
  const sortKey = entry.sortKey ?? computeSortKey(entry.term);
  return {
    ...entry,
    sortKey,
    id: `${entry.language}-${sortKey.replace(/[^a-z0-9]+/g, '-')}-${index}`,
  };
}).sort((a, b) => {
  const cmp = a.sortKey.localeCompare(b.sortKey, 'pt-BR', {sensitivity: 'base'});
  if (cmp !== 0) return cmp;
  return a.language.localeCompare(b.language);
});
