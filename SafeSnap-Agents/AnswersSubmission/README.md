# Answers submission Agent

## Description

This agent detects answers events on the oracle for reality module questions.

## Supported Chains

- Ethereum

## Alerts

- GNOSIS-3-1

  - Fired when `LogNewAnswer` event is emitted on the reality module oracle.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `questionId`: the question Id who's answer is submitted.
    - `answer`: the submitted answer.
    - `user`: address of the user who submitted the answer.
    - `commitment`: set to `yes` if a commitment is submitted, `no` otherwise.

- GNOSIS-3-2

  - Fired when `LogAnswerReveal` event is emitted on the reality module oracle.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `questionId`: the question Id who's answer is submitted.
    - `answer`: the revealed answer.
    - `user`: address of the user who revealed the answer.

- GNOSIS-3-3

  - Fired when `LogFinalize` event is emitted on the reality module oracle.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `questionId`: the question Id that is finalized.
    - `answer`: the final answer.
