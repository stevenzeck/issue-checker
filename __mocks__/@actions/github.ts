export const context = {
  payload: {
    issue: {
      number: 123
    }
  },
  repo: {
    owner: 'stevenzeck',
    repo: 'helloworld'
  }
}

const mockApi = {
  rest: {
    issues: {
      addLabels: jest.fn(),
      removeLabel: jest.fn(),
      getLabel: jest
        .fn()
        .mockRejectedValueOnce(undefined)
        .mockResolvedValue(undefined),
      createLabel: jest.fn(),
      createComment: jest.fn(),
      listLabelsOnIssue: jest.fn()
    },
    repos: {
      getContent: jest.fn()
    }
  }
}

export const getOctokit = jest.fn().mockImplementation(() => mockApi)
