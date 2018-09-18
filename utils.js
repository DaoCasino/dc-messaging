import path  from 'path'
import fs    from 'fs'
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

export const removeRepo = (pathToRepo) => {
  /**
   * Check NODE_ENV if env = test return this function
   * else delete REPO directory
   */
  // if (process.env.NODE_ENV === 'test') return
  
  try {
    /**
     * check files in directory
     * and call functions for each of them
     */
    fs.readdirSync(pathToRepo).forEach(file => {
      /**
       * path to target file
       */
      const curPath = path.join(pathToRepo, file)
      
      /**
       * check availability file and
       * check isDirectory after delete this or recursive call
       */
      if (typeof curPath !== 'undefined') {
        (fs.lstatSync(curPath).isDirectory())
          ? removeRepo(curPath)
          : fs.unlinkSync(curPath)
      } 
    })

    fs.rmdirSync(pathToRepo)
  } catch (err) {
    console.error(err)
  }

  return true
}

export const exitListener = () => {
  /**
   * listening for array signalls
   * and call funct wich argument
   */
  [ 'SIGINT', 'SIGTERM', 'SIGBREAK' ]
    .forEach(SIGNAL => {    
      process.on(SIGNAL, () => {      
        console.log('sss')
        removeRepo('./data/messaging')
        process.kill(0, 'SIGKILL')
        process.exit()
      })
    })
}

export const createRepo = (dirpath = './data/messaging/DataBase') => {
  dirpath += Math.ceil( Math.random() * 10000)
  return path.resolve(dirpath)
}
