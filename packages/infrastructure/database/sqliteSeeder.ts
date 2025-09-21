import { getSQLiteConnection } from './sqliteConnection';
import { Prompt, PromptCategory } from '../../core/domain/entities/Prompt';
import { DrizzleSQLitePromptRepository } from './DrizzleSQLitePromptRepository';
import { v4 as uuidv4 } from 'uuid';

export class SQLiteSeeder {
  private repository: DrizzleSQLitePromptRepository;
  
  constructor() {
    this.repository = new DrizzleSQLitePromptRepository();
  }
  
  async seedDatabase(): Promise<void> {
    console.log('Seeding SQLite database with initial prompts...');
    
    try {
      // Check if we already have data
      const existingPrompts = await this.repository.findAll();
      if (existingPrompts.length > 0) {
        console.log(`Database already contains ${existingPrompts.length} prompts, skipping seeding`);
        return;
      }
      
      const seedPrompts = this.getSeedPrompts();
      
      for (const prompt of seedPrompts) {
        await this.repository.save(prompt);
      }
      
      console.log(`Successfully seeded database with ${seedPrompts.length} initial prompts`);
    } catch (error) {
      console.error('Error seeding SQLite database:', error);
      throw error;
    }
  }
  
  private getSeedPrompts(): Prompt[] {
    const now = new Date();
    
    return [
      new Prompt(
        uuidv4(),
        'Code Review Assistant',
        'A helpful assistant for conducting thorough code reviews with best practices',
        `You are an experienced software engineer conducting a code review. Please analyze the following code and provide constructive feedback on:

1. **Code Quality**: Structure, readability, and maintainability
2. **Best Practices**: Following language/framework conventions
3. **Security**: Potential security vulnerabilities
4. **Performance**: Optimization opportunities
5. **Testing**: Test coverage and quality
6. **Documentation**: Code comments and documentation

Code to review:
{{code}}

Language/Framework: {{language}}
Context: {{context}}

Please provide specific, actionable feedback with examples where appropriate.`,
        PromptCategory.WORK,
        ['code-review', 'development', 'quality-assurance'],
        now,
        now,
        '1.0.0',
        'System',
        [
          { name: 'code', type: 'string', required: true, description: 'The code to be reviewed' },
          { name: 'language', type: 'string', required: true, description: 'Programming language or framework' },
          { name: 'context', type: 'string', required: false, description: 'Additional context about the code' }
        ]
      ),
      
      new Prompt(
        uuidv4(),
        'Meeting Notes Summarizer',
        'Transform meeting recordings or notes into structured, actionable summaries',
        `Please analyze the following meeting content and create a comprehensive summary with these sections:

## Meeting Summary
**Date**: {{date}}
**Participants**: {{participants}}
**Duration**: {{duration}}

## Key Topics Discussed
[List the main topics covered]

## Decisions Made
[Document all decisions with who made them]

## Action Items
[List all action items with assignees and due dates]

## Next Steps
[Outline what happens next]

## Follow-up Required
[Any additional follow-up needed]

Meeting content:
{{meeting_content}}`,
        PromptCategory.WORK,
        ['meetings', 'productivity', 'documentation'],
        now,
        now,
        '1.0.0',
        'System',
        [
          { name: 'meeting_content', type: 'string', required: true, description: 'The meeting transcript or notes' },
          { name: 'date', type: 'string', required: true, description: 'Meeting date' },
          { name: 'participants', type: 'string', required: true, description: 'List of participants' },
          { name: 'duration', type: 'string', required: false, description: 'Meeting duration' }
        ]
      ),
      
      new Prompt(
        uuidv4(),
        'Creative Writing Assistant',
        'Generate creative story ideas, character development, and plot structures',
        `You are a creative writing mentor helping to develop compelling stories. Based on the given parameters, provide detailed creative assistance.

## Story Development for: {{genre}} {{story_type}}

### Core Concept
{{concept}}

### Setting & World
- **Time Period**: {{time_period}}
- **Location**: {{setting}}
- **Atmosphere**: {{mood}}

Please provide:

1. **Enhanced Plot Outline** (3-5 key plot points)
2. **Character Suggestions** (main protagonist and 2-3 supporting characters)
3. **Conflict & Stakes** (what's at risk and why it matters)
4. **Unique Elements** (what makes this story special)
5. **Opening Scene Ideas** (2-3 compelling ways to start)

Make the suggestions specific and actionable for {{target_audience}} readers.`,
        PromptCategory.PERSONAL,
        ['creative-writing', 'storytelling', 'fiction'],
        now,
        now,
        '1.0.0',
        'System',
        [
          { name: 'genre', type: 'string', required: true, description: 'Story genre (e.g., sci-fi, romance, mystery)' },
          { name: 'story_type', type: 'string', required: true, description: 'Format (e.g., short story, novel, screenplay)' },
          { name: 'concept', type: 'string', required: true, description: 'Basic story concept or premise' },
          { name: 'time_period', type: 'string', required: false, description: 'When the story takes place' },
          { name: 'setting', type: 'string', required: false, description: 'Where the story takes place' },
          { name: 'mood', type: 'string', required: false, description: 'Desired tone or atmosphere' },
          { name: 'target_audience', type: 'string', required: false, description: 'Intended audience' }
        ]
      ),
      
      new Prompt(
        uuidv4(),
        'Recipe Optimizer',
        'Adapt recipes for dietary restrictions, serving sizes, and available ingredients',
        `I need help optimizing a recipe based on specific requirements. Please analyze and adapt the recipe below:

## Original Recipe
{{original_recipe}}

## Optimization Requirements
- **Dietary Restrictions**: {{dietary_restrictions}}
- **Serving Size**: {{serving_size}} (original serves {{original_servings}})
- **Available Ingredients**: {{available_ingredients}}
- **Cooking Method**: {{cooking_method}}
- **Time Constraint**: {{time_limit}}

Please provide:

### Adapted Recipe
[Complete ingredient list with adjusted quantities]

### Cooking Instructions
[Step-by-step instructions with timing]

### Substitution Notes
[Explain any ingredient substitutions made and why]

### Nutritional Highlights
[Key nutritional benefits of the adapted recipe]

### Pro Tips
[2-3 tips for best results]`,
        PromptCategory.PERSONAL,
        ['cooking', 'nutrition', 'meal-planning'],
        now,
        now,
        '1.0.0',
        'System',
        [
          { name: 'original_recipe', type: 'string', required: true, description: 'The original recipe to optimize' },
          { name: 'dietary_restrictions', type: 'string', required: false, description: 'Any dietary restrictions (vegan, gluten-free, etc.)' },
          { name: 'serving_size', type: 'number', required: false, description: 'Desired number of servings' },
          { name: 'original_servings', type: 'number', required: false, description: 'Original recipe serving size' },
          { name: 'available_ingredients', type: 'string', required: false, description: 'Ingredients you have on hand' },
          { name: 'cooking_method', type: 'string', required: false, description: 'Preferred cooking method' },
          { name: 'time_limit', type: 'string', required: false, description: 'Time constraint for cooking' }
        ]
      ),
      
      new Prompt(
        uuidv4(),
        'Travel Itinerary Planner',
        'Create detailed travel plans with activities, logistics, and local insights',
        `Create a comprehensive travel itinerary for the following trip:

## Trip Details
- **Destination**: {{destination}}
- **Duration**: {{duration}}
- **Travel Dates**: {{dates}}
- **Budget**: {{budget}}
- **Group Size**: {{group_size}}
- **Interests**: {{interests}}
- **Accommodation Type**: {{accommodation}}

## Itinerary Plan

### Day-by-Day Schedule
[Detailed daily activities with timing and locations]

### Must-See Attractions
[Top recommended attractions with best visiting times]

### Local Experiences
[Authentic local activities and cultural experiences]

### Dining Recommendations
[Restaurant suggestions for different meals and budgets]

### Transportation
[How to get around, including costs and booking tips]

### Budget Breakdown
[Estimated costs for accommodation, food, activities, transport]

### Packing Essentials
[Climate-appropriate clothing and travel essentials]

### Local Tips
[Cultural etiquette, language basics, safety considerations]

### Alternative Plans
[Backup activities for weather or availability issues]`,
        PromptCategory.PERSONAL,
        ['travel', 'planning', 'adventure'],
        now,
        now,
        '1.0.0',
        'System',
        [
          { name: 'destination', type: 'string', required: true, description: 'Travel destination' },
          { name: 'duration', type: 'string', required: true, description: 'Length of trip' },
          { name: 'dates', type: 'string', required: false, description: 'Specific travel dates' },
          { name: 'budget', type: 'string', required: false, description: 'Total budget range' },
          { name: 'group_size', type: 'string', required: false, description: 'Number of travelers' },
          { name: 'interests', type: 'string', required: false, description: 'Activities and interests' },
          { name: 'accommodation', type: 'string', required: false, description: 'Preferred accommodation type' }
        ]
      ),
      
      new Prompt(
        uuidv4(),
        'Event Planning Coordinator',
        'Comprehensive event planning assistance for any type of celebration or gathering',
        `Help me plan a memorable event with all the essential details covered.

## Event Overview
- **Event Type**: {{event_type}}
- **Occasion**: {{occasion}}
- **Date & Time**: {{date_time}}
- **Guest Count**: {{guest_count}}
- **Budget**: {{budget}}
- **Venue**: {{venue}}
- **Theme/Style**: {{theme}}

## Complete Event Plan

### Pre-Event Checklist (6-8 weeks before)
[Essential planning tasks with deadlines]

### Venue & Logistics
[Setup requirements, layout, equipment needs]

### Catering & Menu
[Food and beverage recommendations based on event type]

### Entertainment & Activities
[Appropriate activities for the audience and occasion]

### Decorations & Ambiance
[Theme-consistent decoration ideas and suppliers]

### Timeline for Event Day
[Hour-by-hour schedule for smooth execution]

### Vendor Coordination
[Recommended vendors and coordination tips]

### Budget Allocation
[Detailed budget breakdown by category]

### Contingency Planning
[Backup plans for common issues]

### Post-Event Tasks
[Cleanup, thank you notes, vendor payments]`,
        PromptCategory.SHARED,
        ['event-planning', 'celebrations', 'organization'],
        now,
        now,
        '1.0.0',
        'System',
        [
          { name: 'event_type', type: 'string', required: true, description: 'Type of event (birthday, wedding, corporate, etc.)' },
          { name: 'occasion', type: 'string', required: true, description: 'Specific occasion or purpose' },
          { name: 'date_time', type: 'string', required: true, description: 'Preferred date and time' },
          { name: 'guest_count', type: 'number', required: true, description: 'Expected number of guests' },
          { name: 'budget', type: 'string', required: false, description: 'Total budget range' },
          { name: 'venue', type: 'string', required: false, description: 'Venue type or specific location' },
          { name: 'theme', type: 'string', required: false, description: 'Event theme or style preferences' }
        ]
      )
    ];
  }
}

// Export a function to seed the database
export async function seedSQLiteDatabase(): Promise<void> {
  const seeder = new SQLiteSeeder();
  await seeder.seedDatabase();
}