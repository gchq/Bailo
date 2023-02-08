import NavBar from './NavBar.js'
import DocsMenu from './DocsMenu.js'
import { DocsMenuContent } from '../../../types/interfaces.js'

export default function DocsWrapper({ menu, children }: { menu: DocsMenuContent; children: any }) {
  return (
    <>
      <NavBar />
      <DocsMenu menu={menu}>{children}</DocsMenu>
    </>
  )
}
