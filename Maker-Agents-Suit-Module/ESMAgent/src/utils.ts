import { encodeParameter, decodeParameter } from "forta-agent-tools";

export const decodeParam = (type: string, param: string): any => decodeParameter(type, param);

export const encodeParam = (ptype: string, param: string): any => encodeParameter(ptype, param);
