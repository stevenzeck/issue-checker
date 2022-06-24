import * as core from '@actions/core'
import * as github from '@actions/github';
import { isBodyValid } from './checker';

type ClientType = ReturnType<typeof github.getOctokit>;

export async function run(): Promise<void> {
    try {
        const token = core.getInput("repo-token", { required: true });
        const labelName = core.getInput("issue-label-name", { required: false });
        const labelColor = core.getInput("issue-label-color", { required: false });
        const commentText = core.getInput("issue-comment", { required: true });
        const checkTasks = core.getInput("issue-check-tasks", { required: false }) === 'true';
        let issueKeywords = core.getInput("issue-keywords", { required: false });

        const keywords = issueKeywords.split(',').map((word: Readonly<string>): string => word.trim());

        const issueNumber: number | undefined = getIssueNumber();
        if (!issueNumber) {
            console.log("Could not get issue number from context, exiting");
            return;
        }

        const client: ClientType = github.getOctokit(token);

        const body: string | undefined = github.context.payload.issue?.body;
        const isValid: boolean = await isBodyValid(body, checkTasks, keywords);

        if (!isValid) {
            await addLabelToIssue(client, labelName, labelColor, issueNumber);
            if (github.context.payload.action !== 'edited') {
                await addCommentToIssue(client, commentText, issueNumber);
            }
        } else {
            await removeLabelFromIssue(client, labelName, issueNumber);
        }
    } catch (error: any) {
        // core.error(error);
        // core.setFailed(error.message);
    }
}

run()

function getIssueNumber(): number | undefined {
    const issue = github.context.payload.issue;
    if (!issue) {
        return undefined;
    }

    return issue.number;
}

async function createLabelIfNotExists(client: ClientType, labelName: string, labelColor: string) {
    const { owner, repo } = github.context.repo;

    await client.rest.issues.getLabel({ 
        owner: owner,
        repo: repo,
        name: labelName 
    }).catch((e) => {
        core.debug(e);
        return client.rest.issues.createLabel({ 
            owner: owner,
            repo: repo,
            name: labelName,
            color: labelColor 
        });
    });
}

async function addLabelToIssue(client: ClientType, labelName: string, labelColor: string, issueNumber: number) {
    await createLabelIfNotExists(client, labelName, labelColor);
    await client.rest.issues.addLabels({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: issueNumber,
        labels: [labelName],
    });
}

async function removeLabelFromIssue(client: ClientType, labelName: string, issueNumber: number) {
    await client.rest.issues.removeLabel({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: issueNumber,
        name: labelName,
    });
}

async function addCommentToIssue(client: ClientType, commentText: string, issueNumber: number) {
    await client.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: issueNumber,
        body: commentText
    });
}