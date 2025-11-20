import { EditBlockProps, ReviewBlockProps, SolveBlockProps } from "./types";

type BlockProps = EditBlockProps | SolveBlockProps | ReviewBlockProps;

export function Block({}: BlockProps) {}
