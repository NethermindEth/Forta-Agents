import { AlertEvent, Alert, Label } from "forta-agent";

type AlertContract = {
  address: string;
  name: string;
  projectId?: string;
};

type AlertSource = {
  transactionHash?: string;
  block?: {
    timestamp: string;
    chainId: number;
    hash: string;
    number: number;
  };
  bot?: {
    id?: string;
    reference?: string;
    image?: string;
  };
  sourceAlert?: {
    hash?: string;
    botId?: string;
    timestamp?: string;
    chainId?: number;
  };
};

type AlertProject = {
  id: string;
  name: string;
  contacts?: {
    securityEmailAddress?: string;
    generalEmailAddress?: string;
  };
  website?: string;
  token?: {
    symbol?: string;
    name?: string;
    decimals?: number;
    chainId: number;
    address: string;
  };
  social?: {
    twitter?: string;
    github?: string;
    everest?: string;
    coingecko?: string;
  };
};

type AlertAddressBloomFilter = {
  bitset: string;
  k: string;
  m: string;
};

export class TestAlertEvent extends AlertEvent {
  constructor(
    addresses?: string[],
    alertId?: string,
    hash?: string,
    contracts?: AlertContract[],
    createdAt?: string,
    description?: string,
    findingType?: string,
    name?: string,
    protocol?: string,
    scanNodeCount?: number,
    severity?: string,
    alertDocumentType?: string,
    relatedAlerts?: string[],
    chainId?: number,
    labels?: Label[],
    source?: AlertSource,
    metadata?: any,
    projects?: AlertProject[],
    addressBloomFilter?: AlertAddressBloomFilter
  ) {
    const alert: Alert = Alert.fromObject({
      addresses,
      alertId,
      hash,
      contracts,
      createdAt,
      description,
      findingType,
      name,
      protocol,
      scanNodeCount,
      severity,
      alertDocumentType,
      relatedAlerts,
      chainId,
      labels,
      source,
      metadata,
      projects,
      addressBloomFilter,
    });

    super(alert);
  }
}
