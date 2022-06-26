import * as core from '@actions/core'
import * as github from '@actions/github'
import {isBodyValid} from './checker'

type ClientType = ReturnType<typeof github.getOctokit>

export async function run(): Promise<void> {
  try {
    const token = core.getInput('repo-token', {required: true})
    const labelName = core.getInput('label-name', {required: false})
    const labelColor = core.getInput('label-color', {required: false})
    const commentText = core.getInput('comment-text', {required: false})
    const checkTasks =
      core.getInput('check-tasks', {required: false}) === 'true'
    const issueKeywords = core.getInput('keywords', {required: false})

    const keywords = issueKeywords
      .split(',')
      .map((word: Readonly<string>): string => word.trim())

    const issueNumber: number | undefined = getIssueNumber()
    if (!issueNumber) {
      console.log('Could not get issue number from context, exiting')
      return
    }

    const client: ClientType = github.getOctokit(token)

    const body: string | undefined = github.context.payload.issue?.body
    const isValid: boolean = await isBodyValid(body, checkTasks, keywords)

    if (!isValid) {
      await addLabelToIssue(client, labelName, labelColor, issueNumber)
      if (github.context.payload.action !== 'edited') {
        await addCommentToIssue(client, commentText, issueNumber)
      }
    } else {
      await removeLabelFromIssue(client, labelName, issueNumber)
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(error)
      core.setFailed(error.message)
    }
  }
}

run()

function getIssueNumber(): number | undefined {
  const issue = github.context.payload.issue
  if (!issue) {
    return undefined
  }

  return issue.number
}

async function createLabelIfNotExists(
  client: ClientType,
  labelName: string,
  labelColor: string
): Promise<void> {
  /* eslint-disable github/no-then*/
  await client.rest.issues
    .getLabel({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      name: labelName
    })
    .catch(async e => {
      // TODO validate hex color is valid ^#[a-fA-F0-9]{6}$
      core.debug(e)
      await client.rest.issues.createLabel({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        name: labelName,
        color: labelColor
      })
    })
}

async function addLabelToIssue(
  client: ClientType,
  labelName: string,
  labelColor: string,
  issueNumber: number
): Promise<void> {
  await createLabelIfNotExists(client, labelName, labelColor)
  await client.rest.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    labels: [labelName]
  })
}

async function removeLabelFromIssue(
  client: ClientType,
  labelName: string,
  issueNumber: number
): Promise<void> {
  await client.rest.issues.removeLabel({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    name: labelName
  })
}

async function addCommentToIssue(
  client: ClientType,
  commentText: string,
  issueNumber: number
): Promise<void> {
  await client.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    body: commentText
  })
}
