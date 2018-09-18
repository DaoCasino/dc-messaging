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
   * Check NODE_ENV if env = test or window === undefined
   * return this function
   * else delete REPO directory
   */
  if (
    typeof window !== 'undefined' ||
    process.env.NODE_ENV === 'test' ||
    !fs.existsSync(pathToRepo)
  ) {
    console.log('ENV === test or start with browser or file not exists with path')
    return
  }
  
  try {
    /**
     * check files in directory
     * and call functions for each of them
     */
    for (let file of fs.readdirSync(pathToRepo)) {
      /**
       * Create path to file inner directory
       */
      const curPath = path.join(pathToRepo, file)
      
      /**
       * if file or directory not exist
       * then missing this path
       */
      if (!fs.existsSync(curPath)) { 
        continue
      }

      /**
       * if check path on directory then
       * recursive call else delete file
       */
      (fs.lstatSync(curPath).isDirectory())
        ? removeRepo(curPath)
        : fs.unlinkSync(curPath)
    }

    /** If not files then remove directory */
    fs.rmdirSync(pathToRepo)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

export const exitListener = () => {
  /**
   * listening for array signalls
   * and call funct wich argument
   */
  [ 'SIGINT', 'SIGTERM', 'SIGBREAK' ]
    .forEach(SIGNAL => {    
      process.on(SIGNAL, () => {      
        console.log('Process out...')
        process.kill(0, 'SIGKILL')
        process.exit()
      })
    })
}

export const createRepo = (dirpath = './data/messaging/DataBase') => {
  dirpath += Math.ceil( Math.random() * 10000)
  return path.resolve(dirpath)
}
