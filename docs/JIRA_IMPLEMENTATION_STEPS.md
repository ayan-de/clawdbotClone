# JIRA Integration - Step-by-Step Implementation Plan

**Target**: Integrate JIRA into Orbit Agent for ticket management
**Duration**: ~14-21 hours (2-3 weeks)
**Last Updated**: 2026-03-01

---

## Overview

This plan breaks down the JIRA integration into concrete, actionable steps. Follow these sequentially to build the complete integration.

---

## Phase 1: Database & Foundation (4-5 hours)

### Step 1.1: Generate Database Migration (30 min)
**File**: Generate new migration file

```bash
cd packages/bridge
pnpm migration:generate -d src/infrastructure/database/datasource.ts AddJiraFieldsToUser
```

**Actions**:
1. Open the generated migration file
2. Add columns to User table:
   - `jiraBaseUrl` (varchar 255, nullable)
   - `jiraEmail` (varchar 255, nullable)
   - `jiraApiToken` (varchar 500, nullable) - ENCRYPTED
   - `jiraAuthType` (enum: 'api_token', 'oauth', nullable)
   - `jiraLastSyncAt` (timestamp, nullable)

**Validation**:
- Migration file created in `packages/bridge/migrations/`
- All columns are nullable (for existing users)
- Comments explaining each field

### Step 1.2: Update User Entity (30 min)
**File**: `packages/bridge/src/infrastructure/database/entities/user.entity.ts`

**Actions**:
1. Add properties to User entity:
```typescript
@Column({ type: 'varchar', length: 255, nullable: true })
jiraBaseUrl?: string;

@Column({ type: 'varchar', length: 255, nullable: true })
jiraEmail?: string;

@Column({ type: 'varchar', length: 500, nullable: true })
jiraApiToken?: string;  // Will be encrypted before saving

@Column({ type: 'enum', enum: ['api_token', 'oauth'], nullable: true })
jiraAuthType?: 'api_token' | 'oauth';

@Column({ type: 'timestamp with time zone', nullable: true })
jiraLastSyncAt?: Date;
```

**Validation**:
- Entity compiles without errors
- Properties match migration columns

### Step 1.3: Run Migration (10 min)
**Actions**:
```bash
pnpm migration:run -d src/infrastructure/database/datasource.ts
```

**Validation**:
- Migration runs successfully
- Verify columns exist in database
- Test with existing user (should have NULL values)

### Step 1.4: Create Token Encryption Utilities (1 hour)
**File**: `packages/bridge/src/infrastructure/security/token-encryption.util.ts`

**Actions**:
```typescript
import * as crypto from 'crypto';

export class TokenEncryptionUtil {
  private static ALGORITHM = 'aes-256-gcm';
  private static KEY_LENGTH = 32; // 256 bits
  private static IV_LENGTH = 16; // 128 bits
  private static SALT_LENGTH = 64;

  private static getKey(salt: string): Buffer {
    // Derive key from environment variable + salt
    const secret = process.env.ENCRYPTION_SECRET || 'fallback-secret';
    return crypto.pbkdf2Sync(
      secret,
      salt,
      this.KEY_LENGTH,
      100000,
      'sha256'
    );
  }

  static encrypt(text: string): { encrypted: string; salt: string } {
    const salt = crypto.randomBytes(this.SALT_LENGTH).toString('hex');
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const key = this.getKey(salt);

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encrypted: `${encrypted}:${authTag}`,
      salt,
      iv: iv.toString('hex'),
    };
  }

  static decrypt(encryptedData: string, salt: string, iv: string): string {
    const [encrypted, authTag] = encryptedData.split(':');
    const key = this.getKey(salt);

    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

**Validation**:
- `encrypt()` returns object with encrypted, salt, iv
- `decrypt()` reverses encryption correctly
- Add unit tests in `packages/bridge/test/utils/token-encryption.util.spec.ts`

### Step 1.5: Create Type Definitions (30 min)
**File**: `packages/bridge/src/application/jira/types/jira.types.ts`

**Actions**:
```typescript
export interface JiraTicket {
  key: string;           // e.g., "TDX-300"
  summary: string;       // "Fix authentication bug"
  description: string;    // Full ticket description
  status: string;         // "In Progress", "Done", etc.
  priority: string;       // "High", "Medium", "Low"
  assignee: string;       // Email of assignee
  reporter: string;       // Email of reporter
  created: Date;
  updated: Date;
  url: string;           // Link to ticket in Jira
}

export interface JiraActivity {
  ticketKey: string;
  type: 'assigned' | 'status_change' | 'comment' | 'completed';
  from?: string;          // Previous status (for status_change)
  to?: string;            // New status (for status_change)
  comment?: string;        // Comment content
  author: string;         // User who made change
  occurredAt: Date;
}

export interface JiraConnection {
  baseUrl: string;       // "https://company.atlassian.net"
  email: string;         // User's Jira email
  apiToken: string;       // Encrypted API token
  connected: boolean;
  lastSyncAt?: Date;
}
```

**Validation**:
- All types compile
- Interface names are PascalCase
- Properties are camelCase

---

## Phase 2: JIRA Service (2-3 hours)

### Step 2.1: Create JIRA HTTP Client (45 min)
**File**: `packages/bridge/src/application/jira/jira-client.service.ts`

**Actions**:
```typescript
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class JiraClientService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  createClient(baseUrl: string, email: string, apiToken: string): AxiosInstance {
    // Basic auth for API tokens
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    return axios.create({
      baseURL: `${baseUrl}/rest/api/3`,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
    });
  }

  async searchTickets(
    client: AxiosInstance,
    email: string,
    jql: string
  ): Promise<any[]> {
    const response = await client.post('/search', {
      jql,
      fields: [
        'summary', 'status', 'priority', 'assignee',
        'reporter', 'created', 'updated', 'description'
      ],
      maxResults: 50,
    });

    return response.data.issues.map((issue: any) => ({
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description || '',
      status: issue.fields.status.name,
      priority: issue.fields.priority.name,
      assignee: issue.fields.assignee?.emailAddress || 'Unassigned',
      reporter: issue.fields.reporter.emailAddress,
      created: new Date(issue.fields.created),
      updated: new Date(issue.fields.updated),
      url: `${baseUrl}/browse/${issue.key}`,
    }));
  }

  async getIssueDetails(
    client: AxiosInstance,
    key: string
  ): Promise<any> {
    const response = await client.get(`/issue/${key}`);
    return response.data;
  }

  async getTransitions(
    client: AxiosInstance,
    key: string
  ): Promise<any[]> {
    const response = await client.get(`/issue/${key}/transitions`);
    return response.data.transitions;
  }

  async transitionIssue(
    client: AxiosInstance,
    key: string,
    transitionId: string,
    comment?: string
  ): Promise<void> {
    const body: any = { transition: { id: transitionId } };

    if (comment) {
      body.update = { comment: [ { body: comment } ] };
    }

    await client.post(`/issue/${key}/transitions`, body);
  }

  async addComment(
    client: AxiosInstance,
    key: string,
    body: string
  ): Promise<void> {
    await client.post(`/issue/${key}/comment`, { body });
  }

  async getChangelog(
    client: AxiosInstance,
    key: string
  ): Promise<any[]> {
    const response = await client.get(`/issue/${key}/changelog`);
    return response.data.values || [];
  }
}
```

**Validation**:
- All methods are async
- Proper error handling with try/catch
- Returns typed interfaces

### Step 2.2: Create JIRA Service (1.5 hours)
**File**: `packages/bridge/src/application/jira/jira.service.ts`

**Actions**:
```typescript
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { TokenEncryptionUtil } from '../infrastructure/security/token-encryption.util';
import { JiraClientService } from './jira-client.service';
import { JiraTicket, JiraActivity, JiraConnection } from './types/jira.types';

@Injectable()
export class JiraService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jiraClient: JiraClientService,
  ) {}

  async connect(
    userId: string,
    baseUrl: string,
    email: string,
    apiToken: string
  ): Promise<void> {
    // Validate inputs
    if (!this.isValidJiraUrl(baseUrl)) {
      throw new BadRequestException('Invalid Jira URL format');
    }

    // Encrypt token
    const { encrypted, salt, iv } = TokenEncryptionUtil.encrypt(apiToken);

    // Update user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.jiraBaseUrl = baseUrl;
    user.jiraEmail = email;
    user.jiraApiToken = `${encrypted}:${salt}:${iv}`;
    user.jiraAuthType = 'api_token';
    user.jiraLastSyncAt = new Date();

    await this.userRepository.save(user);
  }

  async disconnect(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.jiraBaseUrl = null;
    user.jiraEmail = null;
    user.jiraApiToken = null;
    user.jiraAuthType = null;

    await this.userRepository.save(user);
  }

  async getConnectionStatus(userId: string): Promise<JiraConnection> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.jiraBaseUrl) {
      return {
        connected: false,
        baseUrl: '',
        email: '',
      };
    }

    return {
      connected: true,
      baseUrl: user.jiraBaseUrl,
      email: user.jiraEmail,
      lastSyncAt: user.jiraLastSyncAt,
    };
  }

  async getAssignedTickets(userId: string): Promise<JiraTicket[]> {
    const user = await this.getUserWithJira(userId);
    const client = this.createClient(user);

    const jql = `assignee = "${user.jiraEmail}" AND status != Done`;

    return await this.jiraClient.searchTickets(client, user.jiraEmail, jql);
  }

  async getTicketDetails(userId: string, ticketKey: string): Promise<JiraTicket> {
    const user = await this.getUserWithJira(userId);
    const client = this.createClient(user);

    const issue = await this.jiraClient.getIssueDetails(client, ticketKey);

    return this.mapIssueToTicket(issue, user.jiraBaseUrl);
  }

  async transitionTicket(
    userId: string,
    ticketKey: string,
    toStatus: string
  ): Promise<void> {
    const user = await this.getUserWithJira(userId);
    const client = this.createClient(user);

    // Get available transitions
    const transitions = await this.jiraClient.getTransitions(client, ticketKey);

    // Find transition to target status
    const transition = transitions.find(
      (t: any) => t.to.name === toStatus
    );

    if (!transition) {
      throw new BadRequestException(
        `Cannot transition ticket to ${toStatus}. Status not available.`
      );
    }

    await this.jiraClient.transitionIssue(
      client,
      ticketKey,
      transition.id,
      `Marked as ${toStatus} by Orbit Agent`
    );
  }

  async getDailyActivity(userId: string, date: Date): Promise<JiraActivity[]> {
    const user = await this.getUserWithJira(userId);
    const client = this.createClient(user);

    // Get all assigned tickets
    const tickets = await this.getAssignedTickets(userId);
    const activities: JiraActivity[] = [];

    for (const ticket of tickets) {
      // Get changelog for each ticket
      const changelog = await this.jiraClient.getChangelog(client, ticket.key);

      for (const entry of changelog) {
        const entryDate = new Date(entry.created);

        // Filter by date
        if (this.isSameDay(entryDate, date)) {
          if (entry.items[0]?.field === 'status') {
            activities.push({
              ticketKey: ticket.key,
              type: 'status_change',
              from: entry.items[0].fromString,
              to: entry.items[0].toString,
              author: entry.author.emailAddress || entry.author.displayName,
              occurredAt: entryDate,
            });
          } else if (entry.items[0]?.field === 'assignee') {
            activities.push({
              ticketKey: ticket.key,
              type: 'assigned',
              author: entry.author.emailAddress || entry.author.displayName,
              occurredAt: entryDate,
            });
          } else if (entry.items[0]?.field === 'comment') {
            activities.push({
              ticketKey: ticket.key,
              type: 'comment',
              comment: entry.items[0].from,
              author: entry.author.emailAddress || entry.author.displayName,
              occurredAt: entryDate,
            });
          }
        }
      }
    }

    // Update last sync time
    const dbUser = await this.userRepository.findOne({ where: { id: userId } });
    dbUser.jiraLastSyncAt = new Date();
    await this.userRepository.save(dbUser);

    return activities.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  // Private helpers

  private async getUserWithJira(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.jiraBaseUrl) {
      throw new BadRequestException('Jira not connected. Please connect first.');
    }

    return user;
  }

  private createClient(user: User) {
    const { encrypted, salt, iv } = this.parseEncryptedToken(user.jiraApiToken);
    const decryptedToken = TokenEncryptionUtil.decrypt(encrypted, salt, iv);

    return this.jiraClient.createClient(
      user.jiraBaseUrl,
      user.jiraEmail,
      decryptedToken
    );
  }

  private parseEncryptedToken(encryptedString: string) {
    const [encrypted, salt, iv] = encryptedString.split(':');
    return { encrypted, salt, iv };
  }

  private isValidJiraUrl(url: string): boolean {
    // Must be HTTPS
    if (!url.startsWith('https://')) {
      return false;
    }

    // Must be atlassian.net domain
    if (!url.includes('atlassian.net')) {
      return false;
    }

    return true;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private mapIssueToTicket(issue: any, baseUrl: string): JiraTicket {
    return {
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description || '',
      status: issue.fields.status.name,
      priority: issue.fields.priority.name,
      assignee: issue.fields.assignee?.emailAddress || 'Unassigned',
      reporter: issue.fields.reporter.emailAddress,
      created: new Date(issue.fields.created),
      updated: new Date(issue.fields.updated),
      url: `${baseUrl}/browse/${issue.key}`,
    };
  }
}
```

**Validation**:
- All public methods documented
- Error handling for all operations
- Token encryption/decryption properly integrated

---

## Phase 3: Controller & DTOs (1.5 hours)

### Step 3.1: Create DTOs (30 min)
**File**: `packages/bridge/src/application/jira/dto/jira-connect.dto.ts`

**Actions**:
```typescript
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class JiraConnectDto {
  @IsNotEmpty()
  @IsString()
  baseUrl!: string;

  @IsNotEmpty()
  @IsString()
  email!: string;

  @IsNotEmpty()
  @IsString()
  apiToken!: string;
}

export class TransitionTicketDto {
  @IsNotEmpty()
  @IsString()
  key!: string;

  @IsNotEmpty()
  @IsString()
  toStatus!: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
```

**File**: `packages/bridge/src/application/jira/dto/jira-ticket.dto.ts`

**Actions**:
```typescript
export class JiraTicketDto {
  key: string;
  summary: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  reporter: string;
  created: Date;
  updated: Date;
  url: string;
}

export class JiraActivityDto {
  ticketKey: string;
  type: string;
  from?: string;
  to?: string;
  comment?: string;
  author: string;
  occurredAt: Date;
}
```

**Validation**:
- All DTOs compile
- Validation decorators applied

### Step 3.2: Create Controller (1 hour)
**File**: `packages/bridge/src/application/jira/jira.controller.ts`

**Actions**:
```typescript
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JiraService } from './jira.service';
import { JiraConnectDto, TransitionTicketDto } from './dto/jira-connect.dto';

@Controller('jira')
@UseGuards(JwtAuthGuard)
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  @Post('connect')
  async connect(
    @Body() dto: JiraConnectDto,
    @Request() req: any
  ) {
    const userId = req.user?.id;
    await this.jiraService.connect(userId, dto.baseUrl, dto.email, dto.apiToken);
    return { success: true, message: 'Jira connected successfully' };
  }

  @Get('status')
  async getStatus(@Request() req: any) {
    const userId = req.user?.id;
    return await this.jiraService.getConnectionStatus(userId);
  }

  @Get('tickets/assigned')
  async getAssignedTickets(@Request() req: any) {
    const userId = req.user?.id;
    const tickets = await this.jiraService.getAssignedTickets(userId);
    return tickets;
  }

  @Get('tickets/:key')
  async getTicketDetails(
    @Param('key') key: string,
    @Request() req: any
  ) {
    const userId = req.user?.id;
    return await this.jiraService.getTicketDetails(userId, key);
  }

  @Post('tickets/:key/transition')
  async transitionTicket(
    @Param('key') key: string,
    @Body() dto: TransitionTicketDto,
    @Request() req: any
  ) {
    const userId = req.user?.id;
    await this.jiraService.transitionTicket(userId, key, dto.toStatus);
    return { success: true, message: 'Ticket transitioned successfully' };
  }

  @Get('activity/daily')
  async getDailyActivity(
    @Query('date') date: string,
    @Request() req: any
  ) {
    const userId = req.user?.id;
    const queryDate = date ? new Date(date) : new Date();
    const activities = await this.jiraService.getDailyActivity(userId, queryDate);
    return activities;
  }
}
```

**Validation**:
- All endpoints protected with JWT guard
- Request/response DTOs properly typed

---

## Phase 4: JIRA Module (15 min)

### Step 4.1: Create Module
**File**: `packages/bridge/src/application/jira/jira.module.ts`

**Actions**:
```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JiraController } from './jira.controller';
import { JiraService } from './jira.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature()],
  controllers: [JiraController],
  providers: [JiraService],
  exports: [JiraService],
})
export class JiraModule {}
```

**Validation**:
- Module compiles
- Service and controller exported properly

### Step 4.2: Register in App Module
**File**: `packages/bridge/src/app.module.ts`

**Actions**:
1. Import JiraModule
2. Add to imports array

```typescript
import { JiraModule } from './application/jira/jira.module';

@Module({
  imports: [
    // ... existing modules
    JiraModule,
  ],
  // ...
})
export class AppModule {}
```

---

## Phase 5: Web Dashboard (2-3 hours)

### Step 5.1: Create Jira Card Component (1 hour)
**File**: `apps/web/app/components/integrations/JiraCard.tsx`

**Actions**:
```typescript
'use client';

import React, { useState } from 'react';

interface JiraCardProps {
  isConnected: boolean;
  jiraEmail?: string;
  onConnect: (data: { baseUrl: string; email: string; apiToken: string }) => void;
  onDisconnect: () => void;
  loading?: boolean;
}

export function JiraCard({
  isConnected,
  jiraEmail,
  onConnect,
  onDisconnect,
  loading = false,
}: JiraCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    baseUrl: '',
    email: '',
    apiToken: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConnect(formData);
    setShowForm(false);
  };

  if (isConnected) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-600">JIRA Connected</h3>
            <p className="text-gray-600 text-sm">{jiraEmail}</p>
          </div>
          <button
            onClick={onDisconnect}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-blue-600">JIRA</h3>
          <p className="text-gray-600 text-sm">Connect your Jira account</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Connect
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JIRA URL
            </label>
            <input
              type="url"
              placeholder="https://company.atlassian.net"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Your company's Atlassian URL (e.g., https://company.atlassian.net)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JIRA Email
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Token
            </label>
            <input
              type="password"
              placeholder="Your Jira API token"
              value={formData.apiToken}
              onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Create API token in Jira Settings → Account → Security → API tokens
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
```

**Validation**:
- Component renders in dev mode
- Form validation works
- API token input is password type

### Step 5.2: Update Dashboard to Include Jira Card (30 min)
**File**: `apps/web/app/page.tsx` (or dashboard page)

**Actions**:
1. Import JiraCard
2. Add JiraCard to integration cards
3. Pass connection status and handlers

```typescript
import { JiraCard } from './components/integrations/JiraCard';

// In dashboard return JSX:
<JiraCard
  isConnected={jiraConnected}
  jiraEmail={jiraEmail}
  onConnect={handleJiraConnect}
  onDisconnect={handleJiraDisconnect}
  loading={jiraLoading}
/>
```

### Step 5.3: Add Web API Client Methods (1 hour)
**File**: `apps/web/src/lib/api.ts`

**Actions**:
```typescript
export const jiraApi = {
  connect: async (data: { baseUrl: string; email: string; apiToken: string }) => {
    return await api.post('/jira/connect', data);
  },

  getStatus: async () => {
    return await api.get('/jira/status');
  },

  getAssignedTickets: async () => {
    return await api.get('/jira/tickets/assigned');
  },

  getTicketDetails: async (key: string) => {
    return await api.get(`/jira/tickets/${key}`);
  },

  transitionTicket: async (key: string, toStatus: string, comment?: string) => {
    return await api.post(`/jira/tickets/${key}/transition`, { toStatus, comment });
  },

  getDailyActivity: async (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return await api.get(`/jira/activity/daily${query}`);
  },
};
```

**Validation**:
- All methods exist
- Error handling in api.post/get

---

## Phase 6: Chat Integration (3-4 hours)

### Step 6.1: Create Intent Parser (1.5 hours)
**File**: `packages/bridge/src/application/jira/intents/jira-intent-parser.ts`

**Actions**:
```typescript
export interface JiraIntent {
  type:
    | 'LIST_TICKETS'
    | 'GET_TICKET_DETAILS'
    | 'COMPLETE_TICKET'
    | 'ADD_COMMENT'
    | 'DAILY_SUMMARY'
    | 'DAILY_REPORT'
    | 'SEARCH_TICKETS';
  ticketKey?: string;
  comment?: string;
  query?: string;
  date?: Date;
}

export class JiraIntentParser {
  private patterns = {
    // List tickets
    listTickets: [
      /what tickets are assigned to me/i,
      /show me my tickets/i,
      /list my tickets/i,
      /my tickets/i,
      /assigned tickets/i,
    ],

    // Ticket details
    getTicket: [
      /tell me about\s+(\w+-\d+)/i,
      /explain\s+(\w+-\d+)/i,
      /show\s+(\w+-\d+)/i,
      /ticket\s+(\w+-\d+)/i,
    ],

    // Complete ticket
    complete: [
      /i finished\s+(\w+-\d+)/i,
      /(\w+-\d+)\s+is done/i,
      /(\w+-\d+)\s+is complete/i,
      /mark\s+(\w+-\d+)\s+as done/i,
      /close\s+(\w+-\d+)/i,
    ],

    // Add comment
    addComment: [
      /comment on\s+(\w+-\d+):\s*(.+)/i,
      /add comment to\s+(\w+-\d+):\s*(.+)/i,
    ],

    // Daily summary
    dailySummary: [
      /what did i (do|work on) today/i,
      /summarize my day/i,
      /daily summary/i,
      /today's summary/i,
    ],

    // Daily report
    dailyReport: [
      /generate my daily report/i,
      /my daily report/i,
      /daily report for today/i,
    ],

    // Search
    search: [
      /search for\s+tickets\s+with\s+(.+)/i,
      /find tickets\s+(.+)/i,
      /tickets\s+containing\s+(.+)/i,
    ],
  };

  parse(message: string): JiraIntent | null {
    const lowerMessage = message.toLowerCase().trim();

    // Try each pattern
    for (const [patternType, patternList] of Object.entries(this.patterns)) {
      for (const pattern of patternList) {
        const match = pattern.exec(lowerMessage);

        if (match) {
          const intentType = patternType.toUpperCase() as JiraIntent['type'];

          switch (intentType) {
            case 'LIST_TICKETS':
              return { type: intentType };

            case 'GET_TICKET_DETAILS':
            case 'COMPLETE_TICKET':
              return { type: intentType, ticketKey: match[1].toUpperCase() };

            case 'ADD_COMMENT':
              return {
                type: intentType,
                ticketKey: match[1].toUpperCase(),
                comment: match[2].trim(),
              };

            case 'DAILY_SUMMARY':
            case 'DAILY_REPORT':
              return { type: intentType, date: new Date() };

            case 'SEARCH_TICKETS':
              return { type: intentType, query: match[1].trim() };
          }
        }
      }
    }

    return null;
  }
}
```

**Validation**:
- Patterns match examples
- Returns correct intent types
- Ticket keys are uppercased

### Step 6.2: Update Message Router (1 hour)
**File**: `packages/bridge/src/application/adapters/message-router.service.ts`

**Actions**:
1. Import JiraIntentParser and JiraService
2. Add handleJiraIntent() private method
3. Update handleMessage() to check Jira intents first
4. Add Jira command handlers

```typescript
// In constructor
constructor(
  private readonly jiraIntentParser: JiraIntentParser,
  private readonly jiraService: JiraService,
  // ... existing services
) {}

// In handleMessage()
async handleMessage(message: string, userId: string): Promise<string> {
  // Check Jira intents first
  const jiraIntent = this.jiraIntentParser.parse(message);

  if (jiraIntent) {
    return this.handleJiraIntent(jiraIntent, userId);
  }

  // Fall back to existing handlers...
  return await this.passToPythonAgent(message, userId);
}

// Add private method
private async handleJiraIntent(intent: JiraIntent, userId: string): Promise<string> {
  const connection = await this.jiraService.getConnectionStatus(userId);

  if (!connection.connected) {
    return '⚠️ Please connect your Jira account first via the dashboard.';
  }

  try {
    switch (intent.type) {
      case 'LIST_TICKETS':
        return await this.listTickets(userId);

      case 'GET_TICKET_DETAILS':
        return await this.getTicketDetails(userId, intent.ticketKey!);

      case 'COMPLETE_TICKET':
        return await this.completeTicket(userId, intent.ticketKey!);

      case 'ADD_COMMENT':
        return await this.addComment(userId, intent.ticketKey!, intent.comment!);

      case 'DAILY_SUMMARY':
        return await this.getDailySummary(userId, intent.date || new Date());

      case 'DAILY_REPORT':
        return await this.generateDailyReport(userId);

      case 'SEARCH_TICKETS':
        return await this.searchTickets(userId, intent.query!);

      default:
        return "I didn't understand that Jira request.";
    }
  } catch (error) {
    logger.error(`Jira intent failed: ${error.message}`);
    return `Sorry, there was an error with Jira: ${error.message}`;
  }
}

// Add handler methods
private async listTickets(userId: string): Promise<string> {
  const tickets = await this.jiraService.getAssignedTickets(userId);

  if (tickets.length === 0) {
    return "📋 You have no tickets assigned to you.";
  }

  let response = "📋 **Your Assigned Tickets:**\n\n";
  tickets.forEach((ticket, index) => {
    const priorityEmoji = this.getPriorityEmoji(ticket.priority);
    response += `${index + 1}. ${priorityEmoji} **${ticket.key}**: ${ticket.summary}\n`;
    response += `   Status: ${ticket.status} | Priority: ${ticket.priority}\n\n`;
  });

  return response;
}

private async getTicketDetails(userId: string, ticketKey: string): Promise<string> {
  const ticket = await this.jiraService.getTicketDetails(userId, ticketKey);

  const priorityEmoji = this.getPriorityEmoji(ticket.priority);

  let response = `${priorityEmoji} **${ticket.key}**: ${ticket.summary}\n\n`;
  response += `**Status:** ${ticket.status}\n`;
  response += `**Priority:** ${ticket.priority}\n`;
  response += `**Assignee:** ${ticket.assignee}\n`;
  response += `**Reporter:** ${ticket.reporter}\n`;
  response += `**Created:** ${ticket.created.toLocaleDateString()}\n`;
  response += `**Updated:** ${ticket.updated.toLocaleDateString()}\n\n`;
  response += `**Description:**\n${ticket.description}\n\n`;
  response += `**Link:** ${ticket.url}`;

  return response;
}

private async completeTicket(userId: string, ticketKey: string): Promise<string> {
  await this.jiraService.transitionTicket(userId, ticketKey, 'Done');
  return `✅ ${ticketKey} marked as Done! Great work! 🎉`;
}

private async addComment(userId: string, ticketKey: string, comment: string): Promise<string> {
  await this.jiraService.addComment(userId, ticketKey, comment);
  return `💬 Comment added to ${ticketKey}`;
}

private async getDailySummary(userId: string, date: Date): Promise<string> {
  const activities = await this.jiraService.getDailyActivity(userId, date);

  if (activities.length === 0) {
    return "📅 No Jira activity recorded for today.";
  }

  let response = `📅 **Daily Summary for ${date.toLocaleDateString()}**\n\n`;

  const ticketsWithActivity = new Map<string, any[]>();

  for (const activity of activities) {
    if (!ticketsWithActivity.has(activity.ticketKey)) {
      ticketsWithActivity.set(activity.ticketKey, []);
    }
    ticketsWithActivity.get(activity.ticketKey)!.push(activity);
  }

  let index = 1;
  for (const [ticketKey, ticketActivities] of ticketsWithActivity.entries()) {
    response += `${index}. **${ticketKey}**\n`;

    for (const act of ticketActivities) {
      if (act.type === 'status_change') {
        response += `   → Status changed: ${act.from} → ${act.to}\n`;
      } else if (act.type === 'comment') {
        response += `   → ${act.author} commented\n`;
      }
    }

    response += '\n';
    index++;
  }

  return response;
}

private async generateDailyReport(userId: string): Promise<string> {
  const activities = await this.jiraService.getDailyActivity(userId, new Date());

  const completed = activities.filter(a => a.type === 'status_change' && a.to === 'Done');
  const inProgress = activities.filter(a => a.type === 'status_change' && a.to === 'In Progress');

  let response = "📊 **Daily Report**\n\n";
  response += `✅ Tickets Completed: ${completed.length}\n`;
  response += `🔄 Tickets in Progress: ${inProgress.length}\n\n`;

  return response;
}

private async searchTickets(userId: string, query: string): Promise<string> {
  const tickets = await this.jiraService.searchTickets(userId, query);

  if (tickets.length === 0) {
    return `No tickets found matching "${query}"`;
  }

  let response = `🔍 **Search Results for "${query}"**\n\n`;
  tickets.forEach((ticket, index) => {
    response += `${index + 1}. **${ticket.key}**: ${ticket.summary}\n`;
    response += `   Status: ${ticket.status}\n\n`;
  });

  return response;
}

private getPriorityEmoji(priority: string): string {
  const priority = priority.toLowerCase();
  if (priority === 'highest' || priority === 'critical') return '🔴';
  if (priority === 'high') return '🟠';
  if (priority === 'medium') return '🟡';
  return '🟢';
}
```

**Validation**:
- Jira intents handled before other handlers
- All intent types have handler methods
- Error handling with try/catch
- User-friendly messages

### Step 6.3: Add Commands to Telegram (30 min)
**File**: `packages/bridge/src/application/adapters/telegram.adapter.ts`

**Actions**:
1. Add Jira commands to help message
2. Add command handlers for quick Jira actions

```typescript
// Update getHelpMessage()
private getHelpMessage(): string {
  return `
/orbit - Orbit Agent AI commands
/mytickets - List your Jira tickets
/ticket <key> - Get ticket details
/today - Daily Jira summary
/jira - Show Jira connection status
  `;
}
```

---

## Phase 7: Testing & Documentation (2-3 hours)

### Step 7.1: Unit Tests (1.5 hours)
**Files**:
- `packages/bridge/test/jira/jira-intent-parser.spec.ts`
- `packages/bridge/test/jira/jira.service.spec.ts`

**Actions**:
```typescript
describe('JiraIntentParser', () => {
  let parser: JiraIntentParser;

  beforeEach(() => {
    parser = new JiraIntentParser();
  });

  it('should parse "what tickets are assigned to me"', () => {
    const intent = parser.parse("what tickets are assigned to me");
    expect(intent?.type).toBe('LIST_TICKETS');
  });

  it('should parse "I finished TDX-300"', () => {
    const intent = parser.parse("I finished TDX-300");
    expect(intent?.type).toBe('COMPLETE_TICKET');
    expect(intent?.ticketKey).toBe('TDX-300');
  });

  // Add more test cases...
});
```

### Step 7.2: Integration Tests (1 hour)
**Actions**:
1. Test connection flow via dashboard
2. Test listing tickets via chat
3. Test completing ticket via chat
4. Test daily summary
5. Verify token encryption works

### Step 7.3: Update Documentation (30 min)
**Files**:
- `CLAUDE.md` - Add Jira integration section
- `README.md` - Update with Jira features

**Actions**:
1. Document Jira connection process
2. Document available commands
3. Add troubleshooting section

---

## Phase 8: Deployment (30 min)

### Step 8.1: Update Environment Variables
**File**: `packages/bridge/.env`

**Actions**:
```env
# Jira Webhook Secret (optional, for Phase 5)
JIRA_WEBHOOK_SECRET=your_random_secret_here
```

### Step 8.2: Deploy and Verify
**Actions**:
1. Build bridge package
2. Run migrations in staging
3. Test Jira connection flow
4. Test chat commands
5. Verify token encryption in database

---

## Success Criteria Check

Before considering this complete, verify:

- [ ] User can connect Jira via web dashboard
- [ ] API token is encrypted in database
- [ ] User can list assigned tickets via chat
- [ ] User can get ticket details via chat
- [ ] User can mark ticket as complete via chat
- [ ] User can get daily summary via chat
- [ ] Intent parser handles all patterns
- [ ] Error messages are user-friendly
- [ ] All unit tests pass
- [ ] Integration tested end-to-end
- [ ] Documentation updated

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|--------|----------|---------------|
| Phase 1: Database & Foundation | 4-5 hours | None |
| Phase 2: JIRA Service | 2-3 hours | Phase 1 |
| Phase 3: Controller & DTOs | 1.5 hours | Phase 2 |
| Phase 4: JIRA Module | 15 min | Phase 2, 3 |
| Phase 5: Web Dashboard | 2-3 hours | Phase 4 |
| Phase 6: Chat Integration | 3-4 hours | Phase 5 |
| Phase 7: Testing & Docs | 2-3 hours | Phase 6 |
| Phase 8: Deployment | 30 min | Phase 7 |
| **Total** | **16-19 hours** | |

---

## Next Steps After Core JIRA Integration

1. **Add Webhooks** - Real-time notifications for new assignments and status changes
2. **Add Scheduler** - Morning standup and weekly reports
3. **Add OAuth** - Replace API tokens with OAuth 2.0
4. **Add Search** - Advanced JQL queries
5. **Add Comments** - Full comment history in ticket details
6. **Add Attachments** - File upload support
7. **Add Sprint Planning** - Integrate with Jira sprints

---

## Troubleshooting

**Issue**: Jira API returns 401 Unauthorized
- **Solution**: Verify API token is correct and not expired. Generate new token in Jira.

**Issue**: Cannot transition ticket
- **Solution**: Check workflow status. The target status may not be available from current status.

**Issue**: Tickets not showing
- **Solution**: Verify JQL query format. Check if email matches Jira account email exactly.

**Issue**: Webhook not receiving events
- **Solution**: Verify webhook URL is public and JIRA_WEBHOOK_SECRET matches.

---

## Notes

- Token encryption is critical for security
- Use rate limiting on Jira API calls (Jira has limits)
- Cache ticket data for performance
- Handle edge cases (no tickets, no comments, etc.)
- Provide clear error messages to users
