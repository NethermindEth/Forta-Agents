# Pickle Finance Management Calls Agent

## Description

This agent detects management calls to Pickle Finance Jars.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- PICKLE-3
  - Fired when a management call is made to a Pickle Finance Jar.
  - Severity is always set to "Info". 
  - Type is always set to "Info".
  - The metadata contains:
    - `pickleJar`: The jar with too much idle funds.
    - `methodCalled`: The method called in the Jar.
    - `args`: Argument used in the method call.
