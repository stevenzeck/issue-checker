import { run } from '../src/main';
import * as github from '@actions/github';
import * as core from '@actions/core';

const gh = github.getOctokit('_');
const getLabelsMock = jest.spyOn(gh.rest.issues, 'getLabel');
const createLabelsMock = jest.spyOn(gh.rest.issues, 'createLabel');
const addLabelsMock = jest.spyOn(gh.rest.issues, 'addLabels');
const removeLabelMock = jest.spyOn(gh.rest.issues, 'removeLabel');
const createCommentMock = jest.spyOn(gh.rest.issues, 'createComment');


describe('issues are missing required information', () => {
  it('unchecked boxes, adds a label and comment to a newly opened issue', async () => {
    mockGetInput({
      'repo-token': '12345',
      'issue-check-tasks': 'true',
      'issue-label-name': 'needs-more-information',
      'issue-label-color': 'ffffff'
    });
    github.context.payload = {
      issue: {
        number: 1,
        title: 'Test',
        body: '- [ ] Task 1\r\n- [ ] Task 2\r\n- [ ] Task 3\r\ngist\nrecreate'
      }
    };

    await run();

    expect(getLabelsMock).toHaveBeenCalled();
    expect(createLabelsMock).toHaveBeenCalled();
    expect(addLabelsMock).toHaveBeenCalled();
    expect(createCommentMock).toHaveBeenCalled();
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

function mockGetInput(mocks: Record<string, string>): jest.SpyInstance {
  const mock = (key: string) => mocks[key] ?? '';
  return jest.spyOn(core, 'getInput').mockImplementation(mock);
}
