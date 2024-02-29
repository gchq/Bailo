import dedent from 'dedent-js'

export function wrapper(children: string) {
  return dedent(`
    <mjml>
      <mj-body background-color="#ccd3e0">
        <mj-section background-color="#ccd3e0" padding-bottom="20px" padding-top="20px">
        </mj-section>
        ${children}
      </mj-body>
    </mjml>
  `)
}
