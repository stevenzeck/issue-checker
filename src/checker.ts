export async function isBodyValid(body: string | undefined, checkCheckboxes: boolean, keywords: string[] | undefined) {
    if (!body) {
        return false
    }

    if (checkCheckboxes && /-\s\[\s\]/g.test(body)) {
        return false
    }

    if (keywords) {
        return keywords.every((key: string) => {
            return body.indexOf(key) > -1
        })
    }

    return true
}