# gitlab-ci-github-status-checks

A small HTTP server that updates GitHub commit status checks when GitLab job status webhook events occur.

With this and [`git-mirror-docker`][git-mirror-docker], you can get the functionality of GitLab.com's "GitHub Integration" (no longer free after 2020) and GitLab EE's "GitHub Integration" using a regular GitLab CE installation.

![Image of the GitHub status checks this tool makes][ss]

## Available Env Vars

* `GH_TOKEN` - *(required)* GitHub personal access token for creating status checks
* `WEBHOOK_SECRET` - *(required)* Pre-shared webhook secret Default: none
* `WEBHOOK_PATH` - Path to POST GitLab webhook events to. Default: `/.gl-webhook`
* `PORT` - Port to listen on. Default: `3000`

## Docker Info

There is a `Dockerfile` that sets up and runs this service.

Docker Hub: https://hub.docker.com/r/flotwig/gitlab-ci-github-status-checks

### Sample `docker run`

This sets up the webhook at `http://0.0.0.0:12345/.gl-webhook`.

```shell
docker run -p 12345:3000 \
  --restart=always \
  -e GH_TOKEN=your-personal-access-token \
  -e WEBHOOK_SECRET=your-gitlab-webhook-pre-shared-secret \
  flotwig/gitlab-ci-github-status-checks:latest
```

### Sample `docker-compose.yml`

> ⚠ Protip: You can even run this in the same `docker-compose.yml` as your `gitlab-runner` and `gitlab-ce` (and [`git-mirror-docker`][git-mirror-docker]) images.

This sets up the webhook at `http://0.0.0.0:12345/.gl-webhook`.

```yml
  ci-status-checks:
    image: 'flotwig/gitlab-ci-github-status-checks:latest'
    restart: always
    ports:
    - '12345:3000'
    environment:
    - GH_TOKEN=your-personal-access-token
    - WEBHOOK_SECRET=your-gitlab-webhook-pre-shared-secret
```

## Notes

* Commit status checks will be pushed from the original `namespace/repo` to the same `owner/repo` on GitHub. So make sure your repos exist and line up.
* This works best if you're mirroring commits from GitHub to GitLab, so the commit is guaranteed to exist on GitHub by the time the status check is made.
  * An easy way to do commit mirroring is with [`git-mirror-docker`][git-mirror-docker]

[git-mirror-docker]: https://github.com/flotwig/git-mirror-docker/
[ss]: https://i.imgur.com/wvCW1Up.png
