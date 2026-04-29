#!/usr/bin/env node
// Wrapper que chama a CLI nativa do Supabase (sem Docker).
// Pré-requisito: `supabase` no PATH (instale via Scoop/Brew/release).
// Lê SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF e SUPABASE_DB_PASSWORD do .env.
//
// Uso: node scripts/supa-native.js <args...>
// Ex:  node scripts/supa-native.js db push
//      node scripts/supa-native.js link
//      node scripts/supa-native.js migration new add_foo

require('dotenv').config();
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  console.error('✗ SUPABASE_ACCESS_TOKEN ausente no .env');
  console.error('  Gere em: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

// link: injeta --project-ref e --password se não foram passados
if (args[0] === 'link' && !args.includes('--project-ref')) {
  const ref = process.env.SUPABASE_PROJECT_REF;
  if (!ref) {
    console.error('✗ SUPABASE_PROJECT_REF ausente no .env');
    process.exit(1);
  }
  args.push('--project-ref', ref);
  if (process.env.SUPABASE_DB_PASSWORD && !args.includes('--password')) {
    args.push('--password', process.env.SUPABASE_DB_PASSWORD);
  }
}

// db push/pull/diff: injeta --password se não foi passado
if (args[0] === 'db' && ['push', 'pull', 'diff'].includes(args[1]) && !args.includes('--password')) {
  if (process.env.SUPABASE_DB_PASSWORD) {
    args.push('--password', process.env.SUPABASE_DB_PASSWORD);
  }
}

// Roda via `npx supabase` — usa a versão instalada como devDependency.
const env = { ...process.env };
const res = spawnSync('npx', ['supabase', ...args], { stdio: 'inherit', shell: true, env });

if (res.error) {
  console.error('✗ Falha rodando supabase CLI:', res.error.message);
  console.error('  Instale com: npm install -D supabase@latest');
  process.exit(1);
}
process.exit(res.status ?? 1);
