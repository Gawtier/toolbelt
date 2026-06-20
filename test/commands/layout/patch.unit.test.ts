import { buildAllOps, formatOps, toPlannedOps } from '../../../src/commands/layout/patch';

describe('toPlannedOps', () => {
  expect.assertions(12);

  it('accepts a valid add op', () => {
    expect.assertions(3);
    const ops = toPlannedOps('layout', [
      { op: 'add', path: '/collections/orders/layout/segments/-', value: { id: 'seg1', name: 'VIP' } },
    ]);
    expect(ops).toHaveLength(1);
    expect(ops[0].op).toBe('add');
    expect(ops[0].domain).toBe('layout');
  });

  it('accepts a valid replace op', () => {
    expect.assertions(2);
    const ops = toPlannedOps('layout', [
      { op: 'replace', path: '/collections/orders/displayName', value: 'Orders v2' },
    ]);
    expect(ops[0].op).toBe('replace');
    expect(ops[0].label).toBe('replace /collections/orders/displayName');
  });

  it('rejects an unknown op type', () => {
    expect.assertions(1);
    expect(() =>
      toPlannedOps('layout', [{ op: 'upsert', path: '/collections/orders/displayName' }]),
    ).toThrow(/unknown op "upsert"/);
  });

  it('rejects a path that does not start with "/"', () => {
    expect.assertions(1);
    expect(() =>
      toPlannedOps('layout', [{ op: 'replace', path: 'collections/orders/displayName' }]),
    ).toThrow(/path must be a string starting with/);
  });

  it('rejects a path outside the server whitelist', () => {
    expect.assertions(1);
    expect(() =>
      toPlannedOps('layout', [{ op: 'replace', path: '/collections/orders/__internal__', value: 'x' }]),
    ).toThrow(/not allowed by the server whitelist/);
  });

  it('accepts a valid workflow op', () => {
    expect.assertions(2);
    const ops = toPlannedOps('workflows', [
      { op: 'replace', path: '/workflows/42/isVisible', value: true },
    ]);
    expect(ops[0].domain).toBe('workflows');
    expect(ops[0].op).toBe('replace');
  });
});

describe('buildAllOps', () => {
  expect.assertions(5);

  it('collects ops from multiple domains in domain order', () => {
    expect.assertions(3);
    const ops = buildAllOps({
      layout: [{ op: 'replace', path: '/collections/orders/displayName', value: 'Orders v2' }],
      workflows: [{ op: 'replace', path: '/workflows/42/isVisible', value: true }],
    });
    expect(ops).toHaveLength(2);
    expect(ops[0].domain).toBe('layout');
    expect(ops[1].domain).toBe('workflows');
  });

  it('returns an empty array when input has no ops', () => {
    expect.assertions(1);
    expect(buildAllOps({})).toHaveLength(0);
  });

  it('throws when a domain value is not an array', () => {
    expect.assertions(1);
    expect(() =>
      buildAllOps({ layout: 'bad' as unknown as Array<{ op: string; path: string }> }),
    ).toThrow(/"layout" must be an array/);
  });
});

describe('formatOps', () => {
  expect.assertions(2);

  it('groups ops by domain with prefixes', () => {
    expect.assertions(1);
    const ops = buildAllOps({
      layout: [{ op: 'replace', path: '/collections/orders/displayName', value: 'Orders v2' }],
    });
    expect(formatOps(ops)).toContain('layout (1 op)');
  });

  it('uses plural for multiple ops', () => {
    expect.assertions(1);
    const ops = buildAllOps({
      layout: [
        { op: 'replace', path: '/collections/orders/displayName', value: 'A' },
        { op: 'replace', path: '/collections/orders/icon', value: 'truck' },
      ],
    });
    expect(formatOps(ops)).toContain('layout (2 ops)');
  });
});
