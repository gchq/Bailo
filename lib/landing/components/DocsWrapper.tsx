import NavBar from './NavBar'
import DocsMenu from './DocsMenu'
import { DocsMenuContent } from '../../../types/interfaces'

export default function DocsWrapper({ menu, children }: { menu: DocsMenuContent; children: any }) {
  return (
    <>
      <NavBar />
      <DocsMenu menu={menu}>{children}</DocsMenu>
    </>
  )
}
