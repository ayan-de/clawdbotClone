/**
 * Integration Status Types
 * Defines the possible states of an integration
 */
export type IntegrationStatus = "connected" | "disconnected" | "pending" | "error";

/**
 * Integration Types
 * Defines available integrations in the system
 */
export type IntegrationType = "telegram" | "email" | "discord" | "slack";

/**
 * Integration Config Interface
 * Defines the structure for integration configuration
 */
export interface IntegrationConfig {
  type: IntegrationType;
  displayName: string;
  description: string;
  icon: string;
  connectable: boolean;
}

/**
 * Integration State Interface
 * Defines the state of an integration for a user
 */
export interface IntegrationState {
  type: IntegrationType;
  status: IntegrationStatus;
  connectedAt?: string;
  data?: Record<string, any>;
}
