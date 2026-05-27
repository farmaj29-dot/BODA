/**
 * DecisionScorer: Evaluates simulation results and assigns scores
 * Used to rank different action outcomes
 */

import { BusinessState, SimulationResult } from "./SimulationEngine";

export interface ScoringConfig {
  revenueWeight: number;
  costWeight: number;
  salesWeight: number;
  profitabilityThreshold: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  revenueWeight: 1,
  costWeight: -1,
  salesWeight: 2,
  profitabilityThreshold: 100,
};

export interface ScoredResult extends SimulationResult {
  score: number;
  scoreBreakdown: {
    revenue: number;
    cost: number;
    sales: number;
    total: number;
  };
  isProfitable: boolean;
}

export class DecisionScorer {
  private static config: ScoringConfig = DEFAULT_SCORING_CONFIG;

  /**
   * Configure the scoring weights
   */
  static setConfig(config: Partial<ScoringConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Score a single state based on business metrics
   */
  static score(state: BusinessState, config?: ScoringConfig): number {
    const cfg = config || this.config;

    const revenueScore = state.revenue * cfg.revenueWeight;
    const costScore = state.cost * cfg.costWeight;
    const salesScore = state.sales * cfg.salesWeight;

    return revenueScore + costScore + salesScore;
  }

  /**
   * Score a simulation result with detailed breakdown
   */
  static scoreResult(
    result: SimulationResult,
    config?: ScoringConfig
  ): ScoredResult {
    const cfg = config || this.config;
    const state = result.resultState;

    const revenueScore = state.revenue * cfg.revenueWeight;
    const costScore = state.cost * cfg.costWeight;
    const salesScore = state.sales * cfg.salesWeight;
    const total = revenueScore + costScore + salesScore;

    const profit = state.revenue - state.cost;
    const isProfitable = profit > cfg.profitabilityThreshold;

    return {
      ...result,
      score: total,
      scoreBreakdown: {
        revenue: revenueScore,
        cost: costScore,
        sales: salesScore,
        total,
      },
      isProfitable,
    };
  }

  /**
   * Score multiple results and sort by score (descending)
   */
  static scoreBatch(
    results: SimulationResult[],
    config?: ScoringConfig
  ): ScoredResult[] {
    return results
      .map((result) => this.scoreResult(result, config))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get the best scoring result
   */
  static getBest(results: SimulationResult[], config?: ScoringConfig): ScoredResult {
    const scored = this.scoreBatch(results, config);
    return scored[0];
  }

  /**
   * Filter results that meet minimum score threshold
   */
  static filterByThreshold(
    results: ScoredResult[],
    minScore: number
  ): ScoredResult[] {
    return results.filter((result) => result.score >= minScore);
  }
}
