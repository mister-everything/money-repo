"use server";
import { findWorkspaceRoot } from "./find-workspace-root";
import { load } from "./load";

const WORKSPACE_ROOT = findWorkspaceRoot();

if (WORKSPACE_ROOT) load(WORKSPACE_ROOT); // global env

load();
