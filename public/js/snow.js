const TOTAL_SNOWFLAKES = 200

let snowDiv = document.getElementById('snowContainer')

function embRand(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a
}

if (!snowDiv) {
  const snowflakes = new Array(TOTAL_SNOWFLAKES).fill(`<i class="snow"></i>`).join('\n')

  const snow = `
    .snow {
      position: absolute;
      width: 10px;
      height: 10px;
      background: white;
      border-radius: 50%;
      margin-top:-10px;
    }

    #snowContainer {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      z-index: 9999999;
      pointer-events: none;
    }
  `

  const transitions = new Array(TOTAL_SNOWFLAKES)
    .fill(undefined)
    .map((_, i) => {
      const rndX = embRand(0, 1000000) * 0.0001
      const rndO = embRand(-100000, 100000) * 0.0001
      const rndT = (embRand(3, 8) * 10).toFixed(2)
      const rndS = (embRand(0, 10000) * 0.0001).toFixed(2)

      return `
      .snow:nth-child(${i}) {
        opacity: ${(embRand(1, 10000) * 0.0001).toFixed(2)};
        transform: translate(${rndX.toFixed(2)}vw,-10px) scale(${rndS});
        animation: fall-${i} ${embRand(10, 30)}s -${embRand(0, 30)}s linear infinite;
      }

      @keyframes fall-${i}{
        ${rndT}%{
          transform: translate(${(rndX + rndO).toFixed(2)}vw,${rndT}vh) scale(${rndS});
        } to {
          transform: translate(${(rndX + rndO / 2).toFixed(2)}vw, 105vh) scale(${rndS});
        }
      }
    `
    })
    .join('\n')

  snowDiv = document.createElement('div')
  snowDiv.id = 'snowContainer'

  snowDiv.innerHTML = `
    <style>
      ${snow}
      ${transitions}
    </style>
    ${snowflakes}
  `
  document.body.appendChild(snowDiv)
}
