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

async function urlapMegjelenites(helyiseg = null) {
    szerkesztesId = helyiseg ? helyiseg.id : null
    document.getElementById('urlap-cim').textContent = helyiseg ? 'Helyiség szerkesztése' : 'Új helyiség hozzáadása'
    document.getElementById('nev').value = helyiseg?.nev ?? ''
    document.getElementById('tipus').value = helyiseg?.tipus ?? 'iroda'
    document.getElementById('terulet_m2').value = helyiseg?.terulet_m2 ?? ''
    document.getElementById('ferohely').value = helyiseg?.ferohely ?? ''
    document.getElementById('leiras').value = helyiseg?.leiras ?? ''
    document.getElementById('statusz').value = helyiseg?.statusz ?? 'szabad'
    document.getElementById('ar_havi').value = helyiseg?.ar_havi ?? ''
    document.getElementById('urlap').classList.remove('rejtett')
    await emeletekBetolteseLegordulo(helyiseg?.emelet_id)
}

async function emeletekBetolteseLegordulo(kivalasztottId = null) {
    const select = document.getElementById('emelet_id')
    select.innerHTML = '<option value="">Válassz emeletet (elhagyható)</option>'
    const { data } = await client
        .from('emeletek')
        .select(`*, epuletek (nev)`)
        .order('nev')
    data.forEach(e => {
        const option = document.createElement('option')
        option.value = e.id
        option.textContent = `${e.epuletek.nev} / ${e.nev}`
        if (kivalasztottId && e.id === kivalasztottId) option.selected = true
        select.appendChild(option)
    })
}

function urlapElrejtes() {
    szerkesztesId = null
    document.getElementById('urlap').classList.add('rejtett')
    document.getElementById('fajl').value = ''
}

async function mentese() {
    const nev = document.getElementById('nev').value
    const tipus = document.getElementById('tipus').value
    const terulet_m2 = document.getElementById('terulet_m2').value
    const ferohely = document.getElementById('ferohely').value
    const leiras = document.getElementById('leiras').value
    const statusz = document.getElementById('statusz').value
    const ar_havi = document.getElementById('ar_havi').value
    const emelet_id = document.getElementById('emelet_id').value ? parseInt(document.getElementById('emelet_id').value) : null

    if (!nev) {
        alert('A helyiség neve kötelező!')
        return
    }

    let id = szerkesztesId
    let error

    if (szerkesztesId) {
        const result = await client
            .from('helyisegek')
            .update({ nev, tipus, terulet_m2, ferohely, leiras, statusz, ar_havi, emelet_id })
            .eq('id', szerkesztesId)
        error = result.error
    } else {
        const result = await client
            .from('helyisegek')
            .insert([{ nev, tipus, terulet_m2, ferohely, leiras, statusz, ar_havi, emelet_id }])
            .select()
        error = result.error
        if (!error && result.data) {
            id = result.data[0].id
        }
    }

    // Fájl feltöltése ha van
    const fajl = document.getElementById('fajl').files[0]
    if (fajl && id) {
        await fajlFeltoltese(fajl, id)
    }

    urlapElrejtes()
    helyisegekBetoltese()
}

async function fajlFeltoltese(fajl, helyisegId) {
    const nev = `${helyisegId}/${Date.now()}_${fajl.name}`
    const { error } = await client.storage
        .from('helyisegek')
        .upload(nev, fajl)
    if (error) {
        alert('Hiba történt a fájl feltöltésekor!')
        console.error(error)
    }
}

async function torles(id) {
    if (!confirm('Biztosan törölni szeretnéd ezt a helyiséget?')) return
    const { error } = await client.from('helyisegek').delete().eq('id', id)
    if (error) {
        alert('Hiba történt a törlés során!')
        console.error(error)
        return
    }
    helyisegekBetoltese()
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function helyisegekBetoltese() {
    const lista = document.getElementById('helyisegek-lista')

    const { data, error } = await client
        .from('helyisegek')
        .select(`*, emeletek (nev, epuletek (nev))`)
        .order('nev')

    if (error) {
        lista.innerHTML = '<p>Hiba történt az adatok betöltésekor.</p>'
        console.error(error)
        return
    }

    if (data.length === 0) {
        lista.innerHTML = '<p>Nincsenek helyiségek.</p>'
        return
    }

    // Csoportosítás emelet szerint
    const csoportok = {}
    data.forEach(h => {
        const kulcs = h.emeletek 
            ? `${h.emeletek.epuletek.nev} / ${h.emeletek.nev}` 
            : '📦 Egyéb helyiségek'
        if (!csoportok[kulcs]) csoportok[kulcs] = []
        csoportok[kulcs].push(h)
    })

    const kartyak = await Promise.all(Object.entries(csoportok).map(async ([csoport, helyisegek]) => {
        const helyisegKartyak = await Promise.all(helyisegek.map(async h => {
            const { data: fajlok } = await client.storage
                .from('helyisegek')
                .list(`${h.id}`)

         const fajlLinkek = fajlok && fajlok.length > 0
                ? fajlok.map(f => {
                    const { data: url } = client.storage
                        .from('helyisegek')
                        .getPublicUrl(`${h.id}/${f.name}`)
                    const isKep = f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    if (isKep) {
                        return `
                            <a href="${url.publicUrl}" target="_blank">
                                <img src="${url.publicUrl}" alt="${f.name}" class="helyiseg-kep">
                            </a>`
                    }
                    return `<a href="${url.publicUrl}" target="_blank" class="fajl-link">📎 ${f.name}</a>`
                }).join('')
                : ''
                
            return `
                <div class="helyiseg-kartya">
                    <div>
                        <h3>${h.nev}</h3>
                        <p>${h.tipus} | ${h.terulet_m2} m² | ${h.ferohely} fő | ${h.ar_havi} Ft/hó</p>
                        <p>${h.leiras ?? ''}</p>
                        <div class="fajl-lista">${fajlLinkek}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
                        <span class="statusz ${h.statusz}">${h.statusz}</span>
                        <div style="display:flex;gap:8px">
                            <button onclick='urlapMegjelenites(${JSON.stringify(h)})' class="szerkeszt-gomb">Szerkesztés</button>
                            <button onclick="torles(${h.id})" class="torles-gomb">Törlés</button>
                        </div>
                    </div>
                </div>
            `
        }))

        return `
            <div class="csoport-fejlec">
                <h3>🏛️ ${csoport}</h3>
            </div>
            ${helyisegKartyak.join('')}
        `
    }))

    lista.innerHTML = kartyak.join('')
}
bejelentkezesEllenorzese()
helyisegekBetoltese()