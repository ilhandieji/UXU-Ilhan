import './index.css'
import { createRoot } from 'react-dom/client'
import { demos } from './demos'

const names = Object.keys(demos)
const current = new URLSearchParams(location.search).get('c') ?? names[0]
const Demo = demos[current]

createRoot(document.getElementById('app')!).render(
  <>
    <nav className="flex gap-4 border-b border-neutral-800 px-6 py-3 text-sm">
      {names.map((name) => (
        <a key={name} href={`?c=${name}`} className={name === current ? 'font-semibold underline' : 'opacity-60 hover:opacity-100'}>
          {name}
        </a>
      ))}
    </nav>
    <main className="p-6">{Demo ? <Demo /> : null}</main>
  </>,
)
