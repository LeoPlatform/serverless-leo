const fs = require('fs')

const replaceTextInFile = (filePath, subString, newSubString) => {
  const fileContent = fs.readFileSync(filePath).toString()
  var re = new RegExp(subString, 'g')
  fs.writeFileSync(filePath, fileContent.replace(re, newSubString))
}

const getDirInfo = (folderPath) => {
  const dirExists = fs.existsSync(folderPath)
  if (!dirExists) return []

  return fs.readdirSync(folderPath).map(f => {
    const newPath = `${folderPath}/${f}`
    const fStats = fs.statSync(newPath)
    return {
      dir: folderPath,
      path: newPath,
      file: f,
      isFile: fStats.isFile(),
      isDir: fStats.isDirectory()
    }
  })
}

const recursePathAndOperate = (folderPath, fileOperation) => {
  const results = getDirInfo(folderPath)

  results.forEach((result) => {
    if (result.isFile) {
      fileOperation(result.path)
    } else if (result.isDir) {
      recursePathAndOperate(result.path, fileOperation)
    }
  })
}

const renameFilesInFolder = (folderPath, subString, newSubString) => {
  recursePathAndOperate(folderPath, (filePath) => {
    fs.renameSync(filePath, filePath.replace(subString, newSubString))
  })
}

const replaceTextInFilesInFolder = (folderPath, subString, newSubString) => {
  recursePathAndOperate(folderPath, (filePath) => {
    replaceTextInFile(filePath, subString, newSubString)
  })
}

module.exports = {
  getDirInfo,
  replaceTextInFile,
  replaceTextInFilesInFolder,
  renameFilesInFolder,
  recursePathAndOperate
}
