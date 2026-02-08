# 🚀 Guia de Deploy no Vercel

Este documento explica como corrigir o erro de deploy que você encontrou.

## 🔴 Problema Encontrado

O erro `Export encountered an error on /_not-found/page` ocorre quando:
1. **Variáveis de ambiente não estão configuradas no Vercel**
2. **O Supabase está sendo inicializado durante a compilação estática (build time)**
3. **URLs do Supabase não são válidas**

## ✅ Soluções Aplicadas

### 1. **Código Atualizado**
- ✅ `supabase.server.ts` - Agora valida variáveis de ambiente com segurança
- ✅ `authContext.tsx` - Adiciona verificação de supabase null no useEffect
- ✅ `login/page.tsx` - Adiciona validação antes de usar supabase
- ✅ `next.config.ts` - Configuração otimizada para build estático

### 2. **O que você precisa fazer:**

#### Passo 1: Criar um novo projeto Supabase (se necessário)

1. Acesse: https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha os detalhes do projeto
4. Aguarde a criação
5. Vá em **Settings** → **API**
6. Copie:
   - **Project URL** (exemplo: `https://xxxxx-xxxxx.supabase.co`)
   - **anon public key** (começa com `eyJ...`)

#### Passo 2: Configurar variáveis de ambiente localmente

1. Abra o arquivo `.env.local`
2. Atualize com suas chaves:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```
3. Salve o arquivo
4. Reinicie o servidor: `npm run dev`

#### Passo 3: Configurar variáveis no Vercel

🔑 **IMPORTANTE**: Adicione as mesmas variáveis no Vercel!

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione duas variáveis:
   - Nome: `NEXT_PUBLIC_SUPABASE_URL`
   - Valor: `https://seu-projeto.supabase.co`
   
   E:
   - Nome: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Valor: Sua chave pública

5. **Clique em "Save"**

#### Passo 4: Fazer o redeploy

1. No Vercel, vá para **Deployments**
2. Clique no último deploy com erro (⚠️)
3. Clique em **Redeploy** (ou "Requeue")
4. **Desmarque** "Use existing build cache"
5. Clique em **Redeploy**

Aguarde a build completar. Desta vez deve funcionar! ✨

---

## 🔍 Verificação Local

Para testar se está tudo funcionando antes de fazer deploy:

```bash
# Instale as dependências
npm install

# Execute o build local (como será no Vercel)
npm run build

# Se o build passar sem erros, está tudo certo!
npm start
```

---

## 📋 Checklist de Deploy

- [ ] Projeto Supabase criado
- [ ] Variáveis de ambiente em `.env.local`
- [ ] `npm run build` funciona localmente
- [ ] Variáveis adicionadas no Vercel
- [ ] Redeploy executado
- [ ] Build passou ✅

---

## 🛠️ Troubleshooting

### Se ainda receber erro na build:

**Opção 1: Limpar cache do Vercel**
- Dashboard Vercel → Settings → Advanced
- Clique em "Clear Build Cache"
- Faça redeploy

**Opção 2: Verificar variáveis de ambiente**
```bash
# Veja quais variáveis estão disponíveis
echo "SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "SUPABASE_KEY: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

**Opção 3: Adicionar mais logs**
- Os logs agora aparecerão no Vercel quando o Supabase não estiver configurado
- Verifique os "Build Logs" no Vercel para mais detalhes

---

## 📚 Referências

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Última atualização:** Fevereiro 2026

Sucesso no deploy! 🎉
