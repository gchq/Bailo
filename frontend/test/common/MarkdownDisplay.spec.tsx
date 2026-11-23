import { ThemeProvider } from '@mui/material/styles'
import { render as renderWithoutTheme } from '@testing-library/react'
import { type ReactElement } from 'react'
import { describe, expect, it } from 'vitest'

import InlineMarkdownDiff from '../../src/common/InlineDiff/InlineMarkdownDiff'
import MarkdownDisplay from '../../src/common/MarkdownDisplay'
import { lightTheme } from '../../src/theme'

const fixedStyle = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:999999'

function render(ui: ReactElement) {
  return renderWithoutTheme(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>)
}

function getRawHtmlElements(container: HTMLElement) {
  return container.querySelectorAll('[data-test-raw]')
}

describe('MarkdownDisplay', () => {
  it('removes style attributes from raw HTML blocks', () => {
    const { container } = render(
      <MarkdownDisplay>{`<div data-test-raw style="${fixedStyle}">Overlay</div>`}</MarkdownDisplay>,
    )

    const element = container.querySelector('[data-test-raw]')
    expect(element?.textContent).toBe('Overlay')
    expect(element?.hasAttribute('style')).toBe(false)
  })

  it('removes style attributes from inline HTML within markdown', () => {
    const { container } = render(
      <MarkdownDisplay>{`- Item <span data-test-raw style="${fixedStyle}">inline</span>`}</MarkdownDisplay>,
    )

    const element = container.querySelector('[data-test-raw]')
    expect(element?.textContent).toBe('inline')
    expect(element?.hasAttribute('style')).toBe(false)
  })

  it('removes style attributes from self-closing HTML elements', () => {
    const { container } = render(
      <MarkdownDisplay>{`<img data-test-raw src="https://example.com/a.gif" alt="gif" style="${fixedStyle}" />`}</MarkdownDisplay>,
    )

    const element = container.querySelector('[data-test-raw]')
    expect(element?.getAttribute('src')).toBe('https://example.com/a.gif')
    expect(element?.hasAttribute('style')).toBe(false)
  })

  it('removes style attributes from HTML nested inside other HTML', () => {
    const { container } = render(
      <MarkdownDisplay>
        {[
          '<details data-test-raw style="position:fixed">',
          '<summary data-test-raw style="position:fixed">More</summary>',
          `<div data-test-raw style="${fixedStyle}"><marquee data-test-raw style="${fixedStyle}">boo</marquee></div>`,
          '</details>',
        ].join('\n')}
      </MarkdownDisplay>,
    )

    const elements = getRawHtmlElements(container)
    expect(elements).toHaveLength(4)
    elements.forEach((element) => expect(element?.hasAttribute('style')).toBe(false))
  })

  it('removes style attributes from verbatim HTML blocks', () => {
    const { container } = render(
      <MarkdownDisplay>{`<pre data-test-raw style="${fixedStyle}">\nverbatim\n</pre>`}</MarkdownDisplay>,
    )

    const element = container.querySelector('[data-test-raw]')
    expect(element?.textContent).toContain('verbatim')
    expect(element?.hasAttribute('style')).toBe(false)
  })

  it('removes style attributes regardless of attribute name casing', () => {
    const { container } = render(
      <MarkdownDisplay>{`<div data-test-raw STYLE="${fixedStyle}">Overlay</div>`}</MarkdownDisplay>,
    )

    expect(container.querySelector('[data-test-raw]')?.hasAttribute('style')).toBe(false)
  })

  it('removes class attributes so page styles cannot be borrowed', () => {
    const { container } = render(
      <MarkdownDisplay>
        {'<div data-test-raw class="MuiAppBar-positionFixed">A</div>\n\n<p data-test-raw className="css-fixed">B</p>'}
      </MarkdownDisplay>,
    )

    const elements = getRawHtmlElements(container)
    expect(elements).toHaveLength(2)
    expect(elements[0].classList.contains('MuiAppBar-positionFixed')).toBe(false)
    expect(elements[1].classList.contains('css-fixed')).toBe(false)
  })

  it('keeps other attributes on raw HTML', () => {
    const { container } = render(
      <MarkdownDisplay>{'<a data-test-raw href="https://example.com" title="Example">link</a>'}</MarkdownDisplay>,
    )

    const element = container.querySelector('[data-test-raw]')
    expect(element?.getAttribute('href')).toBe('https://example.com')
    expect(element?.getAttribute('title')).toBe('Example')
  })

  it('keeps the alignment styles that markdown tables generate', () => {
    const { container } = render(<MarkdownDisplay>{'| Left | Right |\n| :--- | ---: |\n| a | b |'}</MarkdownDisplay>)

    const cells = container.querySelectorAll('td')
    expect((cells[0] as HTMLElement).style.textAlign).toBe('left')
    expect((cells[1] as HTMLElement).style.textAlign).toBe('right')
  })
})

describe('InlineMarkdownDiff', () => {
  it('removes style attributes from raw HTML in both sides of a diff', () => {
    const { container } = render(
      <InlineMarkdownDiff
        from={`Intro\n\n<div data-test-raw style="${fixedStyle}">Old</div>`}
        to={`Intro\n\n<div data-test-raw style="${fixedStyle}">New</div>\n\n<span data-test-raw style="${fixedStyle}">Added</span>`}
      />,
    )

    const elements = getRawHtmlElements(container)
    expect(elements.length).toBeGreaterThan(0)
    elements.forEach((element) => expect(element?.hasAttribute('style')).toBe(false))
  })

  it('removes style attributes when the whole value is replaced', () => {
    const { container } = render(
      <InlineMarkdownDiff from='Old notes' to={`<div data-test-raw style="${fixedStyle}">New notes</div>`} />,
    )

    const elements = getRawHtmlElements(container)
    expect(elements.length).toBeGreaterThan(0)
    elements.forEach((element) => expect(element?.hasAttribute('style')).toBe(false))
  })
})
