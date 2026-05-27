/**
 * AIDecisionMaker: Generates action proposals based on business context
 * Uses heuristics and patterns to recommend decisions
 */

import { Action, BusinessState } from "./SimulationEngine";

export interface DecisionContext {
  state: BusinessState;
  constraints?: Record<string, any>;
  priorities?: string[];
}

export interface ProposalConfig {
  includeAggressive: boolean;
  includeConservative: boolean;
  maxProposals: number;
}

export const DEFAULT_PROPOSAL_CONFIG: ProposalConfig = {
  includeAggressive: true,
  includeConservative: true,
  maxProposals: 5,
};

export class AIDecisionMaker {
  private static config: ProposalConfig = DEFAULT_PROPOSAL_CONFIG;

  /**
   * Configure proposal generation
   */
  static setConfig(config: Partial<ProposalConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate basic action proposals
   */
  static propose(): Action[] {
    return [
      { type: "INCREASE_ADS", metadata: { reason: "boost_revenue" } },
      { type: "LOWER_PRICE", metadata: { reason: "increase_sales_volume" } },
      { type: "RESTOCK", metadata: { reason: "meet_demand" } },
      { type: "CUT_COSTS", metadata: { reason: "improve_margin" } },
      { type: "EXPAND_INVENTORY", metadata: { reason: "scale_operations" } },
    ];
  }

  /**
   * Generate context-aware proposals based on current business state
   */
  static proposeContextual(state: BusinessState): Action[] {
    const proposals: Action[] = [];

    // High revenue, consider scaling
    if (state.revenue > 10000) {
      proposals.push({
        type: "EXPAND_INVENTORY",
        metadata: { reason: "scale_with_high_revenue" },
      });
    }

    // High costs, consider cutting
    if (state.cost > 5000) {
      proposals.push({
        type: "CUT_COSTS",
        metadata: { reason: "reduce_high_costs" },
      });
    }

    // Low sales, consider price reduction
    if (state.sales < 100) {
      proposals.push({
        type: "LOWER_PRICE",
        metadata: { reason: "boost_low_sales" },
      });
    }

    // Low inventory, consider restocking
    if (state.inventory < 50) {
      proposals.push({
        type: "RESTOCK",
        metadata: { reason: "replenish_inventory" },
      });
    }

    // Good margin, invest in marketing
    if (state.margin > 30) {
      proposals.push({
        type: "INCREASE_ADS",
        metadata: { reason: "leverage_high_margin" },
      });
    }

    // Return unique proposals limited by config
    const unique = Array.from(
      new Map(proposals.map((p) => [p.type, p])).values()
    );
    return unique.slice(0, this.config.maxProposals);
  }

  /**
   * Generate proposals with priority ranking
   */
  static proposeWithPriority(
    state: BusinessState,
    priorities: string[] = ["revenue", "profit", "growth"]
  ): Action[] {
    const contextual = this.proposeContextual(state);

    // Sort by priority order
    return contextual.sort((a, b) => {
      const aIndex = priorities.indexOf(a.metadata?.reason || "");
      const bIndex = priorities.indexOf(b.metadata?.reason || "");
      return aIndex - bIndex;
    });
  }

  /**
   * Generate conservative (low-risk) proposals
   */
  static proposeConservative(): Action[] {
    return [
      { type: "CUT_COSTS", metadata: { risk: "low" } },
      { type: "RESTOCK", metadata: { risk: "low" } },
    ];
  }

  /**
   * Generate aggressive (high-growth) proposals
   */
  static proposeAggressive(): Action[] {
    return [
      { type: "INCREASE_ADS", metadata: { risk: "high" } },
      { type: "EXPAND_INVENTORY", metadata: { risk: "high" } },
      { type: "LOWER_PRICE", metadata: { risk: "medium" } },
    ];
  }

  /**
   * Generate balanced proposals
   */
  static proposeBalanced(state: BusinessState): Action[] {
    const proposals: Action[] = [];

    if (this.config.includeConservative) {
      proposals.push(...this.proposeConservative());
    }

    if (this.config.includeAggressive) {
      proposals.push(...this.proposeAggressive());
    }

    // Add contextual proposals
    const contextual = this.proposeContextual(state);
    proposals.push(...contextual);

    // Remove duplicates
    const unique = Array.from(
      new Map(proposals.map((p) => [p.type, p])).values()
    );
    return unique.slice(0, this.config.maxProposals);
  }
}
