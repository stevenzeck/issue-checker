import {run} from '../src/main'
import * as github from '@actions/github'
import * as core from '@actions/core'

const gh = github.getOctokit('_')
const listLabelsOnIssueMock = jest.spyOn(gh.rest.issues, 'listLabelsOnIssue')
const getLabelsMock = jest.spyOn(gh.rest.issues, 'getLabel')
const createLabelsMock = jest.spyOn(gh.rest.issues, 'createLabel')
const addLabelsMock = jest.spyOn(gh.rest.issues, 'addLabels')
const removeLabelMock = jest.spyOn(gh.rest.issues, 'removeLabel')
const createCommentMock = jest.spyOn(gh.rest.issues, 'createComment')

describe('issues are missing required information', () => {
  it('unchecked boxes, adds a label and comment to a newly opened issue', async () => {
    mockGetInput({
      'repo-token': '12345',
      'label-name': 'needs-more-information',
      'label-color': 'ffffff',
      'comment-text': '',
      'check-tasks': 'true',
      keywords: 'recreate'
    })
    github.context.payload = {
      issue: {
        number: 1,
        title: 'Test',
        body: '- [x] Task 1\r\n- [ ] Task 2\r\n- [x] Task 3\r\ngist\nrecreate'
      }
    }

    await run()

    expect(getLabelsMock).toHaveBeenCalled()
    expect(createLabelsMock).toHaveBeenCalled()
    expect(addLabelsMock).toHaveBeenCalled()
    expect(createCommentMock).toHaveBeenCalled()
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})

function mockGetInput(mocks: Record<string, string>): jest.SpyInstance {
  const mock = (key: string) => mocks[key] ?? ''
  return jest.spyOn(core, 'getInput').mockImplementation(mock)
}
