/**
 * ControlLayer: Human approval and override layer
 * Implements decision gating and human-in-the-loop approval
 */

import { Action } from "./SimulationEngine";
import { ScoredResult } from "./DecisionScorer";

export interface ApprovalRequest {
  id: string;
  action: Action;
  score: number;
  recommendation: ScoredResult;
  timestamp: number;
  status: "pending" | "approved" | "rejected" | "overridden";
  approverNotes?: string;
}

export interface ApprovalPolicy {
  autoApproveThreshold: number;
  requireApprovalThreshold: number;
  allowedActions: string[];
  blockedActions: string[];
}

export const DEFAULT_APPROVAL_POLICY: ApprovalPolicy = {
  autoApproveThreshold: 90,
  requireApprovalThreshold: 50,
  allowedActions: [],
  blockedActions: [],
};

export class ControlLayer {
  private static policy: ApprovalPolicy = DEFAULT_APPROVAL_POLICY;
  private static pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private static approvalHistory: ApprovalRequest[] = [];

  /**
   * Set approval policy
   */
  static setPolicy(policy: Partial<ApprovalPolicy>) {
    this.policy = { ...this.policy, ...policy };
  }

  /**
   * Check if action is allowed
   */
  static isActionAllowed(actionType: string): boolean {
    if (
      this.policy.blockedActions.length > 0 &&
      this.policy.blockedActions.includes(actionType)
    ) {
      return false;
    }

    if (
      this.policy.allowedActions.length > 0 &&
      !this.policy.allowedActions.includes(actionType)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate if action needs approval
   */
  static requiresApproval(score: number, actionType: string): boolean {
    if (!this.isActionAllowed(actionType)) {
      return true;
    }

    if (score >= this.policy.autoApproveThreshold) {
      return false;
    }

    if (score < this.policy.requireApprovalThreshold) {
      return true;
    }

    return true;
  }

  /**
   * Submit action for approval
   */
  static submitForApproval(
    action: Action,
    score: number,
    recommendation: ScoredResult
  ): ApprovalRequest {
    const id = this.generateApprovalId();
    const request: ApprovalRequest = {
      id,
      action,
      score,
      recommendation,
      timestamp: Date.now(),
      status: "pending",
    };

    this.pendingApprovals.set(id, request);
    return request;
  }

  /**
   * Auto-approve action if score is high enough
   */
  static autoApprove(
    action: Action,
    score: number,
    recommendation: ScoredResult
  ): { approved: boolean; request: ApprovalRequest } {
    const requiresApproval = this.requiresApproval(score, action.type);

    if (!requiresApproval && this.isActionAllowed(action.type)) {
      const request: ApprovalRequest = {
        id: this.generateApprovalId(),
        action,
        score,
        recommendation,
        timestamp: Date.now(),
        status: "approved",
        approverNotes: "Auto-approved (high confidence)",
      };

      this.approvalHistory.push(request);
      return { approved: true, request };
    }

    const request = this.submitForApproval(action, score, recommendation);
    return { approved: false, request };
  }

  /**
   * Approve a pending request
   */
  static approve(
    requestId: string,
    notes?: string
  ): { success: boolean; request?: ApprovalRequest } {
    const request = this.pendingApprovals.get(requestId);
    if (!request) {
      return { success: false };
    }

    request.status = "approved";
    request.approverNotes = notes;
    this.pendingApprovals.delete(requestId);
    this.approvalHistory.push(request);

    return { success: true, request };
  }

  /**
   * Reject a pending request
   */
  static reject(
    requestId: string,
    reason: string
  ): { success: boolean; request?: ApprovalRequest } {
    const request = this.pendingApprovals.get(requestId);
    if (!request) {
      return { success: false };
    }

    request.status = "rejected";
    request.approverNotes = reason;
    this.pendingApprovals.delete(requestId);
    this.approvalHistory.push(request);

    return { success: true, request };
  }

  /**
   * Override decision with human choice
   */
  static override(
    requestId: string,
    overrideAction: Action,
    reason: string
  ): { success: boolean; request?: ApprovalRequest } {
    const request = this.pendingApprovals.get(requestId);
    if (!request) {
      return { success: false };
    }

    request.status = "overridden";
    request.action = overrideAction;
    request.approverNotes = `Override: ${reason}`;
    this.pendingApprovals.delete(requestId);
    this.approvalHistory.push(request);

    return { success: true, request };
  }

  /**
   * Get pending approvals
   */
  static getPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values());
  }

  /**
   * Get approval history
   */
  static getApprovalHistory(): ApprovalRequest[] {
    return [...this.approvalHistory];
  }

  /**
   * Get approval statistics
   */
  static getStatistics() {
    const total = this.approvalHistory.length;
    const approved = this.approvalHistory.filter(
      (r) => r.status === "approved"
    ).length;
    const rejected = this.approvalHistory.filter(
      (r) => r.status === "rejected"
    ).length;
    const overridden = this.approvalHistory.filter(
      (r) => r.status === "overridden"
    ).length;

    return {
      total,
      approved,
      rejected,
      overridden,
      pending: this.pendingApprovals.size,
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
      overrideRate: total > 0 ? (overridden / total) * 100 : 0,
    };
  }

  private static generateApprovalId(): string {
    return `appr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
