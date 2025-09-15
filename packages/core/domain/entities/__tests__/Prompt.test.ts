import { Prompt, PromptCategory } from '../../entities/Prompt';

describe('Prompt Entity', () => {
  const basePrompt = new Prompt(
    'id-1',
    'Test Prompt',
    'A prompt for testing',
    'Hello {{name}}, you have {{count}} new messages. Active: {{active}}. Tags: {{tags}}',
    PromptCategory.WORK,
    ['test', 'example'],
    new Date('2023-01-01T00:00:00Z'),
    new Date('2023-01-02T00:00:00Z'),
    '1.0.0',
    'Tester',
    [
      { name: 'name', description: 'User name', type: 'string', required: true },
      { name: 'count', description: 'Message count', type: 'number', required: true },
      { name: 'active', description: 'Is active', type: 'boolean', required: false, defaultValue: false },
      { name: 'tags', description: 'Tags list', type: 'array', required: false }
    ]
  );

  it('renders variables correctly', () => {
    const rendered = basePrompt.renderWithVariables({
      name: 'Alice',
      count: 5,
      active: true,
      tags: ['work', 'urgent']
    });
    expect(rendered).toContain('Hello Alice, you have 5 new messages. Active: true. Tags: work,urgent');
  });

  it('validates required variables', () => {
    const errors = basePrompt.validateVariables({ name: '', count: null });
    expect(errors).toContain("Variable 'name' is required but not provided");
    expect(errors).toContain("Variable 'count' is required but not provided");
  });

  it('validates variable types', () => {
    const errors = basePrompt.validateVariables({ name: 'Bob', count: 'five', active: 'maybe', tags: 123 });
    expect(errors).toContain("Variable 'count' must be a number");
    expect(errors).toContain("Variable 'active' must be a boolean");
    expect(errors).toContain("Variable 'tags' must be an array or string");
  });

  it('uses default values for optional variables', () => {
    const rendered = basePrompt.renderWithVariables({ name: 'Carol', count: 2 });
    expect(rendered).toContain('Active: false'); // default value
  });

  it('updates content immutably with withUpdatedContent', () => {
    const updated = basePrompt.withUpdatedContent('New Name', undefined, 'Hi {{name}}');
    expect(updated.name).toBe('New Name');
    expect(updated.content).toBe('Hi {{name}}');
    expect(updated.updatedAt.getTime()).toBeGreaterThan(basePrompt.updatedAt.getTime());
    expect(basePrompt.name).toBe('Test Prompt'); // original remains unchanged
  });
});
