import fs from 'node:fs';
import path from 'node:path';
import { packageRoot } from './install.js';
import { serializePersona, slugify } from './persona.js';

export function personaTemplatePath() {
  return path.join(packageRoot, 'templates', 'persona.template.md');
}

/**
 * Scaffold a persona stub. Intentionally leaves TODO markers rather than
 * inventing content -- a persona the user did not author is a persona whose
 * opinions they cannot trust.
 */
export function scaffoldPersona({ id, name, role, model = 'inherit' }) {
  const slug = slugify(id || name || 'new-persona');
  const templateFile = personaTemplatePath();
  if (fs.existsSync(templateFile)) {
    const raw = fs.readFileSync(templateFile, 'utf8');
    return raw
      .replace(/\{\{id\}\}/g, slug)
      .replace(/\{\{name\}\}/g, name || 'TODO: full name')
      .replace(/\{\{role\}\}/g, role || 'TODO: role and seniority')
      .replace(/\{\{model\}\}/g, model);
  }
  return serializePersona({
    id: slug,
    name: name || 'TODO: full name',
    role: role || 'TODO: role and seniority',
    version: 1,
    model,
    stake: 'TODO: what this persona is personally accountable for',
    mandate: 'TODO: what obliges this persona to disagree',
    lens: ['TODO'],
    biases: ['TODO'],
    blind_spots: ['TODO'],
    directives: ['TODO'],
    body: '## Perspective\n\nTODO: write the system prompt in second person.',
  });
}
