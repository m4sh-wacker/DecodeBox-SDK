type ArgType = "string" | "number" | "boolean" | "option" | "toggleString" | "textarea";
interface OperationArg {
	name: string;
	type: ArgType;
	value: string | number | boolean;
	options?: string[];
	optionLabels?: Record<string, string>;
	toggleValues?: string[];
	toggleValue?: string;
	hint?: string;
	min?: number;
	max?: number;
}
interface OperationDef {
	id: string;
	name: string;
	category: string;
	description: string;
	aliases: string[];
	args: OperationArg[];
	isFlowControl?: boolean;
}
interface RecipeStep {
	uid: string;
	opId: string;
	args: OperationArg[];
	disabled: boolean;
}
interface Recipe {
	id: string;
	name: string;
	steps: RecipeStep[];
}
interface Evidence {
	label: string;
	detail: string;
	weight: number;
}
interface Candidate {
	id: string;
	format: string;
	confidence: number;
	evidence: Evidence[];
	preview: string;
	steps: RecipeStep[];
}
interface HashMatch {
	name: string;
	confidence: number;
	reason: string;
	context?: string;
	salt?: {
		present: boolean;
		value?: string;
		note: string;
	};
}
interface HashIdentification {
	matches: HashMatch[];
	summary: string;
	oneWay: boolean;
	terminal?: boolean;
}
type TerminusReason = "identified" | "plain" | "remainder" | "tooShort" | "depth" | "budget" | "cycle" | "failed";
interface Terminus {
	reason: TerminusReason;
	note: string;
	complete: boolean;
	identification?: HashIdentification;
}
interface EmbeddedFind {
	format: string;
	offset: number;
	length: number;
	source: string;
	decoded: string;
	preview: string;
	confidence: number;
	steps: RecipeStep[];
}
interface Layer {
	id: string;
	depth: number;
	format: string;
	confidence: number;
	byteLength: number;
	output: string;
	evidence: Evidence[];
	steps: RecipeStep[];
	children: Layer[];
	terminus?: Terminus;
	/** Encoded data found inside this layer rather than wrapped around it. */
	embedded?: EmbeddedFind[];
	/** Other interpretations of this layer; actionable steps start at the original input. */
	alternatives?: Candidate[];
}
type OutputType = "text" | "json" | "bytes" | "image";
interface BakeResult {
	/** Unique operation IDs in order of their last successful execution. */
	completedOperations: string[];
	output: string;
	outputType: OutputType;
	byteLength: number;
	durationMs: number;
	error?: {
		stepIndex: number;
		message: string;
	};
}
interface AutoDecodeOptions {
	maxDepth: number;
	threshold: number;
	budgetMs: number;
}
type IndicatorKind = "url" | "domain" | "ipv4" | "ipv6" | "email" | "hash" | "path" | "registry" | "command" | "crypto-key" | "mac" | "cve" | "wallet";
interface Indicator {
	kind: IndicatorKind;
	value: string;
	defanged: string;
	depth: number;
	path: string;
}
type Severity = "critical" | "high" | "medium" | "low" | "info";
interface Finding {
	id: string;
	severity: Severity;
	title: string;
	detail: string;
	evidence: string;
	depth: number;
	path: string;
	reference?: string;
}
interface AnalysisNode {
	id: string;
	format: string;
	confidence: number;
	depth: number;
	path: string;
	byteLength: number;
	output: string;
	preview: string;
	steps: RecipeStep[];
	children: AnalysisNode[];
	origin?: {
		label: string;
		offset: number;
	};
}
interface Analysis {
	root: AnalysisNode;
	nodes: number;
	maxDepth: number;
	indicators: Indicator[];
	findings: Finding[];
	durationMs: number;
	truncated: boolean;
}
interface AnalyseOptions {
	maxDepth: number;
	maxNodes: number;
	budgetMs: number;
	threshold: number;
}
type HintKind = "flag" | "decode" | "crack" | "shape" | "identify" | "inspect";
interface Hint {
	id: string;
	kind: HintKind;
	title: string;
	reason: string;
	confidence: number;
	depth: number;
	path: string;
	preview: string;
	steps: RecipeStep[];
}
interface FoundFlag {
	text: string;
	depth: number;
	path: string;
	known: boolean;
}
interface CtfReport {
	flags: FoundFlag[];
	hints: Hint[];
	layers: number;
	truncated: boolean;
	durationMs: number;
}
interface CtfOptions {
	format: string;
	maxDepth: number;
	budgetMs: number;
}
interface Inspection {
	root: Layer;
	analysis: Analysis;
}
interface InspectOptions {
	decode?: Partial<AutoDecodeOptions>;
	analyse?: Partial<AnalyseOptions>;
}
type Compression = "gzip" | "deflate" | "deflate-raw";
export type Input = string | Uint8Array | ArrayBuffer;
type Value = OperationArg["value"];
export type Arguments = Record<string, Value | {
	value: string;
	format: string;
}>;
export interface Step {
	opId: string;
	args?: Arguments;
	disabled?: boolean;
}
export declare class DecodeBoxError extends Error {
	readonly code: "INVALID_INPUT" | "UNKNOWN_OPERATION" | "OPERATION_FAILED" | "LIMIT_EXCEEDED";
	readonly name = "DecodeBoxError";
	constructor(code: "INVALID_INPUT" | "UNKNOWN_OPERATION" | "OPERATION_FAILED" | "LIMIT_EXCEEDED", message: string);
}
type RecipeInput = readonly (Step | RecipeStep)[] | Pick<Recipe, "steps">;
export declare const apiVersion = "1.0.0";
export declare const engineVersion: string;
export declare const ready: Promise<void>;
export declare function capabilities(): {
	runtime: string;
	cryptography: boolean;
	secureRandom: boolean;
	compressionFormats: Compression[];
	charsets: string[];
	maxInputLength: number;
	maxOutputLength: number;
	maxSteps: number;
};
export declare function listOperations(): OperationDef[];
export declare function getOperation(id: string): OperationDef | null;
export declare function bake(input: Input, recipe: RecipeInput): Promise<BakeResult>;
export declare function executeOperation(opId: string, input: Input, args?: Arguments): Promise<string>;
export declare function detect(input: Input): Promise<Candidate[]>;
export declare function autoDecode(input: Input, opts?: Partial<AutoDecodeOptions>): Promise<Layer>;
export declare function identify(input: Input): Promise<HashIdentification | null>;
export declare function analyse(input: Input, opts?: Partial<AnalyseOptions>): Promise<Analysis>;
export declare function inspect(input: Input, opts?: InspectOptions): Promise<Inspection>;
export declare function hints(input: Input, opts?: Partial<CtfOptions>): Promise<CtfReport>;
export declare const DecodeBox: Readonly<{
	ready: Promise<void>;
	apiVersion: "1.0.0";
	engineVersion: string;
	capabilities: typeof capabilities;
	listOperations: typeof listOperations;
	getOperation: typeof getOperation;
	executeOperation: typeof executeOperation;
	bake: typeof bake;
	detect: typeof detect;
	autoDecode: typeof autoDecode;
	identify: typeof identify;
	analyse: typeof analyse;
	inspect: typeof inspect;
	hints: typeof hints;
}>;

export {
	DecodeBox as default,
};

export {};
