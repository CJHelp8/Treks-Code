import {LanguageTab} from '../types/snippet';
import {extractHtmlIds} from './diagnostics';

export type CompletionKind =
  | 'tag'
  | 'attr'
  | 'prop'
  | 'value'
  | 'fn'
  | 'method'
  | 'keyword'
  | 'snippet'
  | 'var';

export interface AutocompleteItem {
  id: string;
  label: string;
  kind: CompletionKind;
  detail: string;
  insertText: string;
  score: number;
}

export interface AutocompleteResult {
  items: AutocompleteItem[];
  replaceStart: number;
  replaceEnd: number;
  query: string;
}

interface RawSuggestion {
  label: string;
  kind: CompletionKind;
  detail: string;
  insertText: string;
  baseBoost?: number;
}

const HTML_VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const HTML_TAG_SUGGESTIONS: RawSuggestion[] = [
  {label: 'div', kind: 'tag', detail: 'Contêiner genérico de bloco', insertText: '<div>$0</div>', baseBoost: 18},
  {label: 'span', kind: 'tag', detail: 'Contêiner em linha', insertText: '<span>$0</span>', baseBoost: 15},
  {label: 'p', kind: 'tag', detail: 'Parágrafo de texto', insertText: '<p>$0</p>', baseBoost: 16},
  {label: 'h1', kind: 'tag', detail: 'Título principal', insertText: '<h1>$0</h1>', baseBoost: 16},
  {label: 'h2', kind: 'tag', detail: 'Subtítulo nível 2', insertText: '<h2>$0</h2>', baseBoost: 14},
  {label: 'h3', kind: 'tag', detail: 'Subtítulo nível 3', insertText: '<h3>$0</h3>', baseBoost: 12},
  {label: 'button', kind: 'tag', detail: 'Botão interativo', insertText: '<button type="button">$0</button>', baseBoost: 17},
  {label: 'a', kind: 'tag', detail: 'Link de navegação', insertText: '<a href="$0"></a>', baseBoost: 16},
  {label: 'img', kind: 'tag', detail: 'Imagem', insertText: '<img src="$0" alt="">', baseBoost: 15},
  {label: 'input', kind: 'tag', detail: 'Campo de entrada', insertText: '<input type="$0">', baseBoost: 16},
  {label: 'label', kind: 'tag', detail: 'Rótulo de formulário', insertText: '<label>$0</label>', baseBoost: 11},
  {label: 'form', kind: 'tag', detail: 'Formulário', insertText: '<form>\n  $0\n</form>', baseBoost: 13},
  {label: 'textarea', kind: 'tag', detail: 'Área de texto multilinha', insertText: '<textarea>$0</textarea>', baseBoost: 10},
  {label: 'select', kind: 'tag', detail: 'Lista suspensa', insertText: '<select>\n  <option value="$0"></option>\n</select>', baseBoost: 10},
  {label: 'option', kind: 'tag', detail: 'Opção de select', insertText: '<option value="$0"></option>', baseBoost: 9},
  {label: 'ul', kind: 'tag', detail: 'Lista não ordenada', insertText: '<ul>\n  <li>$0</li>\n</ul>', baseBoost: 14},
  {label: 'ol', kind: 'tag', detail: 'Lista ordenada', insertText: '<ol>\n  <li>$0</li>\n</ol>', baseBoost: 11},
  {label: 'li', kind: 'tag', detail: 'Item de lista', insertText: '<li>$0</li>', baseBoost: 14},
  {label: 'main', kind: 'tag', detail: 'Conteúdo principal', insertText: '<main>\n  $0\n</main>', baseBoost: 14},
  {label: 'header', kind: 'tag', detail: 'Cabeçalho da página/seção', insertText: '<header>\n  $0\n</header>', baseBoost: 14},
  {label: 'nav', kind: 'tag', detail: 'Barra de navegação', insertText: '<nav>\n  $0\n</nav>', baseBoost: 12},
  {label: 'section', kind: 'tag', detail: 'Seção temática', insertText: '<section>\n  $0\n</section>', baseBoost: 14},
  {label: 'article', kind: 'tag', detail: 'Conteúdo independente', insertText: '<article>\n  $0\n</article>', baseBoost: 10},
  {label: 'aside', kind: 'tag', detail: 'Conteúdo lateral', insertText: '<aside>\n  $0\n</aside>', baseBoost: 9},
  {label: 'footer', kind: 'tag', detail: 'Rodapé', insertText: '<footer>\n  $0\n</footer>', baseBoost: 12},
  {label: 'strong', kind: 'tag', detail: 'Texto com ênfase forte', insertText: '<strong>$0</strong>', baseBoost: 10},
  {label: 'em', kind: 'tag', detail: 'Texto enfatizado', insertText: '<em>$0</em>', baseBoost: 9},
  {label: 'code', kind: 'tag', detail: 'Trecho de código', insertText: '<code>$0</code>', baseBoost: 9},
  {label: 'pre', kind: 'tag', detail: 'Texto pré-formatado', insertText: '<pre>$0</pre>', baseBoost: 8},
  {label: 'br', kind: 'tag', detail: 'Quebra de linha', insertText: '<br>', baseBoost: 11},
  {label: 'hr', kind: 'tag', detail: 'Linha divisória', insertText: '<hr>', baseBoost: 10},
  {label: 'table', kind: 'tag', detail: 'Tabela', insertText: '<table>\n  <tr>\n    <td>$0</td>\n  </tr>\n</table>', baseBoost: 9},
  {label: 'thead', kind: 'tag', detail: 'Cabeçalho da tabela', insertText: '<thead>\n  $0\n</thead>', baseBoost: 7},
  {label: 'tbody', kind: 'tag', detail: 'Corpo da tabela', insertText: '<tbody>\n  $0\n</tbody>', baseBoost: 7},
  {label: 'tr', kind: 'tag', detail: 'Linha da tabela', insertText: '<tr>\n  <td>$0</td>\n</tr>', baseBoost: 8},
  {label: 'th', kind: 'tag', detail: 'Célula de cabeçalho', insertText: '<th>$0</th>', baseBoost: 7},
  {label: 'td', kind: 'tag', detail: 'Célula da tabela', insertText: '<td>$0</td>', baseBoost: 8},
  {label: 'canvas', kind: 'tag', detail: 'Área de desenho 2D/3D', insertText: '<canvas id="$0"></canvas>', baseBoost: 10},
  {label: 'svg', kind: 'tag', detail: 'Gráfico vetorial SVG', insertText: '<svg viewBox="0 0 24 24">\n  $0\n</svg>', baseBoost: 10},
  {label: 'video', kind: 'tag', detail: 'Reprodutor de vídeo', insertText: '<video src="$0" controls></video>', baseBoost: 9},
  {label: 'audio', kind: 'tag', detail: 'Reprodutor de áudio', insertText: '<audio src="$0" controls></audio>', baseBoost: 8},
  {label: 'iframe', kind: 'tag', detail: 'Quadro embutido', insertText: '<iframe src="$0"></iframe>', baseBoost: 8},
  {label: 'dialog', kind: 'tag', detail: 'Caixa de diálogo modal', insertText: '<dialog>\n  $0\n</dialog>', baseBoost: 8},
  {label: 'details', kind: 'tag', detail: 'Bloco expansível', insertText: '<details>\n  <summary>$0</summary>\n</details>', baseBoost: 8},
  {label: 'script', kind: 'tag', detail: 'Script embutido', insertText: '<script>\n  $0\n</script>', baseBoost: 10},
  {label: 'style', kind: 'tag', detail: 'Estilos embutidos', insertText: '<style>\n  $0\n</style>', baseBoost: 10},
  {label: 'link', kind: 'tag', detail: 'Vínculo externo (CSS/ícone)', insertText: '<link rel="stylesheet" href="$0">', baseBoost: 9},
  {label: 'meta', kind: 'tag', detail: 'Metadado do documento', insertText: '<meta name="$0" content="">', baseBoost: 8},
  {label: 'title', kind: 'tag', detail: 'Título da aba', insertText: '<title>$0</title>', baseBoost: 8},
  {label: 'head', kind: 'tag', detail: 'Cabeçalho do documento', insertText: '<head>\n  $0\n</head>', baseBoost: 7},
  {label: 'body', kind: 'tag', detail: 'Corpo do documento', insertText: '<body>\n  $0\n</body>', baseBoost: 7},
  {label: 'html', kind: 'tag', detail: 'Raiz do documento HTML', insertText: '<html lang="pt-BR">\n  $0\n</html>', baseBoost: 7},
  {
    label: '!',
    kind: 'snippet',
    detail: 'Estrutura básica HTML5',
    insertText:
      '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Documento</title>\n</head>\n<body>\n  $0\n</body>\n</html>',
    baseBoost: 20,
  },
];

const HTML_GLOBAL_ATTRS: RawSuggestion[] = [
  {label: 'class', kind: 'attr', detail: 'Classes CSS do elemento', insertText: 'class="$0"', baseBoost: 20},
  {label: 'id', kind: 'attr', detail: 'Identificador único', insertText: 'id="$0"', baseBoost: 19},
  {label: 'style', kind: 'attr', detail: 'Estilo inline CSS', insertText: 'style="$0"', baseBoost: 15},
  {label: 'title', kind: 'attr', detail: 'Texto de dica ao passar o mouse', insertText: 'title="$0"', baseBoost: 12},
  {label: 'hidden', kind: 'attr', detail: 'Ocultar elemento', insertText: 'hidden', baseBoost: 10},
  {label: 'tabindex', kind: 'attr', detail: 'Ordem de foco pelo teclado', insertText: 'tabindex="$0"', baseBoost: 9},
  {label: 'aria-label', kind: 'attr', detail: 'Rótulo de acessibilidade', insertText: 'aria-label="$0"', baseBoost: 11},
  {label: 'role', kind: 'attr', detail: 'Função semântica ARIA', insertText: 'role="$0"', baseBoost: 10},
  {label: 'data-', kind: 'attr', detail: 'Atributo personalizado data-*', insertText: 'data-$0=""', baseBoost: 11},
  {label: 'onclick', kind: 'attr', detail: 'Evento ao clicar', insertText: 'onclick="$0"', baseBoost: 11},
  {label: 'oninput', kind: 'attr', detail: 'Evento ao digitar', insertText: 'oninput="$0"', baseBoost: 9},
  {label: 'onchange', kind: 'attr', detail: 'Evento ao alterar valor', insertText: 'onchange="$0"', baseBoost: 9},
];

const HTML_TAG_ATTRS: Record<string, RawSuggestion[]> = {
  a: [
    {label: 'href', kind: 'attr', detail: 'URL de destino do link', insertText: 'href="$0"', baseBoost: 24},
    {label: 'target', kind: 'attr', detail: 'Onde abrir o link', insertText: 'target="$0"', baseBoost: 18},
    {label: 'rel', kind: 'attr', detail: 'Relação do link', insertText: 'rel="$0"', baseBoost: 14},
    {label: 'download', kind: 'attr', detail: 'Baixar arquivo vinculado', insertText: 'download="$0"', baseBoost: 12},
  ],
  img: [
    {label: 'src', kind: 'attr', detail: 'Caminho ou URL da imagem', insertText: 'src="$0"', baseBoost: 24},
    {label: 'alt', kind: 'attr', detail: 'Texto alternativo descritivo', insertText: 'alt="$0"', baseBoost: 22},
    {label: 'width', kind: 'attr', detail: 'Largura em pixels', insertText: 'width="$0"', baseBoost: 14},
    {label: 'height', kind: 'attr', detail: 'Altura em pixels', insertText: 'height="$0"', baseBoost: 14},
    {label: 'loading', kind: 'attr', detail: 'Carregamento (lazy / eager)', insertText: 'loading="$0"', baseBoost: 13},
  ],
  input: [
    {label: 'type', kind: 'attr', detail: 'Tipo do campo', insertText: 'type="$0"', baseBoost: 25},
    {label: 'placeholder', kind: 'attr', detail: 'Texto de exemplo', insertText: 'placeholder="$0"', baseBoost: 22},
    {label: 'value', kind: 'attr', detail: 'Valor inicial', insertText: 'value="$0"', baseBoost: 18},
    {label: 'name', kind: 'attr', detail: 'Nome do campo no formulário', insertText: 'name="$0"', baseBoost: 18},
    {label: 'required', kind: 'attr', detail: 'Campo obrigatório', insertText: 'required', baseBoost: 16},
    {label: 'disabled', kind: 'attr', detail: 'Desabilitar campo', insertText: 'disabled', baseBoost: 14},
    {label: 'min', kind: 'attr', detail: 'Valor mínimo', insertText: 'min="$0"', baseBoost: 11},
    {label: 'max', kind: 'attr', detail: 'Valor máximo', insertText: 'max="$0"', baseBoost: 11},
  ],
  button: [
    {label: 'type', kind: 'attr', detail: 'button, submit ou reset', insertText: 'type="$0"', baseBoost: 24},
    {label: 'disabled', kind: 'attr', detail: 'Desabilitar botão', insertText: 'disabled', baseBoost: 16},
  ],
  label: [
    {label: 'for', kind: 'attr', detail: 'ID do campo associado', insertText: 'for="$0"', baseBoost: 24},
  ],
  form: [
    {label: 'action', kind: 'attr', detail: 'URL de envio', insertText: 'action="$0"', baseBoost: 20},
    {label: 'method', kind: 'attr', detail: 'Método HTTP (get / post)', insertText: 'method="$0"', baseBoost: 18},
    {label: 'onsubmit', kind: 'attr', detail: 'Evento ao enviar', insertText: 'onsubmit="$0"', baseBoost: 16},
  ],
  link: [
    {label: 'rel', kind: 'attr', detail: 'Relação (stylesheet, icon...)', insertText: 'rel="$0"', baseBoost: 24},
    {label: 'href', kind: 'attr', detail: 'URL do recurso', insertText: 'href="$0"', baseBoost: 24},
  ],
  script: [
    {label: 'src', kind: 'attr', detail: 'URL do script externo', insertText: 'src="$0"', baseBoost: 24},
    {label: 'type', kind: 'attr', detail: 'Tipo (module)', insertText: 'type="$0"', baseBoost: 18},
    {label: 'defer', kind: 'attr', detail: 'Executar após HTML', insertText: 'defer', baseBoost: 16},
  ],
  textarea: [
    {label: 'rows', kind: 'attr', detail: 'Número de linhas visíveis', insertText: 'rows="$0"', baseBoost: 20},
    {label: 'placeholder', kind: 'attr', detail: 'Texto de exemplo', insertText: 'placeholder="$0"', baseBoost: 20},
    {label: 'name', kind: 'attr', detail: 'Nome do campo', insertText: 'name="$0"', baseBoost: 16},
  ],
  video: [
    {label: 'src', kind: 'attr', detail: 'URL do vídeo', insertText: 'src="$0"', baseBoost: 24},
    {label: 'controls', kind: 'attr', detail: 'Exibir controles', insertText: 'controls', baseBoost: 22},
    {label: 'autoplay', kind: 'attr', detail: 'Reproduzir automaticamente', insertText: 'autoplay', baseBoost: 14},
    {label: 'loop', kind: 'attr', detail: 'Repetir vídeo', insertText: 'loop', baseBoost: 14},
    {label: 'muted', kind: 'attr', detail: 'Iniciar sem som', insertText: 'muted', baseBoost: 14},
  ],
  audio: [
    {label: 'src', kind: 'attr', detail: 'URL do áudio', insertText: 'src="$0"', baseBoost: 24},
    {label: 'controls', kind: 'attr', detail: 'Exibir controles', insertText: 'controls', baseBoost: 22},
  ],
};

const HTML_ATTR_VALUES: Record<string, string[]> = {
  type: ['text', 'button', 'submit', 'email', 'password', 'number', 'checkbox', 'radio', 'date', 'range', 'color', 'file', 'search', 'hidden'],
  target: ['_blank', '_self', '_parent', '_top'],
  rel: ['stylesheet', 'noopener noreferrer', 'icon', 'preconnect'],
  loading: ['lazy', 'eager'],
  method: ['post', 'get'],
};

const CSS_PROPERTY_ITEMS: {name: string; detail: string; defaultVal?: string; boost?: number}[] = [
  {name: 'display', detail: 'Tipo de exibição (flex, grid, block...)', boost: 22},
  {name: 'position', detail: 'Posicionamento (relative, absolute...)', boost: 20},
  {name: 'flex', detail: 'Crescimento e encolhimento flex', boost: 17},
  {name: 'flex-direction', detail: 'Direção dos itens flex', boost: 19},
  {name: 'flex-wrap', detail: 'Quebra de linha em flex', boost: 15},
  {name: 'justify-content', detail: 'Alinhamento no eixo principal', boost: 20},
  {name: 'align-items', detail: 'Alinhamento no eixo cruzado', boost: 20},
  {name: 'align-self', detail: 'Alinhamento individual do item', boost: 14},
  {name: 'gap', detail: 'Espaçamento entre itens flex/grid', boost: 20},
  {name: 'grid-template-columns', detail: 'Colunas do Grid', boost: 18},
  {name: 'grid-template-rows', detail: 'Linhas do Grid', boost: 14},
  {name: 'place-items', detail: 'Alinha itens nos dois eixos', boost: 15},
  {name: 'width', detail: 'Largura do elemento', boost: 21},
  {name: 'height', detail: 'Altura do elemento', boost: 21},
  {name: 'min-width', detail: 'Largura mínima', boost: 14},
  {name: 'max-width', detail: 'Largura máxima', boost: 16},
  {name: 'min-height', detail: 'Altura mínima', boost: 15},
  {name: 'max-height', detail: 'Altura máxima', boost: 14},
  {name: 'margin', detail: 'Margem externa', boost: 21},
  {name: 'margin-top', detail: 'Margem superior', boost: 15},
  {name: 'margin-right', detail: 'Margem direita', boost: 14},
  {name: 'margin-bottom', detail: 'Margem inferior', boost: 15},
  {name: 'margin-left', detail: 'Margem esquerda', boost: 14},
  {name: 'padding', detail: 'Espaçamento interno', boost: 21},
  {name: 'padding-top', detail: 'Espaçamento interno superior', boost: 14},
  {name: 'padding-right', detail: 'Espaçamento interno direito', boost: 13},
  {name: 'padding-bottom', detail: 'Espaçamento interno inferior', boost: 14},
  {name: 'padding-left', detail: 'Espaçamento interno esquerdo', boost: 13},
  {name: 'color', detail: 'Cor do texto', boost: 22},
  {name: 'background', detail: 'Fundo (cor, gradiente ou imagem)', boost: 20},
  {name: 'background-color', detail: 'Cor de fundo', boost: 21},
  {name: 'background-image', detail: 'Imagem ou gradiente de fundo', boost: 15},
  {name: 'background-size', detail: 'Tamanho da imagem de fundo', boost: 13},
  {name: 'background-position', detail: 'Posição da imagem de fundo', boost: 12},
  {name: 'font-family', detail: 'Família tipográfica', boost: 18},
  {name: 'font-size', detail: 'Tamanho da fonte', boost: 20},
  {name: 'font-weight', detail: 'Peso/espessura da fonte', boost: 18},
  {name: 'font-style', detail: 'Estilo da fonte (normal, italic)', boost: 12},
  {name: 'line-height', detail: 'Altura da linha', boost: 16},
  {name: 'letter-spacing', detail: 'Espaçamento entre letras', boost: 13},
  {name: 'text-align', detail: 'Alinhamento do texto', boost: 18},
  {name: 'text-decoration', detail: 'Decoração do texto (underline, none...)', boost: 15},
  {name: 'text-transform', detail: 'Transformação (uppercase, capitalize...)', boost: 13},
  {name: 'text-overflow', detail: 'Comportamento ao exceder linha', boost: 11},
  {name: 'white-space', detail: 'Tratamento de espaços/quebras', boost: 12},
  {name: 'border', detail: 'Borda completa (espessura estilo cor)', boost: 20},
  {name: 'border-radius', detail: 'Arredondamento dos cantos', boost: 20},
  {name: 'border-color', detail: 'Cor da borda', boost: 14},
  {name: 'border-width', detail: 'Espessura da borda', boost: 13},
  {name: 'border-style', detail: 'Estilo da borda', boost: 12},
  {name: 'border-top', detail: 'Borda superior', boost: 12},
  {name: 'border-bottom', detail: 'Borda inferior', boost: 12},
  {name: 'outline', detail: 'Contorno externo (foco)', boost: 14},
  {name: 'box-shadow', detail: 'Sombra da caixa', boost: 18},
  {name: 'box-sizing', detail: 'Modelo de cálculo de largura/altura', boost: 16},
  {name: 'opacity', detail: 'Transparência (0 a 1)', boost: 17},
  {name: 'overflow', detail: 'Comportamento ao transbordar', boost: 17},
  {name: 'overflow-x', detail: 'Transbordamento horizontal', boost: 12},
  {name: 'overflow-y', detail: 'Transbordamento vertical', boost: 12},
  {name: 'cursor', detail: 'Cursor do mouse', boost: 18},
  {name: 'z-index', detail: 'Ordem de empilhamento', boost: 16},
  {name: 'top', detail: 'Deslocamento superior', boost: 15},
  {name: 'right', detail: 'Deslocamento direito', boost: 14},
  {name: 'bottom', detail: 'Deslocamento inferior', boost: 14},
  {name: 'left', detail: 'Deslocamento esquerdo', boost: 15},
  {name: 'inset', detail: 'Atalho top/right/bottom/left', boost: 14},
  {name: 'transform', detail: 'Transformações 2D/3D', boost: 18},
  {name: 'transition', detail: 'Transição animada de propriedades', boost: 19},
  {name: 'animation', detail: 'Animação com @keyframes', boost: 15},
  {name: 'filter', detail: 'Filtros visuais (blur, brightness...)', boost: 13},
  {name: 'backdrop-filter', detail: 'Filtro no fundo atrás do elemento', boost: 13},
  {name: 'object-fit', detail: 'Ajuste de mídia (cover, contain...)', boost: 14},
  {name: 'aspect-ratio', detail: 'Proporção largura/altura', boost: 14},
  {name: 'pointer-events', detail: 'Interação com ponteiro (none, auto)', boost: 13},
  {name: 'user-select', detail: 'Permissão de seleção de texto', boost: 12},
  {name: 'visibility', detail: 'Visibilidade (visible, hidden)', boost: 12},
  {name: 'list-style', detail: 'Marcador de lista (none, disc...)', boost: 12},
  {name: 'scroll-behavior', detail: 'Rolagem suave (smooth, auto)', boost: 12},
  {name: 'accent-color', detail: 'Cor de destaque de inputs nativos', boost: 11},
];

const CSS_VALUES_BY_PROP: Record<string, string[]> = {
  display: ['flex', 'grid', 'block', 'inline-block', 'inline-flex', 'inline', 'none', 'contents'],
  position: ['relative', 'absolute', 'fixed', 'sticky', 'static'],
  'flex-direction': ['column', 'row', 'column-reverse', 'row-reverse'],
  'flex-wrap': ['wrap', 'nowrap', 'wrap-reverse'],
  'justify-content': ['center', 'space-between', 'space-around', 'space-evenly', 'flex-start', 'flex-end'],
  'align-items': ['center', 'flex-start', 'flex-end', 'stretch', 'baseline'],
  'align-self': ['center', 'flex-start', 'flex-end', 'stretch', 'auto'],
  'place-items': ['center', 'start', 'end', 'stretch'],
  'text-align': ['center', 'left', 'right', 'justify'],
  'text-decoration': ['none', 'underline', 'line-through'],
  'text-transform': ['uppercase', 'lowercase', 'capitalize', 'none'],
  'font-weight': ['400', '500', '600', '700', 'bold', 'normal'],
  'font-style': ['italic', 'normal'],
  'box-sizing': ['border-box', 'content-box'],
  cursor: ['pointer', 'default', 'not-allowed', 'grab', 'text', 'move'],
  overflow: ['hidden', 'auto', 'scroll', 'visible', 'clip'],
  'overflow-x': ['hidden', 'auto', 'scroll', 'visible'],
  'overflow-y': ['hidden', 'auto', 'scroll', 'visible'],
  'object-fit': ['cover', 'contain', 'fill', 'none', 'scale-down'],
  'pointer-events': ['none', 'auto'],
  'user-select': ['none', 'text', 'all', 'auto'],
  visibility: ['hidden', 'visible', 'collapse'],
  'list-style': ['none', 'disc', 'decimal'],
  'scroll-behavior': ['smooth', 'auto'],
  'white-space': ['nowrap', 'pre', 'pre-wrap', 'normal'],
  'border-style': ['solid', 'dashed', 'dotted', 'none'],
  color: ['inherit', 'currentColor', 'transparent', '#$0', 'rgb($0)', 'hsl($0)'],
  'background-color': ['transparent', 'inherit', '#$0', 'rgb($0)', 'hsl($0)'],
  background: ['transparent', 'none', 'linear-gradient($0)', '#$0'],
  border: ['1px solid $0', 'none'],
  outline: ['none', '2px solid $0'],
  transition: ['all 200ms ease', 'transform 200ms ease, opacity 200ms ease'],
  transform: ['translateY($0)', 'translateX($0)', 'scale($0)', 'rotate($0deg)'],
};

const CSS_GENERIC_VALUES: RawSuggestion[] = [
  {label: 'var(--)', kind: 'value', detail: 'Variável CSS', insertText: 'var(--$0)', baseBoost: 12},
  {label: 'calc()', kind: 'value', detail: 'Cálculo de medida CSS', insertText: 'calc($0)', baseBoost: 12},
  {label: 'clamp()', kind: 'value', detail: 'Valor limitado (min, ideal, max)', insertText: 'clamp($0)', baseBoost: 10},
  {label: 'rgb()', kind: 'value', detail: 'Cor RGB', insertText: 'rgb($0)', baseBoost: 10},
  {label: 'linear-gradient()', kind: 'value', detail: 'Gradiente linear', insertText: 'linear-gradient($0)', baseBoost: 10},
  {label: 'auto', kind: 'value', detail: 'Valor automático', insertText: 'auto', baseBoost: 9},
  {label: 'inherit', kind: 'value', detail: 'Herdar do elemento pai', insertText: 'inherit', baseBoost: 8},
  {label: 'none', kind: 'value', detail: 'Sem valor / desativado', insertText: 'none', baseBoost: 9},
  {label: '100%', kind: 'value', detail: 'Cem por cento', insertText: '100%', baseBoost: 8},
];

const CSS_AT_RULES: RawSuggestion[] = [
  {label: '@media', kind: 'snippet', detail: 'Regra responsiva por tela', insertText: '@media (max-width: 768px) {\n  $0\n}', baseBoost: 20},
  {label: '@keyframes', kind: 'snippet', detail: 'Definir animação CSS', insertText: '@keyframes $0 {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}', baseBoost: 18},
  {label: '@import', kind: 'keyword', detail: 'Importar folha de estilo', insertText: "@import url('$0');", baseBoost: 14},
  {label: '@supports', kind: 'snippet', detail: 'Verificar suporte do navegador', insertText: '@supports ($0) {\n  \n}', baseBoost: 12},
  {label: '@layer', kind: 'snippet', detail: 'Camada de cascata CSS', insertText: '@layer $0 {\n  \n}', baseBoost: 10},
];

const CSS_PSEUDOS: RawSuggestion[] = [
  {label: ':hover', kind: 'keyword', detail: 'Ao passar o mouse', insertText: ':hover', baseBoost: 20},
  {label: ':focus', kind: 'keyword', detail: 'Quando focado', insertText: ':focus', baseBoost: 18},
  {label: ':focus-visible', kind: 'keyword', detail: 'Foco via teclado', insertText: ':focus-visible', baseBoost: 16},
  {label: ':active', kind: 'keyword', detail: 'Enquanto pressionado', insertText: ':active', baseBoost: 16},
  {label: ':first-child', kind: 'keyword', detail: 'Primeiro filho', insertText: ':first-child', baseBoost: 14},
  {label: ':last-child', kind: 'keyword', detail: 'Último filho', insertText: ':last-child', baseBoost: 14},
  {label: ':nth-child()', kind: 'keyword', detail: 'Filho na posição N', insertText: ':nth-child($0)', baseBoost: 13},
  {label: ':not()', kind: 'keyword', detail: 'Negação de seletor', insertText: ':not($0)', baseBoost: 12},
  {label: ':root', kind: 'keyword', detail: 'Raiz do documento (variáveis)', insertText: ':root', baseBoost: 15},
  {label: '::before', kind: 'keyword', detail: 'Pseudo-elemento antes', insertText: '::before', baseBoost: 15},
  {label: '::after', kind: 'keyword', detail: 'Pseudo-elemento depois', insertText: '::after', baseBoost: 15},
];

const JS_MEMBER_MAP: Record<string, RawSuggestion[]> = {
  document: [
    {label: 'querySelector', kind: 'method', detail: 'document.querySelector(seletor)', insertText: "querySelector('$0')", baseBoost: 25},
    {label: 'querySelectorAll', kind: 'method', detail: 'document.querySelectorAll(seletor)', insertText: "querySelectorAll('$0')", baseBoost: 22},
    {label: 'getElementById', kind: 'method', detail: 'document.getElementById(id)', insertText: "getElementById('$0')", baseBoost: 24},
    {label: 'createElement', kind: 'method', detail: 'document.createElement(tag)', insertText: "createElement('$0')", baseBoost: 21},
    {label: 'addEventListener', kind: 'method', detail: 'Ouvir evento no documento', insertText: "addEventListener('$0', (e) => {\n  \n})", baseBoost: 18},
    {label: 'body', kind: 'var', detail: 'Elemento <body> do documento', insertText: 'body', baseBoost: 16},
    {label: 'head', kind: 'var', detail: 'Elemento <head> do documento', insertText: 'head', baseBoost: 12},
    {label: 'title', kind: 'var', detail: 'Título da página', insertText: 'title', baseBoost: 14},
  ],
  console: [
    {label: 'log', kind: 'method', detail: 'Exibir mensagem no console', insertText: 'log($0)', baseBoost: 26},
    {label: 'warn', kind: 'method', detail: 'Exibir aviso no console', insertText: 'warn($0)', baseBoost: 18},
    {label: 'error', kind: 'method', detail: 'Exibir erro no console', insertText: 'error($0)', baseBoost: 20},
    {label: 'info', kind: 'method', detail: 'Exibir informação no console', insertText: 'info($0)', baseBoost: 15},
    {label: 'table', kind: 'method', detail: 'Exibir dados em tabela', insertText: 'table($0)', baseBoost: 14},
    {label: 'clear', kind: 'method', detail: 'Limpar console', insertText: 'clear()', baseBoost: 12},
  ],
  Math: [
    {label: 'floor', kind: 'method', detail: 'Arredondar para baixo', insertText: 'floor($0)', baseBoost: 22},
    {label: 'ceil', kind: 'method', detail: 'Arredondar para cima', insertText: 'ceil($0)', baseBoost: 18},
    {label: 'round', kind: 'method', detail: 'Arredondar para o mais próximo', insertText: 'round($0)', baseBoost: 20},
    {label: 'random', kind: 'method', detail: 'Número aleatório entre 0 e 1', insertText: 'random()', baseBoost: 23},
    {label: 'max', kind: 'method', detail: 'Maior valor', insertText: 'max($0)', baseBoost: 18},
    {label: 'min', kind: 'method', detail: 'Menor valor', insertText: 'min($0)', baseBoost: 18},
    {label: 'abs', kind: 'method', detail: 'Valor absoluto', insertText: 'abs($0)', baseBoost: 16},
    {label: 'pow', kind: 'method', detail: 'Potência (base, expoente)', insertText: 'pow($0)', baseBoost: 14},
    {label: 'sqrt', kind: 'method', detail: 'Raiz quadrada', insertText: 'sqrt($0)', baseBoost: 15},
    {label: 'PI', kind: 'var', detail: 'Constante π (3.14159...)', insertText: 'PI', baseBoost: 16},
  ],
  JSON: [
    {label: 'parse', kind: 'method', detail: 'Converter texto JSON em objeto', insertText: 'parse($0)', baseBoost: 24},
    {label: 'stringify', kind: 'method', detail: 'Converter objeto em texto JSON', insertText: 'stringify($0)', baseBoost: 24},
  ],
  Object: [
    {label: 'keys', kind: 'method', detail: 'Chaves de um objeto', insertText: 'keys($0)', baseBoost: 22},
    {label: 'values', kind: 'method', detail: 'Valores de um objeto', insertText: 'values($0)', baseBoost: 20},
    {label: 'entries', kind: 'method', detail: 'Pares [chave, valor]', insertText: 'entries($0)', baseBoost: 20},
    {label: 'assign', kind: 'method', detail: 'Combinar propriedades', insertText: 'assign($0)', baseBoost: 14},
  ],
  Array: [
    {label: 'from', kind: 'method', detail: 'Criar array a partir de iterável', insertText: 'from($0)', baseBoost: 20},
    {label: 'isArray', kind: 'method', detail: 'Verificar se é um array', insertText: 'isArray($0)', baseBoost: 18},
  ],
  localStorage: [
    {label: 'getItem', kind: 'method', detail: 'Ler item salvo', insertText: "getItem('$0')", baseBoost: 24},
    {label: 'setItem', kind: 'method', detail: 'Salvar item', insertText: "setItem('$0', '')", baseBoost: 24},
    {label: 'removeItem', kind: 'method', detail: 'Remover item', insertText: "removeItem('$0')", baseBoost: 18},
    {label: 'clear', kind: 'method', detail: 'Limpar armazenamento', insertText: 'clear()', baseBoost: 14},
  ],
  classList: [
    {label: 'add', kind: 'method', detail: 'Adicionar classe CSS', insertText: "add('$0')", baseBoost: 24},
    {label: 'remove', kind: 'method', detail: 'Remover classe CSS', insertText: "remove('$0')", baseBoost: 22},
    {label: 'toggle', kind: 'method', detail: 'Alternar classe CSS', insertText: "toggle('$0')", baseBoost: 23},
    {label: 'contains', kind: 'method', detail: 'Verificar se possui classe', insertText: "contains('$0')", baseBoost: 18},
  ],
  style: [
    {label: 'color', kind: 'var', detail: 'Cor do texto', insertText: "color = '$0'", baseBoost: 20},
    {label: 'backgroundColor', kind: 'var', detail: 'Cor de fundo', insertText: "backgroundColor = '$0'", baseBoost: 20},
    {label: 'display', kind: 'var', detail: 'Modo de exibição', insertText: "display = '$0'", baseBoost: 19},
    {label: 'opacity', kind: 'var', detail: 'Opacidade do elemento', insertText: "opacity = '$0'", baseBoost: 16},
    {label: 'transform', kind: 'var', detail: 'Transformação CSS', insertText: "transform = '$0'", baseBoost: 16},
    {label: 'width', kind: 'var', detail: 'Largura CSS', insertText: "width = '$0'", baseBoost: 15},
    {label: 'height', kind: 'var', detail: 'Altura CSS', insertText: "height = '$0'", baseBoost: 15},
  ],
};

const JS_GENERIC_MEMBERS: RawSuggestion[] = [
  {label: 'addEventListener', kind: 'method', detail: 'Adicionar ouvinte de evento', insertText: "addEventListener('$0', (event) => {\n  \n})", baseBoost: 22},
  {label: 'textContent', kind: 'var', detail: 'Texto interno do elemento', insertText: 'textContent', baseBoost: 20},
  {label: 'innerHTML', kind: 'var', detail: 'HTML interno do elemento', insertText: 'innerHTML', baseBoost: 19},
  {label: 'value', kind: 'var', detail: 'Valor do campo de entrada', insertText: 'value', baseBoost: 20},
  {label: 'classList', kind: 'var', detail: 'Manipular classes CSS', insertText: 'classList', baseBoost: 19},
  {label: 'style', kind: 'var', detail: 'Estilos inline do elemento', insertText: 'style', baseBoost: 18},
  {label: 'setAttribute', kind: 'method', detail: 'Definir atributo HTML', insertText: "setAttribute('$0', '')", baseBoost: 15},
  {label: 'getAttribute', kind: 'method', detail: 'Ler atributo HTML', insertText: "getAttribute('$0')", baseBoost: 15},
  {label: 'appendChild', kind: 'method', detail: 'Inserir elemento filho', insertText: 'appendChild($0)', baseBoost: 16},
  {label: 'remove', kind: 'method', detail: 'Remover elemento do DOM', insertText: 'remove()', baseBoost: 14},
  {label: 'focus', kind: 'method', detail: 'Focar elemento', insertText: 'focus()', baseBoost: 14},
  {label: 'length', kind: 'var', detail: 'Quantidade de itens/caracteres', insertText: 'length', baseBoost: 21},
  {label: 'map', kind: 'method', detail: 'Transformar cada item do array', insertText: 'map((item) => $0)', baseBoost: 21},
  {label: 'filter', kind: 'method', detail: 'Filtrar itens do array', insertText: 'filter((item) => $0)', baseBoost: 20},
  {label: 'forEach', kind: 'method', detail: 'Percorrer cada item', insertText: 'forEach((item) => {\n  $0\n})', baseBoost: 20},
  {label: 'find', kind: 'method', detail: 'Encontrar primeiro item', insertText: 'find((item) => $0)', baseBoost: 17},
  {label: 'reduce', kind: 'method', detail: 'Reduzir array a um valor', insertText: 'reduce((acc, item) => $0, 0)', baseBoost: 15},
  {label: 'push', kind: 'method', detail: 'Adicionar ao final do array', insertText: 'push($0)', baseBoost: 18},
  {label: 'includes', kind: 'method', detail: 'Verificar se contém valor', insertText: 'includes($0)', baseBoost: 17},
  {label: 'join', kind: 'method', detail: 'Juntar itens em string', insertText: "join('$0')", baseBoost: 15},
  {label: 'split', kind: 'method', detail: 'Dividir string em array', insertText: "split('$0')", baseBoost: 16},
  {label: 'trim', kind: 'method', detail: 'Remover espaços das pontas', insertText: 'trim()', baseBoost: 16},
  {label: 'replace', kind: 'method', detail: 'Substituir trecho de texto', insertText: "replace('$0', '')", baseBoost: 15},
  {label: 'slice', kind: 'method', detail: 'Extrair fatia', insertText: 'slice($0)', baseBoost: 14},
  {label: 'toLowerCase', kind: 'method', detail: 'Converter para minúsculas', insertText: 'toLowerCase()', baseBoost: 14},
  {label: 'toUpperCase', kind: 'method', detail: 'Converter para maiúsculas', insertText: 'toUpperCase()', baseBoost: 14},
  {label: 'then', kind: 'method', detail: 'Tratar resultado da Promise', insertText: 'then(($0) => {\n  \n})', baseBoost: 16},
  {label: 'catch', kind: 'method', detail: 'Capturar erro da Promise', insertText: 'catch((erro) => {\n  $0\n})', baseBoost: 15},
];

const JS_TOP_LEVEL: RawSuggestion[] = [
  {label: 'console.log', kind: 'fn', detail: 'Imprimir no console', insertText: 'console.log($0);', baseBoost: 26},
  {label: 'document.querySelector', kind: 'fn', detail: 'Selecionar primeiro elemento CSS', insertText: "document.querySelector('$0')", baseBoost: 24},
  {label: 'document.querySelectorAll', kind: 'fn', detail: 'Selecionar todos os elementos', insertText: "document.querySelectorAll('$0')", baseBoost: 20},
  {label: 'document.getElementById', kind: 'fn', detail: 'Selecionar elemento por id', insertText: "document.getElementById('$0')", baseBoost: 23},
  {label: 'document.createElement', kind: 'fn', detail: 'Criar novo elemento HTML', insertText: "document.createElement('$0')", baseBoost: 20},
  {label: 'document', kind: 'var', detail: 'Objeto DOM da página', insertText: 'document', baseBoost: 22},
  {label: 'window', kind: 'var', detail: 'Janela global do navegador', insertText: 'window', baseBoost: 17},
  {label: 'console', kind: 'var', detail: 'Console de depuração', insertText: 'console', baseBoost: 21},
  {label: 'fetch', kind: 'fn', detail: 'Fazer requisição HTTP (Promise)', insertText: "fetch('$0')", baseBoost: 20},
  {label: 'setTimeout', kind: 'fn', detail: 'Executar função após atraso', insertText: 'setTimeout(() => {\n  $0\n}, 1000);', baseBoost: 21},
  {label: 'setInterval', kind: 'fn', detail: 'Executar função repetidamente', insertText: 'setInterval(() => {\n  $0\n}, 1000);', baseBoost: 19},
  {label: 'clearTimeout', kind: 'fn', detail: 'Cancelar temporizador setTimeout', insertText: 'clearTimeout($0);', baseBoost: 13},
  {label: 'clearInterval', kind: 'fn', detail: 'Cancelar repetição setInterval', insertText: 'clearInterval($0);', baseBoost: 13},
  {label: 'requestAnimationFrame', kind: 'fn', detail: 'Agendar atualização de quadro', insertText: 'requestAnimationFrame($0)', baseBoost: 14},
  {label: 'parseInt', kind: 'fn', detail: 'Converter string para inteiro', insertText: 'parseInt($0, 10)', baseBoost: 17},
  {label: 'parseFloat', kind: 'fn', detail: 'Converter string para decimal', insertText: 'parseFloat($0)', baseBoost: 16},
  {label: 'Number', kind: 'fn', detail: 'Converter valor para número', insertText: 'Number($0)', baseBoost: 16},
  {label: 'String', kind: 'fn', detail: 'Converter valor para texto', insertText: 'String($0)', baseBoost: 15},
  {label: 'Boolean', kind: 'fn', detail: 'Converter valor para booleano', insertText: 'Boolean($0)', baseBoost: 12},
  {label: 'Math', kind: 'var', detail: 'Funções e constantes matemáticas', insertText: 'Math', baseBoost: 18},
  {label: 'JSON', kind: 'var', detail: 'Manipulação de JSON', insertText: 'JSON', baseBoost: 18},
  {label: 'Array', kind: 'var', detail: 'Construtor e utilitários de Array', insertText: 'Array', baseBoost: 15},
  {label: 'Object', kind: 'var', detail: 'Utilitários de Objeto', insertText: 'Object', baseBoost: 15},
  {label: 'Date', kind: 'fn', detail: 'Data e hora atual', insertText: 'new Date($0)', baseBoost: 15},
  {label: 'Promise', kind: 'fn', detail: 'Operação assíncrona', insertText: 'new Promise((resolve, reject) => {\n  $0\n})', baseBoost: 14},
  {label: 'localStorage', kind: 'var', detail: 'Armazenamento local do navegador', insertText: 'localStorage', baseBoost: 16},
  {label: 'alert', kind: 'fn', detail: 'Exibir caixa de alerta', insertText: 'alert($0);', baseBoost: 14},
  {label: 'const', kind: 'keyword', detail: 'Declarar constante', insertText: 'const $0 = ', baseBoost: 24},
  {label: 'let', kind: 'keyword', detail: 'Declarar variável mutável', insertText: 'let $0 = ', baseBoost: 22},
  {label: 'function', kind: 'snippet', detail: 'Declarar função', insertText: 'function $0() {\n  \n}', baseBoost: 22},
  {label: 'async function', kind: 'snippet', detail: 'Declarar função assíncrona', insertText: 'async function $0() {\n  \n}', baseBoost: 18},
  {label: 'if', kind: 'snippet', detail: 'Condição if', insertText: 'if ($0) {\n  \n}', baseBoost: 22},
  {label: 'else', kind: 'snippet', detail: 'Bloco else', insertText: 'else {\n  $0\n}', baseBoost: 18},
  {label: 'else if', kind: 'snippet', detail: 'Condição else if', insertText: 'else if ($0) {\n  \n}', baseBoost: 17},
  {label: 'for', kind: 'snippet', detail: 'Laço for clássico', insertText: 'for (let i = 0; i < $0; i++) {\n  \n}', baseBoost: 20},
  {label: 'forof', kind: 'snippet', detail: 'Laço for...of sobre iterável', insertText: 'for (const item of $0) {\n  \n}', baseBoost: 17},
  {label: 'while', kind: 'snippet', detail: 'Laço while', insertText: 'while ($0) {\n  \n}', baseBoost: 16},
  {label: 'try', kind: 'snippet', detail: 'Tratamento de erro try/catch', insertText: 'try {\n  $0\n} catch (erro) {\n  console.error(erro);\n}', baseBoost: 17},
  {label: 'switch', kind: 'snippet', detail: 'Estrutura switch/case', insertText: 'switch ($0) {\n  case :\n    break;\n  default:\n    break;\n}', baseBoost: 14},
  {label: 'class', kind: 'snippet', detail: 'Definir classe', insertText: 'class $0 {\n  constructor() {\n    \n  }\n}', baseBoost: 15},
  {label: 'return', kind: 'keyword', detail: 'Retornar valor da função', insertText: 'return $0;', baseBoost: 20},
  {label: 'await', kind: 'keyword', detail: 'Aguardar Promise', insertText: 'await $0', baseBoost: 18},
];

function scoreCandidate(label: string, query: string, baseBoost = 0): number | null {
  if (!query) {
    return 50 + baseBoost;
  }
  const lowerLabel = label.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerLabel === lowerQuery) {
    return 200 + baseBoost;
  }
  if (lowerLabel.startsWith(lowerQuery)) {
    return 140 - Math.min(25, label.length - query.length) + baseBoost;
  }
  const idx = lowerLabel.indexOf(lowerQuery);
  if (idx !== -1) {
    const boundaryBonus = idx > 0 && /[-_.\s]/.test(lowerLabel[idx - 1]) ? 20 : 0;
    return 90 + boundaryBonus - idx + baseBoost;
  }

  // Fuzzy subsequence match for longer queries
  let qIdx = 0;
  for (let i = 0; i < lowerLabel.length && qIdx < lowerQuery.length; i += 1) {
    if (lowerLabel[i] === lowerQuery[qIdx]) {
      qIdx += 1;
    }
  }
  if (qIdx === lowerQuery.length) {
    return 55 - (lowerLabel.length - lowerQuery.length) + baseBoost;
  }
  return null;
}

function rankSuggestions(
  candidates: RawSuggestion[],
  query: string,
  replaceStart: number,
  replaceEnd: number,
  limit = 12
): AutocompleteResult | null {
  const seen = new Set<string>();
  const scored: AutocompleteItem[] = [];

  for (const item of candidates) {
    const dedupKey = `${item.kind}:${item.label}`;
    if (seen.has(dedupKey)) continue;
    const score = scoreCandidate(item.label, query, item.baseBoost ?? 0);
    if (score === null) continue;
    seen.add(dedupKey);
    scored.push({
      id: dedupKey,
      label: item.label,
      kind: item.kind,
      detail: item.detail,
      insertText: item.insertText,
      score,
    });
  }

  if (scored.length === 0) return null;

  scored.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  return {
    items: scored.slice(0, limit),
    replaceStart,
    replaceEnd,
    query,
  };
}

function getUnclosedHtmlTagsBefore(source: string): string[] {
  const stack: string[] = [];
  const masked = source.replace(/<!--[\s\S]*?-->/g, ' ');
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:\s+(?:"[^"]*"|'[^']*'|[^>"'])*)?(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(masked)) !== null) {
    const full = m[0];
    const tag = m[1].toLowerCase();
    const isClosing = full.startsWith('</');
    const isSelf = m[2] === '/' || HTML_VOID_TAGS.has(tag);
    if (isSelf) continue;
    if (isClosing) {
      const idx = stack.lastIndexOf(tag);
      if (idx !== -1) {
        stack.splice(idx);
      }
    } else {
      stack.push(tag);
    }
  }
  return stack;
}

function getHtmlSuggestions(
  code: string,
  cursorPos: number,
  manual: boolean
): AutocompleteResult | null {
  const before = code.slice(0, cursorPos);
  const lineStart = before.lastIndexOf('\n') + 1;
  const lineBefore = before.slice(lineStart);

  // 1) Closing tag after </
  const closeMatch = before.match(/<\/([a-zA-Z0-9-]*)$/);
  if (closeMatch) {
    const query = closeMatch[1];
    const replaceStart = cursorPos - closeMatch[0].length;
    const unclosed = getUnclosedHtmlTagsBefore(before.slice(0, replaceStart)).reverse();
    const candidates: RawSuggestion[] = unclosed.map((tag, index) => ({
      label: `</${tag}>`,
      kind: 'tag',
      detail: index === 0 ? 'Fechar tag aberta mais recente' : 'Fechar tag aberta',
      insertText: `</${tag}>`,
      baseBoost: 40 - index * 4,
    }));
    for (const t of HTML_TAG_SUGGESTIONS) {
      if (t.kind === 'tag' && !HTML_VOID_TAGS.has(t.label)) {
        candidates.push({
          label: `</${t.label}>`,
          kind: 'tag',
          detail: `Fechar tag <${t.label}>`,
          insertText: `</${t.label}>`,
          baseBoost: 5,
        });
      }
    }
    return rankSuggestions(candidates, query ? `</${query}` : '</', replaceStart, cursorPos);
  }

  // 2) Inside an open HTML tag (<div ... |)
  const lastOpenAngle = before.lastIndexOf('<');
  const lastCloseAngle = before.lastIndexOf('>');
  if (lastOpenAngle > lastCloseAngle) {
    const insideTag = before.slice(lastOpenAngle + 1);

    // 2a) Tag name right after `<` (e.g. `<`, `<di`)
    const tagNameMatch = insideTag.match(/^([a-zA-Z0-9-]*|!)$/);
    if (tagNameMatch) {
      const query = tagNameMatch[1];
      const replaceStart = lastOpenAngle;
      return rankSuggestions(HTML_TAG_SUGGESTIONS, query, replaceStart, cursorPos);
    }

    // 2b) Attribute value inside quotes: <input type="te
    const attrValMatch = insideTag.match(
      /^([a-zA-Z][a-zA-Z0-9-]*)\b[\s\S]*\s([a-zA-Z-]+)\s*=\s*(?:"([^"]*)|'([^']*))$/
    );
    if (attrValMatch) {
      const attrName = attrValMatch[2].toLowerCase();
      const valQuery = attrValMatch[3] ?? attrValMatch[4] ?? '';
      const values = HTML_ATTR_VALUES[attrName];
      if (values) {
        const replaceStart = cursorPos - valQuery.length;
        const candidates: RawSuggestion[] = values.map((val, idx) => ({
          label: val,
          kind: 'value',
          detail: `Valor para ${attrName}`,
          insertText: val,
          baseBoost: 20 - idx,
        }));
        return rankSuggestions(candidates, valQuery, replaceStart, cursorPos);
      }
      return null;
    }

    // 2c) Attribute name inside tag: <div cla
    const attrNameMatch = insideTag.match(
      /^([a-zA-Z][a-zA-Z0-9-]*)\b[\s\S]*?\s([a-zA-Z-]*)$/
    );
    if (attrNameMatch) {
      const tagName = attrNameMatch[1].toLowerCase();
      const query = attrNameMatch[2];
      if (!query && !manual) return null;
      const replaceStart = cursorPos - query.length;
      const tagSpecific = HTML_TAG_ATTRS[tagName] ?? [];
      return rankSuggestions(
        [...tagSpecific, ...HTML_GLOBAL_ATTRS],
        query,
        replaceStart,
        cursorPos
      );
    }

    return null;
  }

  // 3) Emmet-like bare tag or `!` snippet on a clean indented line: `  di` or `!`
  const bareLineMatch = lineBefore.match(/^[ \t]*(!|[a-zA-Z][a-zA-Z0-9]*)$/);
  if (bareLineMatch) {
    const token = bareLineMatch[1];
    if (token === '!' || token.length >= 2 || manual) {
      const replaceStart = cursorPos - token.length;
      return rankSuggestions(HTML_TAG_SUGGESTIONS, token, replaceStart, cursorPos);
    }
  } else if (manual) {
    const wordMatch = lineBefore.match(/([a-zA-Z0-9-]*)$/);
    const query = wordMatch ? wordMatch[1] : '';
    return rankSuggestions(
      HTML_TAG_SUGGESTIONS,
      query,
      cursorPos - query.length,
      cursorPos
    );
  }

  return null;
}

function getCssSuggestions(
  code: string,
  cursorPos: number,
  manual: boolean
): AutocompleteResult | null {
  const before = code.slice(0, cursorPos);
  const after = code.slice(cursorPos);

  // Determine whether cursor is inside `{ ... }`
  const openBraces = (before.match(/\{/g) || []).length;
  const closeBraces = (before.match(/\}/g) || []).length;
  const insideBlock = openBraces > closeBraces;

  const lineStart = before.lastIndexOf('\n') + 1;
  const lineBefore = before.slice(lineStart);

  if (!insideBlock) {
    // At-rule after @
    const atMatch = lineBefore.match(/@([a-zA-Z-]*)$/);
    if (atMatch) {
      const replaceStart = cursorPos - atMatch[0].length;
      return rankSuggestions(CSS_AT_RULES, `@${atMatch[1]}`, replaceStart, cursorPos);
    }

    // Pseudo-class / pseudo-element after :
    const pseudoMatch = lineBefore.match(/(::?[a-zA-Z-]*)$/);
    if (pseudoMatch) {
      const replaceStart = cursorPos - pseudoMatch[1].length;
      return rankSuggestions(CSS_PSEUDOS, pseudoMatch[1], replaceStart, cursorPos);
    }

    if (manual) {
      const tokenMatch = lineBefore.match(/([a-zA-Z@:-]*)$/);
      const query = tokenMatch ? tokenMatch[1] : '';
      return rankSuggestions(
        [...CSS_AT_RULES, ...CSS_PSEUDOS],
        query,
        cursorPos - query.length,
        cursorPos
      );
    }
    return null;
  }

  // Inside `{ ... }`: check current statement since last `{`, `;`, or `}`
  const lastDelim = Math.max(
    before.lastIndexOf('{'),
    before.lastIndexOf(';'),
    before.lastIndexOf('}')
  );
  const statementBefore = before.slice(lastDelim + 1);
  const colonIdx = statementBefore.indexOf(':');

  if (colonIdx !== -1) {
    // Property value completion
    const propName = statementBefore.slice(0, colonIdx).trim().toLowerCase();
    const afterColon = statementBefore.slice(colonIdx + 1);
    const valMatch = afterColon.match(/([a-zA-Z0-9#-]*)$/);
    const valQuery = valMatch ? valMatch[1] : '';
    if (!valQuery && !manual && !afterColon.endsWith(' ')) {
      return null;
    }
    if (!valQuery && !manual && afterColon.trim().length > 0) {
      return null;
    }

    const specificValues = CSS_VALUES_BY_PROP[propName] ?? [];
    const candidates: RawSuggestion[] = [
      ...specificValues.map((val, idx) => ({
        label: val.replace('$0', ''),
        kind: 'value' as const,
        detail: `Valor de ${propName}`,
        insertText: val,
        baseBoost: 28 - idx,
      })),
      ...CSS_GENERIC_VALUES,
    ];
    return rankSuggestions(
      candidates,
      valQuery,
      cursorPos - valQuery.length,
      cursorPos
    );
  }

  // Property name completion
  const propMatch = statementBefore.match(/([a-zA-Z-]+)$/);
  const propQuery = propMatch ? propMatch[1] : '';
  if (!propQuery && !manual) return null;

  const hasTrailingColonOrSemi = /^[ \t]*[:;]/.test(after);
  const candidates: RawSuggestion[] = CSS_PROPERTY_ITEMS.map((prop) => ({
    label: prop.name,
    kind: 'prop',
    detail: prop.detail,
    insertText: hasTrailingColonOrSemi ? prop.name : `${prop.name}: $0;`,
    baseBoost: prop.boost ?? 10,
  }));

  return rankSuggestions(
    candidates,
    propQuery,
    cursorPos - propQuery.length,
    cursorPos
  );
}

function extractDeclaredJsSymbols(js: string): string[] {
  const symbols = new Set<string>();
  const declRegex =
    /\b(?:const|let|var|function\*?|class)\s+([a-zA-Z_$][\w$]*)/g;
  let m: RegExpExecArray | null;
  while ((m = declRegex.exec(js)) !== null) {
    symbols.add(m[1]);
  }
  return Array.from(symbols);
}

function getJsSuggestions(
  code: string,
  cursorPos: number,
  htmlCode: string,
  manual: boolean
): AutocompleteResult | null {
  const before = code.slice(0, cursorPos);
  const lineStart = before.lastIndexOf('\n') + 1;
  const lineBefore = before.slice(lineStart);

  // Ignore inside // line comment
  if (/\/\/[^\n]*$/.test(lineBefore)) {
    return null;
  }

  // 1) HTML ID completion inside document.getElementById('...') or querySelector('#...')
  const domIdMatch = lineBefore.match(
    /(?:getElementById\(\s*['"]|querySelector(?:All)?\(\s*['"]#)([a-zA-Z0-9_-]*)$/
  );
  if (domIdMatch) {
    const query = domIdMatch[1];
    const htmlIds = Array.from(extractHtmlIds(htmlCode));
    if (htmlIds.length > 0) {
      const candidates: RawSuggestion[] = htmlIds.map((id) => ({
        label: id,
        kind: 'var',
        detail: 'ID encontrado no HTML',
        insertText: id,
        baseBoost: 30,
      }));
      return rankSuggestions(
        candidates,
        query,
        cursorPos - query.length,
        cursorPos
      );
    }
    return null;
  }

  // 2) Member completion after `.` (e.g. `document.qu` or `lista.`)
  const memberMatch = lineBefore.match(/([a-zA-Z_$][\w$]*)\s*\.\s*([a-zA-Z_$][\w$]*)?$/);
  if (memberMatch) {
    const receiver = memberMatch[1];
    const query = memberMatch[2] ?? '';
    const replaceStart = cursorPos - query.length;
    const mapped = JS_MEMBER_MAP[receiver];
    const candidates = mapped ? [...mapped, ...JS_GENERIC_MEMBERS] : JS_GENERIC_MEMBERS;
    return rankSuggestions(candidates, query, replaceStart, cursorPos);
  }

  // 3) Identifier / keyword / snippet completion
  const identMatch = lineBefore.match(/([a-zA-Z_$][\w$]*)$/);
  const query = identMatch ? identMatch[1] : '';
  if (!manual && query.length < 2) {
    return null;
  }

  const declared = extractDeclaredJsSymbols(code);
  const localCandidates: RawSuggestion[] = declared
    .filter((name) => name !== query)
    .map((name) => ({
      label: name,
      kind: 'var',
      detail: 'Declarado neste arquivo',
      insertText: name,
      baseBoost: 18,
    }));

  return rankSuggestions(
    [...localCandidates, ...JS_TOP_LEVEL],
    query,
    cursorPos - query.length,
    cursorPos
  );
}

export function getAutocompleteSuggestions(
  tab: LanguageTab,
  code: string,
  cursorPos: number,
  htmlCode = '',
  manual = false
): AutocompleteResult | null {
  if (cursorPos < 0 || cursorPos > code.length) return null;

  if (tab === 'html') {
    return getHtmlSuggestions(code, cursorPos, manual);
  }
  if (tab === 'css') {
    return getCssSuggestions(code, cursorPos, manual);
  }
  return getJsSuggestions(code, cursorPos, htmlCode, manual);
}

export function applyAutocompleteInsertion(
  code: string,
  replaceStart: number,
  replaceEnd: number,
  insertText: string
): {value: string; cursorPos: number} {
  const lineStart = code.lastIndexOf('\n', replaceStart - 1) + 1;
  const lineIndentMatch = code.slice(lineStart, replaceStart).match(/^[ ]*/);
  const baseIndent = lineIndentMatch ? lineIndentMatch[0] : '';

  const indentedText = insertText.includes('\n')
    ? insertText.replace(/\n/g, `\n${baseIndent}`)
    : insertText;

  const markerIdx = indentedText.indexOf('$0');
  const cleanText =
    markerIdx === -1 ? indentedText : indentedText.replace('$0', '');
  const nextCursor =
    replaceStart + (markerIdx === -1 ? cleanText.length : markerIdx);

  const value = code.slice(0, replaceStart) + cleanText + code.slice(replaceEnd);
  return {value, cursorPos: nextCursor};
}
