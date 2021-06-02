const fs = require('fs-extra')
const { expect } = require('chai')
const utils = require('../../../lib/utils')

describe('utils', () => {
  const replaceDir = 'test/lib/utils/testdir'
  const testFilePath = 'test/lib/utils/testfile'
  after(() => {
    fs.removeSync(testFilePath)
    fs.removeSync(replaceDir)
  })
  it('replaces text pairs in files', () => {
    // Arrage
    fs.writeFileSync(testFilePath, 'Hey TOKEN_REPLACE, TOKEN2_REPLACE! Can I replace TOKEN_REPLACE again?')
    // Act
    utils.replaceTextPairsInFile(testFilePath, [
      ['TOKEN_REPLACE', 'there'],
      ['TOKEN2_REPLACE', 'friend']
    ])
    // Assert
    const content = fs.readFileSync(testFilePath, { encoding: 'utf8' })
    expect(content).to.be.string('Hey there, friend! Can I replace there again?')
  })
  it('replaces renames tokens in filenames recursively', () => {
    // Arrange
    const replaceToken = 'TOKEN_REPLACE'
    const tokenSubstitute = 'hello'
    const replaceSubDir = replaceDir + '/subdir'
    const templateFileA = replaceDir + `/${replaceToken}-world-a.js`
    const templateFileB = replaceDir + `/${replaceToken}-world-b.js`
    const subTemplateFileA = replaceSubDir + `/${replaceToken}-bar-a.js`
    const subTemplateFileB = replaceSubDir + `/${replaceToken}-bar-b.js`
    fs.mkdirSync(replaceDir, { recursive: true })
    fs.mkdirSync(replaceSubDir, { recursive: true })
    fs.writeFileSync(templateFileA, `Filename should not contain ${replaceToken}`)
    fs.writeFileSync(templateFileB, `Filename should not contain ${replaceToken}`)
    fs.writeFileSync(subTemplateFileA, `Filename should not contain ${replaceToken}`)
    fs.writeFileSync(subTemplateFileB, `Filename should not contain ${replaceToken}`)

    // Act
    utils.renameFilesInFolder(replaceDir, replaceToken, tokenSubstitute)

    // Assert
    let originalsExist = fs.existsSync(templateFileA)
    originalsExist = originalsExist && fs.existsSync(templateFileB)
    originalsExist = originalsExist && fs.existsSync(subTemplateFileA)
    originalsExist = originalsExist && fs.existsSync(subTemplateFileB)
    expect(originalsExist, 'The Original Files were not replaced!!').to.be.equal(false)

    let replacedExist = fs.existsSync(templateFileA.replace(replaceToken, tokenSubstitute))
    replacedExist = replacedExist && fs.existsSync(templateFileB.replace(replaceToken, tokenSubstitute))
    replacedExist = replacedExist && fs.existsSync(subTemplateFileA.replace(replaceToken, tokenSubstitute))
    replacedExist = replacedExist && fs.existsSync(subTemplateFileB.replace(replaceToken, tokenSubstitute))
    expect(replacedExist, 'The Files were not replaced!!').to.be.equal(true)
  })
})
