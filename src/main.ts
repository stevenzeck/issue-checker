import {getInput, setFailed, error as coreError} from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {isBodyValid} from './checker'

type GitHubClient = ReturnType<typeof getOctokit>['rest']

export const run = async (): Promise<void> => {
  try {
    const token = getInput('repo-token', {required: true})
    const labelName = getInput('label-name', {required: false})
    const labelColor = getInput('label-color', {required: false}) || 'ffffff'
    const commentText = getInput('comment-text', {required: false})
    const checkTasks = getInput('check-tasks', {required: false}) === 'true'
    const issueKeywords = getInput('keywords', {required: false})

    const keywords = issueKeywords.split(',').map((word: string) => word.trim())
    const issueNumber = context.payload.issue?.number

    if (!issueNumber) {
      console.log('Could not get issue number from context, exiting')
      return
    }

    const {owner, repo} = context.repo
    const {rest: client} = getOctokit(token)

    const body = context.payload.issue?.body
    const isValid = isBodyValid(body, checkTasks, keywords)
    const issueLabels = await client.issues.listLabelsOnIssue({
      owner,
      repo,
      issue_number: issueNumber
    })

    if (!isValid) {
      await addLabelToIssue(client, labelName, labelColor, issueNumber)

      if (context.payload.action !== 'edited' && commentText.trim()) {
        await addCommentToIssue(client, commentText, issueNumber)
      }
    }

    if (issueLabels.data.some(label => label.name === labelName)) {
      await removeLabelFromIssue(client, labelName, issueNumber)
    }
  } catch (error) {
    if (error instanceof Error) {
      coreError(error)
      setFailed(error.message)
    }
  }
}

run()

const isHexColorValid = (color: string): boolean =>
  /^[a-fA-F0-9]{6}$/.test(color)

const createLabelIfNotExists = async (
  client: GitHubClient,
  labelName: string,
  labelColor: string,
  defaultColor = 'ffffff'
): Promise<void> => {
  const {owner, repo} = context.repo

  try {
    await client.issues.getLabel({owner, repo, name: labelName})
  } catch {
    if (isHexColorValid(labelColor)) {
      await client.issues.createLabel({
        owner,
        repo,
        name: labelName,
        color: labelColor
      })
    } else {
      console.log('Invalid hex color, using default color...')
      await client.issues.createLabel({
        owner,
        repo,
        name: labelName,
        color: defaultColor
      })
    }
  }
}

const addLabelToIssue = async (
  client: GitHubClient,
  labelName: string,
  labelColor: string,
  issueNumber: number
): Promise<void> => {
  await createLabelIfNotExists(client, labelName, labelColor)
  const {owner, repo} = context.repo
  await client.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels: [labelName]
  })
}

const removeLabelFromIssue = async (
  client: GitHubClient,
  name: string,
  issue_number: number
): Promise<void> => {
  const {owner, repo} = context.repo
  await client.issues.removeLabel({owner, repo, issue_number, name})
}

const addCommentToIssue = async (
  client: GitHubClient,
  commentText: string,
  issueNumber: number
): Promise<void> => {
  const {owner, repo} = context.repo
  await client.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: commentText
  })
}
