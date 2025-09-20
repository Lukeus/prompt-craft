import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels';

export const setupIpcHandlers = (mainWindow: BrowserWindow | null) => {
  // Mock data for testing
  const mockPrompts = [
    {
      id: '1',
      name: 'Code Review Assistant',
      description: 'A comprehensive prompt for conducting thorough code reviews with focus on best practices, security, and maintainability',
      content: 'Please review this {{language}} code and provide feedback on {{aspects}}. Focus on:\n\n1. Code quality and readability\n2. Performance implications\n3. Security considerations\n4. Best practices adherence\n\nCode:\n```\n{{code}}\n```',
      category: 'work',
      tags: ['code-review', 'development', 'quality-assurance', 'security'],
      author: 'Development Team',
      version: '1.2.0',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      variables: [
        { name: 'language', type: 'string', required: true, description: 'Programming language' },
        { name: 'aspects', type: 'string', required: false, description: 'Specific aspects to focus on' },
        { name: 'code', type: 'string', required: true, description: 'Code to review' }
      ]
    },
    {
      id: '2',
      name: 'Creative Writing Helper',
      description: 'Assist with creative writing projects, story development, and narrative structure',
      content: 'Help me write a {{genre}} story about {{topic}} with a {{tone}} tone. \n\nPlease include:\n- Compelling characters\n- Engaging plot structure\n- Vivid descriptions\n- Appropriate pacing\n\nAdditional context: {{context}}',
      category: 'personal',
      tags: ['writing', 'creative', 'storytelling', 'fiction'],
      author: 'Creative Writing Group',
      version: '2.0.0',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      variables: [
        { name: 'genre', type: 'string', required: true, description: 'Story genre' },
        { name: 'topic', type: 'string', required: true, description: 'Main story topic' },
        { name: 'tone', type: 'string', required: true, description: 'Desired tone' },
        { name: 'context', type: 'string', required: false, description: 'Additional context' }
      ]
    },
    {
      id: '3',
      name: 'Technical Documentation',
      description: 'Generate comprehensive technical documentation for software projects',
      content: 'Create technical documentation for {{project_type}} project named "{{project_name}}".\n\nInclude:\n1. Overview and purpose\n2. Installation instructions\n3. Usage examples\n4. API reference (if applicable)\n5. Contributing guidelines\n\nTechnical details: {{technical_details}}',
      category: 'work',
      tags: ['documentation', 'technical-writing', 'software', 'api'],
      author: 'Technical Writers',
      version: '1.5.0',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      variables: [
        { name: 'project_type', type: 'string', required: true, description: 'Type of project' },
        { name: 'project_name', type: 'string', required: true, description: 'Project name' },
        { name: 'technical_details', type: 'string', required: false, description: 'Technical specifications' }
      ]
    },
    {
      id: '4',
      name: 'Meeting Agenda Generator',
      description: 'Create structured meeting agendas for various types of business meetings',
      content: 'Create a {{meeting_type}} meeting agenda for {{date}}.\n\nMeeting: {{meeting_title}}\nDuration: {{duration}}\nAttendees: {{attendees}}\n\nTopics to cover:\n{{topics}}\n\nPlease structure with time allocations and clear action items.',
      category: 'work',
      tags: ['meetings', 'planning', 'business', 'productivity'],
      author: 'Project Management',
      version: '1.1.0',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      variables: [
        { name: 'meeting_type', type: 'string', required: true, description: 'Type of meeting' },
        { name: 'date', type: 'string', required: true, description: 'Meeting date' },
        { name: 'meeting_title', type: 'string', required: true, description: 'Meeting title' },
        { name: 'duration', type: 'string', required: true, description: 'Meeting duration' },
        { name: 'attendees', type: 'string', required: true, description: 'List of attendees' },
        { name: 'topics', type: 'string', required: true, description: 'Topics to discuss' }
      ]
    },
    {
      id: '5',
      name: 'Recipe Creator',
      description: 'Generate detailed recipes with ingredients, instructions, and cooking tips',
      content: 'Create a {{cuisine_type}} recipe for {{dish_name}}.\n\nDietary requirements: {{dietary_requirements}}\nServing size: {{servings}} people\nDifficulty: {{difficulty}}\n\nPlease include:\n- Complete ingredients list with measurements\n- Step-by-step instructions\n- Cooking time and prep time\n- Nutritional information if possible\n- Chef tips and variations',
      category: 'personal',
      tags: ['cooking', 'recipes', 'food', 'lifestyle'],
      author: 'Culinary Enthusiasts',
      version: '1.3.0',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      variables: [
        { name: 'cuisine_type', type: 'string', required: true, description: 'Type of cuisine' },
        { name: 'dish_name', type: 'string', required: true, description: 'Name of the dish' },
        { name: 'dietary_requirements', type: 'string', required: false, description: 'Dietary restrictions' },
        { name: 'servings', type: 'number', required: true, description: 'Number of servings' },
        { name: 'difficulty', type: 'string', required: true, description: 'Cooking difficulty level' }
      ]
    },
    {
      id: '6',
      name: 'Community Event Planner',
      description: 'Plan and organize community events with detailed logistics and promotion strategies',
      content: 'Help plan a {{event_type}} for {{target_audience}} on {{event_date}}.\n\nEvent: {{event_name}}\nLocation: {{location}}\nBudget: {{budget}}\nExpected attendance: {{attendance}}\n\nPlease provide:\n1. Event timeline and schedule\n2. Resource and staffing requirements\n3. Marketing and promotion strategy\n4. Risk management considerations\n5. Success metrics',
      category: 'shared',
      tags: ['event-planning', 'community', 'organization', 'logistics'],
      author: 'Community Organizers',
      version: '2.1.0',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      variables: [
        { name: 'event_type', type: 'string', required: true, description: 'Type of event' },
        { name: 'target_audience', type: 'string', required: true, description: 'Target audience' },
        { name: 'event_date', type: 'string', required: true, description: 'Event date' },
        { name: 'event_name', type: 'string', required: true, description: 'Name of the event' },
        { name: 'location', type: 'string', required: true, description: 'Event location' },
        { name: 'budget', type: 'string', required: false, description: 'Available budget' },
        { name: 'attendance', type: 'number', required: false, description: 'Expected attendance' }
      ]
    },
    {
      id: '7',
      name: 'Learning Resource Curator',
      description: 'Curate comprehensive learning resources for any topic with structured learning paths',
      content: 'Create a comprehensive learning resource guide for {{topic}}.\n\nLearning level: {{level}}\nTime commitment: {{time_commitment}}\nPreferred format: {{format}}\nSpecific goals: {{goals}}\n\nProvide:\n1. Structured learning path with milestones\n2. Recommended resources (books, courses, tutorials)\n3. Practical exercises and projects\n4. Assessment methods\n5. Community and networking opportunities',
      category: 'shared',
      tags: ['education', 'learning', 'resources', 'skill-development'],
      author: 'Education Team',
      version: '1.4.0',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      variables: [
        { name: 'topic', type: 'string', required: true, description: 'Learning topic' },
        { name: 'level', type: 'string', required: true, description: 'Learning level (beginner/intermediate/advanced)' },
        { name: 'time_commitment', type: 'string', required: true, description: 'Available time commitment' },
        { name: 'format', type: 'string', required: false, description: 'Preferred learning format' },
        { name: 'goals', type: 'string', required: false, description: 'Specific learning goals' }
      ]
    },
    {
      id: '8',
      name: 'Travel Itinerary Planner',
      description: 'Create detailed travel itineraries with activities, logistics, and local recommendations',
      content: 'Plan a {{duration}} trip to {{destination}} for {{travelers}}.\n\nTravel dates: {{dates}}\nBudget: {{budget}}\nInterests: {{interests}}\nAccommodation type: {{accommodation}}\n\nCreate detailed itinerary including:\n1. Day-by-day schedule with activities\n2. Transportation options\n3. Restaurant and dining recommendations\n4. Cultural experiences and local attractions\n5. Practical tips and important information',
      category: 'personal',
      tags: ['travel', 'planning', 'itinerary', 'vacation'],
      author: 'Travel Enthusiasts',
      version: '1.6.0',
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      variables: [
        { name: 'duration', type: 'string', required: true, description: 'Trip duration' },
        { name: 'destination', type: 'string', required: true, description: 'Travel destination' },
        { name: 'travelers', type: 'string', required: true, description: 'Number and type of travelers' },
        { name: 'dates', type: 'string', required: true, description: 'Travel dates' },
        { name: 'budget', type: 'string', required: false, description: 'Travel budget' },
        { name: 'interests', type: 'string', required: true, description: 'Travel interests and preferences' },
        { name: 'accommodation', type: 'string', required: false, description: 'Preferred accommodation type' }
      ]
    }
  ];

  // Prompt CRUD operations
  ipcMain.handle(IPC_CHANNELS.PROMPTS.GET_ALL, async () => {
    try {
      return { success: true, data: mockPrompts };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.GET_BY_ID, async (_, promptId: string) => {
    try {
      const prompt = mockPrompts.find(p => p.id === promptId);
      if (prompt) {
        return { success: true, data: prompt };
      } else {
        return { success: false, error: 'Prompt not found' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DATABASE.GET_STATS, async () => {
    try {
      const stats = {
        total: mockPrompts.length,
        work: mockPrompts.filter((p: any) => p.category === 'work').length,
        personal: mockPrompts.filter((p: any) => p.category === 'personal').length,
        shared: mockPrompts.filter((p: any) => p.category === 'shared').length,
      };
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // MCP Server operations
  ipcMain.handle(IPC_CHANNELS.MCP.START_SERVER, async () => {
    try {
      return { success: true, message: 'MCP Server started (mock)' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP.STOP_SERVER, async () => {
    try {
      return { success: true, message: 'MCP Server stopped (mock)' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP.GET_STATUS, async () => {
    try {
      return { success: true, data: { running: false, port: 3000 } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // System operations
  ipcMain.handle(IPC_CHANNELS.SYSTEM.GET_APP_VERSION, async () => {
    try {
      const { app } = require('electron');
      return { success: true, data: app.getVersion() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM.GET_PLATFORM, async () => {
    try {
      return { success: true, data: process.platform };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Navigation events
  ipcMain.on(IPC_CHANNELS.NAVIGATION.GO_TO, (_, route: string) => {
    mainWindow?.webContents.send('navigate-to', route);
  });
};
