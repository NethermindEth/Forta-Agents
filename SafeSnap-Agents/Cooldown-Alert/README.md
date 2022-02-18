# Cooldown Monitor Agent

## Description

This agent detects when a question, based on its `question_id`, begins its cooldown period.

## Supported Chains

- Ethereum

## Alerts

- SAFESNAP-2
  - Fired when it detects a `question_id`'s cooldown has begun.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `questionId`: ID of the question whose cooldown period has begun.
    - `questionFinalizeTimeStamp`: Time when the question outcome is finalized and cooldown begins.
    - `blockNumber`: Current block number.