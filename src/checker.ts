function isBodyValid(
  body?: string,
  checkCheckboxes = false,
  keywords?: string[]
): boolean {
  if (!body) {
    return false
  }

  if (checkCheckboxes && hasUncheckedCheckboxes(body)) {
    return false
  }

  return !keywords || matchesKeywords(body, keywords)
}

function hasUncheckedCheckboxes(body: string): boolean {
  return body.includes('- [ ]')
}

function matchesKeywords(body: string, keywords: string[]): boolean {
  const lowercaseBody = body.toLowerCase()
  return keywords.some(keyword => lowercaseBody.includes(keyword.toLowerCase()))
}

export {isBodyValid}
