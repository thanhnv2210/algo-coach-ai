# Saga Orchestration — Remittance Flow

## Why This Matters

You told me: **"Remittance service becomes the orchestrator when calling internal services and third-party APIs. Every rollback for the main flow must be executed by this service."**

That is the Saga Orchestration pattern. The orchestrator owns the state machine, calls each participant in sequence, and triggers compensation when a step fails.

---

## Saga vs. Choreography

| | Orchestration (your approach) | Choreography |
|---|---|---|
| Who drives the flow | One service (Remittance) | Each service reacts to events |
| Rollback | Orchestrator calls compensation | Each service listens for failure events |
| Observability | Single place to trace | Harder to trace across services |
| Tight coupling | Yes, orchestrator knows all | Low coupling |

**Your choice is correct for remittance** — the flow is sequential, failures require ordered compensation, and you need to know exactly where in the flow each transaction is at any moment.

---

## State Machine

```
PENDING
  → AML_SCANNING
  → FORTER_CHECKING
  → FUND_PULLING
  → REMITTANCE_IN_PROGRESS
  → CALLBACK_PENDING
  → COMPLETED
  → FAILED (with compensation chain)

COMPENSATION STATES (reversed order):
  FAILED → REFUND_INITIATED → REFUND_COMPLETED
```

---

## 1. State Machine + Compensation — Core Pattern

```java
@Service
@Slf4j
public class RemittanceOrchestrator {

    private final TransactionRepository txnRepo;
    private final AmlScanClient amlClient;
    private final ForterClient forterClient;
    private final FundPullClient fundPullClient;
    private final RemittanceProviderClient remittanceClient;
    private final NotificationService notificationService;
    private final DynatraceMetrics metrics;

    @Transactional  // this outer @Transactional only covers the DB state update
    public void process(String txnId) {
        Transaction txn = txnRepo.findById(txnId).orElseThrow();

        try {
            // Step 1: AML Scan
            transition(txn, TxnStatus.AML_SCANNING);
            AmlResult aml = amlClient.scan(txn);
            if (aml.isRejected()) {
                log.warn("[SAGA][{}] AML rejected: reason={}", txnId, aml.getReason());
                metrics.recordAmlRejection();
                failTransaction(txn, "AML_REJECTED", /* compensate */ false); // no fund pulled yet
                return;
            }

            // Step 2: Forter fraud check
            transition(txn, TxnStatus.FORTER_CHECKING);
            ForterResult forter = forterClient.check(txn);
            if (!forter.isApproved()) {
                failTransaction(txn, "FORTER_DECLINED", false);
                return;
            }

            // Step 3: Pull fund — point of no return
            transition(txn, TxnStatus.FUND_PULLING);
            FundPullResult pull = fundPullClient.pull(txn.getAccountId(), txn.getAmount());
            txn.setFundPullRef(pull.getReferenceId()); // persist before calling third-party
            txnRepo.save(txn);

            // Step 4: Call third-party remittance
            transition(txn, TxnStatus.REMITTANCE_IN_PROGRESS);
            RemittanceResult result = remittanceClient.submit(txn);
            txn.setProviderRef(result.getProviderRef());
            transition(txn, TxnStatus.CALLBACK_PENDING);

        } catch (FundPullException ex) {
            log.error("[SAGA][{}] Fund pull failed — no compensation needed (fund not moved)", txnId, ex);
            metrics.recordFundPullError();
            failTransaction(txn, "FUND_PULL_FAILED", false);

        } catch (ThirdPartyApiException ex) {
            // Fund was pulled, but remittance failed → must refund
            log.error("[SAGA][{}] Third-party failed — initiating refund compensation", txnId, ex);
            metrics.recordThirdPartyError();
            compensate(txn, ex);
        }
    }

    // Called when the third-party sends the callback
    @Transactional
    public void handleCallback(String txnId, CallbackPayload payload) {
        Transaction txn = txnRepo.findById(txnId).orElseThrow();
        if (txn.getStatus() != TxnStatus.CALLBACK_PENDING) {
            log.warn("[SAGA][{}] Unexpected callback in state={}", txnId, txn.getStatus());
            return;
        }
        if (payload.isSuccess()) {
            transition(txn, TxnStatus.COMPLETED);
            notificationService.sendSuccessEmail(txn);
            notificationService.pushMobileNotification(txn);
        } else {
            // Provider says failed after already submitting → refund
            compensate(txn, new RuntimeException("Provider callback: " + payload.getErrorCode()));
        }
    }

    // ---------- Compensation ----------

    private void compensate(Transaction txn, Exception cause) {
        log.warn("[SAGA][COMPENSATE][{}] Starting compensation for status={}",
                 txn.getId(), txn.getStatus());
        transition(txn, TxnStatus.COMPENSATING);
        try {
            if (txn.getFundPullRef() != null) {
                fundPullClient.refund(txn.getFundPullRef(), txn.getAmount());
                transition(txn, TxnStatus.REFUND_INITIATED);
                log.info("[SAGA][COMPENSATE][{}] Refund initiated ref={}",
                         txn.getId(), txn.getFundPullRef());
            }
        } catch (Exception refundEx) {
            // Refund itself failed — this needs manual intervention + alerting
            log.error("[SAGA][COMPENSATE][{}] REFUND FAILED — manual intervention required",
                      txn.getId(), refundEx);
            metrics.recordRefundFailure();
            // Do NOT rethrow — save COMPENSATE_FAILED state and alert ops
            transition(txn, TxnStatus.COMPENSATE_FAILED);
        }
    }

    private void failTransaction(Transaction txn, String reason, boolean wasCompensated) {
        txn.setFailReason(reason);
        txn.setCompensated(wasCompensated);
        transition(txn, TxnStatus.FAILED);
        notificationService.notifyCustomerOfFailure(txn);
    }

    private void transition(Transaction txn, TxnStatus next) {
        log.info("[SAGA][{}] {} → {}", txn.getId(), txn.getStatus(), next);
        txn.setStatus(next);
        txn.setUpdatedAt(Instant.now());
        txnRepo.save(txn);
    }
}
```

---

## 2. Idempotent Step Execution

Each step should be idempotent so retries are safe:

```java
@Service
public class FundPullClient {

    public FundPullResult pull(String accountId, BigDecimal amount) {
        // Idempotency key passed to downstream — same key = no double pull
        String idempotencyKey = "FUND_PULL:" + txnId;
        return bankClient.pull(accountId, amount, idempotencyKey);
    }
}
```

---

## 3. The Compensation Chain Rule

> **Only compensate steps that were already successfully executed.**

| Step failed | Compensate |
|-------------|-----------|
| AML rejected | Nothing (no money moved) |
| Forter declined | Nothing |
| Fund pull failed | Nothing (fund not moved) |
| Third-party failed | Refund the pulled fund |
| Callback: provider failed | Refund the pulled fund |
| Refund failed | Alert ops, set `COMPENSATE_FAILED`, queue for manual review |

---

## 4. Observability: Transaction Journey

Store status history so customers can see their transaction journey in the UI:

```java
@Entity
@Table(name = "txn_status_history")
public class TxnStatusHistory {
    private String txnId;
    private TxnStatus status;
    private Instant occurredAt;
    private String details;
}
```

The customer-facing API reads this table to display the timeline.

---

## Interview Talking Points

- "Remittance service is the Saga orchestrator. It drives the state machine: AML → Forter → Fund Pull → Third-party → Callback."
- "Compensation is triggered only after fund pull succeeds. Before that, failures are clean exits."
- "We persist state to DB before each step, so if the orchestrator restarts mid-flow, a recovery job can re-read state and resume from the last committed step."
- "Refund failure is handled separately — we set `COMPENSATE_FAILED` and alert ops immediately rather than rethrowing, because we never want to leave the transaction in a stuck state."
- "We log every state transition with txnId so Dynatrace traces cover the full saga lifecycle."
