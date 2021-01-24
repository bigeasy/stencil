const fs = require('fs').promises

module.exports = async function (json) {
    try {
        return JSON.parse(json)
    } catch (error) {
        try {
            return JSON.parse(await fs.readFile(json, 'utf8'))
        } catch (e) {
            throw error
        }
    }
}
