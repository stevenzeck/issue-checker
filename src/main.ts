import {getInput, setFailed, error as coreError} from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {isBodyValid} from './checker'

type GitHubClient = ReturnType<typeof getOctokit>['rest']

export async function run(): Promise<void> {
  try {
    const token = getInput('repo-token', {required: true})
    const labelName = getInput('label-name', {required: false})
    const labelColor = getInput('label-color', {required: false})
    const commentText = getInput('comment-text', {required: false})
    const checkTasks = getInput('check-tasks', {required: false}) === 'true'
    const issueKeywords = getInput('keywords', {required: false})

    const keywords = issueKeywords
      .split(',')
      .map((word: Readonly<string>): string => word.trim())

    const issueNumber: number | undefined = getIssueNumber()
    if (!issueNumber) {
      console.log('Could not get issue number from context, exiting')
      return
    }

    const {rest: client} = getOctokit(token)

    const body: string | undefined = context.payload.issue?.body
    const isValid: boolean = await isBodyValid(body, checkTasks, keywords)
    const issueLabels = await client.issues.listLabelsOnIssue({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNumber
    })

    if (!isValid) {
      await addLabelToIssue(client, labelName, labelColor, issueNumber)
      if (context.payload.action !== 'edited') {
        // TODO Check comment text is not empty before adding a comment
        await addCommentToIssue(client, commentText, issueNumber)
      }
    }

    let removeLabel = false
    for (const label of issueLabels.data) {
      /* eslint-disable no-empty*/
      if (typeof label === 'string') {
      } else if (label.name === labelName) {
        removeLabel = true
      }
    }

    if (removeLabel) {
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

function getIssueNumber(): number | undefined {
  const issue = context.payload.issue
  if (!issue) {
    return undefined
  }

  return issue.number
}

async function createLabelIfNotExists(
  client: GitHubClient,
  labelName: string,
  labelColor: string
): Promise<void> {
  /* eslint-disable github/no-then*/
  await client.issues
    .getLabel({
      owner: context.repo.owner,
      repo: context.repo.repo,
      name: labelName
    })
    .catch(async e => {
      // TODO validate hex color is valid ^#[a-fA-F0-9]{6}$
      console.log(`Failed to get repository label due to: "${e}"`)
      try {
        await client.issues.createLabel({
          owner: context.repo.owner,
          repo: context.repo.repo,
          name: labelName,
          color: labelColor
        })
      } catch (error) {
        console.log(`Failed to create repository label due to: "${error}"`)
        throw error
      }
    })
}

async function addLabelToIssue(
  client: GitHubClient,
  labelName: string,
  labelColor: string,
  issueNumber: number
): Promise<void> {
  await createLabelIfNotExists(client, labelName, labelColor)
  try {
    await client.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNumber,
      labels: [labelName]
    })
  } catch (error) {
    console.log(`Could not add label to issue due to: "${error}"`)
    throw error
  }
}

async function removeLabelFromIssue(
  client: GitHubClient,
  name: string,
  issue_number: number
): Promise<void> {
  try {
    await client.issues.removeLabel({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number,
      name
    })
  } catch (error) {
    console.log(`Could not remove label from issue due to: "${error}"`)
    throw error
  }
}

async function addCommentToIssue(
  client: GitHubClient,
  commentText: string,
  issueNumber: number
): Promise<void> {
  try {
    await client.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNumber,
      body: commentText
    })
  } catch (error) {
    console.log(`Could not add comment to issue due to: "${error}"`)
    throw error
  }
}
