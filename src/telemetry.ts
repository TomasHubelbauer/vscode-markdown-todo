import ApplicationInsights from 'vscode-extension-telemetry';
// TODO: Figure out why it doesn't seem to work even with telemetry.d.ts
// @ts-ignore
import { name, version } from '../package.json';
export default new ApplicationInsights(name, version, '040cd0bb-5c25-401e-8454-63ef0b1edf7e');
