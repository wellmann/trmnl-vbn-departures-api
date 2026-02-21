import { Liquid, TagToken, TopLevelToken, Context, Template } from 'liquidjs';
import { LiquidOptions } from 'liquidjs/dist/liquid-options';

export default class TrmnlLiquid extends Liquid {
	private customTemplates = new Map<string, Template[]>();

	constructor(options?: LiquidOptions) {
		super(options);
		this.registerCustomTags();
		this.registerCustomFilters();
	}

	private registerCustomTags() {
		const self = this;

		this.registerTag('template', {
			parse(token: TagToken, remainTokens: TopLevelToken[]) {
				this.templateName = token.args.trim();
				this.templates = [];

				const stream = this.liquid.parser.parseStream(remainTokens);
				stream
					.on('tag:endtemplate', () => stream.stop())
					.on('template', (tpl: Template) => this.templates.push(tpl))
					.on('end', () => {
						throw new Error(`tag ${token.getText()} not closed`);
					});

				stream.start();
			},
			render() {
				self.customTemplates.set(this.templateName, this.templates);
				return '';
			}
		});

		this.registerTag('render', {
			parse(token: TagToken) {
				const args = token.args.trim();
				const match = args.match(/^["']([^"']+)["'](?:,\s*(.+))?$/);

				if (!match) {
					throw new Error(`Invalid render syntax: ${token.getText()}`);
				}

				this.targetName = match[1];
				this.paramsString = match[2] || '';
			},
			*render(ctx: Context, emitter: any): Generator {
				const templateTokens = self.customTemplates.get(this.targetName);

				if (!templateTokens) {
					throw new Error(`Template "${this.targetName}" not found`);
				}

				let pushed = false;
				if (this.paramsString) {
					const scope: Record<string, any> = {};
					const paramPairs = this.paramsString.split(',').map((p: string) => p.trim());
					for (const pair of paramPairs) {
						const [key, value] = pair.split(':').map((s: string) => s.trim());
						scope[key] = yield self.evalValue(value, ctx);
					}
					ctx.push(scope);
					pushed = true;
				}

				const html = yield self.renderer.renderTemplates(templateTokens, ctx);

				if (pushed) {
					ctx.pop();
				}

				emitter.write(html);
			}
		});
	}

	private registerCustomFilters() {
		this.registerFilter('parse_json', (str: string) => {
			try {
				return JSON.parse(str);
			} catch (e) {
				return null;
			}
		});
	}
}
