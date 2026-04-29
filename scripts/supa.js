#!/usr/bin/env node
// Wrapper portátil (Windows/Mac/Linux) pra rodar a Supabase CLI dentro do Docker.
// Uso: node scripts/supa.js <args...>
// Ex:  node scripts/supa.js db push
//      node scripts/supa.js migration new add_column_x
//      node scripts/supa.js link            (usa SUPABASE_PROJECT_REF do .env)

require('dotenv').config();
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  console.error('✗ SUPABASE_ACCESS_TOKEN ausente no .env');
  console.error('  Gere em: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

// Auto-append --project-ref pro comando `link` se não foi passado
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

const composeArgs = ['compose', 'run', '--rm', 'supabase-cli', ...args];
const res = spawnSync('docker', composeArgs, { stdio: 'inherit', shell: false });

if (res.error) {
  console.error('✗ Falha rodando docker:', res.error.message);
  console.error('  Docker Desktop está rodando?');
  process.exit(1);
}
process.exit(res.status ?? 1);
