// css/tokens.css(Folio 정본 복사본)의 토큰을 src/*.src.html에 끼워 완성본 한 파일씩을 만든다.
// 아티팩트는 외부 CSS를 못 읽으므로 한 파일에 전부 들어 있어야 한다.
// 실행: node scripts/build.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokens = readFileSync(join(root, 'css/tokens.css'), 'utf8')

// 정본의 블록을 이름으로 찾는다. 블록이 바뀌어 못 찾으면 멈춘다.
function block(selectorStart) {
  const i = tokens.indexOf(selectorStart)
  if (i < 0) throw new Error('tokens.css에서 못 찾음: ' + selectorStart)
  const open = tokens.indexOf('{', i)
  let depth = 0
  for (let j = open; j < tokens.length; j++) {
    if (tokens[j] === '{') depth++
    if (tokens[j] === '}' && --depth === 0) return tokens.slice(open + 1, j)
  }
  throw new Error('블록이 닫히지 않음: ' + selectorStart)
}

const light = block('.folio-light,\n.folio:not(.folio-dark)')
const dark = block('.folio-dark {')
const scales = block('.folio {\n  /* --- Type scale')
const fonts = block('.folio {\n  --fl-font-sans')

// 아티팩트 규칙: 토큰의 첫 정의는 맨 :root에, 다크는 두 블록(미디어 쿼리 + data-theme)에 다시 정의한다.
const css = [
  ':root {',
  fonts.replace(/\n  font-family[\s\S]*$/, ''),
  light,
  scales,
  '}',
  '@media (prefers-color-scheme: dark) {',
  '  :root:not([data-theme="light"]) {' + dark + '  }',
  '}',
  ':root[data-theme="dark"] {' + dark + '}',
].join('\n')

// src/*.src.html 각각을 같은 이름의 완성본 .html로 만든다. (dashboard, starter)
for (const name of ['dashboard', 'starter']) {
  const src = readFileSync(join(root, `src/${name}.src.html`), 'utf8')
  if (!src.includes('/*__FOLIO_TOKENS__*/')) throw new Error(`${name}: src에 자리표시자가 없음`)
  writeFileSync(join(root, `${name}.html`), src.replace('/*__FOLIO_TOKENS__*/', css))
  console.log(`${name}.html 생성:`, Math.round(css.length / 1024) + 'KB의 토큰 포함')
}
