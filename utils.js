import debug from 'debug'
import fs    from 'fs'
import path  from 'path'

export const debugLog = function (string, loglevel, enable = true) {
  let log = debug('')

  if (loglevel === 'hight') log.enabled = true

  loglevel === 'light' && !enable
    ? log.enabled = false
    : log.enabled = true

  if (loglevel === 'error') {
    log = debug(loglevel)
    log.enabled = true
  }

  if (loglevel === 'none')  log.enabled = false

  return log(string)
}

export const deleteFolderRecursive = dirpath => {
  fs.readdirSync(dirpath).forEach((file, index) => {
    const curPath = path.join(dirpath, file);

    (fs.lstatSync(curPath).isDirectory())
      ? deleteFolderRecursive(curPath)
      : fs.unlinkSync(curPath)
  })

  fs.rmdirSync(dirpath)
}

export const createRepo = (dirpath = './data/messaging/DataBase') => {
  let pathToRepo = dirpath
  if (process.env.NODE_ENV === 'test') {
    pathToRepo += Math.ceil( Math.random() * 10000)
  }

  return pathToRepo
}
