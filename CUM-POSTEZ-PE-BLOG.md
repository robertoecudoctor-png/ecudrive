# Cum postezi pe blogul ECU DRIVE

Articolele stau în `blog/posts.json`, iar pozele în `img/blog/`.
Ai două variante:

## 1. Din panoul de administrare (recomandat, după ce site-ul e online)

1. Intri pe `adresa-site-ului/admin`
2. Te loghezi
3. **Blog → Articole → Adaugă articol**
4. Completezi: titlu, link (ex: `golf-7-stage-1`), dată, categorie, poză, rezumat, conținut
5. Apeși **Publish**. Articolul apare pe site în 1–2 minute.

Ca să meargă panoul, site-ul trebuie urcat pe GitHub și publicat pe Netlify (ambele gratuite).
În `admin/config.yml` se completează numele repo-ului la `repo:`.

### Test pe calculator, fără hosting
Într-un terminal, în folderul site-ului:

```
npx decap-server
```

Apoi deschide site-ul local la `/admin`: poți scrie articole direct, fără login.

## 2. Manual

Deschide `blog/posts.json` și copiază un articol existent (blocul dintre `{` și `}`).
Schimbă textele, pune poza în `img/blog/` și scrie calea la `"cover"`.

În `"body"` poți folosi formatare simplă:
- `**text**` → **îngroșat**
- `## Titlu` → subtitlu
- `- element` → listă
- `![descriere](img/blog/poza.jpg)` → poză în articol
