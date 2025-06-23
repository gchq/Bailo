import { describe, expect, test } from 'vitest'

import { joinDistributionPackageName, splitDistributionPackageName } from '../../src/services/registry.js'

describe('services > registry', () => {
  test('splitDistributionPackageName > success', () => {
    expect(splitDistributionPackageName('name:tag')).toMatchSnapshot()
    expect(splitDistributionPackageName('registry:3.0.0')).toMatchSnapshot()
    expect(splitDistributionPackageName('alpine:latest')).toMatchSnapshot()

    expect(splitDistributionPackageName('localhost:8080/name:tag')).toMatchSnapshot()
    expect(splitDistributionPackageName('clamav/clamav:1.4.2_base')).toMatchSnapshot()
    expect(splitDistributionPackageName('bitnami/minio:2025.4.22')).toMatchSnapshot()
    expect(splitDistributionPackageName('tarampampam/webhook-tester:latest')).toMatchSnapshot()
    expect(splitDistributionPackageName('marlonb/mailcrab:v1.5.0')).toMatchSnapshot()
    expect(splitDistributionPackageName('localhost:8080/export-4lvt8w/alpine:latest')).toMatchSnapshot()
    expect(
      splitDistributionPackageName('localhost:8080/exportfrom-v4yzsn/alpine/test/foo/bar:latest'),
    ).toMatchSnapshot()
    expect(splitDistributionPackageName('nginxinc/nginx-unprivileged:1.25.4-alpine3.18')).toMatchSnapshot()

    expect(splitDistributionPackageName('name@digest:0123456789abcdef0123456789abcdef')).toMatchSnapshot()
    expect(
      splitDistributionPackageName('registry@sha256:1fc7de654f2ac1247f0b67e8a459e273b0993be7d2beda1f3f56fbf1001ed3e7'),
    ).toMatchSnapshot()
    expect(
      splitDistributionPackageName('alpine@sha256:a8560b36e8b8210634f77d9f7f9efd7ffa463e380b75e2e74aff4511df3ef88c'),
    ).toMatchSnapshot()

    expect(
      splitDistributionPackageName('localhost:8080/name@digest:0123456789abcdef0123456789abcdef'),
    ).toMatchSnapshot()
    expect(
      splitDistributionPackageName(
        'clamav/clamav@sha256:e7d108f30ea8f16935dbd12e4b58665f1bc148ce3dd59028cf04088330216910',
      ),
    ).toMatchSnapshot()
    expect(
      splitDistributionPackageName(
        'bitnami/minio@sha256:d7cd0e172c4cc0870f4bdc3142018e2a37be9acf04d68f386600daad427e0cab',
      ),
    ).toMatchSnapshot()
    expect(
      splitDistributionPackageName(
        'tarampampam/webhook-tester@sha256:958a70683cbfdc8b150207b3f3732d0087df1c1a260e8b2f9cf0ec77dbedead3',
      ),
    ).toMatchSnapshot()
    expect(
      splitDistributionPackageName(
        'marlonb/mailcrab@sha256:217db02005fbf51263789d63bfa63011011004685932d330ef8cefcfc054e8da',
      ),
    ).toMatchSnapshot()
    expect(
      splitDistributionPackageName(
        'localhost:8080/export-4lvt8w/alpine@sha256:ec1b05d1eac264d9204a57f4ad9d4dc35e9e756e9fedaea0674aefc7edb1d6a4',
      ),
    ).toMatchSnapshot()
    expect(
      splitDistributionPackageName(
        'localhost:8080/exportfrom-v4yzsn/alpine/test/foo/bar@sha256:ec1b05d1eac264d9204a57f4ad9d4dc35e9e756e9fedaea0674aefc7edb1d6a4',
      ),
    ).toMatchSnapshot()
    expect(
      splitDistributionPackageName(
        'nginxinc/nginx-unprivileged@sha256:7b4316677e4015a53d326e657915340128d9fd506f826f676d9f169c0c8557f6',
      ),
    ).toMatchSnapshot()
  })

  test('splitDistributionPackageName > error', () => {
    expect(() => splitDistributionPackageName('bad-name')).toThrowError('Could not parse Distribution Package Name.')
    expect(() => splitDistributionPackageName('foo:bar:baz')).toThrowError('Could not parse Distribution Package Name.')
    expect(() => splitDistributionPackageName('')).toThrowError('Could not parse Distribution Package Name.')
    expect(() => splitDistributionPackageName('bad-name@:0123456789abcdef0123456789abcdef')).toThrowError(
      'Could not parse Distribution Package Name.',
    )
    expect(() => splitDistributionPackageName('bad-name@sha256:0')).toThrowError(
      'Could not parse Distribution Package Name.',
    )
  })

  test('joinDistributionPackageName > success', () => {
    expect(joinDistributionPackageName({ domain: '', path: 'name', tag: 'tag' })).toMatchSnapshot()
    expect(joinDistributionPackageName({ domain: '', path: 'registry', tag: '3.0.0' })).toMatchSnapshot()
    expect(joinDistributionPackageName({ domain: '', path: 'alpine', tag: 'latest' })).toMatchSnapshot()

    expect(
      joinDistributionPackageName({ domain: '', path: 'name', digest: 'digest:0123456789abcdef0123456789abcdef' }),
    ).toMatchSnapshot()
    expect(
      joinDistributionPackageName({
        domain: '',
        path: 'registry',
        digest: 'sha256:1fc7de654f2ac1247f0b67e8a459e273b0993be7d2beda1f3f56fbf1001ed3e7',
      }),
    ).toMatchSnapshot()
    expect(
      joinDistributionPackageName({
        domain: '',
        path: 'alpine',
        digest: 'sha256:a8560b36e8b8210634f77d9f7f9efd7ffa463e380b75e2e74aff4511df3ef88c',
      }),
    ).toMatchSnapshot()

    expect(joinDistributionPackageName({ domain: 'localhost:8080', path: 'name', tag: 'tag' })).toMatchSnapshot()
    expect(joinDistributionPackageName({ domain: 'clamav', path: 'clamav', tag: '1.4.2_base' })).toMatchSnapshot()
    expect(joinDistributionPackageName({ domain: 'bitnami', path: 'minio', tag: '2025.4.22' })).toMatchSnapshot()
    expect(
      joinDistributionPackageName({ domain: 'tarampampam', path: 'webhook-tester', tag: 'latest' }),
    ).toMatchSnapshot()
    expect(joinDistributionPackageName({ domain: 'marlonb', path: 'mailcrab', tag: 'v1.5.0' })).toMatchSnapshot()
    expect(
      joinDistributionPackageName({ domain: 'localhost:8080', path: 'export-4lvt8w/alpine', tag: 'latest' }),
    ).toMatchSnapshot()
    expect(
      joinDistributionPackageName({
        domain: 'localhost:8080',
        path: 'exportfrom-v4yzsn/alpine/test/foo/bar',
        tag: 'latest',
      }),
    ).toMatchSnapshot()
    expect(
      joinDistributionPackageName({ domain: 'nginxinc', path: 'nginx-unprivileged', tag: '1.25.4-alpine3.18' }),
    ).toMatchSnapshot()

    expect(
      joinDistributionPackageName({
        domain: 'localhost:8080',
        path: 'name',
        digest: 'sha256:0123456789abcdef0123456789abcdef',
      }),
    ).toMatchSnapshot()
    expect(
      joinDistributionPackageName({
        domain: 'clamav',
        path: 'clamav',
        digest: 'sha256:e7d108f30ea8f16935dbd12e4b58665f1bc148ce3dd59028cf04088330216910',
      }),
    ).toMatchSnapshot()
    expect(
      joinDistributionPackageName({
        domain: 'bitnami',
        path: 'minio',
        digest: 'sha256:d7cd0e172c4cc0870f4bdc3142018e2a37be9acf04d68f386600daad427e0cab',
      }),
    ).toMatchSnapshot()
    expect(
      joinDistributionPackageName({
        domain: 'tarampampam',
        path: 'webhook-tester',
        digest: 'sha256:958a70683cbfdc8b150207b3f3732d0087df1c1a260e8b2f9cf0ec77dbedead3',
      }),
    ).toMatchSnapshot()
    expect(
      joinDistributionPackageName({
        domain: 'marlonb',
        path: 'mailcrab',
        digest: 'sha256:217db02005fbf51263789d63bfa63011011004685932d330ef8cefcfc054e8da',
      }),
    ).toMatchSnapshot()
    expect(
      joinDistributionPackageName({
        domain: 'localhost:8080',
        path: 'export-4lvt8w/alpine',
        digest: 'sha256:ec1b05d1eac264d9204a57f4ad9d4dc35e9e756e9fedaea0674aefc7edb1d6a4',
      }),
    ).toMatchSnapshot()
    expect(
      joinDistributionPackageName({
        domain: 'localhost:8080',
        path: 'exportfrom-v4yzsn/alpine/test/foo/bar',
        digest: 'sha256:ec1b05d1eac264d9204a57f4ad9d4dc35e9e756e9fedaea0674aefc7edb1d6a4',
      }),
    ).toMatchSnapshot()
    expect(
      joinDistributionPackageName({
        domain: 'nginxinc',
        path: 'nginx-unprivileged',
        digest: 'sha256:7b4316677e4015a53d326e657915340128d9fd506f826f676d9f169c0c8557f6',
      }),
    ).toMatchSnapshot()
  })

  test('joinDistributionPackageName > error', () => {
    expect(() => joinDistributionPackageName({ domain: '', path: 'bad-name', tag: '' })).toThrowError(
      'Could not join Distribution Package Name.',
    )
    expect(() => joinDistributionPackageName({ domain: '', path: '', tag: 'foo:bar:baz' })).toThrowError(
      'Could not join Distribution Package Name.',
    )
    expect(() => joinDistributionPackageName({ domain: '', path: '', tag: '' })).toThrowError(
      'Could not join Distribution Package Name.',
    )
    expect(() =>
      joinDistributionPackageName({ domain: '', path: '', digest: ':0123456789abcdef0123456789abcdef' }),
    ).toThrowError('Could not join Distribution Package Name.')
    expect(() => joinDistributionPackageName({ domain: 'bad-name', path: '', digest: 'sha256:0' })).toThrowError(
      'Could not join Distribution Package Name.',
    )
  })
})
