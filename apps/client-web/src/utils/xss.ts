/**
 * XSS 防护工具
 * 实现输入过滤、HTML 转义和 URL 验证功能
 *
 * 遵循 api-security-specification.md 和 project-standards.md 规范:
 * - 对用户输入进行过滤
 * - HTML 转义输出
 * - URL 验证
 */

// XSS 配置常量
const XSS_CONFIG = {
  // 允许的标签白名单（用于富文本）
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'],
  // 允许的属性白名单
  ALLOWED_ATTRIBUTES: ['href', 'title', 'target'],
  // 允许的 URL 协议
  ALLOWED_PROTOCOLS: ['http:', 'https:', 'mailto:', 'tel:'],
  // 最大输入长度
  MAX_INPUT_LENGTH: 10000,
} as const;

// 危险的 HTML 标签
const DANGEROUS_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'textarea',
  'button',
  'select',
  'option',
  'link',
  'meta',
  'base',
  'head',
  'body',
  'html',
  'applet',
  'frame',
  'frameset',
  'marquee',
  'blink',
  'xml',
  'xss',
] as const;

// 危险的事件处理器属性
const DANGEROUS_ATTRIBUTES = [
  'onabort',
  'onactivate',
  'onafterprint',
  'onafterupdate',
  'onbeforeactivate',
  'onbeforecopy',
  'onbeforecut',
  'onbeforedeactivate',
  'onbeforeeditfocus',
  'onbeforepaste',
  'onbeforeprint',
  'onbeforeunload',
  'onbeforeupdate',
  'onblur',
  'onbounce',
  'oncellchange',
  'onchange',
  'onclick',
  'oncontextmenu',
  'oncontrolselect',
  'oncopy',
  'oncut',
  'ondataavailable',
  'ondatasetchanged',
  'ondatasetcomplete',
  'ondblclick',
  'ondeactivate',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'onerror',
  'onerrorupdate',
  'onfilterchange',
  'onfinish',
  'onfocus',
  'onfocusin',
  'onfocusout',
  'onhashchange',
  'onhelp',
  'oninput',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onlayoutcomplete',
  'onload',
  'onlosecapture',
  'onmessage',
  'onmousedown',
  'onmouseenter',
  'onmouseleave',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onmousewheel',
  'onmove',
  'onmoveend',
  'onmovestart',
  'onoffline',
  'ononline',
  'onpagehide',
  'onpageshow',
  'onpaste',
  'onpopstate',
  'onpropertychange',
  'onreadystatechange',
  'onreset',
  'onresize',
  'onresizeend',
  'onresizestart',
  'onrowenter',
  'onrowexit',
  'onrowsdelete',
  'onrowsinserted',
  'onscroll',
  'onsearch',
  'onselect',
  'onselectionchange',
  'onselectstart',
  'onstart',
  'onstop',
  'onstorage',
  'onsubmit',
  'onunload',
  'onzoom',
] as const;

// HTML 实体映射
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
} as const;

/**
 * HTML 转义函数
 * 将特殊字符转换为 HTML 实体，防止 XSS 攻击
 * @param input 输入字符串
 * @returns 转义后的字符串
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * HTML 反转义函数
 * 将 HTML 实体转换回原始字符
 * @param input 输入字符串
 * @returns 反转义后的字符串
 */
export function unescapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const reverseEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&#39;': "'",
  };

  return input.replace(
    /&(?:amp|lt|gt|quot|#x27|#x2F|#x60|#x3D|#39);/g,
    (entity) => reverseEntities[entity] || entity
  );
}

/**
 * JavaScript 字符串转义
 * 用于在 JavaScript 字符串中安全地插入用户输入
 * @param input 输入字符串
 * @returns 转义后的字符串
 */
export function escapeJavaScript(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f')
    .replace(/[\b]/g, '\\b')  // Use character class for backspace
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\/');
}

/**
 * CSS 字符串转义
 * 用于在 CSS 中安全地插入用户输入
 * @param input 输入字符串
 * @returns 转义后的字符串
 */
export function escapeCss(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.replace(/[<>'"]/g, (char) => `\\${char.charCodeAt(0).toString(16)} `);
}

/**
 * URL 验证函数
 * 验证 URL 是否安全，只允许特定的协议
 * @param url 要验证的 URL
 * @returns 是否安全
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url, window.location.href);

    // 检查协议是否在白名单中
    if (!XSS_CONFIG.ALLOWED_PROTOCOLS.includes(urlObj.protocol as typeof XSS_CONFIG.ALLOWED_PROTOCOLS[number])) {
      return false;
    }

    // 检查是否包含危险的 JavaScript 代码
    const dangerousPatterns = [
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /on\w+=/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(url)) {
        return false;
      }
    }

    return true;
  } catch {
    // 如果 URL 解析失败，检查是否是相对路径
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return !/javascript:/i.test(url);
    }
    return false;
  }
}

/**
 * 净化 URL
 * 移除 URL 中的危险部分
 * @param url 输入 URL
 * @returns 净化后的 URL 或空字符串
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // 移除危险的协议
  let sanitized = url.replace(/^\s*javascript:/i, '');
  sanitized = sanitized.replace(/^\s*data:text\/html/i, '');
  sanitized = sanitized.replace(/^\s*vbscript:/i, '');

  // 如果 URL 不安全，返回空字符串
  if (!isSafeUrl(sanitized)) {
    return '';
  }

  return sanitized;
}

/**
 * 输入过滤函数
 * 移除输入中的危险字符和标签
 * @param input 输入字符串
 * @returns 过滤后的字符串
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // 限制长度
  if (input.length > XSS_CONFIG.MAX_INPUT_LENGTH) {
    input = input.substring(0, XSS_CONFIG.MAX_INPUT_LENGTH);
  }

  // 移除危险的标签
  let sanitized = input;
  for (const tag of DANGEROUS_TAGS) {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>|<${tag}[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  }

  // 移除危险的事件处理器属性
  for (const attr of DANGEROUS_ATTRIBUTES) {
    const regex = new RegExp(`\\s${attr}=['"][^'"]*['"]`, 'gi');
    sanitized = sanitized.replace(regex, '');
  }

  // 移除其他危险的属性模式
  sanitized = sanitized.replace(/\s*style\s*=\s*['"][^'"]*['"]/gi, '');
  sanitized = sanitized.replace(/\s*expression\s*\(/gi, '');

  return sanitized;
}

/**
 * 验证标签是否在白名单中
 * @param tagName - 标签名
 * @returns 是否允许
 */
function isAllowedTag(tagName: string): boolean {
  return XSS_CONFIG.ALLOWED_TAGS.includes(tagName as typeof XSS_CONFIG.ALLOWED_TAGS[number]);
}

/**
 * 处理非白名单标签 - 只保留其子节点
 * @param element - 元素节点
 * @param sanitizeNodeFn - 节点净化函数
 * @returns 文档片段
 */
function processNonAllowedTag(
  element: HTMLElement,
  sanitizeNodeFn: (node: Node) => Node | null
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  while (element.firstChild) {
    const sanitizedChild = sanitizeNodeFn(element.firstChild);
    if (sanitizedChild) {
      fragment.appendChild(sanitizedChild);
    }
  }
  return fragment;
}

/**
 * 复制白名单属性到安全元素
 * @param sourceElement - 源元素
 * @param targetElement - 目标元素
 */
function copyAllowedAttributes(sourceElement: HTMLElement, targetElement: HTMLElement): void {
  for (const attr of XSS_CONFIG.ALLOWED_ATTRIBUTES) {
    const value = sourceElement.getAttribute(attr);
    if (value !== null) {
      // 对于 href 属性，需要验证 URL
      if (attr === 'href' && !isSafeUrl(value)) {
        continue;
      }
      targetElement.setAttribute(attr, escapeHtml(value));
    }
  }
}

/**
 * 递归净化 DOM 节点
 * @param node - 要净化的节点
 * @returns 净化后的节点或 null
 */
function sanitizeNode(node: Node): Node | null {
  // 文本节点直接返回克隆
  if (node.nodeType === Node.TEXT_NODE) {
    return node.cloneNode(true);
  }

  // 只处理元素节点
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();

  // 检查标签是否在白名单中
  if (!isAllowedTag(tagName)) {
    // 如果不是白名单标签，只保留其子节点
    return processNonAllowedTag(element, sanitizeNode);
  }

  // 创建新的安全元素
  const safeElement = document.createElement(tagName);

  // 复制白名单属性
  copyAllowedAttributes(element, safeElement);

  // 递归处理子节点
  while (element.firstChild) {
    const sanitizedChild = sanitizeNode(element.firstChild);
    if (sanitizedChild) {
      safeElement.appendChild(sanitizedChild);
    }
  }

  return safeElement;
}

/**
 * 将文档片段转换为 HTML 字符串
 * @param fragment - 文档片段
 * @returns HTML 字符串
 */
function fragmentToHtml(fragment: DocumentFragment): string {
  const tempDiv = document.createElement('div');
  tempDiv.appendChild(fragment);
  return tempDiv.innerHTML;
}

/**
 * 净化 HTML 文档的所有子节点
 * @param doc - HTML 文档
 * @returns 净化后的文档片段
 */
function sanitizeDocumentBody(doc: Document): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const body = doc.body;

  while (body.firstChild) {
    const sanitizedNode = sanitizeNode(body.firstChild);
    if (sanitizedNode) {
      fragment.appendChild(sanitizedNode);
    }
  }

  return fragment;
}

/**
 * 富文本净化函数
 * 只允许白名单中的标签和属性
 * @param input 输入的 HTML 字符串
 * @returns 净化后的 HTML
 */
export function sanitizeRichText(input: string): string {
  // 验证输入
  if (!input || typeof input !== 'string') {
    return '';
  }

  // 限制长度
  const truncatedInput = input.length > XSS_CONFIG.MAX_INPUT_LENGTH
    ? input.substring(0, XSS_CONFIG.MAX_INPUT_LENGTH)
    : input;

  // 创建 DOM 解析器并解析 HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(truncatedInput, 'text/html');

  // 净化文档内容
  const sanitizedFragment = sanitizeDocumentBody(doc);

  // 转换为字符串并返回
  return fragmentToHtml(sanitizedFragment);
}

/**
 * 过滤 SQL 注入字符
 * @param input 输入字符串
 * @returns 过滤后的字符串
 */
export function sanitizeSqlInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // 移除或转义危险的 SQL 字符
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/xp_/gi, '')
    .replace(/sp_/gi, '')
    .replace(/exec\s*\(/gi, '')
    .replace(/union\s+select/gi, '')
    .replace(/insert\s+into/gi, '')
    .replace(/delete\s+from/gi, '')
    .replace(/drop\s+table/gi, '');
}

/**
 * 验证文件类型
 * @param filename 文件名
 * @param allowedTypes 允许的文件类型数组
 * @returns 是否允许
 */
export function isAllowedFileType(filename: string, allowedTypes: string[]): boolean {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) {
    return false;
  }

  return allowedTypes.some((type) => type.toLowerCase() === `.${extension}`);
}

/**
 * 净化文件名
 * @param filename 文件名
 * @returns 净化后的文件名
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // 移除路径分隔符和危险字符
  return filename
    .replace(/[/\\]/g, '_')
    .replace(/[<>:"|?*]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '')
    .substring(0, 255);
}

/**
 * 检查输入是否包含 XSS 攻击向量
 * @param input 输入字符串
 * @returns 是否包含攻击向量
 */
export function containsXssVector(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/i,
    /<script[^>]*\/>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /<input/i,
    /expression\s*\(/i,
    /url\s*\(\s*['"]\s*javascript:/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * 深度净化对象
 * 递归处理对象中的所有字符串属性
 * @param obj 输入对象
 * @param escapeFn 转义函数，默认为 escapeHtml
 * @returns 净化后的对象
 */
export function deepSanitize<T>(
  obj: T,
  escapeFn: (input: string) => string = escapeHtml
): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return escapeFn(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepSanitize(item, escapeFn)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deepSanitize(value, escapeFn);
    }
    return result as T;
  }

  return obj;
}

/**
 * 获取 XSS 配置
 * @returns XSS 配置
 */
export function getXssConfig(): typeof XSS_CONFIG {
  return { ...XSS_CONFIG };
}

/**
 * 使用 DOMParser 安全解析 HTML
 * 通过解析和重新序列化来确保 HTML 结构安全
 */
function parseAndSanitizeHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const dangerousElements = doc.querySelectorAll('script, iframe, object, embed, form, link, meta, style');
  dangerousElements.forEach(el => el.remove());

  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    const attrs = Array.from(el.attributes);
    attrs.forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
      if (attr.name === 'style' && attr.value.includes('expression')) {
        el.removeAttribute(attr.name);
      }
      if (attr.name === 'href' || attr.name === 'src') {
        if (attr.value.trim().toLowerCase().startsWith('javascript:') ||
            attr.value.trim().toLowerCase().startsWith('data:')) {
          el.removeAttribute(attr.name);
        }
      }
    });
  });

  return doc.body.innerHTML;
}

/**
 * 创建安全的 innerHTML 设置器
 * 在设置 HTML 内容前进行净化
 * @param element 目标元素
 * @param html HTML 内容
 * @param allowRichText 是否允许富文本（默认 false，使用纯文本更安全）
 */
export function setSafeInnerHTML(
  element: HTMLElement,
  html: string,
  allowRichText: boolean = false
): void {
  if (!element || !(element instanceof HTMLElement)) {
    console.warn('Invalid element provided to setSafeInnerHTML');
    return;
  }

  let sanitized: string;
  if (allowRichText) {
    sanitized = sanitizeRichText(html);
    sanitized = parseAndSanitizeHtml(sanitized);
  } else {
    sanitized = escapeHtml(html);
  }

  element.innerHTML = sanitized;
}

export default {
  escapeHtml,
  unescapeHtml,
  escapeJavaScript,
  escapeCss,
  isSafeUrl,
  sanitizeUrl,
  sanitizeInput,
  sanitizeRichText,
  sanitizeSqlInput,
  isAllowedFileType,
  sanitizeFilename,
  containsXssVector,
  deepSanitize,
  getXssConfig,
  setSafeInnerHTML,
};
