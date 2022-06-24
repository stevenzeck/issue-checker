export async function isBodyValid(
  body: string | undefined,
  checkCheckboxes: boolean,
  keywords: string[] | undefined
): Promise<boolean> {
  if (!body) {
    return false
  }

  if (checkCheckboxes && /-\s\[\s\]/g.test(body)) {
    return false
  }

  if (keywords) {
    const lowercaseBody = body.toLowerCase()
    return keywords.every((key: string) => {
      const lowercaseKeyword = key.toLowerCase()
      return lowercaseBody.includes(lowercaseKeyword)
    })
  }

  return true
}
