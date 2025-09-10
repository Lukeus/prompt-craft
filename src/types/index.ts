export interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  category: PromptCategory;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  version: string;
  author?: string;
  variables?: PromptVariable[];
}

export interface PromptVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: any;
}

export enum PromptCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  SHARED = 'shared'
}

export enum WorkPromptType {
  CODE_REVIEW = 'code-review',
  DOCUMENTATION = 'documentation',
  DEBUGGING = 'debugging',
  ARCHITECTURE = 'architecture',
  TESTING = 'testing',
  API_DESIGN = 'api-design',
  REFACTORING = 'refactoring',
  SECURITY = 'security'
}

export enum PersonalPromptType {
  MUSIC = 'music',
  VISUAL_ART = 'visual-art',
  WRITING = 'writing',
  BRANDING = 'branding',
  WEBSITE = 'website',
  PHOTOGRAPHY = 'photography',
  CREATIVE_WRITING = 'creative-writing'
}

export interface PromptCollection {
  name: string;
  description: string;
  prompts: Prompt[];
  category: PromptCategory;
}

export interface PromptSearchOptions {
  query?: string;
  category?: PromptCategory;
  tags?: string[];
  author?: string;
  limit?: number;
}

export interface PromptConfig {
  version: string;
  collections: {
    work: string[];
    personal: string[];
    shared: string[];
  };
  mcpServer: {
    name: string;
    version: string;
    port?: number;
  };
}
