# Configuração para Deploy na Vercel

## 🚀 Passo a Passo

### 1. Variáveis de Ambiente na Vercel

Acesse o painel da Vercel e adicione as seguintes variáveis de ambiente:

```env
NEXTAUTH_URL=https://seu-dominio.vercel.app
NEXTAUTH_SECRET=sua-chave-secreta-aqui
NEXT_PUBLIC_API_BASE_URL_SIMULATOR=https://aliancacvtest.rtcom.pt
NEXT_PUBLIC_API_KEY=sua-api-key
API_SECRET_TOKEN=seu-token
NODE_ENV=production
```

### 2. Configurações de Build

As configurações já estão corretas no projeto:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### 3. Arquivo vercel.json

O arquivo `vercel.json` na raiz do projeto já está configurado com:
- ✅ Headers CORS globais
- ✅ Rewrites para API externa
- ✅ Configurações de segurança

### 4. Verificar Deploy

Após o deploy, verifique se:

1. **Headers CORS estão ativos:**
```bash
curl -I https://seu-dominio.vercel.app/api/products/ID
```

Deve retornar:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,OPTIONS,PATCH,DELETE,POST,PUT
```

2. **Teste de OPTIONS (Preflight):**
```bash
curl -X OPTIONS https://seu-dominio.vercel.app/api/products/ID
```

Deve retornar status `204 No Content` com headers CORS.

### 5. Troubleshooting

Se ainda houver problemas de CORS:

#### Opção A: Verificar Logs na Vercel
- Acesse Functions → Logs
- Procure por erros relacionados a CORS

#### Opção B: Verificar Headers
No Console do navegador (F12), vá para Network e verifique:
- Response Headers devem conter `Access-Control-Allow-Origin: *`
- Se não aparecer, pode ser cache do browser

#### Opção C: Limpar Cache
```bash
# Na Vercel Dashboard
Settings → General → Clear Cache → Redeploy
```

### 6. Domínio Personalizado

Se usar domínio personalizado, atualize:
```env
NEXTAUTH_URL=https://seu-dominio.com
```

### 7. Configurações Adicionais (se necessário)

Se precisar restringir origens específicas, edite `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { 
          "key": "Access-Control-Allow-Origin", 
          "value": "https://seu-dominio.com,https://outro-dominio.com" 
        }
      ]
    }
  ]
}
```

## ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Deploy realizado com sucesso
- [ ] Headers CORS aparecem nas respostas
- [ ] Teste de requisição OPTIONS funciona
- [ ] API de produtos carrega corretamente
- [ ] Simulação funciona sem erros CORS

## 📞 Suporte

Se continuar com problemas:
1. Verifique os logs da Vercel
2. Teste localmente com `vercel dev`
3. Compare headers local vs produção

