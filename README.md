# Issue Checker

> A GitHub Action that ensures task lists in your issue template are completed when an issue is submitted. It can also scan for keywords that may be in your template but missing when an issue is created.

## What It Does

issue-checker looks at the body of an issue and adds a label and comment if it has unchecked tasks in the tasklist and/or has missing keywords. For example, if each issue should have steps to recreate, you could add "recreate" as a keyword.

## Setup

Create a workflow file (see [Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file)):

```yml
name: "Issue Checker"
on:
  issues:
    types: [opened, edited, reopened]

jobs:
  check_issue:
    runs-on: ubuntu-latest
    steps:
      - uses: stevenzeck/issue-checker@
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
```

## Inputs

| Name | Description | Default |
| --- | --- | --- |
| `repo-token` | Token to use to authorize label changes and commenting on issues | `${{ github.token }}` |
| `label-name` | The name of the label to apply when an issue does not have all tasks checked | `waiting-for-user-information` |
| `label-color` | The color of the label (will be ignored if the label already exists) | `ffffff` |
| `comment-text` | The text of the comment to add to the issue in addition to the label | `''` |
| `check-tasks` | Whether or not to enforce all checkboxes be checked if a tasklist is present | `false` |
| `keywords` | A comma separated list of keywords that each issue should have | `''` |