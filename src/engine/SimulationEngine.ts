/**
 * SimulationEngine: Core simulation logic for AI decision scenarios
 * Applies actions to state and calculates outcomes
 */

export interface BusinessState {
  revenue: number;
  cost: number;
  sales: number;
  margin: number;
  inventory: number;
  timestamp?: number;
}

export interface Action {
  type: "INCREASE_ADS" | "LOWER_PRICE" | "RESTOCK" | "CUT_COSTS" | "EXPAND_INVENTORY";
  metadata?: Record<string, any>;
}

export interface SimulationResult {
  action: Action;
  resultState: BusinessState;
  delta: Partial<BusinessState>;
}

export class SimulationEngine {
  /**
   * Simulate the impact of an action on the current state
   */
  static simulate(state: BusinessState, action: Action): SimulationResult {
    const result = { ...state };
    const delta: Partial<BusinessState> = {};

    switch (action.type) {
      case "INCREASE_ADS":
        result.revenue *= 1.2;
        result.cost += 200;
        delta.revenue = result.revenue - state.revenue;
        delta.cost = 200;
        break;

      case "LOWER_PRICE":
        result.sales += 30;
        result.margin -= 10;
        delta.sales = 30;
        delta.margin = -10;
        break;

      case "RESTOCK":
        result.inventory += 100;
        result.cost += 500;
        delta.inventory = 100;
        delta.cost = 500;
        break;

      case "CUT_COSTS":
        result.cost *= 0.85;
        result.sales -= 5;
        delta.cost = result.cost - state.cost;
        delta.sales = -5;
        break;

      case "EXPAND_INVENTORY":
        result.inventory += 200;
        result.cost += 1000;
        delta.inventory = 200;
        delta.cost = 1000;
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }

    result.timestamp = Date.now();

    return {
      action,
      resultState: result,
      delta,
    };
  }

  /**
   * Simulate multiple actions and return all results
   */
  static simulateMultiple(
    state: BusinessState,
    actions: Action[]
  ): SimulationResult[] {
    return actions.map((action) => this.simulate(state, action));
  }
}
