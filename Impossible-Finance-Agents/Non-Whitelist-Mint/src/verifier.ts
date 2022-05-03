// Define the type for the verifier functions
export type Verifier = (address: string) => Promise<boolean>;

export const IF_WHITELIST_VERIFIER = async (address: string) => {
	// Empty while waiting for response from client
	return true;
}

export const IDIA_WHITELIST_VERIFIER = async (address: string) => {
	// Empty while waiting for response from client
	return true;
}
