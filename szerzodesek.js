const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'
const client = window.supabase.createClient(supabaseUrl, supabaseKey)

async function bejelentkezesEllenorzese() {
    const { data: { session } } = await client.auth.getSession()
    if (!session) window.location.href = 'login.html'
}

async function kijelentkezes() {
    await client.auth.signOut()
    window.location.href = 'login.html'
}

let szerkesztesId = null

function urlapMegjelenites(szerzodes = null) {
    szerkesztesId = szerzodes ? szerzodes.id : null
    document.getElementById('urlap-cim').textContent = szerzodes ? 'Szerződés szerkesztése' : 'Új szerződés hozzáadása'
    document.getElementById('kezdet').value = szerzodes?.kezdet ?? ''
    document.getElementById('vege').value = szerzodes?.vege ?? ''
    document.getElementById('havi_dij').value = szerzodes?.havi_dij ?? ''
    document.getElementById('statusz').value = szerzodes?.statusz ?? 'aktív'
    document.getElementById('megjegyzes').value = szerzodes?.megjegyzes ?? ''
    document.getElementById('urlap').classList.remove('rejtett')
    berlokBetolteseLegordulo(szerzodes?.berlo_id)
    helyisegekBetolteseLegordulo(szerzodes?.helyiseg_id)
}

function urlapElrejtes() {
    szerkesztesId = null
    document.getElementById('urlap').classList.add('rejtett')
    document.getElementById('fajl').value = ''
}

async function berlokBetolteseLegordulo(kivalasztottId = null) {
    const select = document.getElementById('berlo_id')
    select.innerHTML = '<option value="">Válassz bérlőt *</option>'
    const { data } = await client.from('berlok').select('id, nev')
    data.forEach(b => {
        const option = document.createElement('option')
        option.value = b.id
        option.textContent = b.nev
        if (kivalasztottId && b.id === kivalasztottId) option.selected = true
        select.appendChild(option)
    })
}

async function helyisegekBetolteseLegordulo(kivalasztottId = null) {
    const select = document.getElementById('helyiseg_id')
    select.innerHTML = '<option value="">Válassz helyiséget *</option>'
    const { data } = await client.from('helyisegek').select('id, nev')
    data.forEach(h => {
        const option = document.createElement('option')
        option.value = h.id
        option.textContent = h.nev
        if (kivalasztottId && h.id === kivalasztottId) option.selected = true
        select.appendChild(option)
    })
}

async function mentese() {
    const berlo_id = parseInt(document.getElementById('berlo_id').value)
    const helyiseg_id = parseInt(document.getElementById('helyiseg_id').value)
    const kezdet = document.getElementById('kezdet').value
    const vege = document.getElementById('vege').value
    const havi_dij = document.getElementById('havi_dij').value
    const statusz = document.getElementById('statusz').value
    const megjegyzes = document.getElementById('megjegyzes').value

    if (!berlo_id || !helyiseg_id || !kezdet) {
        alert('A bérlő, helyiség és kezdet dátum kötelező!')
        return
    }

    let id = szerkesztesId
    let error

    if (szerkesztesId) {
        const result = await client
            .from('szerzodesek')
            .update({ kezdet, vege: vege || null, havi_dij, statusz, megjegyzes })
            .eq('id', szerkesztesId)
        error = result.error

        if (!error) {
            await client.rpc('update_szerzodes_kapcsolatok', {
                p_id: szerkesztesId,
                p_berlo_id: berlo_id,
                p_helyiseg_id: helyiseg_id
            })
        }
    } else {
        const result = await client
            .from('szerzodesek')
            .insert([{ berlo_id, helyiseg_id, kezdet, vege: vege || null, havi_dij, statusz, megjegyzes }])
            .select()
        error = result.error
        if (!error && result.data) id = result.data[0].id
    }

    if (error) {
        alert('Hiba történt a mentés során!')
        console.error(error)
        return
    }

    const fajl = document.getElementById('fajl').files[0]
    if (fajl && id) {
        const nev = `${id}/${Date.now()}_${fajl.name}`
        const { error: fajlHiba } = await client.storage
            .from('szerzodesek')
            .upload(nev, fajl)
        if (fajlHiba) {
            alert('Hiba történt a fájl feltöltésekor!')
            console.error(fajlHiba)
        }
    }

    urlapElrejtes()
    szerzodesekBetoltese()
}

async function torles(id) {
    if (!confirm('Biztosan törölni szeretnéd ezt a szerződést?')) return
    const { error } = await client.from('szerzodesek').delete().eq('id', id)
    if (error) {
        alert('Hiba történt a törlés során!')
        console.error(error)
        return
    }
    szerzodesekBetoltese()
}

async function szerzodesekBetoltese() {
    const lista = document.getElementById('szerzodesek-lista')

    const { data, error } = await client
        .from('szerzodesek')
        .select(`*, berlok (nev), helyisegek (nev)`)

    if (error) {
        lista.innerHTML = '<p>Hiba történt az adatok betöltésekor.</p>'
        console.error(error)
        return
    }

    if (data.length === 0) {
        lista.innerHTML = '<p>Nincsenek szerződések.</p>'
        return
    }

    const kartyak = await Promise.all(data.map(async sz => {
        const { data: fajlok } = await client.storage
            .from('szerzodesek')
            .list(`${sz.id}`)

        const fajlLinkek = fajlok && fajlok.length > 0
            ? (await Promise.all(fajlok.map(async f => {
                const { data: url } = await client.storage
                    .from('szerzodesek')
                    .createSignedUrl(`${sz.id}/${f.name}`, 3600)
                return `<a href="${url.signedUrl}" target="_blank" class="fajl-link">📎 ${f.name}</a>`
            }))).join('')
            : ''

        return `
            <div class="helyiseg-kartya">
                <div>
                    <h3>${sz.berlok.nev}</h3>
                    <p>🏢 ${sz.helyisegek.nev}</p>
                    <p>📅 ${sz.kezdet} – ${sz.vege ?? 'Határozatlan'}</p>
                    <p>💰 ${sz.havi_dij ?? 'Nincs megadva'} Ft/hó</p>
                    <p>${sz.megjegyzes ?? ''}</p>
                    <div class="fajl-lista">${fajlLinkek}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
                    <span class="statusz ${sz.statusz}">${sz.statusz}</span>
                    <div style="display:flex;gap:8px">
                        <button onclick='urlapMegjelenites(${JSON.stringify(sz)})' class="szerkeszt-gomb">Szerkesztés</button>
                        <button onclick="torles(${sz.id})" class="torles-gomb">Törlés</button>
                    </div>
                </div>
            </div>
        `
    }))

    lista.innerHTML = kartyak.join('')
}

bejelentkezesEllenorzese()
szerzodesekBetoltese()