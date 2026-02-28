# Jira Integration Plan

## Overview

Add Jira integration to Orbit Agent, allowing users to connect their Jira instance, view assigned tickets, track daily progress, and get AI-powered summaries of their work.

## Use Cases

### Primary Use Cases

1. **List My Tickets**
   - User asks: "What tickets are assigned to me?"
   - Bot returns: List of assigned tickets with key, summary, status, and priority
   - Example: `TDX-300: Fix authentication bug (In Progress, High)`

2. **Daily Summary**
   - User asks: "What tickets did I work on today?" or "Summarize my day"
   - Bot returns: Summary of all tickets with activity today, status changes, comments made
   - Includes time spent estimation if available

3. **Mark Ticket as Complete**
   - User says: "I finished TDX-300" or "TDX-201 is done"
   - Bot:
     - Transitions ticket to "Done" or appropriate resolution status
     - Adds comment indicating completion
     - Confirms action back to user

4. **Ticket Details**
   - User asks: "Tell me about TDX-300" or "Explain ticket number 300"
   - Bot returns:
     - Full description
     - Assignee
     - Reporter
     - Priority
     - Status
     - Created/Updated dates
     - Comments summary

5. **Progress Report**
   - User asks: "Generate my daily report"
   - Bot returns:
     - Tickets completed today
     - Tickets in progress
     - Upcoming high-priority tickets
     - Blockers (if any)

### Future Autonomous Workflows

1. **New Assignment Notification**
   - Trigger: User gets assigned new ticket
   - Bot message: "Hey, you were just assigned TDX-300 'Fix authentication bug' by @john.doe. Priority: High"

2. **Ticket Status Change Alert**
   - Trigger: Ticket status changes
   - Bot message: "TDX-300 moved from 'In Progress' to 'Ready for Review'"

3. **Daily Standup Summary**
   - Scheduled: Every morning at 9 AM
   - Bot message: "Good morning! Here's what you have for today: [tickets list]"

4. **Weekly Report**
   - Scheduled: Friday evening
   - Bot message: "Weekly wrap-up: 5 tickets completed, 2 in progress, 3 blocked"

5. **Escalation on Blockers**
   - Trigger: Ticket stays blocked > 24 hours
   - Bot message: "⚠️ TDX-400 has been blocked for 24 hours. Consider escalating to @manager"

---

## Architecture Decision: MCP (Model Context Protocol)

**Answer: NO - MCP is NOT needed for Jira integration**

### Why MCP is NOT Required

1. **Jira has a robust REST API** - No need for MCP server
2. **Token-based authentication** - OAuth 2.0 or API tokens work directly
3. **No real-time requirements initially** - Webhooks can handle notifications
4. **Simpler implementation** - Direct API calls vs MCP server infrastructure

### When MCP Would Be Useful

MCP would be needed if:
- Jira API was unavailable or limited
- You needed custom business logic on Jira side
- You wanted to expose internal Orbit operations to external tools
- Complex data transformations were needed before sending to AI

**For this integration**: Direct Jira REST API integration is sufficient and simpler.

---

## Database Schema (Lightweight)

Keep it simple - store minimal data to make API calls efficient.

### New Columns in `users` Table

```typescript
// Add to packages/bridge/src/application/domain/entities/user.entity.ts

// Jira Integration
@Column({ type: 'varchar', length: 255, nullable: true })
jiraBaseUrl?: string;          // e.g., "https://company.atlassian.net"

@Column({ type: 'varchar', length: 255, nullable: true })
jiraEmail?: string;           // User's Jira email

@Column({ type: 'varchar', length: 500, nullable: true })
jiraApiToken?: string;        // Encrypted Jira API token

@Column({ type: 'enum', enum: ['api_token', 'oauth'], nullable: true })
jiraAuthType?: 'api_token' | 'oauth';

@Column({ type: 'timestamp with time zone', nullable: true })
jiraLastSyncAt?: Date;        // Last successful sync timestamp
```

### Optional: Activity Tracking Table (for daily summaries)

Only if you want offline summaries without hitting Jira API every time:

```typescript
// packages/bridge/src/application/domain/entities/jira-activity.entity.ts

@Entity('jira_activities')
export class JiraActivity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 255 })
  ticketKey!: string;         // e.g., "TDX-300"

  @Column({ type: 'varchar', length: 50 })
  activityType!: string;      // 'assigned', 'status_change', 'comment', 'completed'

  @Column({ type: 'text', nullable: true })
  activityData?: string;       // JSON: { from: 'In Progress', to: 'Done' }

  @Column({ type: 'timestamp with time zone' })
  occurredAt!: Date;

  @Column({ type: 'timestamp with time zone' })
  syncedAt!: Date;
}
```

**Recommendation**: Start WITHOUT this table. Use Jira API for all queries. Add caching later if needed.

---

## Step-by-Step Implementation Plan

### Phase 1: Foundation (Week 1)

#### Step 1.1: Add Database Schema (30 min)

```bash
# Generate migration
cd packages/bridge
pnpm migration:generate -d src/infrastructure/database/datasource.ts AddJiraFieldsToUser

# Run migration
pnpm migration:run -d src/infrastructure/database/datasource.ts
```

Update `user.entity.ts` to add Jira fields.

#### Step 1.2: Create Jira Service (2 hours)

Create `packages/bridge/src/application/jira/jira.service.ts`:

```typescript
@Injectable()
export class JiraService {
  async connect(userId: string, baseUrl: string, email: string, apiToken: string): Promise<void>
  async disconnect(userId: string): Promise<void>
  async getConnectionStatus(userId: string): Promise<{ connected: boolean; email?: string }>
  async getAssignedTickets(userId: string): Promise<JiraTicket[]>
  async getTicketDetails(userId: string, ticketKey: string): Promise<JiraTicket>
  async transitionTicket(userId: string, ticketKey: string, toStatus: string): Promise<void>
  async getDailyActivity(userId: string, date: Date): Promise<JiraActivity[]>
}
```

Use Jira REST API:
- `GET /rest/api/3/search?jql=assignee={email}&status!=Done` - Get assigned tickets
- `GET /rest/api/3/issue/{key}` - Get ticket details
- `POST /rest/api/3/issue/{key}/transitions` - Transition ticket
- `GET /rest/api/3/issue/{key}/changelog` - Get activity history

#### Step 1.3: Create Jira Controller (1 hour)

Create `packages/bridge/src/application/jira/jira.controller.ts`:

```typescript
@Controller('jira')
export class JiraController {
  @Post('connect')
  @UseGuards(JwtAuthGuard)
  async connect(@Body() dto: JiraConnectDto, @Request() req) { }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Request() req) { }

  @Get('tickets/assigned')
  @UseGuards(JwtAuthGuard)
  async getAssignedTickets(@Request() req) { }

  @Get('tickets/:key')
  @UseGuards(JwtAuthGuard)
  async getTicketDetails(@Param('key') key: string, @Request() req) { }

  @Post('tickets/:key/transition')
  @UseGuards(JwtAuthGuard)
  async transitionTicket(@Param('key') key: string, @Body() dto: TransitionDto, @Request() req) { }

  @Get('activity/daily')
  @UseGuards(JwtAuthGuard)
  async getDailyActivity(@Query('date') date: string, @Request() req) { }
}
```

#### Step 1.4: Create Jira Module (30 min)

Create `packages/bridge/src/application/jira/jira.module.ts`:

```typescript
@Module({
  imports: [HttpModule],
  controllers: [JiraController],
  providers: [JiraService],
  exports: [JiraService],
})
export class JiraModule {}
```

Add to `app.module.ts`:

```typescript
@Module({
  imports: [
    JiraModule,
    // ... other modules
  ],
})
export class AppModule {}
```

---

### Phase 2: Web Dashboard Integration (Week 1)

#### Step 2.1: Create JiraCard Component (1 hour)

Create `apps/web/app/components/integrations/JiraCard.tsx`:

```typescript
export function JiraCard({
  isConnected,
  jiraEmail,
  onConnect,
  onDisconnect,
  loading,
}: JiraCardProps) {
  // Similar UI to EmailCard.tsx
  // Fields: Jira URL, Email, API Token
}
```

#### Step 2.2: Add Jira Integration Page (1 hour)

Create or update dashboard to include JiraCard:
- Input fields for Jira URL, email, API token
- Instructions on how to generate API token in Jira
- Connection status display

#### Step 2.3: Add Jira Endpoints to Web API Client (30 min)

Update `apps/web/src/lib/api.ts`:

```typescript
export const jiraApi = {
  connect: (data: JiraConnectDto) => api.post('/jira/connect', data),
  getStatus: () => api.get('/jira/status'),
  getAssignedTickets: () => api.get('/jira/tickets/assigned'),
  getTicketDetails: (key: string) => api.get(`/jira/tickets/${key}`),
  transitionTicket: (key: string, toStatus: string) => api.post(`/jira/tickets/${key}/transition`, { toStatus }),
  getDailyActivity: (date: string) => api.get(`/jira/activity/daily?date=${date}`),
};
```

---

### Phase 3: Chat Integration (Week 2)

#### Step 3.1: Create Jira Intent Parser (2 hours)

Create `packages/bridge/src/application/jira/intents/jira-intent-parser.ts`:

```typescript
export class JiraIntentParser {
  parse(message: string): JiraIntent | null {
    // Patterns:
    // - "what tickets are assigned to me" -> LIST_TICKETS
    // - "show me my tickets" -> LIST_TICKETS
    // - "I finished TDX-300" -> COMPLETE_TICKET
    // - "TDX-201 is done" -> COMPLETE_TICKET
    // - "tell me about TDX-300" -> GET_TICKET_DETAILS
    // - "summarize my day" -> DAILY_SUMMARY
    // - "what did I do today" -> DAILY_SUMMARY
    // - "generate my daily report" -> DAILY_REPORT
  }
}

export interface JiraIntent {
  type: 'LIST_TICKETS' | 'GET_TICKET_DETAILS' | 'COMPLETE_TICKET' | 'DAILY_SUMMARY' | 'DAILY_REPORT';
  ticketKey?: string;      // e.g., "TDX-300"
  date?: Date;            // for daily queries
}
```

#### Step 3.2: Update Message Router (1 hour)

Update `packages/bridge/src/application/adapters/message-router.service.ts`:

```typescript
export class MessageRouterService {
  constructor(
    private readonly jiraIntentParser: JiraIntentParser,
    private readonly jiraService: JiraService,
  ) {}

  async handleMessage(message: string, userId: string): Promise<string> {
    // Check for Jira intents first
    const jiraIntent = this.jiraIntentParser.parse(message);
    if (jiraIntent) {
      return this.handleJiraIntent(jiraIntent, userId);
    }

    // Fall back to other handlers...
  }

  private async handleJiraIntent(intent: JiraIntent, userId: string): Promise<string> {
    const connection = await this.jiraService.getConnectionStatus(userId);

    if (!connection.connected) {
      return "⚠️ Please connect your Jira account first via the dashboard.";
    }

    switch (intent.type) {
      case 'LIST_TICKETS':
        return this.listTickets(userId);
      case 'GET_TICKET_DETAILS':
        return this.getTicketDetails(userId, intent.ticketKey!);
      case 'COMPLETE_TICKET':
        return this.completeTicket(userId, intent.ticketKey!);
      case 'DAILY_SUMMARY':
        return this.getDailySummary(userId);
      case 'DAILY_REPORT':
        return this.getDailyReport(userId);
    }
  }

  private async listTickets(userId: string): Promise<string> {
    const tickets = await this.jiraService.getAssignedTickets(userId);

    if (tickets.length === 0) {
      return "📋 You have no tickets assigned to you.";
    }

    let response = "📋 **Your Assigned Tickets:**\n\n";
    tickets.forEach((ticket, index) => {
      response += `${index + 1}. **${ticket.key}**: ${ticket.summary}\n`;
      response += `   Status: ${ticket.status} | Priority: ${ticket.priority}\n\n`;
    });

    return response;
  }

  private async completeTicket(userId: string, ticketKey: string): Promise<string> {
    await this.jiraService.transitionTicket(userId, ticketKey, 'Done');
    return `✅ ${ticketKey} marked as Done! Great work! 🎉`;
  }

  private async getDailySummary(userId: string): Promise<string> {
    const today = new Date();
    const activities = await this.jiraService.getDailyActivity(userId, today);

    // Build summary...
  }

  private async getDailyReport(userId: string): Promise<string> {
    // More detailed report...
  }
}
```

#### Step 3.3: Add Jira Commands to Telegram Bot (30 min)

Update `packages/bridge/src/application/adapters/telegram.adapter.ts`:

```typescript
// Add commands to help message
private getHelpMessage(): string {
  return `
/jira - Show Jira connection status
/mytickets - List assigned Jira tickets
/ticket <key> - Get ticket details
/today - Daily Jira summary
/report - Generate daily report
  `;
}
```

---

### Phase 4: Enhanced Features (Week 2)

#### Step 4.1: Ticket Comments (1 hour)

Add ability to add comments via chat:

```typescript
// Intent pattern: "comment on TDX-300: this is done"
interface JiraIntent {
  type: 'ADD_COMMENT';
  ticketKey: string;
  comment: string;
}
```

#### Step 4.2: Ticket Assignment (1 hour)

Add ability to assign tickets to others:

```typescript
// Intent pattern: "assign TDX-300 to @john"
interface JiraIntent {
  type: 'ASSIGN_TICKET';
  ticketKey: string;
  assignee: string;
}
```

#### Step 4.3: Search Tickets (1 hour)

Add search functionality:

```typescript
// Intent pattern: "search for tickets with 'authentication' in title"
interface JiraIntent {
  type: 'SEARCH_TICKETS';
  query: string;
}
```

---

### Phase 5: Autonomous Workflows (Future - Optional)

#### Step 5.1: Webhook Setup (2 hours)

Jira webhook for real-time notifications:

```typescript
// packages/bridge/src/application/jira/jira-webhook.controller.ts

@Controller('jira/webhooks')
export class JiraWebhookController {
  @Post('issue-updated')
  @Public() // Jira webhooks need public endpoint (verify with secret)
  async handleIssueUpdated(@Body() payload: JiraWebhookPayload) {
    // Parse webhook
    // Check if user is connected
    // Send notification via appropriate adapter (Telegram, etc.)
  }
}
```

Webhook events to handle:
- `issue_created` - New ticket assigned
- `issue_updated` - Status changed, assignee changed
- `comment_created` - New comment

#### Step 5.2: Notification Service (1 hour)

```typescript
@Injectable()
export class JiraNotificationService {
  async notifyUser(userId: string, message: string): Promise<void> {
    // Find user's connected adapters (Telegram, etc.)
    // Send notification via adapter
  }
}
```

#### Step 5.3: Scheduled Jobs (1 hour)

Use `@nestjs/schedule` for recurring tasks:

```typescript
@Injectable()
export class JiraSchedulerService {
  @Cron('0 9 * * 1-5') // Weekdays at 9 AM
  async sendDailyStandup() {
    // Get all connected users
    // Send "Good morning!" message with today's tickets
  }

  @Cron('0 17 * * 5') // Fridays at 5 PM
  async sendWeeklyReport() {
    // Send weekly wrap-up
  }

  @Cron('0 */1 * * *') // Every hour
  async checkBlockers() {
    // Check for tickets blocked > 24 hours
    // Send escalation alert
  }
}
```

---

## File Structure

```
packages/bridge/src/application/
├── jira/
│   ├── jira.module.ts
│   ├── jira.controller.ts
│   ├── jira.service.ts
│   ├── jira-webhook.controller.ts (optional)
│   ├── jira-scheduler.service.ts (optional)
│   ├── dto/
│   │   ├── jira-connect.dto.ts
│   │   ├── transition.dto.ts
│   │   └── jira-ticket.dto.ts
│   ├── intents/
│   │   ├── jira-intent-parser.ts
│   │   └── jira-intent.types.ts
│   └── notifications/
│       └── jira-notification.service.ts (optional)

apps/web/
├── app/
│   ├── components/
│   │   └── integrations/
│   │       └── JiraCard.tsx
│   └── lib/
│       └── api.ts (add jiraApi)
```

---

## Environment Variables

Add to `packages/bridge/.env`:

```env
# Jira Webhook Secret (for verifying webhooks)
JIRA_WEBHOOK_SECRET=your_random_secret_here
```

---

## Security Considerations

1. **Encrypt API Tokens**:
   - Store `jiraApiToken` encrypted in database
   - Use encryption/decryption utilities from `packages/common`

2. **Webhook Verification**:
   - Verify Jira webhook signatures (if supported)
   - Or use shared secret in URL

3. **Rate Limiting**:
   - Implement rate limiting on Jira API calls
   - Cache ticket data where appropriate

4. **Input Validation**:
   - Validate Jira URLs (prevent SSRF)
   - Validate ticket key format (e.g., `[A-Z]+-\d+`)

5. **Error Handling**:
   - Don't expose sensitive error details
   - Handle Jira API errors gracefully

---

## Testing

### Unit Tests
```typescript
describe('JiraIntentParser', () => {
  it('should parse "what tickets are assigned to me" as LIST_TICKETS', () => { });
  it('should parse "I finished TDX-300" as COMPLETE_TICKET', () => { });
  it('should extract ticket key from "tell me about TDX-300"', () => { });
});

describe('JiraService', () => {
  it('should connect user with valid credentials', () => { });
  it('should fetch assigned tickets', () => { });
  it('should transition ticket to Done', () => { });
});
```

### Integration Tests
- Test full flow: Connect → List Tickets → Complete Ticket
- Test webhook: Send mock Jira webhook → Verify notification sent

---

## Success Criteria

- [ ] User can connect Jira account via web dashboard
- [ ] User can list assigned tickets via chat
- [ ] User can get ticket details via chat
- [ ] User can mark ticket as complete via chat
- [ ] User can get daily summary via chat
- [ ] Database schema updated
- [ ] All endpoints tested
- [ ] Error handling implemented
- [ ] Security measures in place

---

## Future Enhancements

1. **Jira OAuth 2.0** (instead of API tokens)
2. **Multiple Jira Instances** (for users with multiple company accounts)
3. **Sprint Planning** (integrate with Jira sprints)
4. **Time Tracking** (log work via chat)
5. **Custom JQL Queries** (advanced filtering)
6. **Attachment Support** (upload files to tickets)
7. **Board Views** (Kanban/scrum board in chat)
8. **AI-Powered Insights** (ticket priority suggestions, blocker prediction)

---

## Resources

- [Jira REST API v3 Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Jira API Token Creation Guide](https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html)
- [Jira Webhooks Documentation](https://developer.atlassian.com/cloud/jira/platform/webhooks/)

---

## Estimated Timeline

| Phase | Tasks | Time |
|-------|-------|------|
| Phase 1: Foundation | Database, Service, Controller, Module | 4 hours |
| Phase 2: Web Dashboard | Component, Integration, API Client | 2.5 hours |
| Phase 3: Chat Integration | Intent Parser, Message Router, Commands | 3.5 hours |
| Phase 4: Enhanced Features | Comments, Assignment, Search | 3 hours |
| Phase 5: Autonomous | Webhooks, Notifications, Scheduler | 4 hours (optional) |
| **Total** | **Core Features** | **10 hours** |
| **Total with Autonomous** | **All Features** | **14 hours** |

---

## Next Steps

1. ✅ Review this plan and approve
2. ⏭️ Start with Phase 1: Foundation
3. ⏭️ Implement Phase 2: Web Dashboard
4. ⏭️ Implement Phase 3: Chat Integration
5. ⏭️ Test end-to-end
6. ⏭️ Deploy to production

**Ready to build Jira integration? Let's go!** 🚀
