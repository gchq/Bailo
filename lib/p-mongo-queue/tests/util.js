function pause(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

module.exports = { pause }