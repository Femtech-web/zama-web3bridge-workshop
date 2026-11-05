import { BaseError, UserRejectedRequestError } from "viem";

export function friendlyError(error: unknown): string {
  if (
    error instanceof UserRejectedRequestError ||
    (error instanceof BaseError &&
      error.walk((cause) => cause instanceof UserRejectedRequestError) instanceof
        UserRejectedRequestError)
  ) {
    return "The wallet request was declined. Check the latest transaction before retrying a multi-step action.";
  }
  const message = error instanceof Error ? error.message : "The operation could not be completed.";
  if (/reject|denied.*sign/i.test(message))
    return "The signature request was declined. Try again when you are ready.";
  if (/unauthorized|not.allowed|permission|ACL/i.test(message))
    return "This wallet is not authorized to decrypt this value. Check the account and contract permissions.";
  if (/fetch|network|timeout|relayer|RPC/i.test(message))
    return "The RPC or Zama Relayer is unavailable. Wait a moment and retry; check the last transaction before resubmitting.";
  if (/revert/i.test(message))
    return "The transaction reverted. Check the employer wallet, employee address, payroll period, and latest payment attempt.";
  return message.length < 260
    ? message
    : "The operation failed. Check your wallet, network, and deployment configuration, then retry.";
}
