const createGitLabHandler = require('node-gitlab-webhook')
const express = require('express')
const la = require('lazy-ass')
const morgan = require('morgan')
const Octokit = require('@octokit/rest')

function checkRequiredEnvVars() {
  [
    'GH_TOKEN',
    'WEBHOOK_SECRET'
  ].forEach(key => {
    la(process.env[key], `$${key} must be defined!`)
  })
}

function createOctokit() {
  return Octokit({
    auth: process.env.GH_TOKEN,
    userAgent: 'flotwig/gitlab-ci-github-status-checks',
  })
}

function createWebhookHandler(octokit) {
  const handler = createGitLabHandler([
    {
      path: process.env.WEBHOOK_PATH || '/.gl-webhook',
      secret: process.env.WEBHOOK_SECRET
    }
  ])

  handler.on('build', function ({ payload }) {
    console.log(payload)
    const { sha, project_name, repository } = payload
    const [_, owner, repo] = /:(.+)\/(.+)\.git/.exec(repository.url)

    const description = getJobDescription(payload)
    const state = getGitHubStatus(payload.build_status)
    const target_url = getJobUrl(payload)

    octokit.repos.createStatus({
      owner,
      repo,
      sha,
      state,
      target_url,
      description,
      context: `ci:${payload.build_stage}`
    })
    .then(console.log)
    .catch(console.error)
  })

  handler.on('pipeline', function ({ payload }) {
    console.log(payload)
    const { commit, project } = payload
    const [owner, repo] = project.path_with_namespace.split('/')

    const description = getPipelineDescription(payload)
    const state = getGitHubStatus(payload.object_attributes.status)
    const target_url = getPipelineUrl(payload)

    octokit.repos.createStatus({
      owner,
      repo,
      sha: commit.id,
      state,
      target_url,
      description,
      context: `ci:pipeline`
    })
    .then(console.log)
    .catch(console.error)
  })

  return (req, res) => {
    handler(req, res, () => {
      res.status(404)
    })
  }
}

function getPipelineDescription(payload) {
  return `GitLab CI Pipeline: ${payload.object_attributes.status}`
}

function getPipelineUrl(payload) {
  return `${payload.project.web_url}/pipelines/${payload.object_attributes.id}`
}

function getJobDescription(payload) {
  return `${payload.build_status}${payload.build_status === 'failed' ? ` - reason: ${payload.build_failure_reason}` : ''}`
}

function getJobUrl(payload) {
  return `${payload.repository.homepage}/-/jobs/${payload.build_id}`
}

function getGitHubStatus(gitlabStatus) {
  return ({
    'success': 'success',
    'failed': 'failure',
    'passed': 'success'
  })[gitlabStatus] || 'pending'
}

function start() {
  checkRequiredEnvVars()

  const app = express()
  const octokit = createOctokit()

  app.use(morgan("combined"))
  app.use(createWebhookHandler(octokit))

  app.listen(process.env.PORT || 3000)
}

start()
