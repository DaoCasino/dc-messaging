import fs    from 'fs'
import path  from 'path'
import debug from 'debug'

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

export const rmFolder = (pathToDirectory) => {
  /** 
   * Check exists file or directory
   * with param path
   */
  if (!fs.existsSync(pathToDirectory)) {
    console.error(`No file or directory with path ${pathToDirectory}`)
    return
  }

  try {
    /**
     * check files in directory
     * and call functions for each of them
     */
    fs.readdirSync(pathToDirectory).forEach(file => {
      /** path to target file */
      const curPath = path.join(pathToDirectory, file)
      /**
       * check availability file and
       * check isDirectory after delete this or recursive call
       */
      if (typeof curPath !== 'undefined' && fs.existsSync(curPath)) {
        (fs.lstatSync(curPath).isDirectory()) 
          ? rmFolder(curPath) : fs.unlinkSync(curPath)
      }
    })

    /**
     * after unlink files with directory
     * remove target directory
     */
    fs.rmdirSync(pathToDirectory)
  } catch (err) {
    process.exit()
  }
}


export const exitListener = (func, pid) => {
  /**
   * listening for array signalls
   * and call funct wich argument
   */
  [ 'SIGINT', 'SIGTERM', 'SIGBREAK' ]
  .forEach(SIGNAL => {    
    process.on(SIGNAL, () => {
      // Kill all process
      [pid, process.pid, process.ppid]
        .forEach(pd => process.kill(pd, 'SIGINT'))
      
      // Call function with param
      func()
      
      process.exit()
    })
  })
}

export const createRepo = (dirpath = './data/messaging/DataBase') => {
  dirpath += Math.ceil( Math.random() * 10000)
  return path.resolve(dirpath)
}
