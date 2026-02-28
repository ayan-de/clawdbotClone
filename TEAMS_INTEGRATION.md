# Microsoft Teams Integration - Implementation Guide

## Overview
This guide provides step-by-step instructions for integrating a Microsoft Teams bot into your application.

---

## Prerequisites
- Microsoft 365 Developer Account (free tier available)
- Microsoft Azure subscription
- Node.js, .NET, Python, or Java development environment
- ngrok (for local development)
- Basic understanding of Azure Bot Service

---

## Step 1: Set Up Microsoft Developer Account

### 1.1 Create or sign in to Microsoft account
- Go to [https://developer.microsoft.com](https://developer.microsoft.com)
- Sign in with existing account or create new one
- Complete the developer program registration

### 1.2 Get Azure subscription
- Visit [https://azure.microsoft.com/free](https://azure.microsoft.com/free)
- Create free account with $200 credit
- Verify phone number for account activation

### 1.3 Access Azure Portal
- Navigate to [https://portal.azure.com](https://portal.azure.com)
- Sign in with your Microsoft account
- Explore available services

---

## Step 2: Create Azure Bot Resource

### 2.1 Create new Bot Service
- In Azure Portal, search for "Azure Bot"
- Click "Create" button
- Fill in required fields:
  - **Bot handle**: Unique identifier (lowercase, alphanumeric)
  - **Pricing tier**: Free (F0) or Standard (S0)
  - **Type of App**: Multi Tenant
  - **App ID**: Create new or use existing

### 2.2 Configure bot settings
- Choose SDK type (v4 recommended):
  - Web App (Node.js)
  - Web App (.NET)
  - Web App (Python)
  - Web App (Java)
- Set runtime version

### 2.3 Save and create
- Review configuration
- Click "Create" and wait for deployment
- Note down the Bot ID and Bot Password

---

## Step 3: Register App in Azure Active Directory (AAD)

### 3.1 Navigate to App Registrations
- In Azure Portal, search for "App registrations"
- Click "New registration"

### 3.2 Register the application
- **Name**: Your bot name
- **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
- **Redirect URI**: Leave empty for now
- Click "Register"

### 3.3 Copy Application Details
- Copy **Application (client) ID** (also called App ID)
- Copy **Directory (tenant) ID**
- Generate and copy **Client Secret**:
  - Go to "Certificates & secrets"
  - Click "New client secret"
  - Add description and expiration
  - Copy the secret value immediately (won't be shown again)

### 3.4 Configure API permissions
- Go to "API permissions"
- Click "Add a permission"
- Select "Microsoft Graph"
- Choose application permissions:
  - `User.Read.All`
  - `Chat.Read.All`
  - `Chat.ReadWrite.All`
  - `ChannelMessage.Read.All`
  - `ChannelMessage.Send.All`
- Click "Add permissions"
- Click "Grant admin consent for [your organization]"

### 3.5 Add Microsoft Teams Bot permission
- Go to "API permissions"
- Click "Add a permission"
- Search for "Teams"
- Select application permissions:
  - `Team.JoinGroup`
- Grant admin consent

---

## Step 4: Choose Bot Framework SDK

### 4.1 Select SDK based on programming language

**Node.js:**
- `botbuilder` - Official Microsoft Bot Framework
- `microsoft-botframework-connector`

**.NET (C#):**
- `Microsoft.Bot.Builder` - Official SDK
- `Microsoft.Bot.Builder.Integration.AspNet.Core`

**Python:**
- `botbuilder-core` - Official Python SDK
- `botbuilder-integration-aiohttp`

**Java:**
- `botbuilder-core` - Official Java SDK
- `botbuilder-integration-spring`

### 4.2 Install the chosen SDK

Example for Node.js:
```bash
npm install botbuilder botbuilder-adapter-botframework
```

Example for .NET:
```bash
dotnet add package Microsoft.Bot.Builder
dotnet add package Microsoft.Bot.Builder.Integration.AspNet.Core
```

---

## Step 5: Implement Bot Logic

### 5.1 Create bot class
- Extend appropriate bot class from SDK
- Implement message handlers
- Configure adapters

### 5.2 Set up message handling
- Handle incoming messages
- Process commands
- Generate responses
- Handle attachments

### 5.3 Implement activity handlers
- `OnMessageActivityAsync` - Handle messages
- `OnMembersAddedActivityAsync` - New members joined
- `OnConversationUpdateActivityAsync` - Conversation changes
- `OnTeamsChannelCreatedAsync` - New channel created
- `OnTeamsChannelDeletedAsync` - Channel deleted
- `OnTeamsMemberAddedAsync` - Member added to team/channel

### 5.4 Configure turn context
- Access conversation state
- Get user information
- Handle attachments and cards

---

## Step 6: Set Up Local Development Environment

### 6.1 Create development project
- Initialize your project
- Configure bot endpoint
- Set up environment variables:
  - `MicrosoftAppId` - Your App ID
  - `MicrosoftAppPassword` - Your Client Secret
  - `BOT_ENDPOINT` - Local bot URL

### 6.2 Install ngrok for tunneling
- Download ngrok from [https://ngrok.com](https://ngrok.com)
- Unzip and run: `ngrok http 3978`
- Copy the HTTPS URL provided (e.g., `https://abc123.ngrok.io`)

### 6.3 Configure local endpoint
- Update bot configuration with ngrok URL
- Set messaging endpoint: `https://abc123.ngrok.io/api/messages`
- Ensure bot is listening on the configured port

### 6.4 Test locally
- Start your bot application
- Use Bot Framework Emulator to test
- Load bot with App ID and Password
- Send test messages

---

## Step 7: Deploy Bot to Azure

### 7.1 Create Azure App Service
- In Azure Portal, search for "App Service"
- Click "Create"
- Choose:
  - **Runtime stack**: Node.js/.NET/Python/Java
  - **Operating System**: Linux (recommended)
  - **Region**: Choose nearest to users
  - **Pricing tier**: Free (F1) or Standard (S1)

### 7.2 Deploy code to Azure
- **Option A: Git deployment**
  - Initialize git repository
  - Add Azure remote repository
  - Push to deploy

- **Option B: Visual Studio Code**
  - Install Azure extension
  - Right-click project folder
  - Select "Deploy to Web App"

- **Option C: Azure CLI**
  ```bash
  az webapp up --resource-group <group> --name <app-name>
  ```

### 7.3 Configure App Settings
- Go to App Service → Configuration
- Add Application Settings:
  - `MicrosoftAppId`: Your App ID
  - `MicrosoftAppPassword`: Your Client Secret
- Save configuration
- Restart App Service

### 7.4 Update bot endpoint
- Go to Azure Bot resource
- Update "Messaging endpoint" to:
  - `https://<your-app-name>.azurewebsites.net/api/messages`
- Save changes

---

## Step 8: Configure Teams App Package

### 8.1 Create Teams app manifest
- Create `manifest.json` file
- Required fields:
  - `manifestVersion` - Schema version
  - `id` - Unique GUID
  - `version` - App version
  - `developer.name` - Your name/organization
  - `developer.websiteUrl` - Your website
  - `developer.privacyUrl` - Privacy policy URL
  - `developer.termsOfUseUrl` - Terms of service URL
  - `name.short` - Short app name
  - `name.full` - Full app name
  - `description.short` - Short description
  - `description.full` - Full description
  - `icons.color` - Color icon path
  - `icons.outline` - Outline icon path
  - `bots` - Bot configuration

### 8.2 Create app icons
- Generate two icon files:
  - **Color icon**: 192x192 pixels, PNG format
  - **Outline icon**: 32x32 pixels, PNG format, white with transparent background
- Name them appropriately

### 8.3 Configure bot in manifest
```json
"bots": [
  {
    "botId": "<your-bot-id>",
    "scopes": [
      "team",
      "personal",
      "groupChat"
    ],
    "isNotificationOnly": false,
    "supportsFiles": true
  }
]
```

---

## Step 9: Package and Publish to Teams

### 9.1 Package the app
- Use Developer Portal:
  - Go to [https://dev.teams.microsoft.com](https://dev.teams.microsoft.com)
  - Click "Apps" → "New app"
  - Fill in app information
  - Upload icons
  - Add bot details
  - Click "Publish" → "Download the app package"

- Or manually:
  - Zip manifest.json and icons together
  - Ensure proper file structure

### 9.2 Upload to Teams (Development)
- Open Microsoft Teams
- Go to Apps → "Manage your apps"
- Click "Upload an app" → "Upload a custom app"
- Select your app package (.zip file)
- Click "Add"

### 9.3 Install and test
- Add bot to a team
- Test in personal chat
- Test in group chat
- Test in channel
- Verify all features work

---

## Step 10: Implement Key Bot Features

### 10.1 Welcome messages
- Send greeting when user starts conversation
- Provide help and instructions
- Display available commands

### 10.2 Command handling
- Implement command parsing
- Create command handlers:
  - `/help` - Show help information
  - `/info` - Display bot information
  - `/settings` - User preferences
  - Custom commands for your use case

### 10.3 Adaptive Cards
- Create rich, interactive cards
- Use Adaptive Card Designer: [https://adaptivecards.io/designer](https://adaptivecards.io/designer)
- Implement card actions:
  - Submit actions
  - Open URL actions
  - Show card actions
- Handle card submissions

### 10.4 Message extensions
- Create search-based commands
- Implement action-based commands
- Configure manifest for message extensions
- Handle extension requests

### 10.5 Task modules
- Create pop-up dialogs for complex interactions
- Implement task module handlers
- Configure in manifest
- Handle task module responses

### 10.6 File handling
- Support file uploads and downloads
- Process attachments
- Store files in Azure Blob Storage or similar

---

## Step 11: Implement Authentication (Optional)

### 11.1 Enable OAuth 2.0
- Register additional OAuth connection in Azure Bot
- Configure identity provider:
  - Azure AD
  - Microsoft
  - Google
  - Custom provider

### 11.2 Add authentication to bot
- Use `OAuthPrompt` or `MultiProviderAuthPrompt`
- Configure connection name
- Handle authentication flow
- Store tokens securely

### 11.3 Get user token
- Request user authentication
- Exchange code for token
- Use token to access Microsoft Graph API

---

## Step 12: Database Integration

### 12.1 Choose storage solution
- Azure Cosmos DB (recommended)
- Azure SQL Database
- Azure Table Storage
- External database

### 12.2 Implement conversation state
- Store conversation history
- Manage user sessions
- Persist user preferences

### 12.3 Set up state management
- Use Bot Framework state management APIs:
  - User state
  - Conversation state
  - Private conversation state

### 12.4 Configure storage connection
- Add Azure storage connection string
- Configure Cosmos DB or SQL Database
- Implement proper indexing

---

## Step 13: Security Best Practices

### 13.1 Secure credentials
- Never hardcode App ID and Password
- Use Azure Key Vault for secrets
- Use environment variables
- Rotate credentials regularly

### 13.2 Input validation
- Validate all user inputs
- Sanitize data before processing
- Prevent injection attacks
- Limit message size

### 13.3 Rate limiting
- Implement request rate limits
- Prevent abuse and spam
- Use Azure API Management if needed

### 13.4 Data protection
- Encrypt sensitive data
- Follow GDPR and privacy regulations
- Implement data retention policies
- Provide data export/deletion options

### 13.5 Compliance
- Ensure compliance with Microsoft Teams policies
- Follow Microsoft 365 compliance requirements
- Review Microsoft 365 compliance documentation

---

## Step 14: Testing

### 14.1 Unit testing
- Test individual functions
- Mock bot framework components
- Verify logic flows
- Test edge cases

### 14.2 Integration testing
- Test end-to-end workflows
- Verify Azure services integration
- Test database operations
- Validate authentication flows

### 14.3 Teams-specific testing
- Test in personal chat
- Test in group chat
- Test in channels (posts and replies)
- Test mentions (@botname)
- Test message extensions
- Test adaptive cards
- Test task modules

### 14.4 Cross-platform testing
- Test on Teams desktop app
- Test on Teams web app
- Test on Teams mobile app

### 14.5 Load testing
- Simulate multiple concurrent users
- Test performance under load
- Identify bottlenecks
- Scale as needed

---

## Step 15: Publishing to Teams Store (Optional)

### 15.1 Prepare for store submission
- Complete app testing
- Create comprehensive documentation
- Prepare screenshots and videos
- Set up support contact
- Create privacy policy
- Create terms of use

### 15.2 Configure store listing
- Go to Developer Portal
- Fill in store information:
  - App details
  - Description
  - Screenshots
  - Videos
  - Pricing (if applicable)
  - Support information
  - Legal information

### 15.3 Submit for review
- Review all information
- Submit app package
- Wait for Microsoft approval process
- Address any feedback from reviewers

### 15.4 Monitor and update
- Monitor app performance
- Address user feedback
- Release updates as needed
- Maintain store listing

---

## Step 16: Monitoring and Analytics

### 16.1 Set up Application Insights
- Create Application Insights resource in Azure
- Connect bot to Application Insights
- Configure telemetry collection

### 16.2 Track key metrics
- Active users
- Message volume
- Response times
- Error rates
- Popular features

### 16.3 Set up alerts
- Configure error rate alerts
- Set up performance alerts
- Monitor bot availability

### 16.4 Logging
- Log important events
- Track user actions
- Record errors and exceptions
- Monitor API calls

---

## Step 17: Maintenance and Updates

### 17.1 Regular updates
- Update SDK dependencies
- Apply security patches
- Fix bugs and issues
- Optimize performance

### 17.2 Feature enhancements
- Add new features based on feedback
- Improve existing functionality
- Expand integration capabilities

### 17.3 Backup and recovery
- Regular database backups
- Document recovery procedures
- Test backup restoration

### 17.4 Documentation
- Keep user docs updated
- Maintain API documentation
- Document new features

---

## Common Issues and Solutions

### Bot not responding in Teams
- Verify bot endpoint is accessible
- Check App ID and Password are correct
- Ensure ngrok tunnel is active (dev) or App Service is running (prod)
- Review Azure Bot service logs

### Authentication failures
- Verify App registration configuration
- Check API permissions are granted
- Ensure correct tenant ID
- Validate connection strings

### Webhook errors
- Verify HTTPS endpoint is accessible
- Check SSL certificate is valid
- Ensure port is open
- Review firewall settings

### Adaptive cards not rendering
- Validate card JSON structure
- Check schema version compatibility
- Verify required elements are present
- Use Adaptive Card Designer to test

### Message extensions not working
- Verify manifest configuration
- Check search/action parameters
- Ensure bot ID is correct
- Test in various contexts

---

## Advanced Features (Optional)

### 18.1 Microsoft Graph Integration
- Access user profiles
- Read/write calendar events
- Manage Teams and channels
- Send emails
- Access OneDrive files

### 18.2 Power Automate Integration
- Create automated workflows
- Trigger bot messages
- Respond to bot events

### 18.3 Copilot Integration
- Extend Microsoft 365 Copilot
- Create custom plugins
- Implement AI capabilities

### 18.4 Real-time notifications
- Use Azure SignalR Service
- Implement webhooks
- Push updates to users

### 18.5 Multi-language support
- Implement localization
- Support multiple languages
- Use Microsoft Translator API

---

## Resources

### Official Documentation
- [Microsoft Bot Framework Documentation](https://docs.microsoft.com/en-us/azure/bot-service/)
- [Microsoft Teams Platform](https://docs.microsoft.com/en-us/microsoftteams/platform/)
- [Azure Bot Service](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-quickstart)
- [Adaptive Cards](https://adaptivecards.io/)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/api/overview)

### Development Tools
- [Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator)
- [Developer Portal for Teams](https://dev.teams.microsoft.com)
- [ngrok](https://ngrok.com/)
- [Adaptive Card Designer](https://adaptivecards.io/designer/)

### Community
- [Microsoft Teams Developer Community](https://techcommunity.microsoft.com/t5/Microsoft-Teams-Developers/ct-p/MicrosoftTeamsDevelopers)
- [Bot Framework GitHub](https://github.com/microsoft/botbuilder-sdk)
- [Stack Overflow - microsoft-teams](https://stackoverflow.com/questions/tagged/microsoft-teams)

---

## Checklist

- [ ] Set up Microsoft Developer Account
- [ ] Create Azure subscription
- [ ] Create Azure Bot resource
- [ ] Register app in Azure AD
- [ ] Configure API permissions
- [ ] Choose and install Bot Framework SDK
- [ ] Implement bot logic
- [ ] Set up local development with ngrok
- [ ] Test with Bot Framework Emulator
- [ ] Deploy to Azure App Service
- [ ] Create Teams app manifest
- [ ] Generate app icons
- [ ] Package and upload to Teams
- [ ] Test in various Teams contexts
- [ ] Implement core features
- [ ] Set up authentication (if needed)
- [ ] Configure database
- [ ] Implement security measures
- [ ] Perform thorough testing
- [ ] Set up monitoring
- [ ] Publish to store (optional)
- [ ] Create documentation
- [ ] Plan for maintenance

---

## Notes

- Use ngrok for local development only; not suitable for production
- Always use HTTPS endpoints (required by Teams)
- Test thoroughly in different Teams contexts (personal, group, channel)
- Keep your App ID and Client Secret secure at all times
- Follow Microsoft's Teams app certification guidelines
- Stay updated with API changes and deprecations
- Build incrementally - start with basic functionality, add features over time
- Consider using Azure Application Insights for production monitoring
- Review and comply with Microsoft 365 data residency requirements
