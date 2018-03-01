import debug from 'debug'

export const debugLog = function (string, loglevel, enable = true) {
  let log = debug('')

  if (loglevel === 'hight') log.enabled = true

  loglevel === 'light' && !enable
    ? log.enabled = false
    : log.enabled = true

  if (loglevel === 'error') {
    log = debug(loglevel.name)
    log.enabled = true
  }

  if (loglevel === 'none')  log.enabled = false

  return log(string)
}